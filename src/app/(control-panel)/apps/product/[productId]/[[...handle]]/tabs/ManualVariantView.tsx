'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Controller, SubmitHandler, Control, UseFormHandleSubmit, FieldErrors, UseFormSetValue, useForm } from 'react-hook-form';
import { Paper, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button as MuiButton, Box as MuiBox, Select, MenuItem, FormControl, InputLabel, FormHelperText } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AppButton from '@/components/Shared/AppButton';
import FormTextField from '@/components/Shared/FormTextField';
import FormCKEditor from '@/components/Shared/FormCKEditor';
import FuseLoading from '@fuse/core/FuseLoading';
import { FieldError } from 'react-hook-form';
import { DropzoneRootProps, DropzoneInputProps, useDropzone } from 'react-dropzone';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Import actual API service functions (assuming names and module path)
import {
  getProductVariants, // Assuming this can fetch manual variants or will be replaced by a specific function
  updateProductVariant, 
  deleteProductVariant,
  uploadVariantImages,
  setVariantPrimaryImage,
  deleteVariantImage,
  UpdateProductVariantRequest // Added import
} from '@/services/apiProduct'; // Added

// Reusable components
import VariantDisplayCard from '../components/VariantDisplayCard';
import VariantDetailsForm, { VariantFormData as VariantEditFormData } from '../components/VariantDetailsForm';
import { useProductForm } from '../ProductFormContext';

// Assuming VariantFormData (for create), Variant (general), VariantAttributeField types are defined elsewhere or passed/defined here
// Using placeholder types for now
type CreateVariantFormData = Record<string, any>; // For the top creation form
// type Variant = Record<string, any> & { id: string; images?: any[]; attributes: Record<string, string>; }; // General type, if needed elsewhere
type VariantAttributeField = { name: string; value: string }; // For attribute selection in create form

// --- START: Image Validation Constants ---
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_IMAGE_WIDTH = 280;
const MIN_IMAGE_HEIGHT = 280;
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
      const widthValid = img.width >= MIN_IMAGE_WIDTH;
      const heightValid = img.height >= MIN_IMAGE_HEIGHT;

      if (widthValid && heightValid) {
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
  
  if (!ACCEPTED_FILE_TYPES.includes(file.type.toLowerCase())) {
    return "Only .jpg, .jpeg, .png, and .webp formats are supported";
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return "File size must be less than 5MB";
  }
  
  const dimensionResult = await validateImageDimensions(file);
  if (!dimensionResult.valid) {
    if (dimensionResult.dimensions) {
        return `Image dimensions must be at least ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}px. Found: ${dimensionResult.dimensions.width}x${dimensionResult.dimensions.height}px.`;
    }
    return `Image dimensions must be at least ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}px. Could not verify dimensions.`;
  }
  
  return null;
};
// --- END: Image Validation Helper Functions ---

// --- START: Types and Schema for Manual Variant Editing (similar to GenerateVariantsView) ---
interface ManualVariantImage {
  id: number;
  variant_id: number;
  image_url: string;
  is_primary: boolean;
}

interface ManualVariantAttributeTerm {
    id: number;
    name: string;
    slug: string;
}
interface ManualVariantAttributeDefine {
    id: number;
    name: string;
    type: string;
}

interface ManualVariantAttribute {
  id: number;
  variant_id: number;
  attribute_id: number;
  term_id: number;
  is_visible: boolean;
  used_in_variation: boolean;
  term: ManualVariantAttributeTerm;
  attribute: ManualVariantAttributeDefine;
}

interface ManualVariantData {
  id: number; 
  product_id: number;
  slug: string;
  sku: string | null;
  regular_price: string; 
  discount_price: string | null;
  purchase_price: string | null;
  weight: string | null;
  length: string | null;
  width: string | null;
  height: string | null;
  description: string | null;
  barcode: string | null;
  stock: number; 
  low_stock_threshold: number | null;
  stock_status: string; 
  status: string; 
  variantImages: ManualVariantImage[];
  variantAttributes: ManualVariantAttribute[];
}

// Zod schema for variant editing form (copied from GenerateVariantsView, adjust if manual variants have different rules)
const variantEditSchema = z.object({
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
  depositPrice: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for sale price"),
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
// --- END: Types and Schema for Manual Variant Editing ---

// Define FormField wrapper (if not already globally available)
const FormField = ({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean; }) => (
  <div className="mb-4">
    <label className="text-sm text-green-700 mb-1 font-medium block">
        {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

// Helper function to merge unsaved form data with existing variant data
const mergeFormValuesWithVariantData = (
  variantData: ManualVariantData,
  formValues: VariantEditFormData
): ManualVariantData => {
  const mappedStockStatus = formValues.stockStatus; // Keep as "In Stock", "Out of Stock"
  return {
    ...variantData, // Start with existing variant data (ID, product_id, attributes, etc.)
    slug: formValues.slug,
    // Ensure types match ManualVariantData
    regular_price: String(formValues.regular_price), // ManualVariantData.regular_price is string
    stock: formValues.stock,         // ManualVariantData.stock is number
    status: formValues.status,       // 'active' | 'inactive'
    stock_status: mappedStockStatus, // e.g., "In Stock"
    
    discount_price: formValues.depositPrice !== null && formValues.depositPrice !== undefined ? String(formValues.depositPrice) : null,
    purchase_price: formValues.purchasePrice !== null && formValues.purchasePrice !== undefined ? String(formValues.purchasePrice) : null,
    low_stock_threshold: formValues.lowStockThreshold, // number | null
    
    weight: formValues.weight !== null && formValues.weight !== undefined ? String(formValues.weight) : null,
    length: formValues.length !== null && formValues.length !== undefined ? String(formValues.length) : null,
    width: formValues.width !== null && formValues.width !== undefined ? String(formValues.width) : null,
    height: formValues.height !== null && formValues.height !== undefined ? String(formValues.height) : null,
    
    barcode: formValues.barcode || null,
    description: formValues.description || null,
  };
};

interface ManualVariantViewProps {
  // Props for CREATE form
  createControl: Control<CreateVariantFormData>;
  handleCreateSubmit: UseFormHandleSubmit<CreateVariantFormData>;
  createErrors: FieldErrors<CreateVariantFormData>;
  createFormState: any;
  setCreateValue: UseFormSetValue<CreateVariantFormData>;
  onSubmitCreate: SubmitHandler<CreateVariantFormData>;
  productAttributes: any[];
  attributeTerms: Record<number, any[]>;
  attributeFields: VariantAttributeField[];
  setAttributeFields: (fields: VariantAttributeField[]) => void;
  pendingCombination: Record<string, any> | null;
  setPendingCombination: (combo: Record<string, any> | null) => void;
  allPossibleCombinations: Array<Record<string, any>>;
  usedCombinations: Array<Record<string, any>>;
  isCombinationMatch: (combo1: any, combo2: any) => boolean;
  setupFormForCombination: (combination: Record<string, any>) => void;
  allCombinationsUsed: boolean;
  isSubmitting: boolean; // For create form
  imageUploading: boolean; // For create form images
  pendingCreateImages: File[];
  setPendingCreateImages: (files: File[]) => void;
  pendingCreateImagePreviews: string[];
  setPendingCreateImagePreviews: (previews: string[]) => void;
  createGetRootProps: (props?: any) => DropzoneRootProps;
  createGetInputProps: (props?: any) => DropzoneInputProps;
  createIsDragActive: boolean;
  // showSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void; // Already in useSnackbar context
  
  // Add new props for search functionality
  filteredVariants?: ManualVariantData[];
  searchTerm?: string;
  setVariants: (variants: any[]) => void;
  onVariantCountChange?: (count: number) => void;
}

// API Service Placeholders - These will now call the actual imported services
const getManualProductVariantsAPI = async (productId: string | number): Promise<{ success: boolean; data?: ManualVariantData[]; message?: string }> => {
  console.log(`Fetching manual variants for product ${productId} using actual API call.`);
  try {
    const response = await getProductVariants(Number(productId));
    if (response.success) {
      return { success: true, data: response.data as ManualVariantData[] }; 
    } else {
      return { success: false, message: response.message || "Failed to fetch manual variants" };
    }
  } catch (error: any) {
    // return { success: false, message: error.message || "An error occurred while fetching manual variants" };
  }
};

// Modified updateManualProductVariantAPI to filter out null/undefined values from the payload
const updateManualProductVariantAPI = async (
  productId: string | number, 
  variantId: string | number, 
  payloadFromSubmit: Record<string, any>
): Promise<{ success: boolean; data?: ManualVariantData; message?: string, errors?: any[] }> => {
  console.log(`[updateManualProductVariantAPI] Received payload for variant ${variantId}:`, JSON.parse(JSON.stringify(payloadFromSubmit)));
  
  const finalApiPayload: Record<string, any> = {};
  for (const key in payloadFromSubmit) {
    if (Object.prototype.hasOwnProperty.call(payloadFromSubmit, key)) {
      const value = payloadFromSubmit[key];
      if (value !== null && value !== undefined) {
        finalApiPayload[key] = value;
      }
    }
  }
  
  console.log(`[updateManualProductVariantAPI] Final payload being sent to service for variant ${variantId}:`, JSON.parse(JSON.stringify(finalApiPayload)));

  try {
    // The actual service call using the cleaned payload with type assertion
    const response = await updateProductVariant(Number(productId), Number(variantId), finalApiPayload as UpdateProductVariantRequest);
    if (response.success) {
      return { success: true, data: response.data as ManualVariantData };
    } else {
      return { success: false, message: response.message || (response.errors && response.errors[0]?.msg) || "Failed to update variant", errors: response.errors };
    }
  } catch (error: any) {
    return { success: false, message: error.message || "An error occurred during update" };
  }
};

const deleteManualProductVariantAPI = async (productId: string | number, variantId: string | number): Promise<{ success: boolean; message?: string }> => {
  console.log(`Deleting manual variant ${variantId} for product ${productId} using actual API call.`);
  try {
    const response = await deleteProductVariant(Number(variantId)); // Actual API call - check if productId is needed
    if (response.success) {
      return { success: true, message: response.message || "Variant deleted successfully" };
    } else {
      return { success: false, message: response.message || "Failed to delete variant" };
    }
  } catch (error: any) {
    return { success: false, message: error.message || "An error occurred during deletion" };
  }
};

const uploadManualVariantImagesAPI = async (productId: string | number, variantId: string | number, formData: FormData): Promise<{ success: boolean; data?: { variantImages: ManualVariantImage[] }; message?: string }> => {
  console.log(`Uploading images for manual variant ${variantId} using actual API call.`, formData);
  try {
    const response = await uploadVariantImages(String(productId), String(variantId), formData); // Actual API call
    if (response.success && response.data?.variantImages) {
       // Assuming response.data.variantImages structure matches ManualVariantImage[]
      return { success: true, data: { variantImages: response.data.variantImages as ManualVariantImage[] } };
    } else if (response.success && response.data?.variant?.variantImages) { // Alternative structure seen in GenerateVariantsView
      return { success: true, data: { variantImages: response.data.variant.variantImages as ManualVariantImage[] } };
    } else {
      return { success: false, message: response.message || "Failed to upload images or invalid response structure" };
    }
  } catch (error: any) {
    return { success: false, message: error.message || "An error occurred during image upload" };
  }
};

const setManualVariantPrimaryImageAPI = async (productId: string | number, variantId: string | number, imageId: string | number): Promise<{ success: boolean; message?: string }> => {
  console.log(`Setting primary image ${imageId} for manual variant ${variantId} using actual API call.`);
  try {
    const response = await setVariantPrimaryImage(String(productId), String(variantId), String(imageId)); // Actual API call
    if (response.success) {
      return { success: true, message: response.message || "Primary image set" };
    } else {
      return { success: false, message: response.message || "Failed to set primary image" };
    }
  } catch (error: any) {
    return { success: false, message: error.message || "An error occurred setting primary image" };
  }
};

const deleteManualVariantImageAPI = async (productId: string | number, variantId: string | number, imageId: string | number): Promise<{ success: boolean; message?: string }> => {
  console.log(`Deleting image ${imageId} for manual variant ${variantId} using actual API call.`);
  try {
    const response = await deleteVariantImage(String(productId), String(variantId), String(imageId)); // Actual API call
    if (response.success) {
      return { success: true, message: response.message || "Image deleted" };
    } else {
      return { success: false, message: response.message || "Failed to delete image" };
    }
  } catch (error: any) {
    return { success: false, message: error.message || "An error occurred deleting image" };
  }
};
// End API Integration

// Helper to map API data to what VariantDisplayCard expects
const mapManualVariantForDisplayCard = (variant: ManualVariantData) => ({
  id: variant.id,
  slug: variant.slug,
  regular_price: variant.regular_price,
  stock: variant.stock,
  status: variant.status, // 'active' or 'inactive'
  variantImages: variant.variantImages?.map(img => ({ id: img.id, image_url: img.image_url, is_primary: img.is_primary })),
  variantAttributes: variant.variantAttributes?.map(attr => ({
    id: attr.id,
    attribute_name: attr.attribute.name,
    term_name: attr.term.name,
  })) || [],
});

// Helper to map API data to what VariantDetailsForm expects for its `selectedVariant` prop (for images)
const mapManualVariantForDetailsForm = (variant: ManualVariantData | null) => {
  if (!variant) return null;
  return {
    id: variant.id,
    slug: variant.slug, // For alt text, if needed by form
    variantImages: variant.variantImages?.map(img => ({ id: img.id, image_url: img.image_url, is_primary: img.is_primary })),
  };
};


// Helper functions for data transformation (copied from GenerateVariantsView)
const transformOptionalNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

const transformPriceNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const transformDimensionValue = (value: number | string | null | undefined): number | undefined => {
  const num = transformOptionalNumber(value);
  return num && num > 0 ? num : undefined;
};


const ManualVariantView: React.FC<ManualVariantViewProps> = ({
  createControl,
  handleCreateSubmit,
  createErrors,
  createFormState,
  setCreateValue,
  onSubmitCreate,
  productAttributes,
  attributeTerms,
  attributeFields,
  setAttributeFields,
  pendingCombination,
  setPendingCombination,
  allPossibleCombinations,
  usedCombinations,
  isCombinationMatch,
  setupFormForCombination,
  allCombinationsUsed,
  isSubmitting: isCreateSubmitting,
  imageUploading: isCreateImageUploading,
  pendingCreateImages,
  setPendingCreateImages,
  pendingCreateImagePreviews,
  setPendingCreateImagePreviews,
  createGetRootProps,
  createGetInputProps,
  setVariants,
  createIsDragActive,
  filteredVariants,
  searchTerm,
  onVariantCountChange
}) => {
  const { showSnackbar } = useSnackbar();
  const searchParams = useSearchParams();
  const productId = searchParams ? searchParams.get('productId') : null;
  // Get product form data for product slug
  const { formData } = useProductForm();

  // --- START: State for Manual Variant List and Edit ---
  const [manualVariants, setManualVariants] = useState<ManualVariantData[]>([]);
  const [selectedManualVariant, setSelectedManualVariant] = useState<ManualVariantData | null>(null);
  const [isLoadingManualVariants, setIsLoadingManualVariants] = useState(false);
  const [isUpdatingManualVariant, setIsUpdatingManualVariant] = useState(false);
  const [isManualImageUploading, setIsManualImageUploading] = useState(false);
  const [isManualDeleteDialogOpen, setIsManualDeleteDialogOpen] = useState(false);
  const [manualVariantToDeleteId, setManualVariantToDeleteId] = useState<number | string | null>(null);
  
  const originalSelectedManualVariantRef = useRef<ManualVariantData | null>(null);
  const prevSelectedManualVariantIdRef = useRef<number | string | null>(null);
  // --- END: State for Manual Variant List and Edit ---

  // Form handling for EDITING manual variants
  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    reset: resetEditForm,
    getValues: getEditValues,
    setValue: setEditValue,
    formState: { errors: editErrors, isDirty: isEditDirty, isValid: isEditValid, dirtyFields: editDirtyFields },
  } = useForm<VariantEditFormData>({
    resolver: zodResolver(variantEditSchema),
    mode: "all", // Or "onChange"
    defaultValues: { // Sensible defaults
      slug: "", sku: "", regular_price: 0, stock: 0, status: "active", stockStatus: "In Stock",
      depositPrice: null, purchasePrice: null, lowStockThreshold: null,
      weight: null, length: null, width: null, height: null,
      barcode: null, description: null,
    },
  });
  
  // Dropzone for EDIT form images
  const { getRootProps: editGetRootProps, getInputProps: editGetInputProps, isDragActive: isEditDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (!selectedManualVariant || !productId) {
        showSnackbar("No variant selected or product ID missing for image upload.", "error");
        return;
      }
      
      if (acceptedFiles.length === 0) return;

      setIsManualImageUploading(true);

      const validationResults = await Promise.all(
        acceptedFiles.map(async (file) => {
          const error = await validateFile(file); // Use the local validateFile function
          return { file, error };
        })
      );

      const filesToUpload = validationResults.filter(r => !r.error).map(r => r.file);
      const invalidFilesInfo = validationResults.filter(r => r.error);

      invalidFilesInfo.forEach(info => {
        if (info.error) {
          showSnackbar(`Error for ${info.file.name}: ${info.error}`, "error");
        }
      });

      if (filesToUpload.length === 0) {
        setIsManualImageUploading(false);
        if (acceptedFiles.length > 0) showSnackbar("Image upload failed, please check the image dimensions and file type.", "warning");
        return;
      }

      const formData = new FormData();
      filesToUpload.forEach(file => formData.append("files", file));

      try {
        const response = await uploadManualVariantImagesAPI(productId, selectedManualVariant.id, formData);
        if (response.success && response.data?.variantImages) {
          const newImages = response.data.variantImages;
          const currentFormValues = getEditValues();

          let finalUpdatedSelectedVariant: ManualVariantData | null = null;

          setManualVariants(prev => prev.map(v => {
            if (v.id === selectedManualVariant.id) {
              const variantBaseWithFormEdits = mergeFormValuesWithVariantData(v, currentFormValues);
              const updatedImages = [...(variantBaseWithFormEdits.variantImages || [])];
              newImages.forEach(newImg => {
                if (!updatedImages.find(exImg => exImg.image_url === newImg.image_url)) updatedImages.push(newImg);
              });
              const hasPrimary = updatedImages.some(img => img.is_primary);
              if (!hasPrimary && updatedImages.length > 0) updatedImages[0].is_primary = true;
              
              finalUpdatedSelectedVariant = { ...variantBaseWithFormEdits, variantImages: updatedImages };
              return finalUpdatedSelectedVariant;
            }
            return v;
          }));

          if (finalUpdatedSelectedVariant) {
            setSelectedManualVariant(finalUpdatedSelectedVariant);
            // Update original ref to prevent unintended dirty state from image upload if form wasn't otherwise dirty
            originalSelectedManualVariantRef.current = JSON.parse(JSON.stringify(finalUpdatedSelectedVariant)); 
          }
          showSnackbar("Images uploaded successfully", "success");
        } else {
          showSnackbar(response.message || "Failed to upload images", "error");
        }
      } catch (e) {
        showSnackbar("Error uploading images", "error");
      } finally {
        setIsManualImageUploading(false);
      }
    },
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: true,
  });


  // --- START: Helper functions for edit form data transformation ---
  const getEditFieldValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '';
    return value.toString();
  };

  const getEditNumericValue = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  };

  const getEditValidStockStatus = (apiStockStatus: string | null | undefined, currentStockVal?: number): "In Stock" | "Out of Stock" => {
    const stock = currentStockVal ?? selectedManualVariant?.stock ?? 0;
    switch (apiStockStatus?.toLowerCase()) {
      case "in_stock": case "in stock": return "In Stock";
      case "out_of_stock": case "out of stock": return "Out of Stock";
      default: return stock > 0 ? "In Stock" : "Out of Stock";
    }
  };
  // --- END: Helper functions for edit form ---


  // Fetch manual variants
  useEffect(() => {
    if (productId) {
      const loadManualVariants = async () => {
        setIsLoadingManualVariants(true);
        try {
          const response = await getManualProductVariantsAPI(productId);
          if (response.success && response.data) {
            setManualVariants(response.data);
            if (response.data.length > 0 && !selectedManualVariant) { 
              setSelectedManualVariant(response.data[0]);
            }
          } else {
            setManualVariants([]);
            setSelectedManualVariant(null);
            showSnackbar(response.message || "Failed to fetch manual variants", "error");
          }
        } catch (e) {
          setManualVariants([]);
          setSelectedManualVariant(null);
        } finally {
          setIsLoadingManualVariants(false);
        }
      };
      loadManualVariants();
    } else {
      setManualVariants([]);
      setSelectedManualVariant(null);
    }
  }, [productId, showSnackbar, selectedManualVariant]); // Added selectedManualVariant to dependency array to correctly handle initial selection

  // Reset edit form when selectedManualVariant changes
  useEffect(() => {
    if (selectedManualVariant) {
      resetEditForm({
        slug: getEditFieldValue(selectedManualVariant.slug),
        sku: getEditFieldValue(selectedManualVariant.sku),
        regular_price: getEditNumericValue(selectedManualVariant.regular_price),
        stock: getEditNumericValue(selectedManualVariant.stock),
        status: (selectedManualVariant.status?.toLowerCase() === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
        stockStatus: getEditValidStockStatus(selectedManualVariant.stock_status, selectedManualVariant.stock),
        depositPrice: getEditNumericValue(selectedManualVariant.discount_price),
        purchasePrice: getEditNumericValue(selectedManualVariant.purchase_price),
        lowStockThreshold: getEditNumericValue(selectedManualVariant.low_stock_threshold),
        weight: getEditNumericValue(selectedManualVariant.weight),
        length: getEditNumericValue(selectedManualVariant.length),
        width: getEditNumericValue(selectedManualVariant.width),
        height: getEditNumericValue(selectedManualVariant.height),
        barcode: getEditFieldValue(selectedManualVariant.barcode),
        description: getEditFieldValue(selectedManualVariant.description),
      });
      // Update ref to the new selected variant *after* form is reset with its values
      if (prevSelectedManualVariantIdRef.current !== selectedManualVariant.id) {
         originalSelectedManualVariantRef.current = JSON.parse(JSON.stringify(selectedManualVariant));
      }
      prevSelectedManualVariantIdRef.current = selectedManualVariant.id;
    } else {
      resetEditForm({ // Reset to defaults if no variant selected
        slug: "", sku: "", regular_price: 0, stock: 0, status: "active", stockStatus: "In Stock",
        depositPrice: null, purchasePrice: null, lowStockThreshold: null,
        weight: null, length: null, width: null, height: null,
        barcode: null, description: null,
      });
      originalSelectedManualVariantRef.current = null;
      prevSelectedManualVariantIdRef.current = null;
    }
  }, [selectedManualVariant, resetEditForm]);
  
  const calculateManualVariantIsActuallyDirty = () => {
    // Use originalSelectedManualVariantRef.current for comparison, as it's the state when editing started for this variant
    const originalVariant = originalSelectedManualVariantRef.current;
    if (!originalVariant) return false; // Nothing to compare against or form is not for an existing variant

    const formValues = getEditValues();

    if (formValues.slug !== originalVariant.slug) return true;
    if (formValues.sku !== (originalVariant.sku || "")) return true;
    if (getEditNumericValue(formValues.regular_price) !== getEditNumericValue(originalVariant.regular_price)) return true;
    if (getEditNumericValue(formValues.stock) !== getEditNumericValue(originalVariant.stock)) return true; // originalVariant.stock is already a number
    if (formValues.status !== originalVariant.status?.toLowerCase()) return true;
    // For stockStatus, compare against the original value, not a re-derived one, unless it needs re-deriving based on new stock for some logic
    if (formValues.stockStatus !== getEditValidStockStatus(originalVariant.stock_status, originalVariant.stock) ) return true; 


    const originalDiscountPrice = getEditNumericValue(originalVariant.discount_price);
    const formDiscountPrice = getEditNumericValue(formValues.depositPrice);
    if (formDiscountPrice !== originalDiscountPrice) return true;
    
    const originalPurchasePrice = getEditNumericValue(originalVariant.purchase_price);
    const formPurchasePrice = getEditNumericValue(formValues.purchasePrice);
    if (formPurchasePrice !== originalPurchasePrice) return true;

    const originalLowStockThreshold = getEditNumericValue(originalVariant.low_stock_threshold);
    const formLowStockThreshold = getEditNumericValue(formValues.lowStockThreshold);
    if (formLowStockThreshold !== originalLowStockThreshold) return true;

    if (getEditNumericValue(formValues.weight) !== getEditNumericValue(originalVariant.weight)) return true;
    if (getEditNumericValue(formValues.length) !== getEditNumericValue(originalVariant.length)) return true;
    if (getEditNumericValue(formValues.width) !== getEditNumericValue(originalVariant.width)) return true;
    if (getEditNumericValue(formValues.height) !== getEditNumericValue(originalVariant.height)) return true;

    // Handle barcode: if original is null/undefined, form should be null/empty string. If original has value, compare.
    const originalBarcode = originalVariant.barcode || null; // Normalize to null if undefined/empty
    const formBarcode = formValues.barcode || null; // Normalize to null if undefined/empty
    if (formBarcode !== originalBarcode) return true;

    // Handle description similarly
    const originalDescription = originalVariant.description || null;
    const formDescription = formValues.description || null;
    if (formDescription !== originalDescription) return true;
    return false;
  };

  // Submit handler for UPDATING a manual variant
  const onSubmitManualVariantUpdate: SubmitHandler<VariantEditFormData> = async (data) => {
    if (!selectedManualVariant || !productId) {
      showSnackbar('Error: No variant selected for update or product ID missing.', 'error');
      return;
    }

    if (!calculateManualVariantIsActuallyDirty() && !isEditDirty ) {
      showSnackbar('No changes detected.', 'info');
      return;
    }

    setIsUpdatingManualVariant(true);
    
    const priceValue = data.regular_price; 
    const depositPriceValue = data.depositPrice; 
    const purchasePriceValue = data.purchasePrice; 
    
    // Dimensions from Zod are number | null
    const weightValue = data.weight;
    const lengthValue = data.length;
    const widthValue = data.width;
    const heightValue = data.height;

    const updateRequestData: any = {
      // Slug removed from API payload - not needed for variant updates
      sku: data.sku || null,
      regular_price: priceValue,
      stock: data.stock, 
      status: data.status,
      stock_status: data.stockStatus === "In Stock" ? "in_stock" :
                    data.stockStatus === "Out of Stock" ? "out_of_stock" :
                    "",
      discount_price: transformPriceNumber(data.depositPrice), 
      purchase_price: transformPriceNumber(data.purchasePrice), 
      low_stock_threshold: data.lowStockThreshold,
      weight: weightValue, // Pass as number or null
      length: lengthValue, // Pass as number or null
      width: widthValue,   // Pass as number or null
      height: heightValue, // Pass as number or null
      barcode: data.barcode || null,
      description: data.description || null,
    };

    if (selectedManualVariant.variantAttributes && selectedManualVariant.variantAttributes.length > 0) {
      updateRequestData.attributes = selectedManualVariant.variantAttributes.map(attr => ({
        attribute_id: attr.attribute_id,
        term_id: attr.term_id,
      }));
    }

    try {
      const response = await updateManualProductVariantAPI(productId, selectedManualVariant.id, updateRequestData);
      if (response.success && response.data) {
        const updatedVariant = response.data;
        setManualVariants(prev => prev.map(v => v.id === updatedVariant.id ? updatedVariant : v));
        setSelectedManualVariant(updatedVariant);
        resetEditForm(data, { keepValues: true, keepDirty: false });
        originalSelectedManualVariantRef.current = JSON.parse(JSON.stringify(updatedVariant));
        showSnackbar("Manual variant updated successfully", "success");
      } else {
        showSnackbar(response.message || "Failed to update manual variant", "error");
      }
    } catch (e) {
      showSnackbar("Error updating manual variant", "error");
    } finally {
      setIsUpdatingManualVariant(false);
    }
  };

  // Handlers for image operations for selected manual variant
  const handleManualSetPrimaryImage = async (imageId: number) => {
    if (!selectedManualVariant || !productId) return;
    try {
      await setManualVariantPrimaryImageAPI(productId, selectedManualVariant.id, imageId);
      
      const currentFormValues = getEditValues();
      const variantBaseWithFormEdits = mergeFormValuesWithVariantData(selectedManualVariant, currentFormValues);
      
      const updatedImages = variantBaseWithFormEdits.variantImages.map(img => ({ ...img, is_primary: img.id === imageId }));
      const finalUpdatedVariant = { ...variantBaseWithFormEdits, variantImages: updatedImages };
      
      setSelectedManualVariant(finalUpdatedVariant);
      setManualVariants(prev => prev.map(v => v.id === finalUpdatedVariant.id ? finalUpdatedVariant : v));
      showSnackbar("Primary image set", "success");
    } catch (e) { showSnackbar("Failed to set primary image", "error"); }
  };

  const handleManualDeleteImage = async (imageId: number) => {
    if (!selectedManualVariant || !productId) return;
    try {
      await deleteManualVariantImageAPI(productId, selectedManualVariant.id, imageId);

      const currentFormValues = getEditValues();
      const variantBaseWithFormEdits = mergeFormValuesWithVariantData(selectedManualVariant, currentFormValues);

      let updatedImages = variantBaseWithFormEdits.variantImages.filter(img => img.id !== imageId);
      const deletedWasPrimary = variantBaseWithFormEdits.variantImages.find(img => img.id === imageId)?.is_primary;

      if (deletedWasPrimary && updatedImages.length > 0 && !updatedImages.some(img => img.is_primary)) {
        updatedImages[0].is_primary = true;
        // Persist this new primary image selection with API
        await setManualVariantPrimaryImageAPI(productId, selectedManualVariant.id, updatedImages[0].id);
      }
      
      const finalUpdatedVariant = { ...variantBaseWithFormEdits, variantImages: updatedImages };

      setSelectedManualVariant(finalUpdatedVariant);
      setManualVariants(prev => prev.map(v => v.id === finalUpdatedVariant.id ? finalUpdatedVariant : v));
      showSnackbar("Image deleted", "success");
    } catch (e) { showSnackbar("Failed to delete image", "error"); }
  };
  
  // Delete manual variant
  const openDeleteManualVariantDialog = (variantId: number | string) => {
    setManualVariantToDeleteId(variantId);
    setIsManualDeleteDialogOpen(true);
  };

  const confirmDeleteManualVariant = async () => {
    if (!manualVariantToDeleteId || !productId) return;
    try {
      const response = await deleteManualProductVariantAPI(productId, manualVariantToDeleteId);
      if (response.success) {
        const newVariants = manualVariants.filter(v => v.id !== manualVariantToDeleteId);
        setVariants(newVariants);
        setManualVariants(newVariants);
        onVariantCountChange?.(newVariants.length);

        if (selectedManualVariant?.id === manualVariantToDeleteId) {
          setSelectedManualVariant(null); // Clear selection if deleted variant was selected
        }
        showSnackbar("Manual variant deleted", "success");
      } else {
        showSnackbar(response.message || "Failed to delete variant", "error");
      }
    } catch (e) {
      showSnackbar("Error deleting variant", "error");
    } finally {
      setIsManualDeleteDialogOpen(false);
      setManualVariantToDeleteId(null);
    }
  };


  // Use specific form states for CREATE form
  const { isValid: isCreateValid, isDirty: isCreateDirty } = createFormState;

  // Add useEffect to clear slug when pendingCombination changes for the CREATE form
  useEffect(() => {
    if (setCreateValue) { // Ensure setCreateValue is available
      setCreateValue("slug", "", { shouldDirty: true});
    }
  }, [pendingCombination, setCreateValue]);

  // Add new state for notification (for CREATE form)
  const [showAllCombinationsNotification, setShowAllCombinationsNotification] = useState(false);

  // Add useEffect to handle notification (for CREATE form)
  useEffect(() => {
    if (allCombinationsUsed) {
      setShowAllCombinationsNotification(true);
      const timer = setTimeout(() => {
        setShowAllCombinationsNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [allCombinationsUsed]);

  // Add wrapper for create submit (for CREATE form)
  const handleCreateSubmitWrapper = async (data: CreateVariantFormData) => {
    try {
      console.log("[ManualVariantView Create] Passing raw form data to onSubmitCreate prop:", data);
      await onSubmitCreate(data); // This is the prop for creating a new variant based on combinations
    } catch (error) {
      console.error("[ManualVariantView Create] Error during create submission wrapper:", error);
      throw error;
    }
  };

  // Use filteredVariants when available with searchTerm
  const variantsToShow = searchTerm && filteredVariants ? filteredVariants : manualVariants;

  return (
    <div className="w-full">
      {/* --- START: CREATE NEW VARIANT FORM (Existing UI) --- */}
      {!allCombinationsUsed ? (
        <Paper elevation={3} className="p-4 bg-white mb-6">
          <h2 className="text-xl font-bold mb-4">Create New Variant (Manual Combination)</h2>
          {/* Combination selection UI */}
          <div className="mb-2">
            {allPossibleCombinations.length > 0 && (
              <div className="text-sm bg-blue-50 border border-blue-200 p-2 rounded mb-4">
                <span className="font-medium">Combinations:</span> {usedCombinations.length} of {allPossibleCombinations.length} combinations used.
                <span className="font-medium ml-2">Remaining:</span> {allPossibleCombinations.length - usedCombinations.length}
              </div>
            )}
          </div>
          <div className="mb-6 rounded-lg p-4 border bg-white">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Current Variant Attributes</h3>
              {productAttributes.length > 0 && (
                <div className="text-xs text-gray-500">
                  {pendingCombination ? 'Currently adding the combination below' : 'Select attributes to create individual variants'}
                </div>
              )}
            </div>
            {productAttributes.length === 0 ? (
              <div className="text-center py-4 bg-gray-50 rounded">
                <p className="text-gray-500">No attributes found for this product.</p>
                <p className="mt-2 text-gray-500 text-sm">Please add attributes in the Attributes tab first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 mb-3">
                {attributeFields.map((field, index) => {
                  const attribute = productAttributes.find(attr => attr.name === field.name);
                  const attributeId = attribute?.id;
                  const allTermsForAttr = attributeId ? attributeTerms[attributeId] || [] : [];
                  const availableTerms = allTermsForAttr; // Simplified
                  return (
                    <div key={index} className="mb-3">
                      <label className="block text-sm text-green-700 font-medium mb-1">
                        {field.name || "Attribute"}
                      </label>
                      <select
                        value={field.value}
                        onChange={(e) => {
                          const newFields = [...attributeFields]; newFields[index].value = e.target.value; setAttributeFields(newFields);
                          const attribute = productAttributes.find(attr => attr.name === field.name);
                          const attributeId = attribute?.id;

                          if (attributeId) { // Ensure attributeId is valid before proceeding
                            const currentPendingCombination = pendingCombination || {}; // Handle if pendingCombination is initially null
                            const updatedCombo = { ...currentPendingCombination };
                            const termData = (attributeTerms[attributeId] || []).find((t: any) => t.name === e.target.value);

                            if (termData) { // If a valid term is selected
                              updatedCombo[field.name] = { term_id: termData.id, attribute_id: attributeId, value: termData.name };
                              setPendingCombination(updatedCombo);
                              setCreateValue("slug", "", { shouldValidate: true, shouldDirty: true }); // Clear slug
                            } else { // If e.target.value is empty (term deselected) or term not found
                              if (updatedCombo[field.name]) { // If the field was previously set in the combo
                                delete updatedCombo[field.name];
                                setPendingCombination(Object.keys(updatedCombo).length > 0 ? updatedCombo : null);
                                setCreateValue("slug", "", { shouldValidate: true, shouldDirty: true }); // Clear slug
                              }
                            }
                          }
                        }}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white appearance-none h-10 text-sm">
                        <option value="">Select {field.name}</option>
                        {allTermsForAttr.map((term: any) => <option key={term.id} value={term.name}>{term.name}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create form fields */}
          <form onSubmit={handleCreateSubmit(handleCreateSubmitWrapper)}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Controller
                name="stockStatus"
                control={createControl}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error} variant="outlined">
                    <InputLabel id="create-stock-status-label" className="text-green-700">Stock Status *</InputLabel>
                    <Select
                      {...field}
                      labelId="create-stock-status-label"
                      label="Stock Status *"
                      className="bg-white rounded-lg"
                    >
                      <MenuItem value="In Stock">In Stock</MenuItem>
                      <MenuItem value="Out of Stock">Out of Stock</MenuItem>
                    </Select>
                    {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
                  </FormControl>
                )}
              />
              <Controller
                name="status"
                control={createControl}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error} variant="outlined">
                    <InputLabel id="create-status-label" className="text-green-700">Status *</InputLabel>
                    <Select
                      {...field}
                      labelId="create-status-label"
                      label="Status *"
                      className="bg-white rounded-lg"
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                    {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <FormTextField name="regular_price" control={createControl} label="Regular Price" required type="number" />
              <FormTextField name="depositPrice" control={createControl} label="Sale Price" type="number" />
              <FormTextField name="purchasePrice" control={createControl} label="Purchase Price" type="number" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <FormTextField name="stock" control={createControl} label="Stock" required type="number" />
              <FormTextField name="lowStockThreshold" control={createControl} label="Low Stock Threshold" type="number" />
              <div>
                <FormTextField name="slug" control={createControl} label="Slug" required placeholder="variant-slug" />
              </div>
            </div>
            <div className="mb-4">
              <MuiBox sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <MuiBox sx={{ flex: 1 }}>
                  <FormTextField
                    name="sku"
                    control={createControl}
                    label="SKU"
                    type="text"
                  />
                </MuiBox>
                <MuiButton 
                  variant="outlined" 
                  onClick={() => {
                    const productSlugValue = formData?.slug || "";
                    if (productSlugValue) {
                      setCreateValue("sku", productSlugValue, { shouldValidate: true });
                      showSnackbar("SKU filled with product slug value", "success");
                    } else {
                      showSnackbar("Product slug not available", "warning");
                    }
                  }}
                      sx={{ 
                        height: '40px',
                        textTransform: 'none',
                        whiteSpace: 'nowrap',
                        minWidth: 'auto',
                        px: 2,
                        borderColor: '#247c5c',
                        color: '#247c5c',
                        '&:hover': {
                          borderColor: '#1a5c43',
                          backgroundColor: 'rgba(36, 124, 92, 0.04)',
                        }
                      }}
                    >
                      Same as slug
                    </MuiButton>
              </MuiBox>
            </div>
          
            <div className="mb-4">
              <h3 className="font-semibold mb-3 text-md">Dimensions & Weight</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <FormTextField name="weight" control={createControl} label="Weight" type="number" />
                <FormTextField name="length" control={createControl} label="Length" type="number" />
                <FormTextField name="width" control={createControl} label="Width" type="number" />
                <FormTextField name="height" control={createControl} label="Height" type="number" />
              </div>
            </div>
            <FormTextField name="barcode" control={createControl} label="Barcode" />
            <div className="mt-2">
              <FormCKEditor
                name="description"
                control={createControl}
                label="Description"
              />
            </div>

            <div className="mt-4">
              <label className="text-sm text-green-700 font-medium block mb-3">
                Image
              </label>
              {pendingCreateImagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {pendingCreateImagePreviews.map((url, idx) => (
                    <div key={idx} className="relative border rounded p-1">
                      <img src={url} alt={`preview ${idx}`} className="w-full h-24 object-contain" />
                      <IconButton size="small" color="error" className="bg-white absolute top-1 right-1" onClick={() => {
                          const updImages = [...pendingCreateImages]; const updPreviews = [...pendingCreateImagePreviews];
                          URL.revokeObjectURL(updPreviews[idx]); updImages.splice(idx,1); updPreviews.splice(idx,1);
                          setPendingCreateImages(updImages); setPendingCreateImagePreviews(updPreviews);
                        }} disabled={isCreateSubmitting}><DeleteIcon fontSize="small" /></IconButton>
                    </div>))}
                </div>)}
              <div {...createGetRootProps()} className={`border rounded flex flex-col items-center justify-center py-8 bg-gray-50 ${createIsDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'} ${(isCreateImageUploading || isCreateSubmitting) ? 'opacity-70 cursor-wait' : 'cursor-pointer'} mb-3`}>
                <input {...createGetInputProps()} disabled={isCreateSubmitting || isCreateImageUploading} />
                {isCreateImageUploading ? <FuseLoading className="mb-2" /> : <><CloudUploadIcon className="text-gray-400 mb-2" /><p className="text-center text-sm">{createIsDragActive ? "Drop" : "Upload Image"}</p><p className="text-xs">5MB max</p></>}
              </div>
            </div>
            <div className="mt-6 text-right">
              <AppButton label="Add New Variant" type="submit" disabled={!isCreateValid || isCreateSubmitting || !pendingCombination} loading={isCreateSubmitting} />
            </div>
          </form>
        </Paper>
      ) : (
        <> {/* Notification when all combinations used */}
        {showAllCombinationsNotification && (
        <Paper elevation={3} className="p-4 bg-white mb-6 relative" sx={{ borderLeft: '4px solid #4CAF50', backgroundColor: '#F1F8E9' }}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-green-600 font-medium mb-1">All combinations are completely added.</h3>
              <p className="text-gray-600">You have created all possible variant combinations for this product.</p>
            </div>
            <IconButton size="small" onClick={() => setShowAllCombinationsNotification(false)} sx={{ padding: '4px' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
        </Paper>
        )}
      </>
      )}
      {/* --- END: CREATE NEW VARIANT FORM --- */}

      {/* --- START: LIST AND EDIT MANUALLY CREATED VARIANTS --- */}
        {variantsToShow.length > 0 && (
        <>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left side - Variant cards */}
            <div className="w-full md:w-1/2 max-h-[600px] overflow-y-auto pr-2">
              {variantsToShow.map((variant) => (
                <VariantDisplayCard
                  key={variant.id}
                  variant={mapManualVariantForDisplayCard(variant)}
                  isSelected={selectedManualVariant?.id === variant.id}
                  onClick={() => setSelectedManualVariant(variant)}
                  onDelete={() => openDeleteManualVariantDialog(variant.id)}
                  isActionDisabled={isUpdatingManualVariant || isManualImageUploading}
                />
              ))}
            </div>

            {/* Right side - Variant Details Form for Editing */}
            {selectedManualVariant && (
              <div className="w-full md:w-1/2" key={selectedManualVariant.id}> {/* Key for re-mount on selection change */}
                <VariantDetailsForm
                  control={editControl}
                  handleSubmit={handleEditSubmit}
                  onSubmit={onSubmitManualVariantUpdate}
                  selectedVariant={mapManualVariantForDetailsForm(selectedManualVariant)}
                  isSaving={isUpdatingManualVariant}
                  isSaveDisabled={isUpdatingManualVariant || isManualImageUploading || !isEditValid || !calculateManualVariantIsActuallyDirty()}
                  getValues={getEditValues}
                  setValue={setEditValue}
                  showSnackbar={showSnackbar}
                  imageGetRootProps={editGetRootProps}
                  imageGetInputProps={editGetInputProps}
                  isImageDragActive={isEditDragActive}
                  isImageUploading={isManualImageUploading}
                  onSetPrimaryImage={handleManualSetPrimaryImage}
                  onDeleteImage={handleManualDeleteImage}
                  productSlug={formData?.slug || ""}
                />
              </div>
            )}
          </div>
          </>
        )}
      {/* --- END: LIST AND EDIT MANUALLY CREATED VARIANTS --- */}

      {/* Add empty state message with searchTerm */}
      {variantsToShow.length === 0 && !isLoadingManualVariants && (
        <div className="p-4 border rounded bg-gray-50 text-center text-gray-600">
          {searchTerm 
            ? `No variants found matching "${searchTerm}". Try a different search term.`
            : "No manual variants found. Create your first variant using the form above."}
        </div>
      )}

      {/* Delete Confirmation Dialog for Manual Variants */}
      <Dialog
        open={isManualDeleteDialogOpen}
        onClose={() => setIsManualDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this manual variant (ID: {manualVariantToDeleteId})? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setIsManualDeleteDialogOpen(false)}>Cancel</MuiButton>
          <MuiButton onClick={confirmDeleteManualVariant} color="error" autoFocus>
            Delete
          </MuiButton>
        </DialogActions>
      </Dialog>

    </div>
  );
};

export default ManualVariantView; 