"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Alert, Typography, Box, Tabs, Tab } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { usePost } from "@/hooks/useFetch";
import {
  createBrand,
  getEntityBanners,
  createEntityBanner,
  updateEntityBanner,
  deleteEntityBanner,
  saveBrandRelatedBrands,
  type RelatedLink,
} from "@/services/apiProductBrand";
import { useSnackbar } from "@/contexts/SnackbarContext";
import FormFileUploadField from "@/components/Shared/FormFileUploadField";
import { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import BannerModal from "../components/BannerModal";
import DeleteConfirmationModal from "@/components/Shared/DeleteConfirmationModal";
import { Grid, IconButton, Card, CardMedia, CardContent, CardActions } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RelatedCategoriesSelector from "@/app/(control-panel)/apps/product-category/components/RelatedCategoriesSelector";
import RelatedCollectionsEditor from "@/app/(control-panel)/apps/product-category/components/RelatedCollectionsEditor";
import { prepareTypeCardsHtmlForSave } from "@/components/Shared/typeCardImageEncode";
import {
  cleanRelatedLinks,
  getRelatedLinksValidationErrors,
  hasRelatedLinksErrors,
} from "@/app/(control-panel)/apps/product-category/components/relatedLinks.utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
const MIN_IMAGE_WIDTH = 150;
const MIN_IMAGE_HEIGHT = 150;
const MAX_IMAGE_WIDTH = 300;
const MAX_IMAGE_HEIGHT = 300;
const MAX_ASPECT_RATIO = 2; // Width to height ratio (prevents very elongated images)

// Helper function to validate image dimensions
const validateImageDimensions = (file: File): Promise<{ 
  valid: boolean; 
  error?: string;
  dimensions?: { width: number; height: number } 
}> => {
  return new Promise((resolve) => {
    if (!file || !(file instanceof File)) {
      resolve({ valid: true });
      return;
    }

    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const { width, height } = img;
      
      // Check minimum dimensions
      if (width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT) {
        resolve({ 
          valid: false,
          error: `Image dimensions must be at least ${MIN_IMAGE_WIDTH}×${MIN_IMAGE_HEIGHT} pixels. Current: ${width}×${height}px`,
          dimensions: { width, height } 
        });
        return;
      }
      
      // Check maximum dimensions
      if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
        resolve({ 
          valid: false,
          error: `Image dimensions must not exceed ${MAX_IMAGE_WIDTH}×${MAX_IMAGE_HEIGHT} pixels. Current: ${width}×${height}px`,
          dimensions: { width, height } 
        });
        return;
      }
      
      // Check aspect ratio (prevent very tall or very wide images)
      const aspectRatio = Math.max(width / height, height / width);
      if (aspectRatio > MAX_ASPECT_RATIO) {
        resolve({ 
          valid: false,
          error: `Image must be square or rectangle. Very elongated images are not allowed. Current: ${width}×${height}px`,
          dimensions: { width, height } 
        });
        return;
      }
      
      resolve({ valid: true, dimensions: { width, height } });
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({ valid: true }); // Assume valid on error to avoid blocking submission
    };
    img.src = URL.createObjectURL(file);
  });
};

const schema = z.object({
  name: z.string()
    .min(1, "Brand Name is required")
    .max(50, "Brand Name must not exceed 50 characters"),
  
  slug: z.string()
    .min(1, "Slug is required")
    .max(50, "Slug must be at most 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be a valid URL-friendly string (lowercase letters, numbers, and hyphens only)"),

  description: z.string().optional(),

  alt_text: z.string().optional(),

  logo: z.union([
    z.undefined(),
    z.null(),
    z.instanceof(File)
      .refine(
        (file) => file.size <= MAX_FILE_SIZE,
        "File size must be less than 5MB"
      )
      .refine(
        (file) => ACCEPTED_FILE_TYPES.includes(file.type),
        "Only .jpg, .jpeg, .png, and .webp formats are supported"
      )
      .superRefine(async (file, ctx) => {
        const result = await validateImageDimensions(file);
        if (!result.valid) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: result.error || `Image dimensions must be between ${MIN_IMAGE_WIDTH}×${MIN_IMAGE_HEIGHT} and ${MAX_IMAGE_WIDTH}×${MAX_IMAGE_HEIGHT} pixels`,
          });
        }
      })
  ]).optional().nullable(),

});

const defaultValues = {
  name: "",
  slug: "",
  description: "",
  alt_text: "",
  logo: undefined,
};

export type FormType = z.infer<typeof schema>;

function CreateBrandForm() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [createdBrandId, setCreatedBrandId] = useState<number | null>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [isDeletingBanner, setIsDeletingBanner] = useState<number | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [relatedLinks, setRelatedLinks] = useState<RelatedLink[]>([]);
  const [relatedLinksErrors, setRelatedLinksErrors] = useState<string[]>([]);
  const [typeCardsHtml, setTypeCardsHtml] = useState("");

  const { control, formState, handleSubmit, setValue, watch, setError } = useForm<FormType>({
    mode: "all",
    defaultValues,
    resolver: zodResolver(schema),
  });

  // Watch for logo errors
  const logoValue = watch("logo");
  const logoError = formState.errors.logo?.message as string | undefined;

  // Set hasImageError when logo validation fails
  useEffect(() => {
    if (logoError) {
      setHasImageError(true);
    } else {
      setHasImageError(false);
    }
  }, [logoError]);

  const { isValid, dirtyFields, errors } = formState;
  const { trigger: triggerCreateBrand, isMutating } = usePost(
    "createBrand",
    createBrand,
  );

  async function onSubmit(formData: FormType) {
    if (hasRelatedLinksErrors(relatedLinks)) {
      const errors = getRelatedLinksValidationErrors(
        relatedLinks.filter(
          (l) => (l.text ?? "").trim() || (l.url ?? "").trim()
        )
      );
      setRelatedLinksErrors(errors);
      setActiveTab(1);
      showSnackbar(errors[0] || "Fix related brand links before creating", "error");
      return;
    }

    setIsLoading(true);

    try {
      const formDataObj = new FormData();

      // Append name and slug
      formDataObj.append("name", formData.name.trim());
      formDataObj.append("slug", formData.slug.toLowerCase());

      // Append description if it exists
      if (formData.description) {
        formDataObj.append("description", formData.description);
      }

      // Type cards HTML (separate from description / related_links)
      formDataObj.append(
        "type_cards_html",
        await prepareTypeCardsHtmlForSave(typeCardsHtml ?? "")
      );

      // Append alt_text if it exists
      if (formData.alt_text) {
        formDataObj.append("alt_text", formData.alt_text);
      }

      // Only append logo if it's a File instance
      if (selectedFile instanceof File) {
        formDataObj.append("logo", selectedFile);
      }

      const brandResponse = await triggerCreateBrand(formDataObj);
      const brandId = brandResponse?.data?.id || brandResponse?.id;
      setCreatedBrandId(brandId);

      showSnackbar("Brand created successfully!", "success");

      if (brandId) {
        const cleanedRelatedLinks = cleanRelatedLinks(relatedLinks);
        const linkErrors = getRelatedLinksValidationErrors(cleanedRelatedLinks);

        if (linkErrors.length > 0) {
          setRelatedLinksErrors(linkErrors);
          showSnackbar(linkErrors[0], "error");
        } else {
          try {
            await saveBrandRelatedBrands(Number(brandId), cleanedRelatedLinks);
          } catch (relError: any) {
            const msg =
              relError?.response?.data?.errors?.[0]?.msg ||
              relError?.response?.data?.message ||
              relError?.errors?.[0]?.msg ||
              relError?.message ||
              "Brand created, but failed to save related links";
            setRelatedLinksErrors([msg]);
            showSnackbar(msg, "error");
          }
        }

        router.push(
          `/apps/product-brand/brand-update/${brandId}?tab=buying-guide`
        );
      } else {
        router.push("/apps/product-brand");
      }
    } catch (error: any) {
      // Handle validation errors from the API
      if (error?.error && Array.isArray(error.error)) {
        error.error.forEach((validationError: any) => {
          if (validationError.path && validationError.message) {
            // Set field-specific error
            setError(validationError.path as keyof FormType, {
              type: "manual",
              message: validationError.message,
            });
            // Show snackbar for the error
            showSnackbar(validationError.message, "error");
          }
        });
      } else if (error?.errors) {
        showSnackbar(error?.errors[0]?.msg, "error");
      } else {
        const errorMessage = error?.message || "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }

      // Legacy error handling for backward compatibility
      const errorData = error || error;
      if (errorData?.error && typeof errorData.error === "object" && !Array.isArray(errorData.error)) {
        Object.entries(errorData.error).forEach(([field, message]) => {
          if (typeof message === "string") {
            showSnackbar(message, "error");
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch banners when brand is created
  useEffect(() => {
    const fetchBanners = async () => {
      if (!createdBrandId) return;
      
      try {
        const response = await getEntityBanners({ type: "brand", brand_id: createdBrandId });
        if (response?.data?.entityBanners) {
          setBanners(response.data.entityBanners);
        }
      } catch (error) {
        console.error("Error fetching banners:", error);
      }
    };

    fetchBanners();
  }, [createdBrandId]);

  const handleCreateBanner = () => {
    if (banners.length >= 3) {
      showSnackbar("Maximum 3 banners allowed", "error");
      return;
    }
    setEditingBanner(null);
    setIsBannerModalOpen(true);
  };

  const handleEditBanner = (banner: any) => {
    setEditingBanner(banner);
    setIsBannerModalOpen(true);
  };

  const handleDeleteBanner = (bannerId: number) => {
    setBannerToDelete(bannerId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteBanner = async () => {
    if (!bannerToDelete || !createdBrandId) {
      setIsDeleteModalOpen(false);
      setBannerToDelete(null);
      return;
    }

    setIsDeletingBanner(bannerToDelete);
    try {
      await deleteEntityBanner(bannerToDelete);
      setBanners(banners.filter(b => b.id !== bannerToDelete));
      showSnackbar("Banner deleted successfully!", "success");
    } catch (error: any) {
      console.error("Error deleting banner:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete banner";
      showSnackbar(errorMessage, "error");
    } finally {
      setIsDeletingBanner(null);
      setIsDeleteModalOpen(false);
      setBannerToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBannerToDelete(null);
  };

  const handleSaveBanner = async (data: any) => {
    if (!createdBrandId) {
      throw new Error("Brand ID is missing");
    }

    const bannerData: any = {
      type: "brand",
      brand_id: createdBrandId,
      image: data.imageFile instanceof File ? data.imageFile : (data.image || undefined),
      alt: data.alt || "",
      order: data.order || 0,
    };
    
    // Only include url if it has a non-empty value
    if (data.url && typeof data.url === 'string' && data.url.trim() !== '') {
      bannerData.url = data.url;
    }

    if (editingBanner?.id) {
      // Update existing banner
      await updateEntityBanner(editingBanner.id, bannerData);
      showSnackbar("Banner updated successfully!", "success");
    } else {
      // Check limit before creating
      if (banners.length >= 3) {
        throw new Error("Maximum 3 banners allowed");
      }
      // Create new banner
      await createEntityBanner(bannerData);
      showSnackbar("Banner created successfully!", "success");
    }

    // Refresh banners list
    const response = await getEntityBanners({ type: "brand", brand_id: createdBrandId });
    if (response?.data?.entityBanners) {
      setBanners(response.data.entityBanners);
    }
  };

  return (
    <div className="md:px-14 p-4">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
        New Brand
        </Typography>
      </div>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          aria-label="brand create tabs"
        >
          <Tab
            label="Brand Details"
            id="brand-create-details-tab"
            aria-controls="brand-create-details-panel"
          />
          <Tab
            label="Related Brands"
            id="brand-create-related-brands-tab"
            aria-controls="brand-create-related-brands-panel"
          />
          <Tab
            label="Related Collections"
            id="brand-create-related-collections-tab"
            aria-controls="brand-create-related-collections-panel"
          />
        </Tabs>
      </Box>
      <form
        name="brandForm"
        noValidate
        className="flex w-full flex-col justify-center"
        onSubmit={handleSubmit(onSubmit)}
      >
        {errors?.root?.message && (
          <Alert className="mb-8" severity="error">
            {errors?.root?.message}
          </Alert>
        )}

        <Box hidden={activeTab !== 0}>
          <FormInputField
            name="name"
            control={control}
            label="Brand Name"
            type="text"
            required
          />
          <FormInputField
            name="slug"
            control={control}
            label="Slug"
            type="text"
            required
          />
          <FormCKEditor
            name="description"
            control={control}
            label="Description"
            defaultValue=""
          />

          <Box sx={{ mt: 2, mb: 2 }}>
            <FormFileUploadField
              name="logo"
              control={control}
              label="Brand Logo"
              onFileChange={(file) => {
                setSelectedFile(file);
                setValue("logo", file, { shouldValidate: true });
              }}
              helperText={`Upload a brand logo (Min: ${MIN_IMAGE_WIDTH}×${MIN_IMAGE_HEIGHT}px, Max: ${MAX_IMAGE_WIDTH}×${MAX_IMAGE_HEIGHT}px, Max size: 5MB). Only square or rectangle images allowed. Supported formats: PNG, JPG, JPEG, WebP`}
            />
          </Box>

          {(selectedFile || logoValue) && (
            <FormInputField
              name="alt_text"
              control={control}
              label="Alt Text"
              type="text"
            />
          )}
        </Box>

        <div
          role="tabpanel"
          hidden={activeTab !== 1}
          id="brand-create-related-brands-panel"
          aria-labelledby="brand-create-related-brands-tab"
        >
          <RelatedCategoriesSelector
            label="Related Brands"
            links={relatedLinks}
            onLinksChange={(nextLinks) => {
              setRelatedLinks(nextLinks);
              if (relatedLinksErrors.length > 0) {
                setRelatedLinksErrors([]);
              }
            }}
            validationErrors={relatedLinksErrors}
            showRowErrors={relatedLinksErrors.length > 0}
          />
        </div>

        <div
          role="tabpanel"
          hidden={activeTab !== 2}
          id="brand-create-related-collections-panel"
          aria-labelledby="brand-create-related-collections-tab"
        >
          {activeTab === 2 && (
            <RelatedCollectionsEditor
              content={typeCardsHtml}
              onContentChange={setTypeCardsHtml}
            />
          )}
        </div>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
          After creating the brand, you will be redirected to configure the
          Buying Guide, FAQ, SEO, and banners.
        </Typography>

        <AppButton
          label="Create"
          loading={isLoading}
          type="submit"
          fullWidth
          size="large"
          disabled={!isValid || isMutating || hasImageError}
          className="mt-4 w-full"
        />
      </form>

      {/* Banner Section - Outside the main form */}
      {createdBrandId && (
        <Box sx={{ mt: 4, mb: 2, p: 3, border: "1px solid #e0e0e0", borderRadius: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Brand Banners ({banners.length}/3)
            </Typography>
            <AppButton
              label="Create Banner"
              type="button"
              onClick={handleCreateBanner}
              disabled={banners.length >= 3}
              size="medium"
              disableGradient
              sx={{ 
                backgroundColor: "#2E9970", 
                "&:hover": { backgroundColor: "#1E7A56" },
                color: "#fff"
              }}
            />
          </Box>

          {banners.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: "center", py: 3 }}>
              No banners created yet. Click "Create Banner" to add one.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {banners.map((banner) => (
                <Grid item xs={12} sm={6} md={4} key={banner.id}>
                  <Card>
                    {banner.image && (
                      <CardMedia
                        component="img"
                        height="140"
                        image={banner.image}
                        alt={banner.alt || "Banner"}
                        sx={{ objectFit: "contain" }}
                      />
                    )}
                    <CardContent>
                      <Typography variant="body2" color="textSecondary">
                        Alt: {banner.alt || "N/A"}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        URL: {banner.url || "N/A"}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Order: {banner.order ?? 0}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <IconButton
                        size="small"
                        onClick={() => handleEditBanner(banner)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteBanner(banner.id)}
                        color="error"
                        disabled={isDeletingBanner === banner.id}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          <BannerModal
            open={isBannerModalOpen}
            onClose={() => {
              setIsBannerModalOpen(false);
              setEditingBanner(null);
            }}
            onSave={handleSaveBanner}
            initialData={editingBanner}
            isEdit={!!editingBanner}
          />

          <DeleteConfirmationModal
            open={isDeleteModalOpen}
            onClose={handleCloseDeleteModal}
            onConfirm={handleConfirmDeleteBanner}
            message="Are you sure you want to delete this banner?"
            loading={isDeletingBanner !== null}
          />
        </Box>
      )}
    </div>
  );
}

export default CreateBrandForm;
