"use client";

import React, { useEffect, useState, useRef } from 'react';
import FuseLoading from '@fuse/core/FuseLoading';
import { generateProductVariants, getProductVariants, updateProductVariant, UpdateProductVariantRequest, deleteProductVariant } from '@/services/apiProduct';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useSearchParams } from 'next/navigation';
import { IconButton, Paper, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormTextField from '@/components/Shared/FormTextField';
import AppButton from '@/components/Shared/AppButton';
import { useDropzone, DropzoneRootProps, DropzoneInputProps } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { uploadVariantImages, setVariantPrimaryImage, deleteVariantImage } from '@/services/apiProduct';
import VariantDisplayCard from '../components/VariantDisplayCard';
import VariantDetailsForm, { VariantFormData as DetailsFormDataType } from '../components/VariantDetailsForm';
import { useProductForm } from '../ProductFormContext';

interface GenerateVariantsViewProps {
  isLoading: boolean;
  onSuccess?: () => void;
  allCombinationsUsed: boolean;
  productAttributes:any[];
  filteredVariants?: any[];
  searchTerm?: string;
  setVariants: (variants: any[] | ((prev: any[]) => any[])) => void;
}

interface VariantImage {
  id: number;
  variant_id: number;
  image_url: string;
  is_primary: boolean;
  alt_text?: string;
  isPreview?: boolean;
}

interface VariantAttribute {
  id: number;
  variant_id: number;
  attribute_id: number;
  term_id: number;
  is_visible: boolean;
  used_in_variation: boolean;
  term: {
    id: number;
    name: string;
    slug: string;
  };
  attribute: {
    id: number;
    name: string;
    type: string;
  };
}

interface GeneratedVariant {
  id: number;
  product_id: number;
  slug: string;
  sku: string; // Always a string (empty string if not provided by API), matching VariantManager
  regular_price: string;
  discount_price: string;
  purchase_price: string;
  weight: string;
  length: string;
  width: string;
  height: string | null;
  description: string;
  barcode: string;
  stock: number;
  low_stock_threshold: number;
  stock_status: string;
  status: string;
  is_discontinued?: boolean;
  variantImages: VariantImage[];
  variantAttributes: VariantAttribute[];
}

// Helper to map GeneratedVariant to VariantForCard (for VariantDisplayCard)
const mapVariantForDisplayCard = (variant: GeneratedVariant) => ({
  id: variant.id,
  slug: variant.slug,
  regular_price: variant.regular_price,
  stock: variant.stock,
  status: variant.status,
  variantImages: variant.variantImages?.map(img => ({ 
    id: img.id, 
    image_url: img.image_url, 
    is_primary: img.is_primary,
    alt_text: img.alt_text || ''
  })),
  variantAttributes: variant.variantAttributes.map(attr => ({
    id: attr.id, // or attr.term.id if more appropriate for key
    attribute_name: attr.attribute.name,
    term_name: attr.term.name,
  })),
});

// Helper to map GeneratedVariant to SelectedVariantForForm (for VariantDetailsForm)
const mapVariantForDetailsForm = (variant: GeneratedVariant | null) => {
  if (!variant) return null;
  return {
    id: variant.id,
    slug: variant.slug,
    variantImages: variant.variantImages?.map(img => ({ 
      id: img.id, 
      image_url: img.image_url, 
      is_primary: img.is_primary,
      alt_text: img.alt_text || ''
    })),
  };
};

// Add FormField component
const FormField = ({ 
  label, 
  error, 
  children, 
  required 
}: { 
  label: string; 
  error?: string; 
  children: React.ReactNode; 
  required?: boolean; 
}) => (
  <div className="mb-4">
    <label className="text-sm text-green-700 mb-1 font-medium block">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

// Add variant schema (same as in VariantManager)
const variantSchema = z.object({
  slug: z.string()
    .max(100, "Slug cannot exceed 100 characters")
    .regex(/^[a-z0-9-]*$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional()
    .nullable(),
  sku: z.string().optional(),
  regular_price: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for regular price"),
      z.number()
        .positive("Regular price must be greater than zero")
        .max(9999999.99, "Regular price exceeds maximum limit")
        .refine(
          (val) => {
            const str = val.toString();
            return !str.includes(".") || str.split(".")[1].length <= 2;
          },
          { message: "Regular price can have at most 2 decimal places" }
        ),
      z.null().refine(() => false, "Regular price is required"),
    ])
  ),
  stock: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for stock"),
      z.number()
        .int("Stock must be a whole number")
        .min(0, "Stock must be a non-negative number"),
      z.null().refine(() => false, "Stock is required"),
    ])
  ),
  status: z.enum(["active", "inactive"]).default("active"),
  stockStatus: z.enum(["In Stock", "Out of Stock"]).default("In Stock"),
  is_discontinued: z.boolean().optional().default(false),
  depositPrice: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for Sale price"),
      z.number()
        .min(0, "Sale price cannot be negative")
        .max(9999999.99, "Sale price exceeds maximum limit")
        .refine(
          (val) => {
            const str = val.toString();
            return !str.includes(".") || str.split(".")[1].length <= 2;
          },
          { message: "Sale price can have at most 2 decimal places" }
        ),
      z.null(),
    ]).optional()
  ),
  purchasePrice: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for purchase price"),
      z.number()
        .min(0, "Purchase price cannot be negative")
        .max(9999999.99, "Purchase price exceeds maximum limit")
        .refine(
          (val) => {
            const str = val.toString();
            return !str.includes(".") || str.split(".")[1].length <= 2;
          },
          { message: "Purchase price can have at most 2 decimal places" }
        ),
      z.null(),
    ]).optional()
  ),
  lowStockThreshold: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for low stock threshold"),
      z.number()
        .int("Low stock threshold must be a whole number")
        .min(0, "Low stock threshold cannot be negative"),
      z.null(),
    ]).optional()
  ),
  weight: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for weight"),
      z.number().min(0, "Weight cannot be negative"),
      z.null(),
    ]).optional()
  ),
  length: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for length"),
      z.number().min(0, "Length cannot be negative"),
      z.null(),
    ]).optional()
  ),
  width: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for width"),
      z.number().min(0, "Width cannot be negative"),
      z.null(),
    ]).optional()
  ),
  height: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for height"),
      z.number().min(0, "Height cannot be negative"),
      z.null(),
    ]).optional()
  ),
  barcode: z.string()
    .refine(val => !val || (val.length >= 3 && val.length <= 50), {
      message: "Barcode must be between 3 and 50 characters if provided",
    })
    .optional()
    .nullable(),
  description: z.string()
    .refine(val => {
      if (!val) return true; // Allow null/empty
      // Strip HTML tags to count only actual text content
      const textContent = val.replace(/<[^>]*>/g, '').trim();
      return textContent.length <= 10000;
    }, { 
      message: "Description cannot exceed 10000 characters (excluding HTML formatting)" 
    })
    .optional()
    .nullable(),
});

type GenerateVariantFormData = z.infer<typeof variantSchema>; // Renamed type

// --- START: Image Validation Constants ---
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_IMAGE_WIDTH = 280;
const MIN_IMAGE_HEIGHT = 280;
// const MAX_IMAGE_WIDTH = 800; // Removed for min-only validation
// const MAX_IMAGE_HEIGHT = 800; // Removed for min-only validation
const ACCEPTED_FILE_TYPES = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
// --- END: Image Validation Constants ---

// --- START: Image Validation Helper Functions ---
// Helper function to validate image dimensions
const validateImageDimensions = (file: File): Promise<{ valid: boolean; dimensions?: { width: number; height: number } }> => {
  return new Promise((resolve) => {
    if (!file || !(file instanceof File)) {
      resolve({ valid: true }); // Let other validations catch it
      return;
    }

    const img = document.createElement('img');
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const widthValid = img.width >= MIN_IMAGE_WIDTH; // Check min width
      const heightValid = img.height >= MIN_IMAGE_HEIGHT; // Check min height

      if (widthValid && heightValid) { // Valid if both are met
        resolve({ valid: true, dimensions: { width: img.width, height: img.height } });
      } else {
        resolve({
          valid: false,
          dimensions: {
            width: img.width,
            height: img.height
          }
        });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({ valid: false });
    };
    img.src = URL.createObjectURL(file);
  });
};

// Validate file size, type and dimensions
const validateFile = async (file: File): Promise<string | null> => {
  if (!file) return "File is required";

  if (!ACCEPTED_FILE_TYPES.includes(file.type.toLowerCase())) { // Added toLowerCase for robustness
    return "Only .jpg, .jpeg, .png, and .webp formats are supported";
  }

  if (file.size > MAX_FILE_SIZE) {
    return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }

  const dimensionResult = await validateImageDimensions(file);
  if (!dimensionResult.valid) {
    if (dimensionResult.dimensions) {
        return `Image dimensions must be at least ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}px. Found: ${dimensionResult.dimensions.width}x${dimensionResult.dimensions.height}px.`; // Updated message
    }
    return `Image dimensions must be at least ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}px. Could not verify dimensions.`; // Updated message
  }

  return null;
};
// --- END: Image Validation Helper Functions ---

const GenerateVariantsView: React.FC<GenerateVariantsViewProps> = ({ isLoading: initialLoading, onSuccess, allCombinationsUsed, productAttributes, filteredVariants: propFilteredVariants, searchTerm, setVariants }) => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetchErrorOccurred, setFetchErrorOccurred] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<GeneratedVariant | null>(null);
  const { showSnackbar } = useSnackbar();
  const searchParams = useSearchParams();
  // Get productId safely once at the top
  const productId = searchParams ? searchParams.get('productId') : null;
  // Get product form data for product slug
  const { formData } = useProductForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedThisLoad, setHasGeneratedThisLoad] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [variantToDeleteId, setVariantToDeleteId] = useState<number | null>(null);

  const originalSelectedVariantRef = useRef<GeneratedVariant | null>(null);
  const prevSelectedVariantIdRef = useRef<number | null>(null);

  // Add form handling
  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    reset: resetForm,
    formState: { errors, isDirty, isValid, dirtyFields },
  } = useForm<DetailsFormDataType>({
    resolver: zodResolver(variantSchema),
    mode: "all",
    defaultValues: {
      slug: "",
      sku: "",
      regular_price: 1,
      stock: 0,
      status: "active",
      depositPrice: null,
      purchasePrice: null,
      lowStockThreshold: null,
      weight: null,
      length: null,
      width: null,
      height: null,
      barcode: null,
      description: null,
      stockStatus: "In Stock",
    },
  });

  // --- Define Helper Functions at Component Scope --- 
  const getFieldValue = (value: any): string => {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    return value.toString();
  };

  // Updated to return null if value is null/undefined/empty/NaN
  const getNumericValue = (value: any): number | null => { 
    if (value === null || value === undefined || value === '') return null; // Return null for empty
    const num = Number(value);
    return isNaN(num) ? null : num; // Return null if NaN, otherwise the number
  };

  const getValidStockStatus = (status: string | null | undefined): "In Stock" | "Out of Stock"  => {
    // Use selectedVariant from component state if needed for fallback
    const currentStock = selectedVariant?.stock ?? 0;
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case "in_stock":
      case "in stock":
        return "In Stock";
      case "out_of_stock":
      case "out of stock":
        return "Out of Stock";
      default:
        // Provide a fallback based on stock value if status is invalid/missing
        return currentStock > 0 ? "In Stock" : "Out of Stock";
    }
  };
  // --- End Helper Functions --- 

  // Add dropzone hook for image uploads
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (!selectedVariant || !productId) {
        showSnackbar("No variant selected or product ID missing to upload images.", "error");
        return;
      }

      if (acceptedFiles.length === 0) return;

      setImageUploading(true);

      const validationResults = await Promise.all(
        acceptedFiles.map(async (file) => {
          const error = await validateFile(file); // Using the local validateFile function
          return { file, error };
        })
      );

      const validFiles = validationResults.filter(r => !r.error).map(r => r.file);
      const invalidFilesInfo = validationResults.filter(r => r.error);

      invalidFilesInfo.forEach(info => {
        if (info.error) {
          showSnackbar(`Error for ${info.file.name}: ${info.error}`, "error");
        }
      });

      if (validFiles.length === 0) {
        setImageUploading(false);
        if (acceptedFiles.length > 0) showSnackbar("Image upload failed, please check the image dimensions and file type.", "warning");
        return;
      }

      // Store temporary IDs and a way to identify preview objects
      const previewImageObjects: Array<VariantImage & { _tempId: number, isPreview?: boolean, _file?: File }> = [];

      // Log for debugging
      console.log(`[onDrop] Creating previews for ${validFiles.length} valid files`);

      // Create previews only for valid files
      validFiles.forEach((file, idx) => {
        // Use negative IDs for temporary previews to avoid conflicts with API-generated IDs
        const tempId = -(Date.now() + idx); // Negative temporary ID to avoid conflicts with API IDs
        previewImageObjects.push({
          id: tempId, // This ID is temporary
          _tempId: tempId, // Store it separately for reliable lookup later
          image_url: URL.createObjectURL(file),
          is_primary: false,
          variant_id: selectedVariant.id,
          isPreview: true, // Flag to identify this as a temporary client-side preview
          _file: file // Keep file reference for FormData
        });
        console.log(`[onDrop] Created preview with temp ID: ${tempId} for file: ${file.name}`);
      });

      // Update UI with previews
      if (previewImageObjects.length > 0) {
        setGeneratedVariants(prev =>
          prev.map(v =>
            v.id === selectedVariant.id
              ? { ...v, variantImages: [...(v.variantImages || []), ...previewImageObjects] }
              : v
          )
        );
        if (selectedVariant && selectedVariant.id) {
          setSelectedVariant(prevSelected => {
            if (!prevSelected || prevSelected.id !== selectedVariant.id) return prevSelected;
            return {
              ...prevSelected,
              variantImages: [...(prevSelected.variantImages || []), ...previewImageObjects]
            };
          });
        }
      }

      const formData = new FormData();
      previewImageObjects.forEach(p => {
        if (p._file) formData.append('files', p._file);
      });

      try {
        const response = await uploadVariantImages(productId, String(selectedVariant.id), formData);
        console.log("[onDrop] Upload API Response:", response);

        // --- Robustly map API response to VariantImage[] ---
        let rawApiImages: any[] = [];
        // (Extraction logic for rawApiImages as before)
        if (response && Array.isArray(response.data?.variantImages)) {
          rawApiImages = response.data.variantImages;
        } else if (response && Array.isArray(response.data?.variant?.variantImages)) {
          rawApiImages = response.data.variant.variantImages;
        } else if (Array.isArray(response)) {
          rawApiImages = response;
        } else if (response && response.data && Array.isArray(response.data)) {
            rawApiImages = response.data;
        } else if (response && response.data && response.data.id && response.data.image_url) {
            rawApiImages = [response.data];
        } else {
            console.warn("[onDrop] API response for uploaded images is not in an expected array format:", response);
        }

        console.log("[onDrop] Raw API images:", rawApiImages);

        const newImagesFromApi: VariantImage[] = rawApiImages.map((rawImg: any) => {
          const serverId = rawImg.id ?? rawImg.image_id ?? rawImg.pk ?? rawImg.ImageId ?? rawImg.imageId;
          const imageUrl = rawImg.image_url ?? rawImg.url ?? rawImg.imageUrl;
          const isPrimary = rawImg.is_primary ?? rawImg.is_main ?? false;
          const variantId = rawImg.variant_id ?? selectedVariant.id;

          if (serverId === undefined || imageUrl === undefined) {
            console.warn("[onDrop] Skipping an image from API response due to missing id or image_url:", rawImg);
            return null;
          }
          
          console.log(`[onDrop] Mapped API image: ID=${serverId}, isPrimary=${isPrimary}, url=${imageUrl?.substring(0, 30)}...`);
          
          return {
            id: Number(serverId),
            variant_id: Number(variantId),
            image_url: imageUrl,
            is_primary: isPrimary,
            alt_text: rawImg.alt_text || '',
            // NO isPreview flag here, these are persisted images
          };
        }).filter(img => img !== null) as VariantImage[];
        console.log("[onDrop] Mapped new images from API:", newImagesFromApi);
        // --- End of robust mapping ---

        if (newImagesFromApi.length === 0) {
          console.warn("[onDrop] No new images mapped from API response.");
          showSnackbar("Upload processed, but no valid image data returned from API.", "warning");
          
          // Clean up previews since we don't have server images to replace them
          setGeneratedVariants(prev => 
            prev.map(v => 
              v.id === selectedVariant.id 
                ? { ...v, variantImages: (v.variantImages || []).filter(img => !previewImageObjects.some(p => p._tempId === img.id && img.isPreview)) } 
                : v
            )
          );
          
          if (selectedVariant && selectedVariant.id) {
            setSelectedVariant(prevSelected => {
              if (!prevSelected || prevSelected.id !== selectedVariant.id) return prevSelected;
              return {
                ...prevSelected,
                variantImages: (prevSelected.variantImages || []).filter(img => !previewImageObjects.some(p => p._tempId === img.id && img.isPreview))
              };
            });
          }
          
          setImageUploading(false);
          previewImageObjects.forEach(p => {
            if (p.image_url) URL.revokeObjectURL(p.image_url);
          });
          return;
        }

        console.log("[onDrop] Processing successful upload with", newImagesFromApi.length, "images from API");

        const currentFormValues = getValues();

        // Define a function to consistently update variants
        const updateVariantWithNewImages = (variant: GeneratedVariant): GeneratedVariant => {
          if (variant.id !== selectedVariant.id) return variant;
          
          // Remove temporary previews
          const imagesWithoutTempPreviews = (variant.variantImages || []).filter(
            img => !previewImageObjects.some(p => p._tempId === img.id && img.isPreview)
          );
          
          // Add new server images, avoiding duplicates
          const finalImages = [...imagesWithoutTempPreviews];
          newImagesFromApi.forEach(apiImg => {
            if (!finalImages.find(existingImg => existingImg.id === apiImg.id)) {
              finalImages.push(apiImg);
            }
          });
          
          // Ensure proper primary image state
          let hasPrimary = finalImages.some(img => img.is_primary);
          if (!hasPrimary && finalImages.length > 0) {
            finalImages[0].is_primary = true;
          } else if (hasPrimary) {
            // Ensure only one primary image
            let primaryFound = false;
            finalImages.forEach(img => {
              if (img.is_primary) {
                if (primaryFound) img.is_primary = false;
                else primaryFound = true;
              }
            });
          }
          
          // Return updated variant with form values
          return {
            ...variant,
            ...currentFormValues,
            regular_price: String(getNumericValue(currentFormValues.regular_price) ?? variant.regular_price ?? null),
            stock: getNumericValue(currentFormValues.stock) ?? variant.stock ?? 0,
            slug: String(currentFormValues.slug || variant.slug || ''),
            sku: currentFormValues.sku || variant.sku || '',
            discount_price: String(getNumericValue(currentFormValues.depositPrice) ?? variant.discount_price ?? null),
            purchase_price: String(getNumericValue(currentFormValues.purchasePrice) ?? variant.purchase_price ?? null),
            low_stock_threshold: getNumericValue(currentFormValues.lowStockThreshold) ?? variant.low_stock_threshold ?? null,
            weight: String(getNumericValue(currentFormValues.weight) ?? variant.weight ?? null),
            length: String(getNumericValue(currentFormValues.length) ?? variant.length ?? null),
            width: String(getNumericValue(currentFormValues.width) ?? variant.width ?? null),
            height: String(getNumericValue(currentFormValues.height) ?? variant.height ?? null),
            barcode: String(currentFormValues.barcode || variant.barcode || ''),
            description: String(currentFormValues.description || variant.description || ''),
            status: String(currentFormValues.status || variant.status || 'inactive') as 'active' | 'inactive',
            stock_status: String(currentFormValues.stockStatus || variant.stock_status || 'Out of Stock'),
            variantImages: finalImages
          };
        };

        // Update state using the consistent function
        setGeneratedVariants(prev => prev.map(updateVariantWithNewImages));
        setSelectedVariant(prevSelected => prevSelected ? updateVariantWithNewImages(prevSelected) : null);

        // Update originalSelectedVariantRef for dirty state checking
        if (selectedVariant) {
          const updatedVariant = updateVariantWithNewImages(selectedVariant);
          originalSelectedVariantRef.current = JSON.parse(JSON.stringify(updatedVariant));
        }

        // Handle first image as primary if needed
        const firstApiImage = newImagesFromApi[0];
        const originallyWasPrimary = rawApiImages.find((rawImg:any) => 
          (rawImg.id ?? rawImg.image_id ?? rawImg.pk) === firstApiImage.id)?.is_primary;
          
        if (firstApiImage && firstApiImage.is_primary && !originallyWasPrimary) {
          try {
            await setVariantPrimaryImage(productId, String(selectedVariant.id), String(firstApiImage.id));
            showSnackbar("Images uploaded and first new image set as primary.", "success");
          } catch (primaryApiError) {
            console.error("[onDrop] Failed to persist default primary image via API:", primaryApiError);
            showSnackbar("Images uploaded, but failed to save default primary image setting.", "warning");
          }
        } else {
          showSnackbar("Images uploaded successfully.", "success");
        }

      } catch (error) {
        console.error("Error uploading images:", error);
        showSnackbar("Failed to upload images", "error");
        // If API call fails, remove temp previews
        setGeneratedVariants(prev => 
          prev.map(v => 
            v.id === selectedVariant.id 
              ? { ...v, variantImages: (v.variantImages || []).filter(img => !previewImageObjects.some(p => p._tempId === img.id && img.isPreview)) } 
              : v
          )
        );
        if (selectedVariant && selectedVariant.id) {
            setSelectedVariant(prevSelected => {
                if (!prevSelected || prevSelected.id !== selectedVariant.id) return prevSelected;
                return {
                    ...prevSelected,
                    variantImages: (prevSelected.variantImages || []).filter(img => !previewImageObjects.some(p => p._tempId === img.id && img.isPreview))
                };
            });
        }
      } finally {
        setImageUploading(false);
        previewImageObjects.forEach(p => {
          if (p.image_url) URL.revokeObjectURL(p.image_url);
        });
      }
    },
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: true
  });

  // Add image handling functions
  const handleSetPrimaryImage = async (imageId: number) => {
    if (!selectedVariant) return;

    // Use the derived productId variable
    if (!productId) {
      showSnackbar("Product ID not found", "error");
      return;
    }

    try {
      await setVariantPrimaryImage(productId, String(selectedVariant.id), String(imageId));
      console.log(`[handleSetPrimaryImage] API call successful for image ID: ${imageId}`);

      let updatedSelectedVariantAfterPrimary : GeneratedVariant | null = null;

      // --- Get current form values to preserve edits ---
      const currentFormValues = getValues();
      // --- End get current form values ---

      // Update local state
      setGeneratedVariants(prevVariants => 
        prevVariants.map(variant => {
          if (variant.id === selectedVariant.id) {
            // Ensure variantImages is an array
            const originalImages = Array.isArray(variant.variantImages) ? variant.variantImages : [];
            // Map to new array, updating is_primary
            const updatedImages = originalImages.map(img => ({
              ...img,
              is_primary: img.id === imageId // Set true only for the target image
            }));

            console.log(`[handleSetPrimaryImage] Updating variant ${variant.id}, images primary status:`, updatedImages.map(i => ({id: i.id, is_primary: i.is_primary})) );

            // Create the updated variant object, merging form values
            const newlyUpdatedVariant: GeneratedVariant = {
              ...variant, // Start with the existing variant from state
              // Overwrite with potentially unsaved form values, applying correct typing/mapping
              slug: String(currentFormValues.slug || variant.slug || ''),
              sku: currentFormValues.sku || variant.sku || '',
              regular_price: String(getNumericValue(currentFormValues.regular_price) ?? variant.regular_price ?? null),
              stock: getNumericValue(currentFormValues.stock) ?? variant.stock ?? 0,
              status: String(currentFormValues.status || variant.status || 'inactive') as 'active' | 'inactive',
              discount_price: String(getNumericValue(currentFormValues.depositPrice) ?? variant.discount_price ?? null),
              purchase_price: String(getNumericValue(currentFormValues.purchasePrice) ?? variant.purchase_price ?? null),
              low_stock_threshold: getNumericValue(currentFormValues.lowStockThreshold) ?? variant.low_stock_threshold ?? null,
              weight: String(getNumericValue(currentFormValues.weight) ?? variant.weight ?? null),
              length: String(getNumericValue(currentFormValues.length) ?? variant.length ?? null),
              width: String(getNumericValue(currentFormValues.width) ?? variant.width ?? null),
              height: String(getNumericValue(currentFormValues.height) ?? variant.height ?? null),
              barcode: String(currentFormValues.barcode || variant.barcode || ''),
              description: String(currentFormValues.description || variant.description || ''),
              stock_status: String(currentFormValues.stockStatus || variant.stock_status || 'Out of Stock'),
              // NOW overwrite the images with the new list
              variantImages: updatedImages
            };
             // Store for selectedVariant update
            updatedSelectedVariantAfterPrimary = newlyUpdatedVariant;
            return newlyUpdatedVariant; // Return the new object
          }
          return variant;
        })
      );

      // Update selectedVariant state AFTER generatedVariants state
      if (updatedSelectedVariantAfterPrimary) {
         setSelectedVariant(updatedSelectedVariantAfterPrimary);
      }

      showSnackbar("Primary image updated", "success");
    } catch (error) {
      console.error("Error setting primary image:", error);
      showSnackbar("Failed to set primary image", "error");
    }
  };

  // Handle updating variant image alt_text
  const handleUpdateImageAltText = async (imageId: number, altText: string) => {
    if (!selectedVariant || !productId) return;

    try {
      // Update local state
      setGeneratedVariants(prev => prev.map(variant => {
        if (variant.id === selectedVariant.id) {
          const updatedImages = variant.variantImages.map(img => 
            img.id === imageId ? { ...img, alt_text: altText } : img
          );
          return { ...variant, variantImages: updatedImages };
        }
        return variant;
      }));

      // Update selectedVariant state
      if (selectedVariant) {
        setSelectedVariant(prev => {
          if (!prev || prev.id !== selectedVariant.id) return prev;
          const updatedImages = prev.variantImages.map(img => 
            img.id === imageId ? { ...img, alt_text: altText } : img
          );
          return { ...prev, variantImages: updatedImages };
        });
      }
    } catch (error) {
      console.error("Error updating alt_text in local state:", error);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!selectedVariant) return;

    if (!productId) {
      showSnackbar("Product ID not found", "error");
      return;
    }

    console.log(`[handleDeleteImage] Attempting to delete image ID: ${imageId}`, 
      selectedVariant ? `from variant ID: ${selectedVariant.id}` : 'but no selectedVariant!');
    
    // Make sure selectedVariant.variantImages exists and is an array
    if (!selectedVariant.variantImages || !Array.isArray(selectedVariant.variantImages) || selectedVariant.variantImages.length === 0) {
      console.warn(`[handleDeleteImage] No variantImages found on selectedVariant or it's empty.`);
      showSnackbar("No images found to delete", "error");
      return;
    }

    // Debug log to check available images
    console.log(`[handleDeleteImage] Available images:`, 
      selectedVariant.variantImages.map(img => ({ id: img.id, isPrimary: img.is_primary, isPreview: img.isPreview })));

    const currentFormValues = getValues();
    const originalSelectedVariantState = selectedVariant ? JSON.parse(JSON.stringify(selectedVariant)) : null;
    const originalGeneratedVariantsState = JSON.parse(JSON.stringify(generatedVariants));

    // Find the image object to check its isPreview flag
    const imageToRemove = selectedVariant.variantImages?.find(img => img.id === imageId);

    if (!imageToRemove) {
      console.warn(`[handleDeleteImage] Image with ID ${imageId} not found in selectedVariant.variantImages. This might be due to a stale UI or state inconsistency.`);
      showSnackbar("Could not find the image to delete. It might have already been removed or the list updated.", "warning");
      return;
    }

    if (imageToRemove?.isPreview) {
      console.log(`[handleDeleteImage] Deleting client-side preview image ID: ${imageId}`);
      let imageUrlToRevoke: string | undefined;

      const updateVariantStateForLocalDelete = (variant: GeneratedVariant): GeneratedVariant => {
        if (variant.id !== selectedVariant.id) return variant;
        const updatedImages = (variant.variantImages || []).filter(img => {
          if (img.id === imageId) {
            imageUrlToRevoke = img.image_url; 
            return false; 
          }
          return true;
        });
        return {
          ...variant,
          // (Merge with form values as before)
          slug: String(currentFormValues.slug || variant.slug || ''),
          sku: currentFormValues.sku || variant.sku || '',
          regular_price: String(getNumericValue(currentFormValues.regular_price) ?? getNumericValue(variant.regular_price) ?? 0),
          stock: getNumericValue(currentFormValues.stock) ?? getNumericValue(variant.stock) ?? 0,
          status: String(currentFormValues.status || variant.status || 'inactive') as 'active' | 'inactive',
          discount_price: String(getNumericValue(currentFormValues.depositPrice) ?? getNumericValue(variant.discount_price) ?? 0),
          purchase_price: String(getNumericValue(currentFormValues.purchasePrice) ?? getNumericValue(variant.purchase_price) ?? 0),
          low_stock_threshold: getNumericValue(currentFormValues.lowStockThreshold) ?? getNumericValue(variant.low_stock_threshold) ?? null,
          weight: String(getNumericValue(currentFormValues.weight) ?? getNumericValue(variant.weight) ?? 0),
          length: String(getNumericValue(currentFormValues.length) ?? getNumericValue(variant.length) ?? 0),
          width: String(getNumericValue(currentFormValues.width) ?? getNumericValue(variant.width) ?? 0),
          height: (h => h === null ? null : String(h))(getNumericValue(currentFormValues.height) ?? getNumericValue(variant.height)),
          barcode: String(currentFormValues.barcode || variant.barcode || ''),
          description: String(currentFormValues.description || variant.description || ''),
          stock_status: String(currentFormValues.stockStatus || variant.stock_status || 'Out of Stock'),
          variantImages: updatedImages
        };
      };

      setGeneratedVariants(prevVariants => prevVariants.map(updateVariantStateForLocalDelete));
      setSelectedVariant(prevSelected => prevSelected ? updateVariantStateForLocalDelete(prevSelected) : null);

      if (imageUrlToRevoke) {
        URL.revokeObjectURL(imageUrlToRevoke);
        console.log(`[handleDeleteImage] Revoked Object URL for temporary image: ${imageUrlToRevoke}`);
      }
      showSnackbar("Temporary image preview removed", "info");
      return; 
    }

    // Proceed with API deletion for persisted images (those without isPreview or isPreview is false)
    console.log(`[handleDeleteImage] Attempting to delete persisted image ID: ${imageId} via API.`);
    try {
      await deleteVariantImage(productId, String(selectedVariant.id), String(imageId));
      console.log(`[handleDeleteImage] Successfully called API to delete image ID: ${imageId}`);

      let newPrimaryImageId: number | null = null; // Track if we need to set a new primary

      // More simplified and robust state update approach
      const updateVariantWithDeletedImage = (variant: GeneratedVariant): GeneratedVariant => {
        if (variant.id !== selectedVariant.id) return variant;
        
        // Check if deleted image was primary
        const deletedImageWasPrimary = variant.variantImages.find(img => img.id === imageId)?.is_primary || false;
        
        // Filter out the deleted image
        const updatedImages = variant.variantImages.filter(img => img.id !== imageId);
        
        // If primary was deleted and we have other images, set first as primary
        if (deletedImageWasPrimary && updatedImages.length > 0) {
          updatedImages[0].is_primary = true;
          newPrimaryImageId = updatedImages[0].id;
        }
        
        // Create updated variant with current form values and new image list
        return {
          ...variant,
          slug: String(currentFormValues.slug || variant.slug || ''),
          sku: currentFormValues.sku || variant.sku || '',
          regular_price: String(getNumericValue(currentFormValues.regular_price) ?? variant.regular_price ?? null),
          stock: getNumericValue(currentFormValues.stock) ?? variant.stock ?? 0,
          status: String(currentFormValues.status || variant.status || 'inactive') as 'active' | 'inactive',
          discount_price: String(getNumericValue(currentFormValues.depositPrice) ?? variant.discount_price ?? null),
          purchase_price: String(getNumericValue(currentFormValues.purchasePrice) ?? variant.purchase_price ?? null),
          low_stock_threshold: getNumericValue(currentFormValues.lowStockThreshold) ?? variant.low_stock_threshold ?? null,
          weight: String(getNumericValue(currentFormValues.weight) ?? variant.weight ?? null),
          length: String(getNumericValue(currentFormValues.length) ?? variant.length ?? null),
          width: String(getNumericValue(currentFormValues.width) ?? variant.width ?? null),
          height: String(getNumericValue(currentFormValues.height) ?? variant.height ?? null),
          barcode: String(currentFormValues.barcode || variant.barcode || ''),
          description: String(currentFormValues.description || variant.description || ''),
          stock_status: String(currentFormValues.stockStatus || variant.stock_status || 'Out of Stock'),
          variantImages: updatedImages
        };
      };

      // Update both state arrays with the same function to ensure consistency
      setGeneratedVariants(prevVariants => prevVariants.map(updateVariantWithDeletedImage));
      setSelectedVariant(prevSelected => prevSelected ? updateVariantWithDeletedImage(prevSelected) : null);

      // If we need to set a new primary image after deletion
      if (newPrimaryImageId !== null) {
        try {
          await setVariantPrimaryImage(productId, String(selectedVariant.id), String(newPrimaryImageId));
          showSnackbar("Image deleted and new primary set successfully", "success");
        } catch (primaryError) {
          console.error("[handleDeleteImage] Failed to persist new primary image via API:", primaryError);
          showSnackbar("Image deleted, but failed to save new primary setting", "warning");
        }
      } else {
        showSnackbar("Image deleted successfully", "success");
      }

      // Update originalSelectedVariantRef for dirty state checking
      if (selectedVariant) {
        const updatedSelectedVariant = updateVariantWithDeletedImage(selectedVariant);
        originalSelectedVariantRef.current = JSON.parse(JSON.stringify(updatedSelectedVariant));
      }

    } catch (error) {
      console.error("[handleDeleteImage] Error deleting image:", error);
      showSnackbar("Failed to delete image", "error");
    }
  };

  // Helper function to generate default SKU for a variant
  const generateDefaultSku = (variant: GeneratedVariant): string | null => {
    // If variant already has a SKU, return it
    if (variant.sku && variant.sku.trim() !== '') {
      return variant.sku;
    }
    
    // Generate SKU based on variant slug or ID
    // Format: Use slug if available, otherwise use variant ID
    if (variant.slug && variant.slug.trim() !== '') {
      // Use slug as base for SKU, convert to uppercase and replace hyphens
      return variant.slug.toUpperCase().replace(/-/g, '');
    }
    
    // Fallback to variant ID if slug is not available
    if (variant.id) {
      return `VAR-${variant.id}`;
    }
    
    return null;
  };

  // Fetch EXISTING variants (Simplified: No dialog logic here)
  const fetchVariants = async (productIdParam: string, isMounted: boolean) => {
    setIsLoading(true); 
    setError(null);
    setFetchErrorOccurred(false);
    try {
      console.log(`[fetchVariants] Fetching variants for ID: ${productIdParam}`);
      const response = await getProductVariants(Number(productIdParam));
      console.log("[fetchVariants] Response:", response);
      if (!isMounted) return; // Check mount state after await

      if (response.success) {
        const fetchedVariants = (response.data || []).map((variant: any) => {
          // Create a properly typed variant object - same as VariantManager
          const mappedVariant: GeneratedVariant = {
            id: variant.id,
            product_id: variant.product_id,
            slug: variant.slug || '',
            // Use SKU directly from API response, default to empty string like VariantManager
            sku: variant.sku || "",
            regular_price: variant.regular_price || '0',
            discount_price: variant.discount_price || null,
            purchase_price: variant.purchase_price || null,
            weight: variant.weight || null,
            length: variant.length || null,
            width: variant.width || null,
            height: variant.height || null,
            description: variant.description || null,
            barcode: variant.barcode || null,
            stock: variant.stock || 0,
            low_stock_threshold: variant.low_stock_threshold || null,
            stock_status: variant.stock_status || 'out_of_stock',
            status: variant.status || 'inactive',
            variantImages: variant.variantImages?.map((img: any) => ({
              id: img.id,
              image_url: img.image_url,
              is_primary: img.is_primary,
              alt_text: img.alt_text || ''
            })) || [],
            variantAttributes: variant.variantAttributes || []
          };
          
          return mappedVariant;
        });
        setGeneratedVariants(fetchedVariants);
        // Select first variant if list is not empty and none is selected
        if (fetchedVariants.length > 0 && !selectedVariant) { 
            setSelectedVariant(fetchedVariants[0]);
        } else if (fetchedVariants.length === 0) {
             setSelectedVariant(null); // Clear selection if no variants
        }
        // Update selected variant if it still exists after fetch
        else if (selectedVariant && !fetchedVariants.some(v => v.id === selectedVariant.id)) {
             setSelectedVariant(fetchedVariants[0] || null); // Select first or null if old selection gone
        }
      } else {
          throw new Error(response.message || "Failed to fetch variants");
      }
    } catch (error: any) {
      if (!isMounted) return;
      console.error('[fetchVariants] Error fetching variants:', error);
      setError(error.message || 'Failed to fetch variants'); 
      setFetchErrorOccurred(true);
       setGeneratedVariants([]); 
       setSelectedVariant(null);
       setIsLoading(false);
    } finally {
       if (isMounted) setIsLoading(false); // Ensure loading stops
    }
  };

  // --- useEffect to fetch variants on initial load/product change --- 
  useEffect(() => {
    let isMounted = true; // Add mount check flag
    setHasGeneratedThisLoad(false); // Reset generation flag
    setIsConfirmationDialogOpen(false); // Ensure dialog is closed initially
    setFetchErrorOccurred(false);

    // Use the derived productId variable
    if (productId) {
      // Call fetchVariants (now only fetches data)
      fetchVariants(productId, isMounted); 
    } else {
      if (isMounted) {
          setError('Product ID not found');
          showSnackbar('Product ID not found', 'error');
          setGeneratedVariants([]);
          setSelectedVariant(null);
          setIsLoading(false); // Stop loading if no product ID
      }
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [productId, showSnackbar]); // Dependencies: only things that trigger initial load/reset

  // --- ADDED: useEffect to control dialog visibility --- 
  useEffect(() => {    
    // Open dialog if EITHER fetch failed OR (combinations available AND not generated this load)
    if (!allCombinationsUsed && !hasGeneratedThisLoad && productAttributes.length > 0 ) {
       setIsConfirmationDialogOpen(true);
    } else {
        console.log(`[DialogEffect] Conditions NOT met. Dialog remains closed.`);
        // Ensure dialog is closed if conditions aren't met (e.g., after generation)
        setIsConfirmationDialogOpen(false); 
    }
  }, [ allCombinationsUsed, hasGeneratedThisLoad, generatedVariants.length,productAttributes]); // Add fetchErrorOccurred and generatedVariants.length

  // Update useEffect to handle form reset with selected variant
  useEffect(() => {
    console.log(`[useEffect resetEditForm GVW] Running for variant ID: ${selectedVariant?.id}, Prev ID: ${prevSelectedVariantIdRef.current}`);
    if (selectedVariant) {
      if (prevSelectedVariantIdRef.current !== selectedVariant.id) {
        console.log(`[useEffect resetEditForm GVW] Variant ID changed from ${prevSelectedVariantIdRef.current} to ${selectedVariant.id}. Resetting form.`);
        const resetValues = {
          slug: getFieldValue(selectedVariant.slug),
          sku: getFieldValue(selectedVariant.sku),
          regular_price: getNumericValue(selectedVariant.regular_price),
          stock: getNumericValue(selectedVariant.stock),
          status: (selectedVariant.status?.toLowerCase() === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
          depositPrice: getNumericValue(selectedVariant.discount_price),
          purchasePrice: getNumericValue(selectedVariant.purchase_price),
          lowStockThreshold: getNumericValue(selectedVariant.low_stock_threshold),
          stockStatus: getValidStockStatus(selectedVariant.stock_status),
          is_discontinued: Boolean(selectedVariant.is_discontinued),
          weight: getNumericValue(selectedVariant.weight),
          length: getNumericValue(selectedVariant.length),
          width: getNumericValue(selectedVariant.width),
          height: getNumericValue(selectedVariant.height),
          barcode: getFieldValue(selectedVariant.barcode),
          description: getFieldValue(selectedVariant.description)
        };
        console.log('[useEffect resetEditForm GVW] Resetting form with data:', JSON.stringify(resetValues, null, 2));
        resetForm(resetValues);
        originalSelectedVariantRef.current = JSON.parse(JSON.stringify(selectedVariant));
      } else {
        console.log(`[useEffect resetEditForm GVW] Variant ID ${selectedVariant.id} is the same. Preserving form input, only updating originalSelectedVariantRef.`);
        // IMPORTANT: Update originalSelectedVariantRef to the latest selectedVariant state
        // This ensures that if an image was uploaded, the "original" for dirty checking now includes that new image.
        originalSelectedVariantRef.current = JSON.parse(JSON.stringify(selectedVariant));
      }
      prevSelectedVariantIdRef.current = selectedVariant.id;
    } else {
      console.log('[useEffect resetEditForm GVW] No variant selected, resetting to defaults.');
      resetForm({
        slug: '',
        sku: '',
        regular_price: null,
        stock: null,
        status: 'active',
        depositPrice: null,
        purchasePrice: null,
        lowStockThreshold: null,
        stockStatus: 'In Stock',
        is_discontinued: false,
        weight: null,
        length: null,
        width: null,
        height: null,
        barcode: '',
        description: ''
      });
      originalSelectedVariantRef.current = null;
      prevSelectedVariantIdRef.current = null;
    }
  }, [selectedVariant, resetForm]);

  const calculateIsActuallyDirty = () => {
    if (!selectedVariant || !originalSelectedVariantRef.current) {
      // If selectedVariant is present but no original, treat as dirty (e.g. for a new variant flow if that existed here).
      // If neither, not dirty.
      return !!selectedVariant; 
    }

    const formValues = getValues();

    // Construct an object representing the current state based on RHF form values and selectedVariant for non-form data.
    const currentStateToCompare: Partial<GeneratedVariant> = {
        // Fields from selectedVariant state (not in RHF form directly but part of the variant)
        id: selectedVariant.id,
        product_id: selectedVariant.product_id,
        variantImages: selectedVariant.variantImages || [],
        variantAttributes: selectedVariant.variantAttributes || [],

        // Fields from the form (obtained via getValues())
        slug: formValues.slug,
        sku: formValues.sku ?? originalSelectedVariantRef.current.sku ?? '',
        regular_price: String(getNumericValue(formValues.regular_price) ?? originalSelectedVariantRef.current.regular_price), // Fallback to original for comparison consistency
        stock: getNumericValue(formValues.stock) ?? originalSelectedVariantRef.current.stock,
        status: formValues.status, // 'active' | 'inactive'
        discount_price: String(getNumericValue(formValues.depositPrice) ?? originalSelectedVariantRef.current.discount_price),
        purchase_price: String(getNumericValue(formValues.purchasePrice) ?? originalSelectedVariantRef.current.purchase_price),
        low_stock_threshold: getNumericValue(formValues.lowStockThreshold) ?? originalSelectedVariantRef.current.low_stock_threshold,
        weight: String(getNumericValue(formValues.weight) ?? originalSelectedVariantRef.current.weight),
        length: String(getNumericValue(formValues.length) ?? originalSelectedVariantRef.current.length),
        width: String(getNumericValue(formValues.width) ?? originalSelectedVariantRef.current.width),
        height: String(getNumericValue(formValues.height) ?? originalSelectedVariantRef.current.height),
        description: formValues.description ?? originalSelectedVariantRef.current.description, // Fallback to original if form value is null/undefined
        barcode: formValues.barcode ?? originalSelectedVariantRef.current.barcode,
        stock_status: formValues.stockStatus, // e.g., "In Stock", "Out of Stock"
        is_discontinued: Boolean(formValues.is_discontinued),
    };

    const dirty = JSON.stringify(currentStateToCompare) !== JSON.stringify(originalSelectedVariantRef.current);
    // console.log("Is Dirty:", dirty);
    // if (dirty) {
    //   console.log("Current for compare:", JSON.stringify(currentStateToCompare));
    //   console.log("Original for compare:", JSON.stringify(originalSelectedVariantRef.current));
    // }
    return dirty;
  };

  // Add onSubmit handler for variant updates
  const onSubmit = async (data: DetailsFormDataType) => {
    if (!selectedVariant) return;

    // Use the derived productId variable
    if (!productId) {
      // showSnackbar("Product ID not found", "error");
      setIsSubmitting(false); // Stop submission
      return;
    }

    const isActuallyDirty = calculateIsActuallyDirty();

    // Check if there are actual changes before proceeding
    if (!isActuallyDirty) {
      console.log("[onSubmit] Form is not actually dirty, no update necessary.");
      showSnackbar("No changes to save.", "info");
      return;
    }

    setIsSubmitting(true);
    try {
      const transformOptionalNumber = (value: number | string | null | undefined): number | null => {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        return isNaN(num) ? null : num;
      };

      // Helper function for price fields - returns 0 instead of null for empty values
      const transformPriceNumber = (value: number | string | null | undefined): number => {
        if (value === null || value === undefined || value === '') return 0;
        const num = Number(value);
        return isNaN(num) ? 0 : num; // Return 0 if not a valid number
      };

      // Start with an empty payload, explicitly typed
      const apiPayload: Partial<UpdateProductVariantRequest> = {};

      console.log("[onSubmit] Dirty fields:", dirtyFields);
      console.log("[onSubmit] Submitted data:", data);

      // Dynamically add fields to payload ONLY if they are dirty
      // Slug removed from API payload - not needed for variant updates
      if (dirtyFields.sku) apiPayload.sku = data.sku || null;
      if (dirtyFields.regular_price) apiPayload.regular_price = transformOptionalNumber(data.regular_price);
      if (dirtyFields.stock) apiPayload.stock = transformOptionalNumber(data.stock);
      if (dirtyFields.depositPrice) {
        const saleCleared = (data.depositPrice as any) === '' || data.depositPrice === null || data.depositPrice === undefined;
        apiPayload.discount_price = saleCleared ? 0 : transformOptionalNumber(data.depositPrice);
      }
      if (dirtyFields.purchasePrice) {
        const purchaseCleared = (data.purchasePrice as any) === '' || data.purchasePrice === null || data.purchasePrice === undefined;
        apiPayload.purchase_price = purchaseCleared ? 0 : transformOptionalNumber(data.purchasePrice);
      }
      if (dirtyFields.lowStockThreshold) apiPayload.low_stock_threshold = transformOptionalNumber(data.lowStockThreshold);
      if (dirtyFields.weight) apiPayload.weight = transformOptionalNumber(data.weight);
      if (dirtyFields.length) apiPayload.length = transformOptionalNumber(data.length);
      if (dirtyFields.width) apiPayload.width = transformOptionalNumber(data.width);
      if (dirtyFields.height) apiPayload.height = transformOptionalNumber(data.height);
      if (dirtyFields.barcode) apiPayload.barcode = data.barcode || null;
      // --- ADDED: Include status and stock_status if dirty --- 
      if (dirtyFields.status) {
        apiPayload.status = data.status; // Assuming API expects 'active' | 'inactive'
      }
      if (dirtyFields.stockStatus) {
        // Map form value to API expected value
        switch (data.stockStatus) {
          case 'In Stock': apiPayload.stock_status = 'in_stock'; break;
          case 'Out of Stock': apiPayload.stock_status = 'out_of_stock'; break;
          default: apiPayload.stock_status = null; // Or handle as error/default
        }
      }
      if (dirtyFields.is_discontinued) {
        apiPayload.is_discontinued = Boolean(data.is_discontinued);
      }

      // --- IMPORTANT: Always include attributes if required by backend --- 
      apiPayload.attributes = selectedVariant.variantAttributes.map(attr => ({
        attribute_id: attr.attribute_id,
        term_id: attr.term_id
      }));

      // --- Safety check: Include required fields if they weren't dirty ---
      // Slug removed from API payload - not needed for variant updates
      if (apiPayload.regular_price === undefined && data.regular_price !== undefined) apiPayload.regular_price = transformOptionalNumber(data.regular_price);
      if (apiPayload.stock === undefined && data.stock !== undefined) apiPayload.stock = transformOptionalNumber(data.stock);

      // Check if there are any actual changes being sent (besides attributes/required fields)
      const fieldsBeingSent = Object.keys(apiPayload).filter(key => key !== 'attributes');
      if (fieldsBeingSent.length === 0) {
        console.log("[onSubmit] No fields detected in payload to update (excluding attributes). Skipping API call.");
        setIsSubmitting(false);
        return; // Early return as no meaningful update needed
      }

      console.log("[onSubmit] Sending API payload:", apiPayload);

      await updateProductVariant(Number(productId), selectedVariant.id, apiPayload as UpdateProductVariantRequest);

      // --- Local State Update --- 
      setGeneratedVariants(prev =>
        prev.map(variant => {
          if (variant.id === selectedVariant.id) {
            return {
              ...variant,
              slug: data.slug || variant.slug, // Keep existing slug if not provided, but not sent to API
              sku: data.sku || '',
              regular_price: String(data.regular_price || 0),
              stock: Number(data.stock || 0),
              discount_price: String(data.depositPrice || 0),
              purchase_price: String(data.purchasePrice || 0),
              low_stock_threshold: Number(data.lowStockThreshold || 0),
              weight: String(data.weight || 0),
              length: String(data.length || 0),
              width: String(data.width || 0),
              height: String(data.height || null),
              barcode: data.barcode || '',
              description: data.description || '',
              stock_status: data.stockStatus,
              status: data.status,
              is_discontinued: Boolean(data.is_discontinued),
            };
          }
          return variant;
        })
      );

      showSnackbar("Variant updated successfully", "success");

      // --- Explicitly reset dirty state after successful update --- 
      // This tells RHF that the current form values are now the 'clean' baseline
      resetForm(data, { keepValues: true, keepDirty: false });
      // Update the original ref to the new clean state
      if (selectedVariant) { // selectedVariant state should have been updated by setGeneratedVariants
        const updatedVersionInState = generatedVariants.find(v => v.id === selectedVariant.id);
        if (updatedVersionInState) {
            originalSelectedVariantRef.current = JSON.parse(JSON.stringify(updatedVersionInState));
        } else {
            // Fallback if somehow not found, though it should be
            originalSelectedVariantRef.current = JSON.parse(JSON.stringify(selectedVariant)); 
        }
      }

    } catch (error) {
      console.error("Error updating variant:", error);
      // Check for error structure properly
      if (error?.errors && error?.errors.length > 0) {
        showSnackbar(error.errors[0]?.msg, "error");
      } else if (
        error?.error &&
        Array.isArray(error?.error) &&
        error.error.length > 0
      ) {
        showSnackbar(error.error[0]?.message, "error");
      } else if (error?.message) {
        showSnackbar(error.message, "error");
      } else {
        const errorMessage = "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Function to trigger actual generation (Called from Dialog Confirm) ---
  const triggerVariantGeneration = async () => {
    // Use the derived productId variable
    if (!productId) {
      // showSnackbar('Product ID is missing.', 'error');
      return; 
    }

    setIsGenerating(true); // Use specific loading state for generation
    setError(null);
    try {
      console.log(`[triggerVariantGeneration] Calling generateProductVariants for ID: ${productId}`);
      const response = await generateProductVariants(Number(productId));
      console.log("[triggerVariantGeneration] API Response:", response);
        
      if (response.success) {
        showSnackbar('Variants generated successfully', 'success');
        setHasGeneratedThisLoad(true); // <-- Set flag BEFORE fetching
        await fetchVariants(productId, true); // Fetch the updated list directly in this component
        if (onSuccess) { // Still call parent callback if provided
           onSuccess(); 
        }
      } else {
        const errorMessage = response.message || 'Failed to generate variants.';
        console.error("[triggerVariantGeneration] API Error:", errorMessage);
        setError(errorMessage);
        showSnackbar(errorMessage, 'error');
        if (onSuccess) { // Optionally call onSuccess even on failure if parent needs to react
            onSuccess();
        }
      }
    } catch (error: any) {
      console.error('[triggerVariantGeneration] Network/Catch Error:', error);
      const errorMessage = error.message || 'An unexpected error occurred during generation.';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
      if (onSuccess) { // Optionally call onSuccess even on failure
         onSuccess();
      }
    } finally {
      setIsGenerating(false); // Stop generation loading
    }
  };

  // --- Dialog Handlers ---
  const handleConfirmGenerate = () => {
    console.log("[Dialog] Confirmed Generation");
    setIsConfirmationDialogOpen(false); // Close dialog
    triggerVariantGeneration(); // Call the generation function
  };

  const handleCancelGenerate = () => {
    console.log("[Dialog] Cancelled Generation");
    setIsConfirmationDialogOpen(false); // Close dialog
    // Optionally refetch variants if needed, but fetchVariants on load might suffice
    // const productId = searchParams.get('productId');
    // if (productId) fetchVariants(productId); 
  };

  // --- Add Delete Handlers ---
  const handleDeleteClick = (variantId: number) => {
    console.log(`[handleDeleteClick] Initiating delete for variant ID: ${variantId}`);
    setVariantToDeleteId(variantId);
    setIsDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    console.log("[handleCancelDelete] Cancelled delete dialog.");
    setIsDeleteDialogOpen(false);
    setVariantToDeleteId(null);
  };

  const handleConfirmDelete = async () => {
    if (!variantToDeleteId) return;
    
    // Use the derived productId variable
    if (!productId) {
        // showSnackbar('Product ID is missing.', 'error');
        setIsDeleteDialogOpen(false);
        setVariantToDeleteId(null);
        return;
    }

    console.log(`[handleConfirmDelete] Confirming delete for variant ID: ${variantToDeleteId} of product ID: ${productId}`);
    // Optionally add a specific loading state for deletion if needed
    // setIsLoading(true); // Or a new state like setIsDeleting(true)
    
    try {
      // Pass only the variant ID as indicated by the error
      const response = await deleteProductVariant(variantToDeleteId); 
      console.log("[handleConfirmDelete] API Response:", response);

      if (response.success) {
        showSnackbar('Variant deleted successfully', 'success');
        
        // Update local state after successful deletion
        setVariants(prevVariants => prevVariants.filter(v => v.id !== variantToDeleteId));
        setGeneratedVariants(prevVariants => 
          prevVariants.filter(variant => variant.id !== variantToDeleteId)
        );
        // If the deleted variant was selected, clear the selection
        if (selectedVariant?.id === variantToDeleteId) {
          console.log("[handleConfirmDelete] Deleted variant was selected. Clearing selection.");
          setSelectedVariant(null);
          // Optionally reset form if needed, though useEffect handles selection change
        }

        // Call parent success handler (might refresh combination counts etc.)
        if (onSuccess) {
          console.log("[handleConfirmDelete] Calling parent onSuccess callback.");
          onSuccess(); 
        }
      } else {
        const errorMsg = response.message || 'Failed to delete variant.';
        console.error("[handleConfirmDelete] API Error:", errorMsg);
        showSnackbar(errorMsg, 'error');
      }
    } catch (error: any) {
      console.error('[handleConfirmDelete] Network/Catch Error:', error);
      const errorMsg = error.message || 'An unexpected error occurred during deletion.';
      showSnackbar(errorMsg, 'error');
    } finally {
      // Ensure dialog closes and ID is reset regardless of outcome
      setIsDeleteDialogOpen(false);
      setVariantToDeleteId(null);
      // Optionally stop loading state
      // setIsLoading(false); // Or setIsDeleting(false)
    }
  };
  // --- End Delete Handlers ---

  // Use propFilteredVariants when they exist and there's a search term
  const variantsToShow = searchTerm && propFilteredVariants ? propFilteredVariants : generatedVariants;

  // --- Loading States ---
  // Initial loading or fetching variants
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <FuseLoading />
        {/* <span className="ml-2">Loading variants...</span> */}
      </div>
    );
  }

  // Specific loading during generation process
  if (isGenerating) {
       return (
         <div className="flex justify-center items-center py-8">
           <FuseLoading />
           {/* <span className="ml-2">Generating new variants...</span> */}
         </div>
       );
  }

  // --- Render component ---
  return (
    <div>
      {/* REMOVE Generate Button Div */}
      {/* <div className="mb-4 flex justify-end"> ... </div> */}

      {/* Update conditional rendering for empty state */}
      {variantsToShow.length === 0 && !isLoading && !isGenerating && (
         <div className="p-4 border rounded bg-gray-50 text-center text-gray-600">
           {searchTerm 
             ? `No variants found matching "${searchTerm}". Try a different search term.`
             : allCombinationsUsed 
               ? "No variants found. All possible combinations seem to be generated."
               : "No variants found. New combinations might be available."}
         </div>
      )}

      {/* Keep variant list and form rendering */}
      {variantsToShow.length > 0 && (
        <>
            <h3 className="text-lg font-semibold mb-4">Created Variants</h3>
            <div className="flex gap-6">
              {/* Left side - Variant cards */}
            <div className="w-full md:w-1/2 max-h-[600px] overflow-y-auto pr-2">
                {variantsToShow.map((variant) => (
                  <VariantDisplayCard
                    key={variant.id}
                    variant={mapVariantForDisplayCard(variant)}
                    isSelected={selectedVariant?.id === variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    onDelete={handleDeleteClick}
                    isActionDisabled={isSubmitting}
                  />
                ))}
              </div>

              {/* Right side - Variant Details Form */}
              {selectedVariant && (
                <div className="w-1/2" key={selectedVariant.id}> {/* Ensure key is on a stable element if selectedVariant itself is the key source */}
                  <VariantDetailsForm
                    control={control}
                    handleSubmit={handleSubmit}
                    onSubmit={onSubmit}
                    selectedVariant={mapVariantForDetailsForm(selectedVariant)}
                    isSaving={isSubmitting}
                    isSaveDisabled={isSubmitting || !calculateIsActuallyDirty() || !isValid}
                    imageGetRootProps={getRootProps}
                    imageGetInputProps={getInputProps}
                    isImageDragActive={isDragActive}
                    isImageUploading={imageUploading}
                    onSetPrimaryImage={handleSetPrimaryImage}
                    onDeleteImage={handleDeleteImage}
                    getValues={getValues}
                    setValue={setValue}
                    showSnackbar={showSnackbar}
                    productSlug={formData?.slug || ""}
                    productId={productId}
                    variantId={selectedVariant?.id}
                    onUpdateImageAltText={handleUpdateImageAltText}
                  />
                </div>
              )}
            </div>
        </>
       )}

       {/* Keep Confirmation Dialog */}
       <Dialog
         open={isConfirmationDialogOpen}
         onClose={handleCancelGenerate}
         aria-labelledby="generate-variants-confirmation-title"
         aria-describedby="generate-variants-confirmation-description"
       >
         <DialogTitle id="generate-variants-confirmation-title">
                    Generate New Variants?
         </DialogTitle>
         <DialogContent>
           <DialogContentText id="generate-variants-confirmation-description">
                          New combinations based on product attributes are available. Do you want to generate these new variants?
           </DialogContentText>
         </DialogContent>
         <DialogActions>
           <Button onClick={handleCancelGenerate} color="primary">
             Cancel
           </Button>
           <Button onClick={handleConfirmGenerate} color="primary" autoFocus> 
             Generate 
           </Button>
         </DialogActions>
       </Dialog>

       {/* --- Add Delete Confirmation Dialog --- */ 
       <Dialog
         open={isDeleteDialogOpen}
         onClose={handleCancelDelete}
         aria-labelledby="delete-variant-confirmation-title"
         aria-describedby="delete-variant-confirmation-description"
       >
         <DialogTitle id="delete-variant-confirmation-title">
           Confirm Deletion
         </DialogTitle>
         <DialogContent>
           <DialogContentText id="delete-variant-confirmation-description">
             Are you sure you want to delete this variant (ID: {variantToDeleteId})? This action cannot be undone.
           </DialogContentText>
         </DialogContent>
         <DialogActions>
           <Button onClick={handleCancelDelete} color="primary">
             Cancel
           </Button>
           <Button onClick={handleConfirmDelete} color="error" autoFocus> 
             Delete
           </Button>
         </DialogActions>
       </Dialog>
       }
    </div>
  );
};

export default GenerateVariantsView; 