"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Alert, Typography, Box, Button, CircularProgress, Tabs, Tab, Divider } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormFileUploadField from "@/components/Shared/FormFileUploadField";
import { usePost, useFetch } from "@/hooks/useFetch";
import {
  updateBrand,
  brandDetails,
  removeBrandImage,
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
const MAX_IMAGE_WIDTH = 150;
const MAX_IMAGE_HEIGHT = 150;

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
};

export type FormType = {
  name: string;
  slug: string;
  description?: string;
  logo?: File | string | null | undefined;
  logo_url?: string;
};

const EditBrandForm = ({ brand: initialBrand }: { brand: FormType }) => {
  const router = useRouter();
  const params = useParams();
  const brandId = params?.id ? (Array.isArray(params.id) ? parseInt(params.id[0], 10) : parseInt(params.id, 10)) : null;
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [isImageDeleting, setIsImageDeleting] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const brandRef = useRef<FormType>(initialBrand);

  const [activeTab, setActiveTab] = useState<number>(0); // 0 for Details, 1 for FAQ, 2 for SEO

  const { control, formState, handleSubmit, setValue, watch } = useForm<InferredSchemaType>({
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
      // Consider if redirection is still desired or if staying on the edit page with tabs is preferred.
      // router.push("/apps/product-brand"); 
    } catch (error: any) {
        if (error?.errors) {
            showSnackbar(error?.errors[0]?.msg, "error");
        } else {
            const errorMessage = error?.response?.data?.message || error?.message || "An unexpected error occurred";
            showSnackbar(errorMessage, "error");
        }
    } finally {
        setIsLoading(false);
    }
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
        <PageBreadcrumb className="mt-8" />
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
                <FormInputField name="description" control={control} label="Description" type="text" />

                <Box sx={{ mt: 2, mb: 2 }}>
                  <FormFileUploadField
                    name="logo"
                    control={control}
                    label="Brand Logo"
                    onFileChange={(file) => {
                      setSelectedFile(file);
                      setValue("logo", file, { shouldValidate: true });
                    }}
                    helperText={`Upload a brand logo (${MAX_IMAGE_WIDTH} × ${MAX_IMAGE_HEIGHT} px, Max size: 5MB). Supported formats: PNG, JPG, JPEG, WebP`}
                    defaultImage={brandRef.current?.logo_url || undefined}
                  />
                  {/* Consider adding image delete button here if tied to this tab */}
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
