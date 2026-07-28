"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  Alert,
  Typography,
  Box,
  Tabs,
  Tab,
  Grid,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  CardActions,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormFileUploadField from "@/components/Shared/FormFileUploadField";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import { usePost } from "@/hooks/useFetch";
import {
  updateBrand,
  removeBrandImage,
  getEntityBanners,
  createEntityBanner,
  updateEntityBanner,
  deleteEntityBanner,
} from "@/services/apiProductBrand";
import { useSnackbar } from "@/contexts/SnackbarContext";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import FaqAccordion from "../../faq/FaqAccordion";
import SeoForm from "@/app/(control-panel)/apps/seo/components/SeoForm";
import BuyingGuideForm from "@/app/(control-panel)/apps/product-category/components/BuyingGuideForm";
import RelatedCollectionsTab from "@/app/(control-panel)/apps/product-category/components/RelatedCollectionsTab";
import RelatedBrandsTab from "../components/RelatedBrandsTab";
import BannerModal from "../components/BannerModal";
import DeleteConfirmationModal from "@/components/Shared/DeleteConfirmationModal";

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
  name: z
    .string()
    .min(1, "Brand Name is required")
    .max(50, "Name must be less than 50 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug must be at most 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be a valid URL-friendly string (lowercase letters, numbers, and hyphens only)"
    ),
  description: z.string().optional(),
  alt_text: z.string().optional(),
  logo: z
    .union([
      z.undefined(),
      z.null(),
      z.string(), // For existing logo URLs
      z
        .instanceof(File)
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
        }),
    ])
    .optional()
    .nullable(),
  // Optional redirect URL for deleted brands. Empty string allowed.
  redirect_url: z.string().url("Invalid URL format").optional().or(z.literal("")),
});

// Infer the type from the Zod schema
type InferredSchemaType = z.infer<typeof schema>;
// Explicitly define the type for the logo field based on the schema inference
type LogoFieldValue = InferredSchemaType['logo'];

const defaultValues: InferredSchemaType = {
  name: "",
  slug: "",
  description: "",
  alt_text: "",
  logo: undefined,
  redirect_url: "",
};

export type FormType = {
  name: string;
  slug: string;
  description?: string;
  type_cards_html?: string | null;
  alt_text?: string;
  logo?: File | string | null | undefined;
  logo_url?: string;
  redirect_url?: string | null;
  deletedAt?: string | null;
  banner?: {
    id?: number;
    image?: string;
    alt?: string;
    url?: string;
    order?: number;
  };
};

const EditBrandForm = ({ brand: initialBrand }: { brand: FormType | null }) => {
  if (!initialBrand) {
    return <div>Loading brand data...</div>;
  }
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const brandId = params?.id ? (Array.isArray(params.id) ? parseInt(params.id[0], 10) : parseInt(params.id, 10)) : null;
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [isImageDeleting, setIsImageDeleting] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [isDeletingBanner, setIsDeletingBanner] = useState<number | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const brandRef = useRef<FormType>(initialBrand);

  const [activeTab, setActiveTab] = useState<number>(() => {
    const tab = searchParams?.get("tab");
    if (tab === "related-collections") return 5;
    if (tab === "related-brands") return 4;
    if (tab === "buying-guide") return 3;
    if (tab === "seo") return 2;
    if (tab === "faq") return 1;
    return 0;
  }); // 0 Details, 1 FAQ, 2 SEO, 3 Buying Guide, 4 Related Brands, 5 Related Collections

  const { control, formState, handleSubmit, setValue, watch, setError } = useForm<InferredSchemaType>({
    mode: "all",
    defaultValues,
    resolver: zodResolver(schema),
  });

  // Watch the name field to display character count
  const nameValue = watch("name") || "";
  const slugValue = watch("slug") || "";
  const nameLength = nameValue.length;
  const nameRemaining = 50 - nameLength;

  const { isValid, errors } = formState;
  const { trigger: triggerUpdateBrand, isMutating } = usePost(
    "updateBrand",
    updateBrand
  );

  // Watch the logo field for validation issues
  const logoValue = watch("logo");
  const logoError = errors.logo?.message as string | undefined;

  // Set hasImageError when logo validation fails
  useEffect(() => {
    if (logoError) {
      setHasImageError(true);
    } else {
      setHasImageError(false);
    }
  }, [logoError]);

  // Fetch existing banners
  useEffect(() => {
    const fetchBanners = async () => {
      if (!brandId) return;
      
      try {
        const response = await getEntityBanners({ type: "brand", brand_id: brandId });
        if (response?.data?.entityBanners) {
          setBanners(response.data.entityBanners);
        }
      } catch (error) {
        console.error("Error fetching banners:", error);
      }
    };

    fetchBanners();
  }, [brandId]);

  // Prefill form
  useEffect(() => {
    if (initialBrand) {
      brandRef.current = initialBrand;
      setValue("name", initialBrand.name);
      setValue("slug", initialBrand.slug);
      setValue("description", initialBrand.description || "");
      setValue("alt_text", initialBrand.alt_text || "");
      if (initialBrand.logo_url) {
        setValue("logo", initialBrand.logo_url as LogoFieldValue);
      } else {
        setValue("logo", undefined as LogoFieldValue);
      }
      // Prefill redirect URL if present (used when brand is deleted)
      // Support new API shape where redirect is an object:
      // { redirect: { redirect_url, old_path, header_code, status } }
      const extractedRedirectUrl =
        (initialBrand as any)?.redirect?.redirect_url ??
        (initialBrand as any)?.redirect_url ??
        "";
      setValue("redirect_url", extractedRedirectUrl);
    }
  }, [initialBrand, setValue]);

  const onSubmit = async (formData: InferredSchemaType) => {
    setIsLoading(true);
    try {
      const formDataObj = new FormData();
      if (!formData.name || !formData.slug) {
        throw new Error("Name and slug are required fields");
      }
      formDataObj.append("name", formData.name.trim());
      formDataObj.append("slug", formData.slug.toLowerCase().replace(/\s+/g, "-"));
      if (formData.description) {
        formDataObj.append("description", formData.description);
      }
      // Preserve type cards when updating details (managed on Related Collections tab)
      formDataObj.append(
        "type_cards_html",
        brandRef.current?.type_cards_html ?? ""
      );
      if (formData.alt_text) {
        formDataObj.append("alt_text", formData.alt_text);
      }
      if (selectedFile instanceof File) {
        formDataObj.append("logo", selectedFile);
      } else if (formData.logo === null) {
        formDataObj.append("logo", "");
      }
      // If editing a deleted brand, allow saving a redirect URL
      if (initialBrand?.deletedAt) {
        const redirect = (formData as any).redirect_url?.toString()?.trim();
        if (redirect) {
          formDataObj.append("redirect_url", redirect);
        }
      }
      await updateBrand(brandId, formDataObj); // Use parsed brandId
      
      showSnackbar("Brand updated successfully!", "success");
      router.push("/apps/product-brand");
    } catch (error: any) {
      // Handle validation errors from the API
      const errorResponse = error?.response?.data || error;
      
      if (errorResponse?.error && Array.isArray(errorResponse.error)) {
        errorResponse.error.forEach((validationError: any) => {
          if (validationError.path && validationError.message) {
            // Set field-specific error
            setError(validationError.path as keyof InferredSchemaType, {
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
        const errorMessage = error?.response?.data?.message || error?.message || "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

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
    if (!bannerToDelete || !brandId) {
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
    if (!brandId) {
      throw new Error("Brand ID is missing");
    }

    const bannerData: any = {
      type: "brand",
      brand_id: brandId,
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
    const response = await getEntityBanners({ type: "brand", brand_id: brandId });
    if (response?.data?.entityBanners) {
      setBanners(response.data.entityBanners);
    }
  };

  const handleRemoveNewLogo = () => {
    setSelectedFile(null);
    setLogoPreview(null);
    setValue("logo", brandRef.current.logo_url, { shouldValidate: true });
  };

  const handleImageDelete = async () => {
    try {
      setIsImageDeleting(true);
      await removeBrandImage(brandId); // Use parsed brandId
      setValue("logo", null, { shouldValidate: true });
      setSelectedFile(null);
      if (brandRef.current) {
        brandRef.current.logo_url = undefined;
        brandRef.current.logo = null as LogoFieldValue;
      }
      showSnackbar("Brand image removed successfully", "success");
    } catch (error) {
      console.error("Error removing brand image:", error);
      showSnackbar("Failed to remove brand image", "error");
    } finally {
      setIsImageDeleting(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <div className="md:px-14 p-4">
      <div>
        <PageBreadcrumb className="mt-8" customLastLabel={initialBrand?.name || ""} />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          Edit Brand
        </Typography>
      </div>

      {isLoading && <p>Loading brand data...</p>} 
      {/* Initial loading for brand data if fetched here, currently assumes initialBrand prop */}

      {!isLoading && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="brand edit tabs">
              <Tab label="Brand Details" id="brand-details-tab" aria-controls="brand-details-panel" />
              <Tab label="FAQ" id="brand-faq-tab" aria-controls="brand-faq-panel" />
              <Tab label="SEO" id="brand-seo-tab" aria-controls="brand-seo-panel" />
              <Tab label="Buying Guide" id="brand-buying-guide-tab" aria-controls="brand-buying-guide-panel" />
              <Tab
                label="Related Brands"
                id="brand-related-brands-tab"
                aria-controls="brand-related-brands-panel"
              />
              <Tab
                label="Related Collections"
                id="brand-related-collections-tab"
                aria-controls="brand-related-collections-panel"
              />
            </Tabs>
          </Box>

          {/* Brand Details Tab Panel */} 
          <div role="tabpanel" hidden={activeTab !== 0} id="brand-details-panel" aria-labelledby="brand-details-tab">
            {activeTab === 0 && (
              <>
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
                  <FormInputField name="name" control={control} label="Brand Name" type="text" required />
                  <div className="text-xs text-gray-500 -mt-3 mb-4">
                      {nameLength} / 50 characters used{" "}
                      {nameRemaining < 0 ? "(exceeded maximum)" : ""}
                  </div>
                  <FormInputField name="slug" control={control} label="Slug" type="text" required />
                  <FormCKEditor
                    name="description"
                    control={control}
                    label="Description"
                    defaultValue={initialBrand.description || ""}
                  />

                  <Box sx={{ mt: 2, mb: 2 }}>
                    <FormFileUploadField
                      name="logo"
                      control={control}
                      label="Brand Logo"
                      onFileChange={(file) => {
                        setSelectedFile(file);
                        setValue("logo", file, { shouldValidate: true });
                        if (file) {
                          setLogoPreview(URL.createObjectURL(file));
                        } else {
                          setLogoPreview(null);
                        }
                      }}
                      helperText={`Upload a brand logo (Min: ${MIN_IMAGE_WIDTH}×${MIN_IMAGE_HEIGHT}px, Max: ${MAX_IMAGE_WIDTH}×${MAX_IMAGE_HEIGHT}px, Max size: 5MB). Only square or rectangle images allowed. Supported formats: PNG, JPG, JPEG, WebP`}
                      hidePreview
                    />
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      {logoPreview ? (
                        <Grid item>
                          <Typography variant="subtitle2">New Image Preview:</Typography>
                          <Box sx={{ border: '1px solid #ddd', p: 1, position: 'relative' }}>
                            <img
                              src={logoPreview}
                              alt="New logo preview"
                              style={{ width: 150, height: 150, objectFit: 'contain' }}
                            />
                            <IconButton
                              size="small"
                              onClick={handleRemoveNewLogo}
                              sx={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'white' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                      ) : (
                        brandRef.current?.logo_url && (
                          <Grid item>
                            <Typography variant="subtitle2">Current Image:</Typography>
                            <Box sx={{ border: '1px solid #ddd', p: 1 }}>
                              <img
                                src={brandRef.current.logo_url}
                                alt="Current logo"
                                style={{ width: 150, height: 150, objectFit: 'contain' }}
                              />
                            </Box>
                          </Grid>
                        )
                      )}
                    </Grid>
                  </Box>

                  {(selectedFile || (typeof logoValue === 'string' && logoValue) || initialBrand?.logo_url || brandRef.current?.logo_url) && (
                    <FormInputField
                      name="alt_text"
                      control={control}
                      label="Alt Text"
                      type="text"
                    />
                  )}
                  
                  {/* Redirect URL field - only for deleted brands */}
                  {initialBrand?.deletedAt && (
                    <FormInputField
                      name="redirect_url"
                      control={control}
                      label="Redirect URL (optional)"
                      type="text"
                      helperText="Leave empty to skip. Enter a valid URL (e.g. https://example.com)."
                    />
                  )}

                  <AppButton
                    label="Update Brand Details"
                    loading={isLoading} // Use top-level isLoading for form submission
                    type="submit"
                    fullWidth
                    size="large"
                    disabled={!isValid || isMutating || hasImageError || isLoading}
                    className="mt-4 w-full"
                  />
                </form>

                {/* Banner Section - Outside the main form */}
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
              </>
            )}
          </div>

          {/* FAQ Tab Panel */} 
          <div role="tabpanel" hidden={activeTab !== 1} id="brand-faq-panel" aria-labelledby="brand-faq-tab">
            {activeTab === 1 && brandId && (
              <Box sx={{ pt: 2 }}>
                <FaqAccordion entityId={brandId} entityType="brand" />
              </Box>
            )}
            {activeTab === 1 && !brandId && (
                <Typography color="error">Brand ID is missing. Cannot load FAQs.</Typography>
            )}
          </div>

          {/* SEO Tab Panel */}
          <div role="tabpanel" hidden={activeTab !== 2} id="brand-seo-panel" aria-labelledby="brand-seo-tab">
            {activeTab === 2 && brandId && (
              <Box sx={{ pt: 2 }}>
                <SeoForm
                  entityType="brand"
                  entityId={brandId}
                  entityName={nameValue}
                  entitySlug={slugValue}
                  // fullWidth={true}
                />
              </Box>
            )}
            {activeTab === 2 && !brandId && (
                <Typography color="error">Brand ID is missing. Cannot load SEO details.</Typography>
            )}
          </div>

          {/* Buying Guide Tab Panel */}
          <div
            role="tabpanel"
            hidden={activeTab !== 3}
            id="brand-buying-guide-panel"
            aria-labelledby="brand-buying-guide-tab"
          >
            {activeTab === 3 && brandId && (
              <Box sx={{ pt: 2 }}>
                <BuyingGuideForm
                  entityType="brand"
                  brandId={brandId}
                  brandName={nameValue || initialBrand?.name}
                />
              </Box>
            )}
            {activeTab === 3 && !brandId && (
              <Typography color="error">
                Brand ID is missing. Cannot load buying guide.
              </Typography>
            )}
          </div>

          {/* Related Brands Tab Panel */}
          <div
            role="tabpanel"
            hidden={activeTab !== 4}
            id="brand-related-brands-panel"
            aria-labelledby="brand-related-brands-tab"
          >
            {activeTab === 4 && brandId && (
              <Box sx={{ pt: 2 }}>
                <RelatedBrandsTab brandId={brandId} />
              </Box>
            )}
            {activeTab === 4 && !brandId && (
              <Typography color="error">
                Brand ID is missing. Cannot load related brands.
              </Typography>
            )}
          </div>

          {/* Related Collections Tab Panel (type_cards_html) */}
          <div
            role="tabpanel"
            hidden={activeTab !== 5}
            id="brand-related-collections-panel"
            aria-labelledby="brand-related-collections-tab"
          >
            {activeTab === 5 && brandId && (
              <Box sx={{ pt: 2 }}>
                <RelatedCollectionsTab
                  entityType="brand"
                  brandId={brandId}
                  initialHtml={brandRef.current?.type_cards_html}
                  onSaved={(html) => {
                    if (brandRef.current) {
                      brandRef.current.type_cards_html = html;
                    }
                  }}
                />
              </Box>
            )}
            {activeTab === 5 && !brandId && (
              <Typography color="error">
                Brand ID is missing. Cannot load type cards.
              </Typography>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EditBrandForm;
