"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Alert, Typography, Box, Button, CircularProgress, Tabs, Tab, Grid, IconButton, Card, CardMedia, CardContent, CardActions } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import FormFileUploadField from "@/components/Shared/FormFileUploadField";
import { usePost, useFetch } from "@/hooks/useFetch";
import {
  updateCategory,
  categoryDetails,
  removeCategoryImage,
  getEntityBanners,
  createEntityBanner,
  updateEntityBanner,
  deleteEntityBanner,
} from "@/services/apiProductCategory";
import { useSnackbar } from "@/contexts/SnackbarContext";
import axiosInstance from "@/utils/axiosApi";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import FaqAccordion from "../../faq/FaqAccordion";
import SeoForm from "@/app/(control-panel)/apps/seo/components/SeoForm";
import BannerModal from "../components/BannerModal";
import DeleteConfirmationModal from "@/components/Shared/DeleteConfirmationModal";

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
  name: z
    .string()
    .min(1, "Category Name is required")
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
        .refine(
          async (file) => {
            const result = await validateImageDimensions(file);
            return result.valid;
          },
          `Image dimensions must not exceed ${MAX_IMAGE_WIDTH}×${MAX_IMAGE_HEIGHT} pixels`
        ),
    ])
    .optional()
    .nullable(),
  parent_id: z
    .union([
      z.number(),
      z.string().transform((val) => (val === "" ? null : Number(val))),
      z.null(),
      z.undefined(),
    ])
    .optional()
    .nullable(),

});

// Infer the type from the Zod schema
type InferredSchemaType = z.infer<typeof schema>;

const defaultValues: InferredSchemaType = {
  name: "",
  slug: "",
  description: "",
  logo: undefined,
  parent_id: undefined,
};

export type FormType = {
  name: string;
  slug: string;
  description?: string;
  logo?: File | string | null | undefined;
  logo_url?: string;
  parent_id?: number | null;
};

const EditCategoryForm = ({
  category: initialCategory,
}: {
  category: FormType | null;
}) => {
  if (!initialCategory) {
    return <div>Loading category data...</div>;
  }
  const router = useRouter();
  const params = useParams();
  const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : undefined;
  const categoryId = params?.id ? (Array.isArray(params.id) ? parseInt(params.id[0], 10) : parseInt(params.id as string, 10)) : null;
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [isImageDeleting, setIsImageDeleting] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [isDeletingBanner, setIsDeletingBanner] = useState<number | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0); // 0 for Details, 1 for FAQ, 2 for SEO

  const categoryRef = useRef<FormType>(initialCategory);

  const { control, formState, handleSubmit, setValue, watch } = useForm<InferredSchemaType>({
    mode: "onChange",
    defaultValues,
    resolver: zodResolver(schema),
  });

  // Destructure formState first to avoid the "used before declaration" error
  const { isValid, errors, dirtyFields } = formState;

  // Watch the name field to display character count
  const nameValue = watch("name") || "";
  const slugValue = watch("slug") || "";
  const nameLength = nameValue.length;
  const nameRemaining = 50 - nameLength;

  // Watch the logo field for validation issues
  const logoValue = watch("logo");
  const logoError = errors?.logo?.message as string | undefined;

  const { trigger: triggerUpdateCategory, isMutating } = usePost(
    "updateCategory",
    updateCategory
  );

  // Set hasImageError when logo validation fails
  useEffect(() => {
    if (logoError) {
      setHasImageError(true);
    } else {
      setHasImageError(false);
    }
  }, [logoError]);

  // Check if required fields are filled
  const areRequiredFieldsFilled = () => {
    return (
      nameValue.trim() !== "" &&
      watch("slug")?.trim() !== "" &&
      !errors.name &&
      !errors.slug &&
      !hasImageError
    );
  };

  // Fetch existing banners
  useEffect(() => {
    const fetchBanners = async () => {
      if (!categoryId) return;
      
      try {
        const response = await getEntityBanners({ type: "category", category_id: categoryId });
        if (response?.data?.entityBanners) {
          setBanners(response.data.entityBanners);
        }
      } catch (error) {
        console.error("Error fetching banners:", error);
      }
    };

    fetchBanners();
  }, [categoryId]);

  // Prefill form when category data is available
  useEffect(() => {
    if (initialCategory) {
      categoryRef.current = initialCategory;
      setValue("name", initialCategory.name);
      setValue("slug", initialCategory.slug);
      setValue("description", initialCategory.description || "");
      if (
        initialCategory.parent_id !== undefined &&
        initialCategory.parent_id !== null
      ) {
        setValue("parent_id", Number(initialCategory.parent_id));
      } else {
        setValue("parent_id", null);
      }
      if (initialCategory.logo_url) {
        setValue("logo", initialCategory.logo_url as InferredSchemaType['logo']);
      } else {
        setValue("logo", undefined as InferredSchemaType['logo']);
      }
    }
  }, [initialCategory, setValue]);

  const onSubmit = async (formData: InferredSchemaType) => {
    setIsLoading(true);

    try {
      const formDataObj = new FormData();

      // Ensure required fields are present and properly formatted
      if (!formData.name || !formData.slug) {
        throw new Error("Name and slug are required fields");
      }

      // Append each field to FormData
      formDataObj.append("name", formData.name.trim());
      formDataObj.append(
        "slug",
        formData.slug.toLowerCase().replace(/\s+/g, "-")
      );

      if (formData.description) {
        formDataObj.append("description", formData.description);
      }

      // Handle parent_id properly
      if (formData.parent_id !== undefined && formData.parent_id !== null) {
        formDataObj.append("parent_id", formData.parent_id.toString());
      } else if (formData.parent_id === null) {
        formDataObj.append("parent_id", "");
      }

      // Only append logo if it's a File instance
      if (selectedFile instanceof File) {
        formDataObj.append("logo", selectedFile);
      } else if (formData.logo === null) {
        // If logo is explicitly set to null, it means we want to remove it
        formDataObj.append("logo", "");
      }

      // Debugging: Log form data
      for (let [key, value] of formDataObj.entries()) {
        console.log(`${key}:`, value);
      }

      // Call the updateCategory API with the correct ID format
      await updateCategory(id, formDataObj);

      showSnackbar("Category updated successfully!", "success");
      router.push("/apps/product-category");
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
  };

  // Handler to delete category image
  const handleImageDelete = async () => {
    try {
      setIsImageDeleting(true);

      // Call the API first
      await removeCategoryImage(id);

      // Only update the UI after successful API call
      setValue("logo", null, { shouldValidate: true });
      setSelectedFile(null);

      // Update the category object to reflect the removal of the image
      if (categoryRef.current) {
        categoryRef.current.logo_url = undefined;
        categoryRef.current.logo = null;
      }

      showSnackbar("Category image removed successfully", "success");
    } catch (error) {
      console.error("Error removing category image:", error);
      showSnackbar("Failed to remove category image", "error");

      // No need to restore anything since we didn't change the form state yet
    } finally {
      setIsImageDeleting(false);
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
    if (!bannerToDelete || !categoryId) {
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
    if (!categoryId) {
      throw new Error("Category ID is missing");
    }

    const bannerData = {
      type: "category",
      category_id: categoryId,
      image: data.imageFile instanceof File ? data.imageFile : (data.image || undefined),
      alt: data.alt || "",
      url: data.url || "",
      order: data.order || 0,
    };

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
    const response = await getEntityBanners({ type: "category", category_id: categoryId });
    if (response?.data?.entityBanners) {
      setBanners(response.data.entityBanners);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <div className="md:px-14 p-4">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          Edit Category
        </Typography>
      </div>

      {isLoading && <p>Loading category data...</p>}

      {!isLoading && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3, mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="category edit tabs">
              <Tab label="Category Details" id="category-details-tab" aria-controls="category-details-panel" />
              <Tab label="FAQ" id="category-faq-tab" aria-controls="category-faq-panel" />
              <Tab label="SEO" id="category-seo-tab" aria-controls="category-seo-panel" />
            </Tabs>
          </Box>
          <form
            name="categoryForm"
            noValidate
            className="flex w-full flex-col justify-center"
            onSubmit={handleSubmit(onSubmit)}
            hidden={activeTab !== 0} // Hide form if not on details tab
          >
            {errors?.root?.message && (
              <Alert className="mb-8" severity="error">
                {errors?.root?.message}
              </Alert>
            )}

            <FormInputField
              name="name"
              control={control}
              label="Category Name"
              type="text"
              required
            />
            <div className="text-xs text-gray-500 -mt-3 mb-4">
              {nameLength} / 50 characters used{" "}
              {nameRemaining < 0 ? "(exceeded maximum)" : ""}
            </div>
            <FormInputField
              name="slug"
              control={control}
              label="Slug"
              type="text"
              required
            />
            <FormCKEditor
              key={`description-${categoryId || 'new'}`}
              name="description"
              control={control}
              label="Description"
              defaultValue={initialCategory?.description || ""}
            />
            <FormInputField
              name="parent_id"
              control={control}
              label="Parent Category ID"
              type="number"
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
                defaultImage={categoryRef.current?.logo_url || undefined}
              />
            </Box>
            <AppButton
              label="Update Category Details"
              loading={isLoading}
              type="submit"
              fullWidth
              size="large"
              disabled={!areRequiredFieldsFilled() || isMutating}
              className="mt-4 w-full"
            />
          </form>

          {/* Banner Section - Outside the main form */}
          {activeTab === 0 && (
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

          {/* Category Details Tab Panel - Content is rendered above if activeTab === 0 */}
          <div role="tabpanel" hidden={activeTab !== 0} id="category-details-panel" aria-labelledby="category-details-tab">
            {/* The form is now outside and conditionally hidden */}
          </div>

          {/* FAQ Tab Panel */}
          <div role="tabpanel" hidden={activeTab !== 1} id="category-faq-panel" aria-labelledby="category-faq-tab">
            {activeTab === 1 && categoryId && (
              <Box sx={{ pt: 2 }}>
                <FaqAccordion entityId={categoryId} entityType="category" />
              </Box>
            )}
            {activeTab === 1 && !categoryId && (
                <Typography color="error">Category ID is missing. Cannot load FAQs.</Typography>
            )}
          </div>

          {/* SEO Tab Panel */}
          <div role="tabpanel" hidden={activeTab !== 2} id="category-seo-panel" aria-labelledby="category-seo-tab">
            {activeTab === 2 && categoryId && (
              <Box sx={{ pt: 2 }}>
                <SeoForm
                  entityType="category"
                  entityId={categoryId}
                  entityName={nameValue}
                  entitySlug={slugValue}
                  // fullWidth={true}
                />
              </Box>
            )}
            {activeTab === 2 && !categoryId && (
                <Typography color="error">Category ID is missing. Cannot load SEO details.</Typography>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EditCategoryForm;
