"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Alert,
  Typography,
  Box,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Grid,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormFileUploadField from "@/components/Shared/FormFileUploadField";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import { usePost, useFetch } from "@/hooks/useFetch";
import {
  updateBrand,
  brandDetails,
  removeBrandImage,
  getEntityBanners,
  createEntityBanner,
  updateEntityBanner,
} from "@/services/apiProductBrand";
import { useSnackbar } from "@/contexts/SnackbarContext";
import axiosInstance from "@/utils/axiosApi";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import FaqAccordion from "../../faq/FaqAccordion";
import SeoForm from "@/app/(control-panel)/apps/seo/components/SeoForm";

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

  // Banner fields
  bannerImage: z.union([
    z.undefined(),
    z.null(),
    z.string(), // For existing banner image URLs
    z.instanceof(File)
      .refine(
        (file) => file.size <= MAX_FILE_SIZE,
        "Banner file size must be less than 5MB"
      )
      .refine(
        (file) => ACCEPTED_FILE_TYPES.includes(file.type),
        "Only .jpg, .jpeg, .png, and .webp formats are supported"
      )
  ]).optional().nullable(),
  bannerAlt: z.string().optional(),
  bannerUrl: z.union([
    z.string().url("Banner URL must be a valid URL"),
    z.literal(""),
  ]).optional(),
  bannerOrder: z.number().int().min(0, "Order must be a non-negative integer").optional(),
  bannerId: z.number().optional(), // For existing banner ID
});

// Infer the type from the Zod schema
type InferredSchemaType = z.infer<typeof schema>;
// Explicitly define the type for the logo field based on the schema inference
type LogoFieldValue = InferredSchemaType['logo'];

const defaultValues: InferredSchemaType = {
  name: "",
  slug: "",
  description: "",
  logo: undefined,
  bannerImage: undefined,
  bannerAlt: "",
  bannerUrl: "",
  bannerOrder: 0,
  bannerId: undefined,
};

export type FormType = {
  name: string;
  slug: string;
  description?: string;
  logo?: File | string | null | undefined;
  logo_url?: string;
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
  const brandId = params?.id ? (Array.isArray(params.id) ? parseInt(params.id[0], 10) : parseInt(params.id, 10)) : null;
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  const [isImageDeleting, setIsImageDeleting] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [existingBanner, setExistingBanner] = useState<any>(null);
  const brandRef = useRef<FormType>(initialBrand);

  const [activeTab, setActiveTab] = useState<number>(0); // 0 for Details, 1 for FAQ, 2 for SEO

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

  // Fetch existing banner data
  useEffect(() => {
    const fetchBanner = async () => {
      if (!brandId) return;
      
      try {
        const response = await getEntityBanners({ type: "brand", brand_id: brandId });
        if (response?.data?.entityBanners && response.data.entityBanners.length > 0) {
          const banner = response.data.entityBanners[0];
          setExistingBanner(banner);
          setValue("bannerId", banner.id);
          setValue("bannerImage", banner.image);
          setValue("bannerAlt", banner.alt || "");
          setValue("bannerUrl", banner.url || "");
          setValue("bannerOrder", banner.order || 0);
          setBannerPreview(banner.image);
        }
      } catch (error) {
        console.error("Error fetching banner:", error);
        // Banner might not exist yet, which is fine
      }
    };

    fetchBanner();
  }, [brandId, setValue]);

  // Prefill form
  useEffect(() => {
    if (initialBrand) {
      brandRef.current = initialBrand;
      setValue("name", initialBrand.name);
      setValue("slug", initialBrand.slug);
      setValue("description", initialBrand.description || "");
      if (initialBrand.logo_url) {
        setValue("logo", initialBrand.logo_url as LogoFieldValue);
      } else {
        setValue("logo", undefined as LogoFieldValue);
      }
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
      if (selectedFile instanceof File) {
        formDataObj.append("logo", selectedFile);
      } else if (formData.logo === null) {
        formDataObj.append("logo", "");
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

  const onSaveBanner = async () => {
    if (!brandId) {
      showSnackbar("Brand ID is missing", "error");
      return;
    }

    setIsSavingBanner(true);
    try {
      const formData = watch();
      
      if (!selectedBannerFile && !formData.bannerAlt && !formData.bannerUrl && !existingBanner) {
        showSnackbar("Please provide at least banner image, alt text, or URL", "error");
        setIsSavingBanner(false);
        return;
      }

      const bannerData = {
        type: "brand",
        brand_id: brandId,
        image: selectedBannerFile instanceof File ? selectedBannerFile : undefined,
        alt: formData.bannerAlt || "",
        url: formData.bannerUrl || "",
        order: formData.bannerOrder || 0,
      };

      if (existingBanner?.id) {
        // Update existing banner
        await updateEntityBanner(existingBanner.id, bannerData);
        showSnackbar("Banner updated successfully!", "success");
      } else {
        // Create new banner
        await createEntityBanner(bannerData);
        showSnackbar("Banner created successfully!", "success");
        // Refresh banner data
        const response = await getEntityBanners({ type: "brand", brand_id: brandId });
        if (response?.data?.entityBanners && response.data.entityBanners.length > 0) {
          const banner = response.data.entityBanners[0];
          setExistingBanner(banner);
          setValue("bannerId", banner.id);
          setBannerPreview(banner.image);
        }
      }
    } catch (error: any) {
      console.error("Error saving banner:", error);
      const errorResponse = error?.response?.data || error;
      
      // Handle validation errors from the API
      if (errorResponse?.errors && Array.isArray(errorResponse.errors)) {
        errorResponse.errors.forEach((validationError: any) => {
          if (validationError.path && validationError.msg) {
            setError(validationError.path as keyof InferredSchemaType, {
              type: "manual",
              message: validationError.msg,
            });
            showSnackbar(validationError.msg, "error");
          }
        });
      } else if (errorResponse?.error && Array.isArray(errorResponse.error)) {
        errorResponse.error.forEach((validationError: any) => {
          if (validationError.path && validationError.message) {
            setError(validationError.path as keyof InferredSchemaType, {
              type: "manual",
              message: validationError.message,
            });
            showSnackbar(validationError.message, "error");
          }
        });
      } else if (errorResponse?.errors && !Array.isArray(errorResponse.errors)) {
        showSnackbar(errorResponse.errors[0]?.msg || errorResponse.errors, "error");
      } else {
        const errorMessage = errorResponse?.message || error?.message || "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }
    } finally {
      setIsSavingBanner(false);
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
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Brand Banner (Optional)
                </Typography>
                
                <Box sx={{ mt: 2, mb: 2 }}>
                  <FormFileUploadField
                    name="bannerImage"
                    control={control}
                    label="Banner Image"
                    onFileChange={(file) => {
                      setSelectedBannerFile(file);
                      setValue("bannerImage", file, { shouldValidate: true });
                      if (file) {
                        setBannerPreview(URL.createObjectURL(file));
                      } else {
                        setBannerPreview(null);
                      }
                    }}
                    helperText="Upload a banner image (Max size: 5MB). Supported formats: PNG, JPG, JPEG, WebP"
                    defaultImage={typeof watch("bannerImage") === 'string' ? watch("bannerImage") as string : undefined}
                    hidePreview
                  />
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    {bannerPreview && bannerPreview !== (watch("bannerImage") as string) ? (
                      <Grid item>
                        <Typography variant="subtitle2">New Banner Preview:</Typography>
                        <Box sx={{ border: '1px solid #ddd', p: 1, position: 'relative' }}>
                          <img
                            src={bannerPreview}
                            alt="New banner preview"
                            style={{ maxWidth: 300, maxHeight: 200, objectFit: 'contain' }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedBannerFile(null);
                              setBannerPreview(existingBanner?.image || null);
                              setValue("bannerImage", existingBanner?.image || undefined, { shouldValidate: true });
                            }}
                            sx={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'white' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    ) : (
                      existingBanner?.image && (
                        <Grid item>
                          <Typography variant="subtitle2">Current Banner:</Typography>
                          <Box sx={{ border: '1px solid #ddd', p: 1 }}>
                            <img
                              src={existingBanner.image}
                              alt={existingBanner.alt || "Current banner"}
                              style={{ maxWidth: 300, maxHeight: 200, objectFit: 'contain' }}
                            />
                          </Box>
                        </Grid>
                      )
                    )}
                  </Grid>
                </Box>

                <FormInputField
                  name="bannerAlt"
                  control={control}
                  label="Banner Alt Text"
                  type="text"
                />

                <FormInputField
                  name="bannerUrl"
                  control={control}
                  label="Banner URL"
                  type="url"
                  helperText="URL to redirect when banner is clicked"
                />

                <FormInputField
                  name="bannerOrder"
                  control={control}
                  label="Banner Order"
                  type="number"
                  helperText="Display order (0 = first)"
                />

                <AppButton
                  label="Save Banner"
                  loading={isSavingBanner}
                  type="button"
                  onClick={onSaveBanner}
                  fullWidth
                  size="large"
                  disabled={isSavingBanner}
                  className="mt-4 w-full"
                  disableGradient
                  sx={{ 
                    backgroundColor: "#2E9970", 
                    "&:hover": { backgroundColor: "#1E7A56" },
                    color: "#fff"
                  }}
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
        </>
      )}
    </div>
  );
};

export default EditBrandForm;
