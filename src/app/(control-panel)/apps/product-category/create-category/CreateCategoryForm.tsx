"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Alert, Typography, Box, Tabs, Tab } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import { usePost } from "@/hooks/useFetch";
import {
  createCategory,
  getEntityBanners,
  createEntityBanner,
  updateEntityBanner,
  deleteEntityBanner,
  saveCategoryRelatedCategories,
} from "@/services/apiProductCategory";
import { useSnackbar } from "@/contexts/SnackbarContext";
import FormFileUploadField from "@/components/Shared/FormFileUploadField";
import { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import BannerModal from "../components/BannerModal";
import DeleteConfirmationModal from "@/components/Shared/DeleteConfirmationModal";
import { Grid, IconButton, Card, CardMedia, CardContent, CardActions } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RelatedCategoriesSelector from "../components/RelatedCategoriesSelector";
import RelatedCollectionsEditor from "../components/RelatedCollectionsEditor";
import { prepareTypeCardsHtmlForSave } from "@/components/Shared/typeCardImageEncode";
import {
  cleanRelatedLinks,
  getRelatedLinksValidationErrors,
  hasRelatedLinksErrors,
} from "../components/relatedLinks.utils";
import type { RelatedLink } from "@/services/apiProductCategory";

// const schema = z.object({
//   name: z.string().min(1, "Brand Name is required"),
//   slug: z.string().min(1, "Slug is required"),
//   description: z.string().optional(),
//   logo: z.instanceof(File).optional(),
//   parent_id: z.string().optional().nullable(), // ✅ Added Parent ID
// });

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
const MAX_IMAGE_WIDTH = 236;
const MAX_IMAGE_HEIGHT = 204;

// Helper function to validate image dimensions
const validateImageDimensions = (file: File): Promise<{ valid: boolean; dimensions?: { width: number; height: number } }> => {
  return new Promise((resolve) => {
    if (!file || !(file instanceof File)) {
      resolve({ valid: true });
      return;
    }

    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      if (img.width > MAX_IMAGE_WIDTH || img.height > MAX_IMAGE_HEIGHT) {
        resolve({ 
          valid: false, 
          dimensions: { 
            width: img.width, 
            height: img.height 
          } 
        });
      } else {
        resolve({ valid: true });
      }
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
    .min(1, "Category Name is required")
    .max(50, "Category Name must not exceed 50 characters"),

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
      .refine(
        async (file) => {
          const result = await validateImageDimensions(file);
          return result.valid;
        },
        `Image dimensions must not exceed ${MAX_IMAGE_WIDTH}×${MAX_IMAGE_HEIGHT} pixels`
      )
  ]).optional().nullable(),
  
  parent_id: z.union([
    z.number(),
    z.string().transform((val) => (val === "" ? null : Number(val))),
    z.null(),
    z.undefined()
  ]).optional().nullable(),

});

// Infer the type from the Zod schema
type InferredSchemaType = z.infer<typeof schema>;

const defaultValues: InferredSchemaType = {
  name: "",
  slug: "",
  description: "",
  alt_text: "",
  logo: null,
  parent_id: null,
};

// Align FormType with Zod schema or use InferredSchemaType directly
export type FormType = InferredSchemaType; // Simplest way to keep them in sync

function CreateCategoryForm() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [createdCategoryId, setCreatedCategoryId] = useState<number | null>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [isDeletingBanner, setIsDeletingBanner] = useState<number | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0); // 0 Details, 1 Related Categories, 2 Type Cards
  const [relatedLinks, setRelatedLinks] = useState<RelatedLink[]>([]);
  const [relatedLinksErrors, setRelatedLinksErrors] = useState<string[]>([]);
  const [typeCardsHtml, setTypeCardsHtml] = useState("");

  const { control, formState, handleSubmit, setValue, watch } = useForm<InferredSchemaType>({
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
  const { trigger: triggerCreateCategory, isMutating } = usePost(
    "createCategory",
    createCategory,
  );

  async function onSubmit(formData: InferredSchemaType) {
    const filledRelatedLinks = relatedLinks.filter(
      (l) => (l.text ?? "").trim() || (l.url ?? "").trim()
    );
    const linkErrors = getRelatedLinksValidationErrors(filledRelatedLinks);
    if (linkErrors.length > 0) {
      setRelatedLinksErrors(linkErrors);
      setActiveTab(1);
      showSnackbar(linkErrors[0], "error");
      return;
    }

    setIsLoading(true);

    try {
      const formDataObj = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (!value) return; // Skip falsy values like `null` or `undefined`

        if (key === "slug" && typeof value === "string") {
          value = value.toLowerCase(); // ✅ Safe conversion
        }

        if (key === "logo" && selectedFile instanceof File) {
          formDataObj.append("logo", selectedFile, selectedFile.name); // ✅ Ensure file is sent as binary
        } else if (typeof value === "string") {
          formDataObj.append(key, value); // ✅ Append only valid string values
        }
      });

      // Handle parent_id separately
      if (formData.parent_id !== undefined && formData.parent_id !== null) {
        formDataObj.append("parent_id", formData.parent_id.toString());
      }

      // Type cards HTML (separate from description / related_links)
      formDataObj.append(
        "type_cards_html",
        await prepareTypeCardsHtmlForSave(typeCardsHtml ?? "")
      );

      // ✅ Debugging: Check FormData values
      for (const pair of formDataObj.entries()) {
        console.log(pair[0], pair[1]);
      }

      const categoryResponse = await triggerCreateCategory(formDataObj);
      const categoryId = categoryResponse?.data?.id || categoryResponse?.id;
      setCreatedCategoryId(categoryId);

      showSnackbar("Category created successfully!", "success");
        if (categoryId) {
          const cleanedRelatedLinks = cleanRelatedLinks(relatedLinks);
          const linkErrors = getRelatedLinksValidationErrors(cleanedRelatedLinks);

          if (linkErrors.length > 0) {
            setRelatedLinksErrors(linkErrors);
            showSnackbar(linkErrors[0], "error");
          } else {
            try {
              await saveCategoryRelatedCategories(
                Number(categoryId),
                cleanedRelatedLinks
              );
            } catch (relError: any) {
              const msg =
                relError?.response?.data?.errors?.[0]?.msg ||
                relError?.response?.data?.message ||
                relError?.errors?.[0]?.msg ||
                relError?.message ||
                "Category created, but failed to save related links";
              setRelatedLinksErrors([msg]);
              showSnackbar(msg, "error");
            }
          }

        router.push(
          `/apps/product-category/category-update/${categoryId}?tab=buying-guide`
        );
      } else {
        router.push("/apps/product-category");
      }
    } catch (error) {
      if (error?.errors) {
        showSnackbar(error?.errors[0]?.msg, "error");
      } else {
        const errorMessage = error?.message || "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }

      const errorData = error || error;
      if (errorData?.error && typeof errorData.error === "object") {
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

  // Fetch banners when category is created
  useEffect(() => {
    const fetchBanners = async () => {
      if (!createdCategoryId) return;
      
      try {
        const response = await getEntityBanners({ type: "category", category_id: createdCategoryId });
        if (response?.data?.entityBanners) {
          setBanners(response.data.entityBanners);
        }
      } catch (error) {
        console.error("Error fetching banners:", error);
      }
    };

    fetchBanners();
  }, [createdCategoryId]);

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
    if (!bannerToDelete || !createdCategoryId) {
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
    if (!createdCategoryId) {
      throw new Error("Category ID is missing");
    }

    const bannerData: any = {
      type: "category",
      category_id: createdCategoryId,
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
    const response = await getEntityBanners({ type: "category", category_id: createdCategoryId });
    if (response?.data?.entityBanners) {
      setBanners(response.data.entityBanners);
    }
  };

  return (
    <div className="md:px-64 p-4">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          New Category
        </Typography>
      </div>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          aria-label="category create tabs"
        >
          <Tab
            label="Category Details"
            id="category-create-details-tab"
            aria-controls="category-create-details-panel"
          />
          <Tab
            label="Related Categories"
            id="category-create-related-categories-tab"
            aria-controls="category-create-related-categories-panel"
          />
          <Tab
            label="Related Collections"
            id="category-create-related-collections-tab"
            aria-controls="category-create-related-collections-panel"
          />
        </Tabs>
      </Box>
      <form
        name="categoryForm"
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
            label="Name"
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
          />

          <Box sx={{ mt: 2, mb: 2 }}>
            <FormFileUploadField
              name="logo"
              control={control}
              label="Category Logo"
              onFileChange={(file) => {
                setSelectedFile(file);
                setValue("logo", file, { shouldValidate: true });
              }}
              helperText={`Upload a category slider image (${MAX_IMAGE_WIDTH} × ${MAX_IMAGE_HEIGHT} px, Max size: 5MB). Supported formats: PNG, JPG, JPEG, WebP`}
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

          <div className="mt-6">
            <FormInputField
              name="parent_id"
              control={control}
              label="Parent ID"
              type="number"
            />
          </div>
        </Box>

        <div
          role="tabpanel"
          hidden={activeTab !== 1}
          id="category-create-related-categories-panel"
          aria-labelledby="category-create-related-categories-tab"
        >
          <RelatedCategoriesSelector
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
          id="category-create-related-collections-panel"
          aria-labelledby="category-create-related-collections-tab"
        >
          {activeTab === 2 && (
            <RelatedCollectionsEditor
              content={typeCardsHtml}
              onContentChange={setTypeCardsHtml}
            />
          )}
        </div>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
          After creating the category, you will be redirected to configure the
          Buying Guide, FAQ, SEO, and banners.
        </Typography>

        <AppButton
          label="Create"
          loading={isLoading}
          type="submit"
          fullWidth
          size="large"
          disabled={
            !isValid ||
            isMutating ||
            hasImageError ||
            hasRelatedLinksErrors(relatedLinks)
          }
          className="mt-4 w-full"
        />
      </form>

      {/* Banner Section - Outside the main form */}
      {createdCategoryId && (
        <Box sx={{ mt: 4, mb: 2, p: 3, border: "1px solid #e0e0e0", borderRadius: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Category Banners ({banners.length}/3)
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

export default CreateCategoryForm;
