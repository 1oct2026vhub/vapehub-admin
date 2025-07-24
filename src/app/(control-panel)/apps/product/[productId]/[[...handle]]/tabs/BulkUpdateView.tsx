'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller, SubmitHandler, FieldError, Control as RHFControl, UseFormHandleSubmit as RHFUseFormHandleSubmit, FieldErrors as RHFFieldErrors, UseFormStateReturn as RHFUseFormStateReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { Paper, FormControlLabel, Checkbox, Select, MenuItem, FormControl, InputLabel, FormHelperText, Typography, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, CircularProgress } from '@mui/material';
import AppButton from '@/components/Shared/AppButton';
import FormTextField from '@/components/Shared/FormTextField';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import { 
  bulkUpdateProductVariants, 
  BulkUpdateProductVariantsPayload,
  updateProductVariant,
  deleteProductVariant,
  uploadVariantImages,
  setVariantPrimaryImage,
  deleteVariantImage,
  UpdateProductVariantRequest,
  getProductVariants
} from '@/services/apiProduct';
import FuseLoading from '@fuse/core/FuseLoading';
import { useDropzone, DropzoneRootProps, DropzoneInputProps } from 'react-dropzone';
import VariantDisplayCard from '../components/VariantDisplayCard';
import VariantDetailsForm, { VariantFormData } from '../components/VariantDetailsForm';

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

// --- START: Local Detailed Types for Variant Structure ---
// Based on ManualVariantView and common needs for displaying/editing variant details
interface LocalVariantImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  // variant_id?: number; // Optional, might not be needed for frontend state if parent variant is known
}

interface LocalVariantAttributeTerm {
  id: number;
  name: string;
  slug?: string; 
}

interface LocalVariantAttributeDefine {
  id: number;
  name: string;
  type?: string;
}

interface LocalVariantAttribute {
  id?: number; // Can be undefined if it represents a new attribute pairing not yet saved for the variant
  attribute_id: number; // ID of the attribute definition (e.g., "Color")
  term_id: number;      // ID of the attribute term (e.g., "Red")
  attribute: LocalVariantAttributeDefine; // Nested attribute definition details
  term: LocalVariantAttributeTerm;          // Nested attribute term details
}

// This is the main data structure used for variants within BulkUpdateView state
// It should be compatible with DetailedProductVariant from the API but may use local types for sub-structures.
interface EditableVariantData {
  id: number;
  product_id: number;
  slug: string;
  regular_price: string; // API often returns strings for prices
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
  stock_status: string; // e.g., "in_stock", "out_of_stock"
  status: string; // e.g., "active", "inactive"
  sku?: string | null; // Added SKU as it's common
  
  // Using locally defined detailed types for images and attributes
  variantImages: LocalVariantImage[]; 
  variantAttributes: LocalVariantAttribute[]; 
}
// --- END: Local Detailed Types ---

const bulkUpdateSchema = z.object({
    regular_price: z.object({
        type: z.enum(['set', 'increase', 'decrease']).optional(),
        value: z.preprocess(
            (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
            z.number({ invalid_type_error: "Regular price value must be a number" })
             .min(0, "Regular price value cannot be negative")
             .refine((val) => {
                if (val === undefined) return true;
                const str = val.toString();
                return !str.includes('.') || str.split('.')[1].length <= 2;
             }, { message: "Regular price value can have at most 2 decimal places" })
             .optional()
        ),
        is_percentage: z.boolean().optional(),
    }).optional().refine(data => !data || (data.type && data.value !== undefined) || (!data.type && data.value === undefined), {
        message: "If updating price, both type and value are required",
        path: ["root"]
    }),
    depositPrice: z.object({
        type: z.enum(['set', 'increase', 'decrease']).optional(),
        value: z.preprocess(
            (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
            z.number({ invalid_type_error: "Sale price value must be a number" })
             .min(0, "Sale price value cannot be negative")
             .refine((val) => {
                if (val === undefined) return true;
                const str = val.toString();
                return !str.includes('.') || str.split('.')[1].length <= 2;
             }, { message: "Sale price value can have at most 2 decimal places" })
             .optional()
        ),
        is_percentage: z.boolean().optional(),
    }).optional().refine(data => !data || (data.type && data.value !== undefined) || (!data.type && data.value === undefined), {
        message: "If updating deposit price, both type and value are required",
        path: ["root"]
    }),
    purchasePrice: z.object({
        type: z.enum(['set', 'increase', 'decrease']).optional(),
        value: z.preprocess(
            (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
            z.number({ invalid_type_error: "Purchase price value must be a number" })
             .min(0, "Purchase price value cannot be negative")
             .refine((val) => {
                if (val === undefined) return true;
                const str = val.toString();
                return !str.includes('.') || str.split('.')[1].length <= 2;
             }, { message: "Purchase price value can have at most 2 decimal places" })
             .optional()
        ),
        is_percentage: z.boolean().optional(),
    }).optional().refine(data => !data || (data.type && data.value !== undefined) || (!data.type && data.value === undefined), {
        message: "If updating purchase price, both type and value are required",
        path: ["root"]
    }),
    stock: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
        z.number({ invalid_type_error: "Stock must be a whole number" }).int().min(0).optional()
    ),
    lowStockThreshold: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
        z.number({ invalid_type_error: "Low stock threshold must be a whole number" }).int().min(0).optional()
    ),
    stockStatus: z.enum(['In Stock', 'Out of Stock', 'Back Order']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    weight: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
        z.number({ invalid_type_error: "Weight must be a number" }).min(0).optional()
    ),
    length: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
        z.number({ invalid_type_error: "Length must be a number" }).min(0).optional()
    ),
    width: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
        z.number({ invalid_type_error: "Width must be a number" }).min(0).optional()
    ),
    height: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
        z.number({ invalid_type_error: "Height must be a number" }).min(0).optional()
    ),
}).refine(data => Object.values(data).some(val => val !== undefined && val !== null && (typeof val !== 'object' || Object.values(val).some(v => v !== undefined))), {
    message: "At least one field must be provided for bulk update",
    path: ["root"]
});
type BulkUpdateFormData = z.infer<typeof bulkUpdateSchema>;

const individualVariantEditSchema = z.object({
  slug: z.string()
    .min(1, "Slug is required")
    .max(100, "Slug cannot exceed 100 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  regular_price: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number({ required_error: "Regular price is required", invalid_type_error: "Please enter a valid number for regular price" })
      .positive("Regular price must be greater than zero")
      .max(9999999.99, "Regular price exceeds maximum limit")
      .refine((val) => !val.toString().includes('.') || val.toString().split('.')[1].length <= 2, { message: "Regular price can have at most 2 decimal places" })
  ),
  stock: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number({ required_error: "Stock is required", invalid_type_error: "Please enter a valid number for stock" })
      .int("Stock must be a whole number")
      .min(0, "Stock must be a non-negative number")
  ),
  status: z.enum(["active", "inactive"]).default("active"),
  stockStatus: z.enum(["In Stock", "Out of Stock", "Back Order"]).default("In Stock"),
  depositPrice: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number({ invalid_type_error: "Please enter a valid number for sale price" })
      .min(0, "Sale price cannot be negative")
      .max(9999999.99, "Sale price exceeds maximum limit")
      .refine((val) => val === null || !val.toString().includes('.') || val.toString().split('.')[1].length <= 2, { message: "Sale price can have at most 2 decimal places" })
      .nullable().optional()
  ),
  purchasePrice: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number({ invalid_type_error: "Please enter a valid number for purchase price" })
      .min(0, "Purchase price cannot be negative")
      .max(9999999.99, "Purchase price exceeds maximum limit")
      .refine((val) => val === null || !val.toString().includes('.') || val.toString().split('.')[1].length <= 2, { message: "Purchase price can have at most 2 decimal places" })
      .nullable().optional()
  ),
  lowStockThreshold: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number({ invalid_type_error: "Please enter a valid number for low stock threshold" })
      .int("Low stock threshold must be a whole number")
      .min(0, "Low stock threshold cannot be negative")
      .nullable().optional()
  ),
  weight: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number({ invalid_type_error: "Please enter a valid number for weight" }).min(0, "Weight cannot be negative").nullable().optional()
  ),
  length: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number({ invalid_type_error: "Please enter a valid number for length" }).min(0, "Length cannot be negative").nullable().optional()
  ),
  width: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number({ invalid_type_error: "Please enter a valid number for width" }).min(0, "Width cannot be negative").nullable().optional()
  ),
  height: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number({ invalid_type_error: "Please enter a valid number for height" }).min(0, "Height cannot be negative").nullable().optional()
  ),
  barcode: z.string()
    .refine(val => !val || (val.length >= 3 && val.length <= 50), { message: "Barcode must be between 3 and 50 characters if provided" })
    .optional().nullable(),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional().nullable(),
});
type EditVariantFormData = z.infer<typeof individualVariantEditSchema>;

const getEditFieldValue = (value: any): string => {
  if (value === null || value === undefined || value === '') return '';
  return String(value);
};

const getEditNumericValue = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

const transformPriceNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const getDisplayStockStatus = (apiStockStatus: string | null | undefined, currentStockVal?: number): "In Stock" | "Out of Stock" | "Back Order" => {
  const stock = currentStockVal ?? 0;
  switch (apiStockStatus?.toLowerCase()) {
    case "in_stock": return "In Stock";
    case "out_of_stock": return "Out of Stock";
    case "back_to_order": case "back_order": return "Back Order";
    default: return stock > 0 ? "In Stock" : "Out of Stock";
  }
};

const mergeFormValuesWithVariantData = (
  variantData: EditableVariantData,
  formValues: EditVariantFormData
): EditableVariantData => {
  let apiStockStatusFromForm = variantData.stock_status; // Default to existing API status
  // Convert form's display stockStatus to API format
  switch (formValues.stockStatus) {
    case "In Stock":
      apiStockStatusFromForm = "in_stock";
      break;
    case "Out of Stock":
      apiStockStatusFromForm = "out_of_stock";
      break;
    case "Back Order":
      apiStockStatusFromForm = "back_order";
      break;
    // No default needed if formValues.stockStatus is always one of the enum values
  }

  return {
    ...variantData,
    slug: formValues.slug,
    regular_price: String(formValues.regular_price),
    stock: formValues.stock, // formValues.stock is already a number or null from schema
    status: formValues.status, // formValues.status is 'active' | 'inactive'
    stock_status: apiStockStatusFromForm, // Use the converted status from the form
    
    discount_price: formValues.depositPrice !== null && formValues.depositPrice !== undefined ? String(formValues.depositPrice) : null,
    purchase_price: formValues.purchasePrice !== null && formValues.purchasePrice !== undefined ? String(formValues.purchasePrice) : null,
    low_stock_threshold: formValues.lowStockThreshold, // Already number or null
    
    weight: formValues.weight !== null && formValues.weight !== undefined ? String(formValues.weight) : null,
    length: formValues.length !== null && formValues.length !== undefined ? String(formValues.length) : null,
    width: formValues.width !== null && formValues.width !== undefined ? String(formValues.width) : null,
    height: formValues.height !== null && formValues.height !== undefined ? String(formValues.height) : null,
    
    barcode: formValues.barcode || null,
    description: formValues.description || null,
  };
};

const mapVariantForDisplayCardBulk = (variant: EditableVariantData | null) => {
  if (!variant) {
    return null;
  }
  return {
    id: variant.id,
    slug: variant.slug,
    price: variant.regular_price,
    stock: variant.stock,
    status: variant.status, 
    variantImages: variant.variantImages?.map(img => ({ id: img.id, image_url: img.image_url, is_primary: img.is_primary })),
    variantAttributes: variant.variantAttributes?.map(attr => {
      const attributeName = attr.attribute?.name || (attr.attribute_id ? `Attribute ID: ${attr.attribute_id}` : 'N/A');
      const termName = attr.term?.name || (attr.term_id ? `Term ID: ${attr.term_id}` : 'N/A');
      return {
        id: attr.id || attr.attribute_id || 0, // Use attr.id (product_variant_attributes.id) if available, else fallback
        attribute_name: attributeName,
        term_name: termName,
      };
    }) || [],
  };
};

const mapVariantForDetailsFormBulk = (variant: EditableVariantData | null) => {
  if (!variant) return null;
  return {
    id: variant.id,
    slug: variant.slug, 
    variantImages: variant.variantImages?.map(img => ({ id: img.id, image_url: img.image_url, is_primary: img.is_primary })),
  };
};

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#d1d5db", borderRadius: "8px" },
    "&:hover fieldset": { borderColor: "#9ca3af" },
    "&.Mui-focused fieldset": { borderColor: "#2E9970" },
    height: "40px", padding: "0", backgroundColor: "white",
  },
  "& .MuiInputLabel-root": { color: "#2E9970" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#2E9970" },
  "& .MuiOutlinedInput-input": { padding: "12px 16px", backgroundColor: "white" },
  width: "100%",
}));

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

interface BulkUpdateViewProps {
  allCombinationsUsed: boolean;
  variants: EditableVariantData[];
  setVariants: React.Dispatch<React.SetStateAction<EditableVariantData[]>>;
  showSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
  filteredVariants?: EditableVariantData[];
  searchTerm?: string;
}

// API Service to fetch detailed variants for BulkUpdateView
const getBulkProductVariantsAPI = async (productId: string | number): Promise<{ success: boolean; data?: EditableVariantData[]; message?: string }> => {
  console.log(`Fetching variants for BulkUpdateView product ${productId} using actual API call.`);
  try {
    const response = await getProductVariants(Number(productId)); // Using imported getProductVariants
    if (response.success && response.data) {
      // The response.data needs to be an array of objects that are compatible with EditableVariantData.
      // This might involve mapping if the structure from getProductVariants differs from EditableVariantData,
      // especially for variantImages and variantAttributes and their nested structures.
      // For now, we'll assume direct compatibility or that mapping occurs in the calling useEffect.
      return { success: true, data: response.data as EditableVariantData[] }; 
    } else {
      return { success: false, message: response.message || "Failed to fetch variants for bulk update" };
    }
  } catch (error: any) {
    console.error("[getBulkProductVariantsAPI] Error:", error);
    return { success: false, message: error.message || "An error occurred while fetching variants" };
  }
};

const BulkUpdateView: React.FC<BulkUpdateViewProps> = ({ 
  allCombinationsUsed,
  variants,
  setVariants,
  showSnackbar,
  filteredVariants,
  searchTerm
}) => {
  const { showSnackbar: useSnackbarShowSnackbar } = useSnackbar();
  const searchParams = useSearchParams();
  const productId = searchParams ? searchParams.get('productId') : null;

  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const {
    control: bulkControl,
    handleSubmit: handleBulkSubmitInternal,
    watch: watchBulk,
    setValue: setBulkValue,
    formState: bulkFormState,
    reset: resetBulkForm,
  } = useForm<BulkUpdateFormData>({
    resolver: zodResolver(bulkUpdateSchema),
    defaultValues: {
        regular_price: { type: undefined, value: undefined, is_percentage: undefined },
        depositPrice: { type: undefined, value: undefined, is_percentage: undefined },
        purchasePrice: { type: undefined, value: undefined, is_percentage: undefined },
        stock: undefined,
        lowStockThreshold: undefined,
        stockStatus: undefined,
        status: undefined,
        weight: undefined,
        length: undefined,
        width: undefined,
        height: undefined,
    },
    mode: 'onChange',
  });

  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [isUpdatingSelectedVariant, setIsUpdatingSelectedVariant] = useState(false);
  const [isEditImageUploading, setIsEditImageUploading] = useState(false);
  const [isVariantDeleteDialogOpen, setIsVariantDeleteDialogOpen] = useState(false);
  const [variantToDeleteId, setVariantToDeleteId] = useState<number | string | null>(null);

  const originalSelectedVariantRef = useRef<EditableVariantData | null>(null);
  const prevSelectedVariantIdRef = useRef<number | string | null>(null);

  const {
    control: editDetailControl,
    handleSubmit: handleEditDetailSubmit,
    reset: resetEditDetailForm,
    getValues: getEditDetailValues,
    formState: editDetailFormState,
  } = useForm<VariantFormData>({
    resolver: zodResolver(individualVariantEditSchema),
    mode: "all",
    defaultValues: {
      slug: "", regular_price: 0, stock: 0, status: "active", stockStatus: "In Stock",
      depositPrice: null, purchasePrice: null, lowStockThreshold: null,
      weight: null, length: null, width: null, height: null,
      barcode: null, description: null,
    },
  });

  const {
    getRootProps: editDetailGetRootProps,
    getInputProps: editDetailGetInputProps,
    isDragActive: isEditDetailDragActive
  } = useDropzone({
    onDrop: async (acceptedFiles) => {
      const currentSelectedVariant = variants[selectedVariantIndex];
      if (!currentSelectedVariant || !productId) {
        showSnackbar("No variant selected or product ID missing to upload images.", "error");
        return;
      }

      if (acceptedFiles.length === 0) {
        return; // No files to process
      }

      setIsEditImageUploading(true);

      // Validate each file
      const validationResults = await Promise.all(
        acceptedFiles.map(async (file) => {
          const error = await validateFile(file); // Using the local validateFile
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
        setIsEditImageUploading(false);
        if (acceptedFiles.length > 0) showSnackbar("Image upload failed, please check the image dimensions and file type.", "warning");
        return;
      }

      const formData = new FormData();
      filesToUpload.forEach(file => formData.append("files", file));

      try {
        const response = await uploadVariantImages(String(productId), String(currentSelectedVariant.id), formData);
        
        if (response.success) {
          let uploadedApiImages: LocalVariantImage[] = [];
          // Standardized response checking, similar to GenerateVariantsView
          if (response.data?.variantImages && Array.isArray(response.data.variantImages)) {
            uploadedApiImages = response.data.variantImages.map((img: any) => ({ id: img.id, image_url: img.image_url, is_primary: img.is_primary }));
          } else if (response.data?.variant?.variantImages && Array.isArray(response.data.variant.variantImages)) {
            uploadedApiImages = response.data.variant.variantImages.map((img: any) => ({ id: img.id, image_url: img.image_url, is_primary: img.is_primary }));
          } else if (Array.isArray(response.data)) { // Handle if response.data is directly the array of images
            uploadedApiImages = response.data.map((img: any) => ({ id: img.id, image_url: img.image_url, is_primary: img.is_primary }));
          } else {
            showSnackbar("Images uploaded but response structure was unexpected.", "warning");
            setIsEditImageUploading(false);
            return;
          }

          if (uploadedApiImages.length === 0 && filesToUpload.length > 0) { // Check if files were attempted but API returned no images
            showSnackbar("Upload successful, but no image data returned from API.", "warning");
            setIsEditImageUploading(false);
            return;
          }
          
          const currentFormValues = getEditDetailValues(); 

          setVariants(prevVariants =>
            prevVariants.map(variantInState => {
              if (variantInState.id === currentSelectedVariant.id) {
                const variantWithFormEdits = mergeFormValuesWithVariantData(variantInState, currentFormValues);
                const existingImages = variantWithFormEdits.variantImages || [];
                const updatedImages = [...existingImages];
                
                uploadedApiImages.forEach(newImg => {
                  if (!updatedImages.find(exImg => exImg.image_url === newImg.image_url)) {
                    updatedImages.push(newImg);
                  }
                });

                const hasPrimary = updatedImages.some(img => img.is_primary);
                if (!hasPrimary && updatedImages.length > 0) {
                  updatedImages[0].is_primary = true;
                  // Optional: API call to persist new primary if needed immediately after upload
                  // setVariantPrimaryImage(String(productId), String(currentSelectedVariant.id), String(updatedImages[0].id));
                }
                return { ...variantWithFormEdits, variantImages: updatedImages };
              }
              return variantInState;
            })
          );
          showSnackbar("Images uploaded successfully!", "success");
        } else {
          showSnackbar(response.message || "Failed to upload images.", "error");
        }
      } catch (e: any) {
        console.error("Error uploading images:", e);
        showSnackbar(e.message || "An error occurred during image upload.", "error");
      } finally {
        setIsEditImageUploading(false);
      }
    },
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] }, // Keep existing accept types
    multiple: true,
  });

  const selectedVariantForEdit = variants && variants.length > selectedVariantIndex ? variants[selectedVariantIndex] : null;

  const calculateVariantIsActuallyDirty = (): boolean => {
    if (!selectedVariantForEdit || !originalSelectedVariantRef.current) return false;
    const formValues = getEditDetailValues();
    if (formValues.slug !== originalSelectedVariantRef.current.slug) return true;
    return editDetailFormState.isDirty;
  };

  useEffect(() => {
    if (selectedVariantForEdit) {
      resetEditDetailForm({
        slug: getEditFieldValue(selectedVariantForEdit.slug),
        regular_price: getEditNumericValue(selectedVariantForEdit.regular_price),
        stock: getEditNumericValue(selectedVariantForEdit.stock),
        status: (selectedVariantForEdit.status?.toLowerCase() === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
        stockStatus: getDisplayStockStatus(selectedVariantForEdit.stock_status, selectedVariantForEdit.stock),
        depositPrice: transformPriceNumber(selectedVariantForEdit.discount_price),
        purchasePrice: transformPriceNumber(selectedVariantForEdit.purchase_price),
        lowStockThreshold: getEditNumericValue(selectedVariantForEdit.low_stock_threshold),
        weight: getEditNumericValue(selectedVariantForEdit.weight),
        length: getEditNumericValue(selectedVariantForEdit.length),
        width: getEditNumericValue(selectedVariantForEdit.width),
        height: getEditNumericValue(selectedVariantForEdit.height),
        barcode: getEditFieldValue(selectedVariantForEdit.barcode),
        description: getEditFieldValue(selectedVariantForEdit.description),
      });
      if (prevSelectedVariantIdRef.current !== selectedVariantForEdit.id) {
        originalSelectedVariantRef.current = JSON.parse(JSON.stringify(selectedVariantForEdit));
      }
      prevSelectedVariantIdRef.current = selectedVariantForEdit.id;
    } else {
      resetEditDetailForm({
        slug: "", regular_price: 0, stock: 0, status: "active", stockStatus: "In Stock",
        depositPrice: null, purchasePrice: null, lowStockThreshold: null,
        weight: null, length: null, width: null, height: null,
        barcode: null, description: null,
      });
      originalSelectedVariantRef.current = null;
      prevSelectedVariantIdRef.current = null;
    }
  }, [selectedVariantForEdit, resetEditDetailForm]);

  const onSubmitEditForm: SubmitHandler<VariantFormData> = async (data) => {
    if (!selectedVariantForEdit || !productId) {
      showSnackbar("No variant selected or product ID missing.", "error");
      return;
    }

    const isActuallyDirty = calculateVariantIsActuallyDirty();
    if (!isActuallyDirty && !editDetailFormState.isDirty) {
        showSnackbar("No changes to save.", "info");
        return;
    }

    setIsUpdatingSelectedVariant(true);
    try {
      const updateRequestData: Partial<UpdateProductVariantRequest> = {
        slug: data.slug,
        regular_price: getEditNumericValue(data.regular_price),
        stock: getEditNumericValue(data.stock), // Ensure this is a number
        status: data.status,
        // stock_status will be mapped below
        discount_price: transformPriceNumber(data.depositPrice),
        purchase_price: transformPriceNumber(data.purchasePrice),
        low_stock_threshold: getEditNumericValue(data.lowStockThreshold),
        weight: getEditNumericValue(data.weight),
        length: getEditNumericValue(data.length),
        width: getEditNumericValue(data.width),
        height: getEditNumericValue(data.height),
        barcode: data.barcode || null,
        description: data.description || null,
        // Ensure attributes are correctly mapped if they can be edited or need to be re-sent
        attributes: selectedVariantForEdit.variantAttributes.map(attr => ({
            attribute_id: attr.attribute_id,
            term_id: attr.term_id,
        })),
      };

      // Map stockStatus from form value to API value
      switch (data.stockStatus) {
        case "In Stock": updateRequestData.stock_status = "in_stock"; break;
        case "Out of Stock": updateRequestData.stock_status = "out_of_stock"; break;
        case "Back Order": updateRequestData.stock_status = "back_order"; break;
      }
      
      // Filter out null/undefined values from the payload
      const finalApiPayload = Object.entries(updateRequestData).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined) {
          (acc as Record<string, any>)[key as keyof UpdateProductVariantRequest] = value;
        }
        return acc;
      }, {} as Partial<UpdateProductVariantRequest>);

      if (Object.keys(finalApiPayload).length === 0) {
        showSnackbar("No changes to submit to the API.", "info");
        setIsUpdatingSelectedVariant(false);
        return;
      }
      
      const response = await updateProductVariant(Number(productId), selectedVariantForEdit.id, finalApiPayload as UpdateProductVariantRequest);

      if (response.success && response.data) {
        // Assuming response.data is the updated variant object from the API
        // We need to map this API response back to our local EditableVariantData structure
        const updatedVariantFromApi = response.data;

        const updatedVariantState: EditableVariantData = {
          ...selectedVariantForEdit, // Keep existing fields like product_id
          id: updatedVariantFromApi.id,
          slug: updatedVariantFromApi.slug,
          regular_price: String(updatedVariantFromApi.regular_price), 
          stock: updatedVariantFromApi.stock,
          status: updatedVariantFromApi.status,
          stock_status: updatedVariantFromApi.stock_status, // API version
          discount_price: updatedVariantFromApi.discount_price !== null && updatedVariantFromApi.discount_price !== undefined ? String(updatedVariantFromApi.discount_price) : null,
          purchase_price: updatedVariantFromApi.purchase_price !== null && updatedVariantFromApi.purchase_price !== undefined ? String(updatedVariantFromApi.purchase_price) : null,
          low_stock_threshold: updatedVariantFromApi.low_stock_threshold,
          weight: updatedVariantFromApi.weight !== null && updatedVariantFromApi.weight !== undefined ? String(updatedVariantFromApi.weight) : null,
          length: updatedVariantFromApi.length !== null && updatedVariantFromApi.length !== undefined ? String(updatedVariantFromApi.length) : null,
          width: updatedVariantFromApi.width !== null && updatedVariantFromApi.width !== undefined ? String(updatedVariantFromApi.width) : null,
          height: updatedVariantFromApi.height !== null && updatedVariantFromApi.height !== undefined ? String(updatedVariantFromApi.height) : null,
          barcode: updatedVariantFromApi.barcode || null,
          description: updatedVariantFromApi.description || null,
          sku: updatedVariantFromApi.sku || null,
          // Map images and attributes from API response if they are part of it and might change
          // For now, assume they are managed by other functions or don't change on basic update
          variantImages: updatedVariantFromApi.variantImages?.map(img => ({
            id: img.id,
            image_url: img.image_url,
            is_primary: img.is_primary,
          })) || selectedVariantForEdit.variantImages,
          variantAttributes: updatedVariantFromApi.variantAttributes?.map((attr: any) => ({ // Ensure attr type matches API response
            id: attr.id,
            attribute_id: attr.attribute_id,
            term_id: attr.term_id,
            attribute: {
                id: attr.attribute?.id || attr.attribute_id, // Fallback if nested attr id is missing
                name: attr.attribute?.name || 'N/A', // Ensure name exists
                type: attr.attribute?.type || undefined,
            },
            term: {
                id: attr.term?.id || attr.term_id, // Fallback if nested term id is missing
                name: attr.term?.name || 'N/A', // Ensure name exists
                slug: attr.term?.slug || undefined,
            }
          })) || selectedVariantForEdit.variantAttributes,
        };

        setVariants(prev =>
          prev.map(v => (v.id === selectedVariantForEdit.id ? updatedVariantState : v))
        );
        originalSelectedVariantRef.current = JSON.parse(JSON.stringify(updatedVariantState)); // Update original ref
        resetEditDetailForm(data, { keepValues: true, keepDirty: false }); // Reset dirty state but keep displayed values

        showSnackbar("Variant updated successfully.", "success");
      } else {
        const errorMsg = response.message || (response.errors && response.errors[0]?.msg) || "Failed to update variant.";
        showSnackbar(errorMsg, "error");
      }
    } catch (error: any) {
      console.error("Error updating variant:", error);
      const errorMsg = error?.response?.data?.message || error?.errors?.[0]?.msg || error.message || "An unexpected error occurred.";
      showSnackbar(errorMsg, "error");
    } finally {
      setIsUpdatingSelectedVariant(false);
    }
  };

  const handleSetPrimaryImageEditForm = async (imageId: number) => {
    if (!selectedVariantForEdit || !productId) {
      showSnackbar("No variant or product ID available to set primary image.", "error");
      return;
    }
    
    // Consider adding a specific loading state like setIsSettingPrimaryImage if needed
    // For now, re-using isUpdatingSelectedVariant or assuming it's quick
    // setIsUpdatingSelectedVariant(true); 

    try {
      const response = await setVariantPrimaryImage(String(productId), String(selectedVariantForEdit.id), String(imageId));
      if (response.success) {
        const currentFormValues = getEditDetailValues(); // Get current form values
        setVariants(prevVariants =>
          prevVariants.map(variantInState => {
            if (variantInState.id === selectedVariantForEdit.id) {
              const variantWithFormEdits = mergeFormValuesWithVariantData(variantInState, currentFormValues);
              const updatedImages = variantWithFormEdits.variantImages.map(img => ({
                ...img,
                is_primary: img.id === imageId,
              }));
              return { ...variantWithFormEdits, variantImages: updatedImages };
            }
            return variantInState;
          })
        );
        
        // Update original ref so this change alone doesn't mark the form dirty
        if (originalSelectedVariantRef.current && originalSelectedVariantRef.current.id === selectedVariantForEdit.id) {
          const updatedOriginalImages = originalSelectedVariantRef.current.variantImages.map(img => ({
            ...img,
            is_primary: img.id === imageId,
          }));
          originalSelectedVariantRef.current = {
            ...originalSelectedVariantRef.current,
            variantImages: updatedOriginalImages,
          };
        }
        showSnackbar(response.message || "Primary image set successfully!", "success");
      } else {
        showSnackbar(response.message || "Failed to set primary image.", "error");
      }
    } catch (e: any) {
      console.error("Error setting primary image:", e);
      showSnackbar(e.message || "An error occurred while setting primary image.", "error");
    } finally {
      // setIsUpdatingSelectedVariant(false);
    }
  };

  const handleDeleteImageEditForm = async (imageId: number) => {
    if (!selectedVariantForEdit || !productId) {
      showSnackbar("No variant or product ID available to delete image.", "error");
      return;
    }

    // It's good to use a loading state if the operation might take time.
    // setIsUpdatingSelectedVariant(true); 

    try {
      const deleteResponse = await deleteVariantImage(String(productId), String(selectedVariantForEdit.id), String(imageId));

      if (deleteResponse.success) {
        let newPrimaryImageIdToSet: number | null = null;
        const currentFormValues = getEditDetailValues(); // Get current form values

        setVariants(prevVariants =>
          prevVariants.map(variantInState => {
            if (variantInState.id === selectedVariantForEdit.id) {
              const variantWithFormEdits = mergeFormValuesWithVariantData(variantInState, currentFormValues);
              const imageToDelete = variantWithFormEdits.variantImages.find(img => img.id === imageId);
              const wasPrimary = imageToDelete?.is_primary || false;
              
              let updatedImages = variantWithFormEdits.variantImages.filter(img => img.id !== imageId);

              if (wasPrimary && updatedImages.length > 0 && !updatedImages.some(img => img.is_primary)) {
                updatedImages[0].is_primary = true;
                newPrimaryImageIdToSet = updatedImages[0].id;
              }
              return { ...variantWithFormEdits, variantImages: updatedImages };
            }
            return variantInState;
          })
        );

        // If a new primary image needs to be set as a result of deleting the old primary
        if (newPrimaryImageIdToSet !== null) {
          try {
            await setVariantPrimaryImage(String(productId), String(selectedVariantForEdit.id), String(newPrimaryImageIdToSet));
            showSnackbar("Image deleted and new primary image set.", "success");
          } catch (setPrimaryError: any) {
            console.error("Error setting new primary image after deletion:", setPrimaryError);
            showSnackbar("Image deleted, but failed to set new primary image automatically.", "warning");
          }
        } else {
          showSnackbar(deleteResponse.message || "Image deleted successfully!", "success");
        }
        
        // Update originalSelectedVariantRef after state has been updated
        // Find the latest version of the variant from the state
        const latestVariantState = variants.find(v => v.id === selectedVariantForEdit.id);
        if (latestVariantState) {
            originalSelectedVariantRef.current = JSON.parse(JSON.stringify(latestVariantState));
        } else { // Variant might have been deleted in another process, though unlikely here
            originalSelectedVariantRef.current = null;
        }

      } else {
        showSnackbar(deleteResponse.message || "Failed to delete image.", "error");
      }
    } catch (e: any) {
      console.error("Error deleting image:", e);
      showSnackbar(e.message || "An error occurred while deleting image.", "error");
    } finally {
      // setIsUpdatingSelectedVariant(false);
    }
  };

  const openDeleteDialog = (id: number | string) => {
    setVariantToDeleteId(id);
    setIsVariantDeleteDialogOpen(true);
  };

  const confirmDeleteVariant = async () => {
    if (!variantToDeleteId || !productId) {
      showSnackbar("No variant selected for deletion or product ID missing.", "warning");
      setIsVariantDeleteDialogOpen(false);
      return;
    }

    // Assuming a general loading state, or create a specific one like setIsDeletingVariant
    setIsUpdatingSelectedVariant(true); 
    try {
      // API expects only variantId for deletion
      const response = await deleteProductVariant(Number(variantToDeleteId)); 
      
      if (response.success) {
        const deletedIdNumeric = Number(variantToDeleteId);
        let newSelectedIdx = selectedVariantIndex;

        // Update variants state and determine the new selected index
        setVariants(prevVariants => {
            const filtered = prevVariants.filter(v => v.id !== deletedIdNumeric);
            if (selectedVariantForEdit?.id === deletedIdNumeric) { // If the deleted was selected
              if (filtered.length === 0) {
                  newSelectedIdx = 0; // Or -1 if you want to signify no selection explicitly
              } else if (selectedVariantIndex >= filtered.length) {
                  newSelectedIdx = filtered.length - 1; // Was last, select new last
              } // Else newSelectedIdx remains same (points to next item in the new list or stays if not last)
            } else { // If deleted was not selected, find the ID of the currently selected variant
              const currentSelectedActualId = prevVariants[selectedVariantIndex]?.id;
              if (currentSelectedActualId) {
                newSelectedIdx = filtered.findIndex(v => v.id === currentSelectedActualId);
                if (newSelectedIdx === -1 && filtered.length > 0) newSelectedIdx = 0; // Default to first if current selected was also removed or not found
                else if (newSelectedIdx === -1) newSelectedIdx = 0; // No items left or selection issue
              } else if (filtered.length > 0) {
                newSelectedIdx = 0; // If no current selection or it was invalid, point to first.
              } else {
                newSelectedIdx = 0; // No variants left
              }
            }
            return filtered;
        });
        
        // setSelectedVariantIndex needs to be called after setVariants has processed
        // To ensure newSelectedIdx is based on the *updated* list length.
        // This is tricky due to closure. A useEffect might be better or pass a callback to setVariants if supported.
        // For simplicity here, we'll call it, but be mindful of timing.
        // A safer way: Calculate based on the list that *will be* set.
        const currentVariantsList = variants.filter(v => v.id !== deletedIdNumeric);
        if (selectedVariantForEdit?.id === deletedIdNumeric) {
            if (currentVariantsList.length === 0) newSelectedIdx = 0;
            else if (selectedVariantIndex >= currentVariantsList.length) newSelectedIdx = currentVariantsList.length - 1;
            // else index is okay
        } else {
            const currentSelectedActualId = variants[selectedVariantIndex]?.id;
            if (currentSelectedActualId) {
                newSelectedIdx = currentVariantsList.findIndex(v => v.id === currentSelectedActualId);
                if (newSelectedIdx === -1 && currentVariantsList.length > 0) newSelectedIdx = 0;
                else if (newSelectedIdx === -1) newSelectedIdx = 0;
            } else if (currentVariantsList.length > 0) {
                newSelectedIdx = 0;
            } else {
                newSelectedIdx = 0;
            }
        }
        setSelectedVariantIndex(newSelectedIdx); // Set the new index

        showSnackbar(response.message || `Variant ${variantToDeleteId} deleted successfully.`, "success");
      } else {
        showSnackbar(response.message || "Failed to delete variant.", "error");
      }
    } catch (error: any) {
      console.error("Error deleting variant:", error);
      const errorMsg = error?.response?.data?.message || error?.errors?.[0]?.msg || error.message || "An error occurred during deletion.";
      showSnackbar(errorMsg, "error");
    } finally {
      setIsUpdatingSelectedVariant(false);
      setIsVariantDeleteDialogOpen(false);
      setVariantToDeleteId(null);
    }
  };

  const onBulkSubmit: SubmitHandler<BulkUpdateFormData> = async (data) => {
    if (!productId) {
      showSnackbar("Product ID not found.", "error");
      return;
    }
    if (!bulkFormState.isDirty) {
        showSnackbar("No changes detected to apply.", "info");
        return;
    }

    setIsBulkSubmitting(true);
    try {
      const updates: BulkUpdateProductVariantsPayload['updates'] = {};

      if (data.regular_price?.type && data.regular_price.value !== undefined) {
          updates.price = { type: data.regular_price.type, value: data.regular_price.value, is_percentage: data.regular_price.is_percentage };
      }
      if (data.depositPrice?.type && data.depositPrice.value !== undefined) {
          updates.discount_price = { type: data.depositPrice.type, value: data.depositPrice.value, is_percentage: data.depositPrice.is_percentage };
      }
      if (data.purchasePrice?.type && data.purchasePrice.value !== undefined) {
          updates.purchase_price = { type: data.purchasePrice.type, value: data.purchasePrice.value, is_percentage: data.purchasePrice.is_percentage };
      }
      if (data.stock !== undefined && data.stock !== null) updates.stock = data.stock;
      if (data.lowStockThreshold !== undefined && data.lowStockThreshold !== null) updates.low_stock_threshold = data.lowStockThreshold;
      if (data.weight !== undefined && data.weight !== null) updates.weight = data.weight;
      if (data.length !== undefined && data.length !== null) updates.length = data.length;
      if (data.width !== undefined && data.width !== null) updates.width = data.width;
      if (data.height !== undefined && data.height !== null) updates.height = data.height;
      if (data.status !== undefined) updates.status = data.status;

      if (data.stockStatus !== undefined) {
        switch (data.stockStatus) {
          case 'In Stock': updates.stock_status = 'in_stock'; break;
          case 'Out of Stock': updates.stock_status = 'out_of_stock'; break;
          case 'Back Order': updates.stock_status = 'back_order'; break;
        }
      }

      const payload: BulkUpdateProductVariantsPayload = { updates };

      if (Object.keys(updates).length === 0) {
          showSnackbar("No update fields provided with valid values.", "warning");
          setIsBulkSubmitting(false);
          return;
      }

      const response = await bulkUpdateProductVariants(Number(productId), payload);

      showSnackbar(response.message || "Variants updated successfully", "success");
      resetBulkForm();

    } catch (error: any) {
      console.error("Bulk update failed:", error);
      showSnackbar(error?.response?.data?.message || error.message || "Bulk update failed", "error");
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Effect to fetch detailed variants
  useEffect(() => {
    if (productId) {
      const loadVariants = async () => {
        setIsLoadingVariants(true);
        try {
          const response = await getBulkProductVariantsAPI(productId);
          if (response.success && response.data) {
            // Map API data to ensure compatibility with EditableVariantData structure,
            // particularly for nested attribute/term names.
            const mappedData = response.data.map(variant => ({
              ...variant,
              // Ensure variantAttributes has the nested structure expected by EditableVariantData
              variantAttributes: variant.variantAttributes?.map(attr => ({
                id: attr.id, // product_variant_attributes.id
                attribute_id: attr.attribute_id,
                term_id: attr.term_id,
                attribute: {
                  id: attr.attribute?.id || attr.attribute_id, // Fallback if nested attr id is missing
                  name: attr.attribute?.name || 'N/A', // Ensure name exists
                  type: attr.attribute?.type || undefined,
                },
                term: {
                  id: attr.term?.id || attr.term_id, // Fallback if nested term id is missing
                  name: attr.term?.name || 'N/A', // Ensure name exists
                  slug: attr.term?.slug || undefined,
                }
              })) || [],
              variantImages: variant.variantImages?.map(img => ({
                id: img.id,
                image_url: img.image_url,
                is_primary: img.is_primary,
              })) || [],
            }));
            setVariants(mappedData as EditableVariantData[]); // Update parent state
          } else {
            // showSnackbar(response.message || "Failed to load variants for bulk update", "error");
            setVariants([]); // Clear variants on failure
          }
        } catch (e: any) {
          // showSnackbar(e.message || "Error loading variants", "error");
          setVariants([]); // Clear variants on error
        } finally {
          setIsLoadingVariants(false);
        }
      };
      loadVariants();
    }
  }, [productId, setVariants, showSnackbar]);

  // Use filteredVariants when available with searchTerm
  const variantsToShow = searchTerm && filteredVariants ? filteredVariants : variants;

  if (isLoadingVariants) {
    return (
      <div className="flex justify-center items-center py-8">
        <FuseLoading />
        <span className="ml-2">Loading variant details...</span>
      </div>
    );
  }

  if (variantsToShow.length === 0 && !allCombinationsUsed) {
    return (
      <Paper elevation={3} className="p-4 bg-yellow-50 border border-yellow-300 text-center">
        <Typography color="textSecondary">
          Bulk Update requires at least one existing variant. Please add or generate variants first.
        </Typography>
      </Paper>
    );
  }
  if (variantsToShow.length === 0 && allCombinationsUsed ) {
    return (
      <Paper elevation={3} className="p-4 bg-gray-50 border border-gray-300 text-center">
        <Typography color="textSecondary">
          No variants found for this product. All attribute combinations may have been used or no attributes are defined.
        </Typography>
      </Paper>
    );
  }

  return (
    <div>
      <Paper elevation={3} className="p-4 bg-white mb-6">
        <h2 className="text-lg font-bold mb-4">Bulk Update Variant Details</h2>
        <form onSubmit={handleBulkSubmitInternal(onBulkSubmit)}>
          <div className="mb-6 space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-4"> 
                <div className="grid grid-cols-12 gap-x-2 gap-y-1 items-center border p-3 pt-5 rounded-md relative">
                  <label className="absolute -top-2.5 left-2 bg-white px-1 text-xs text-gray-500 font-bold text-base">Regular Price</label>
                  <div className="col-span-6">
                    <Controller
                      name="regular_price.type"
                      control={bulkControl}
                      render={({ field }) => (
                        <FormControl fullWidth variant="outlined">
                          <InputLabel>Type</InputLabel>
                          <Select
                            {...field}
                            label="Type"
                            value={field.value || ""}
                            onChange={(e) => {
                              const newType = e.target.value || undefined;
                              field.onChange(newType);
                              if (newType === 'set' || newType === undefined) {
                                setBulkValue('regular_price.is_percentage', false);
                              } else if (newType === 'increase' || newType === 'decrease') {
                                setBulkValue('regular_price.is_percentage', true);
                              }
                            }}
                            className="w-full bg-white rounded-lg border-gray-300 focus:border-green-600 focus:ring-1 focus:ring-green-600"
                            sx={{ height: '40px' }}
                          >
                            <MenuItem value="set">Set to</MenuItem>
                            <MenuItem value="increase">Increase by</MenuItem>
                            <MenuItem value="decrease">Decrease by</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </div>
                  <div className="col-span-6">
                    <Controller
                      name="regular_price.value"
                      control={bulkControl}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          type="number"
                          value={field.value === undefined || field.value === null ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          fullWidth
                          placeholder="Value"
                          label="Value"
                          InputLabelProps={{ shrink: true }}
                          error={!!(bulkFormState.errors.regular_price as any)?.value || !!bulkFormState.errors.regular_price?.root}
                          inputProps={{ step: "0.01" }}
                          sx={{ "& .MuiOutlinedInput-root": { height: '40px' } }}
                        />
                      )}
                    />
                  </div>
                  {(bulkFormState.errors.regular_price?.root?.message || (bulkFormState.errors.regular_price as any)?.value?.message) && (
                    <div className="col-span-12 mt-1 mx-auto">
                        <p className="text-xs text-red-500">
                            {bulkFormState.errors.regular_price?.root?.message || (bulkFormState.errors.regular_price as any)?.value?.message}
                        </p>
                    </div>
                  )}
                  <div className="col-span-12 mt-1">
                    <Controller
                      name="regular_price.is_percentage"
                      control={bulkControl}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              disabled={!watchBulk('regular_price.type') || (watchBulk('regular_price.type') === 'set')}
                              sx={{ '&.Mui-checked': { color: '#2E9970' } }}
                            />
                          }
                          label="Percentage"
                          labelPlacement="end"
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-x-2 gap-y-1 items-center border p-3 pt-5 rounded-md relative">
                  <label className="absolute -top-2.5 left-2 bg-white px-1 text-xs text-gray-500 font-bold text-base">Sale Price</label>
                  <div className="col-span-6">
                    <Controller
                      name="depositPrice.type"
                      control={bulkControl}
                      render={({ field }) => (
                        <FormControl fullWidth variant="outlined">
                          <InputLabel>Type</InputLabel>
                          <Select
                            {...field}
                            label="Type"
                            value={field.value || ""}
                            onChange={(e) => {
                              const newType = e.target.value || undefined;
                              field.onChange(newType);
                              if (newType === 'set' || newType === undefined) {
                                setBulkValue('depositPrice.is_percentage', false);
                              } else if (newType === 'increase' || newType === 'decrease') {
                                setBulkValue('depositPrice.is_percentage', true);
                              }
                            }}
                            className="w-full bg-white rounded-lg border-gray-300 focus:border-green-600 focus:ring-1 focus:ring-green-600"
                            sx={{ height: '40px' }}
                          >
                            <MenuItem value="set">Set to</MenuItem>
                            <MenuItem value="increase">Increase by</MenuItem>
                            <MenuItem value="decrease">Decrease by</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </div>
                  <div className="col-span-6">
                    <Controller
                      name="depositPrice.value"
                      control={bulkControl}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          type="number"
                          value={field.value === undefined || field.value === null ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          fullWidth
                          placeholder="Value"
                          label="Value"
                          InputLabelProps={{ shrink: true }}
                          error={!!(bulkFormState.errors.depositPrice as any)?.value || !!bulkFormState.errors.depositPrice?.root}
                          inputProps={{ step: "0.01" }}
                          sx={{ "& .MuiOutlinedInput-root": { height: '40px' } }}
                        />
                      )}
                    />
                  </div>
                  {(bulkFormState.errors.depositPrice?.root?.message || (bulkFormState.errors.depositPrice as any)?.value?.message) && (
                    <div className="col-span-12 mt-1 mx-auto">
                        <p className="text-xs text-red-500">
                            {bulkFormState.errors.depositPrice?.root?.message || (bulkFormState.errors.depositPrice as any)?.value?.message}
                        </p>
                    </div>
                  )}
                  <div className="col-span-12 mt-1">
                    <Controller
                      name="depositPrice.is_percentage"
                      control={bulkControl}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              disabled={!watchBulk('depositPrice.type') || (watchBulk('depositPrice.type') === 'set')}
                              sx={{ '&.Mui-checked': { color: '#2E9970' } }}
                            />
                          }
                          label="Percentage"
                          labelPlacement="end"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-x-2 gap-y-1 items-center border p-3 pt-5 rounded-md relative">
                  <label className="absolute -top-2.5 left-2 bg-white px-1 text-xs text-gray-500 font-bold text-base">Purchase Price</label>
                  <div className="col-span-6">
                    <Controller
                      name="purchasePrice.type"
                      control={bulkControl}
                      render={({ field }) => (
                        <FormControl fullWidth variant="outlined">
                          <InputLabel>Type</InputLabel>
                          <Select
                            {...field}
                            label="Type"
                            value={field.value || ""}
                            onChange={(e) => {
                              const newType = e.target.value || undefined;
                              field.onChange(newType);
                              if (newType === 'set' || newType === undefined) {
                                setBulkValue('purchasePrice.is_percentage', false);
                              } else if (newType === 'increase' || newType === 'decrease') {
                                setBulkValue('purchasePrice.is_percentage', true);
                              }
                            }}
                            className="w-full bg-white rounded-lg border-gray-300 focus:border-green-600 focus:ring-1 focus:ring-green-600"
                            sx={{ height: '40px' }}
                          >
                            <MenuItem value="set">Set to</MenuItem>
                            <MenuItem value="increase">Increase by</MenuItem>
                            <MenuItem value="decrease">Decrease by</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </div>
                  <div className="col-span-6">
                    <Controller
                      name="purchasePrice.value"
                      control={bulkControl}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          type="number"
                          value={field.value === undefined || field.value === null ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          fullWidth
                          placeholder="Value"
                          label="Value"
                          InputLabelProps={{ shrink: true }}
                          error={!!(bulkFormState.errors.purchasePrice as any)?.value || !!bulkFormState.errors.purchasePrice?.root}
                          inputProps={{ step: "0.01" }}
                          sx={{ "& .MuiOutlinedInput-root": { height: '40px' } }}
                        />
                      )}
                    />
                  </div>
                  {(bulkFormState.errors.purchasePrice?.root?.message || (bulkFormState.errors.purchasePrice as any)?.value?.message) && (
                    <div className="col-span-12 mt-1">
                        <p className="text-xs text-red-500">
                            {bulkFormState.errors.purchasePrice?.root?.message || (bulkFormState.errors.purchasePrice as any)?.value?.message}
                        </p>
                    </div>
                  )}
                  <div className="col-span-12 mt-1">
                    <Controller
                      name="purchasePrice.is_percentage"
                      control={bulkControl}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              disabled={!watchBulk('purchasePrice.type') || (watchBulk('purchasePrice.type') === 'set')}
                              sx={{ '&.Mui-checked': { color: '#2E9970' } }}
                            />
                          }
                          label="Percentage"
                          labelPlacement="end"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4"> 
                <FormTextField
                  name="stock"
                  control={bulkControl}
                  label="Stock"
                  type="number"
                  placeholder=""
                  helperText={bulkFormState.errors.stock?.message as string ?? undefined}
                />
                <Controller
                  name="stockStatus"
                  control={bulkControl}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth variant="outlined" error={!!error}>
                      <InputLabel>Stock Status</InputLabel>
                      <Select
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || undefined)}
                        label="Stock Status"
                        sx={{ height: '40px', backgroundColor: 'white', borderRadius: '8px' }}
                      >
                        <MenuItem value="In Stock">In Stock</MenuItem>
                        <MenuItem value="Out of Stock">Out of Stock</MenuItem>
                        <MenuItem value="Back Order">Back Order</MenuItem>
                      </Select>
                      {error && <FormHelperText>{error.message}</FormHelperText>}
                    </FormControl>
                  )}
                />
                <FormTextField
                  name="lowStockThreshold"
                  control={bulkControl}
                  label="Low Stock Threshold"
                  type="number"
                  placeholder=""
                  helperText={bulkFormState.errors.lowStockThreshold?.message as string ?? undefined}
                />
                <Controller
                  name="status"
                  control={bulkControl}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth variant="outlined" error={!!error}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || undefined)}
                        label="Status"
                        sx={{ height: '40px', backgroundColor: 'white', borderRadius: '8px' }}
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                      {error && <FormHelperText>{error.message}</FormHelperText>}
                    </FormControl>
                  )}
                />
              </div>

              <div className="space-y-4"> 
                <div className="mb-2">
                  <h3 className="font-semibold">Dimensions & Weight</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormTextField 
                    name="weight"
                    control={bulkControl}
                    label="Weight"
                    type="number"
                    placeholder=""
                    helperText={bulkFormState.errors.weight?.message as string ?? undefined}
                  />
                  
                  <FormTextField 
                    name="length"
                    control={bulkControl}
                    label="Length"
                    type="number"
                    placeholder=""
                    helperText={bulkFormState.errors.length?.message as string ?? undefined}
                  />
                  
                  <FormTextField 
                    name="width"
                    control={bulkControl}
                    label="Width"
                    type="number"
                    placeholder=""
                    helperText={bulkFormState.errors.width?.message as string ?? undefined}
                  />
                  
                  <FormTextField 
                    name="height"
                    control={bulkControl}
                    label="Height"
                    type="number"
                    placeholder=""
                    helperText={bulkFormState.errors.height?.message as string ?? undefined}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-right">
            <AppButton 
              label="Apply Bulk Update"
              type="submit" 
              disabled={!bulkFormState.isDirty || !bulkFormState.isValid || isBulkSubmitting}
              loading={isBulkSubmitting}
            />
          </div>
        </form>
      </Paper>
      {variantsToShow.length > 0 && (
        <div className="mt-8">
          {/* <h3 className="text-lg font-semibold mb-4">Manage Individual Variants</h3> */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2 max-h-[600px] overflow-y-auto pr-2">
              {variantsToShow.map((variant, index) => {
                const mappedDisplayCardVariant = mapVariantForDisplayCardBulk(variant);
                if (!mappedDisplayCardVariant) return null;

                return (
                  <VariantDisplayCard
                    key={variant.id}
                    variant={mappedDisplayCardVariant}
                    isSelected={selectedVariantIndex === index}
                    onClick={() => setSelectedVariantIndex(index)}
                    onDelete={() => openDeleteDialog(variant.id)}
                    isActionDisabled={isUpdatingSelectedVariant || isBulkSubmitting || isEditImageUploading}
                  />
                );
              })}
            </div>
            
            {selectedVariantForEdit && (
              <div className="w-full md:w-1/2" key={selectedVariantForEdit.id}>
                <VariantDetailsForm
                  control={editDetailControl}
                  handleSubmit={handleEditDetailSubmit}
                  onSubmit={onSubmitEditForm}
                  selectedVariant={mapVariantForDetailsFormBulk(selectedVariantForEdit)}
                  isSaving={isUpdatingSelectedVariant}
                  isSaveDisabled={isUpdatingSelectedVariant || isBulkSubmitting || isEditImageUploading || !editDetailFormState.isDirty || !editDetailFormState.isValid || !calculateVariantIsActuallyDirty()}
                  imageGetRootProps={editDetailGetRootProps}
                  imageGetInputProps={editDetailGetInputProps}
                  isImageDragActive={isEditDetailDragActive}
                  isImageUploading={isEditImageUploading}
                  onSetPrimaryImage={handleSetPrimaryImageEditForm}
                  onDeleteImage={handleDeleteImageEditForm}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog
        open={isVariantDeleteDialogOpen}
        onClose={() => setIsVariantDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this variant (ID: {variantToDeleteId})? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsVariantDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteVariant} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BulkUpdateView; 
