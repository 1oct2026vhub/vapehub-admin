'use client';

import React, { useState } from 'react';
import { useForm, Controller, SubmitHandler, FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { Paper, FormControlLabel, Checkbox, Select, MenuItem, FormControl, InputLabel, FormHelperText, Typography } from '@mui/material';
import AppButton from '@/components/Shared/AppButton';
import FormTextField from '@/components/Shared/FormTextField'; 
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import { 
  bulkUpdateProductVariants, 
  BulkUpdateProductVariantsPayload 
} from '@/services/apiProduct';
import { 
  IconButton, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle, 
  Button, 
  CircularProgress 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FuseLoading from '@fuse/core/FuseLoading';
import { useDropzone, DropzoneRootProps, DropzoneInputProps } from 'react-dropzone';
import { Control, UseFormHandleSubmit, FieldErrors, UseFormStateReturn } from 'react-hook-form';
import VariantDisplayCard from '../components/VariantDisplayCard';
import VariantDetailsForm, { VariantFormData as SharedVariantFormData } from '../components/VariantDetailsForm';

const bulkUpdateSchema = z.object({
    price: z.object({
        type: z.enum(['set', 'increase', 'decrease']).optional(),
        value: z.preprocess(
            (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
            z.number({ invalid_type_error: "Price value must be a number" })
             .min(0, "Price value cannot be negative")
             .refine((val) => {
                if (val === undefined) return true;
                const str = val.toString();
                return !str.includes('.') || str.split('.')[1].length <= 2;
             }, { message: "Price value can have at most 2 decimal places" })
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

interface VariantImage {
  id: number;
  image_url: string;
  is_primary: boolean;
}

interface Variant {
  id: string;
  slug: string;
  price: number | null; 
  stock: number | null; 
  status: 'Active' | 'Inactive';
  stockStatus?: 'In Stock' | 'Out of Stock' | 'Back Order'; 
  attributes: Record<string, string>;
  images?: VariantImage[];
  depositPrice?: number | null;
  purchasePrice?: number | null;
  lowStockThreshold?: number | null;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  barcode?: string | null;
  description?: string | null;
}

const variantSchema = z.object({
  slug: z.string()
    .min(1, "Slug is required")
    .max(100, "Slug cannot exceed 100 characters") 
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"), 
  price: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for price"),
      z.number()
        .positive("Price must be greater than zero")
        .max(9999999.99, "Price exceeds maximum limit")
        .refine(
          (val) => {
            const str = val.toString();
            return !str.includes(".") || str.split(".")[1].length <= 2;
          },
          { message: "Price can have at most 2 decimal places" }
        ),
      z.null().refine(() => false, "Price is required"),
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
  stockStatus: z.enum(["In Stock", "Out of Stock", "Back Order"]).default("In Stock"),
  depositPrice: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for deposit price"),
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
    .max(1000, "Description cannot exceed 1000 characters") 
    .optional()
    .nullable(),
});

type VariantFormData = z.infer<typeof variantSchema>;

// Helper to map Variant (from BulkUpdateView state) to VariantForCard
const mapVariantForDisplayCardBulk = (variant: Variant | null) => {
  if (!variant) return null; // Should ideally not happen if we have a selected variant
  const displayAttributes = Object.entries(variant.attributes || {}).map(([key, value], idx) => ({
    id: idx, // Placeholder ID, consider a more robust way if available (e.g., attribute_id from productAttributes)
    attribute_name: key,
    term_name: value,
  }));

  return {
    id: Number(variant.id), // Convert string ID to number
    slug: variant.slug || '',
    price: variant.price !== null ? variant.price : 0, // Default to 0 if null
    stock: variant.stock !== null ? variant.stock : 0, // Default to 0 if null
    status: variant.status === 'Active' ? 'active' : 'inactive', // Map status
    variantImages: variant.images?.map(img => ({ ...img })) || [],
    variantAttributes: displayAttributes,
  };
};

// Helper to map Variant to SelectedVariantForForm
const mapVariantForDetailsFormBulk = (variant: Variant | null) => {
  if (!variant) return null;
  return {
    id: Number(variant.id), // Convert string ID to number
    slug: variant.slug,
    variantImages: variant.images?.map(img => ({ ...img })) || [],
  };
};

interface BulkUpdateViewProps {
  allCombinationsUsed: boolean;
  variants: Variant[];
  setVariants: React.Dispatch<React.SetStateAction<Variant[]>>;
  selectedVariantIndex: number;
  setSelectedVariantIndex: (index: number) => void;
  filteredVariants: Variant[];
  editControl: Control<VariantFormData>;
  handleEditSubmit: UseFormHandleSubmit<VariantFormData>;
  editFormState: UseFormStateReturn<VariantFormData>;
  handleUpdateVariant: SubmitHandler<VariantFormData>;
  editGetRootProps: (props?: any) => DropzoneRootProps;
  editGetInputProps: (props?: any) => DropzoneInputProps;
  editIsDragActive: boolean;
  handleSetPrimaryImage: (imageId: number) => void;
  handleDeleteImage: (imageId: number) => void;
  isEditImageUploading: boolean;
  isUpdating: boolean;
  setVariantToDeleteId: (id: string | null) => void;
  setIsDeleteDialogOpen: (isOpen: boolean) => void;
  showSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

const BulkUpdateView: React.FC<BulkUpdateViewProps> = ({ 
  allCombinationsUsed,
  variants,
  setVariants,
  selectedVariantIndex,
  setSelectedVariantIndex,
  filteredVariants,
  editControl,
  handleEditSubmit,
  editFormState,
  handleUpdateVariant,
  editGetRootProps,
  editGetInputProps,
  editIsDragActive,
  handleSetPrimaryImage,
  handleDeleteImage,
  isEditImageUploading,
  isUpdating,
  setVariantToDeleteId,
  setIsDeleteDialogOpen,
  showSnackbar,
}) => {
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const searchParams = useSearchParams();

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
        price: { type: undefined, value: undefined, is_percentage: undefined },
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

  const onBulkSubmit: SubmitHandler<BulkUpdateFormData> = async (data) => {
    const productId = searchParams ? searchParams.get('productId') : null;
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

      if (data.price?.type && data.price.value !== undefined) {
          updates.price = { type: data.price.type, value: data.price.value, is_percentage: data.price.is_percentage };
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

  const selectedVariant = filteredVariants[selectedVariantIndex] || null;

  if (variants.length === 0) {
    return (
      <Paper elevation={3} className="p-4 bg-yellow-50 border border-yellow-300 text-center">
        <Typography color="textSecondary">
          Bulk Update requires at least one existing variant. Please add or generate variants first.
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
                      name="price.type"
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
                                setBulkValue('price.is_percentage', false);
                              } else if (newType === 'increase' || newType === 'decrease') {
                                setBulkValue('price.is_percentage', true);
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
                      name="price.value"
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
                          error={!!(bulkFormState.errors.price as any)?.value || !!bulkFormState.errors.price?.root}
                          inputProps={{ step: "0.01" }}
                          sx={{ "& .MuiOutlinedInput-root": { height: '40px' } }}
                        />
                      )}
                    />
                  </div>
                  {(bulkFormState.errors.price?.root?.message || (bulkFormState.errors.price as any)?.value?.message) && (
                    <div className="col-span-12 mt-1 mx-auto">
                        <p className="text-xs text-red-500">
                            {bulkFormState.errors.price?.root?.message || (bulkFormState.errors.price as any)?.value?.message}
                        </p>
                    </div>
                  )}
                  <div className="col-span-12 mt-1">
                    <Controller
                      name="price.is_percentage"
                      control={bulkControl}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              disabled={!watchBulk('price.type') || (watchBulk('price.type') === 'set')}
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

      {variants.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Created Variants</h3>
          {filteredVariants.length === 0 && (
            <div className="text-center py-8 border rounded bg-gray-50">
              <p className="text-gray-500">No variants match your search</p>
              <p className="mt-2 text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
          
          {filteredVariants.length > 0 && (
            <div className="flex gap-6">
              <div className="w-1/2">
                <div>
                  {filteredVariants.map((variant) => {
                    const variantIndex = variants.findIndex(v => v.id === variant.id);
                    return (
                      <div
                        key={variant.id}
                        data-variant-id={variant.id}
                        className={`border border-gray-200 overflow-hidden cursor-pointer bg-white mb-2 rounded-xl ${ 
                          selectedVariantIndex === variantIndex ? 'border-l-4 border-l-green-600' : 'border-l-transparent' 
                        }`}
                        onClick={() => setSelectedVariantIndex(variantIndex)}
                      >
                        <div className="flex p-3">
                          <div className="w-16 mr-3">
                             <div className="h-16 w-16 flex items-center justify-center">
                               {(() => {
                                 const primaryImage = variant.images?.find((img: VariantImage) => img.is_primary);
                                 const displayImage = primaryImage || variant.images?.[0];
                                 if (displayImage) {
                                   return <img src={displayImage.image_url} alt={`Variant ${variant.id}`} className="max-h-full max-w-full object-contain" />;
                                 } else {
                                   return <div className="text-gray-400">No image</div>;
                                 }
                               })()}
                             </div>
                          </div>
                          <div className="flex-1 pl-4">
                             <div className="mb-2">
                               <p className="text-sm font-semibold text-gray-700">ID: {variant.id}</p>
                             </div>
                             <div className="space-y-2">
                              {Object.entries(variant.attributes).map(([key, value], attrIndex) => (
                                <div key={`${key}-${attrIndex}`} >
                                  <p className="text-sm text-green-800 font-semibold mb-0.5">{key}:</p>
                                  <input 
                                    type="text" 
                                    readOnly 
                                    value={value} 
                                    className="w-full text-sm border border-gray-300 px-3 py-1 rounded bg-gray-50 text-gray-800 focus:outline-none" 
                                  />
                                </div>
                              ))}
                            </div>
                             <div className="flex items-center pt-3 justify-between">
                               <div className="flex items-center flex-wrap gap-2">
                                 <div className="flex items-center space-x-1 border border-[#005B2F] rounded-md bg-green-50 px-2.5 py-1">
                                   <span className="text-[#14854E] text-sm font-medium">Stock:</span>
                                   <div className="bg-[#14854E] px-1.5 py-0.5 rounded-sm text-white text-sm font-semibold stock-value">
                                     {variant.stock ?? 'N/A'}
                                   </div>
                                 </div>
                                 <div className="flex items-center gap-1 border border-[#005B2F] rounded-md bg-green-50 px-2.5 py-1">
                                   <span className="text-[#14854E] text-sm font-medium">Price:</span>
                                   <div className="bg-[#14854E] px-1.5 py-0.5 rounded-sm text-white text-sm font-semibold price-value">
                                     ${variant.price !== null ? Number(variant.price).toFixed(2) : 'N/A'}
                                   </div>
                                 </div>
                               </div>
                               <div className={`px-3 py-1 rounded-md text-sm font-medium status-value ${ 
                                 variant.status === 'Active' ? 'bg-white border border-[#005B2F] text-[#14854E]' : 'bg-white border border-red-500 text-red-500' 
                               }`}>
                                 {variant.status}
                               </div>
                             </div>
                          </div>
                          <div className="ml-2">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setVariantToDeleteId(variant.id); 
                                setIsDeleteDialogOpen(true); 
                              }}
                              disabled={isUpdating || isBulkSubmitting}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {selectedVariant && (
                <div className="w-1/2">
                  <Paper elevation={3} className="p-4 bg-white">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-bold">Variant Details</h2>
                      <AppButton 
                        label="Save" 
                        onClick={handleEditSubmit(handleUpdateVariant)}
                        disabled={isUpdating || !editFormState.isDirty || !editFormState.isValid || isBulkSubmitting}
                        loading={isUpdating}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <Controller name="stockStatus" control={editControl} render={({ field, fieldState: { error } }) => (
                        <FormField label="Stock Status" required error={(error as FieldError)?.message}>
                          <select {...field} className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white h-10 appearance-none">
                            <option value="In Stock">In Stock</option>
                            <option value="Out of Stock">Out of Stock</option>
                            <option value="Back Order">Back Order</option>
                          </select>
                        </FormField>
                      )}/>
                      <Controller name="status" control={editControl} render={({ field, fieldState: { error } }) => (
                        <FormField label="Status" required error={(error as FieldError)?.message}>
                          <select {...field} className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white h-10 appearance-none">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </FormField>
                      )}/>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <FormTextField name="price" control={editControl} label="Regular Price" required type="number" inputProps={{ step: "0.01" }}/>
                        <FormTextField name="depositPrice" control={editControl} label="Sale Price" type="number" inputProps={{ step: "0.01" }}/>
                        <FormTextField name="purchasePrice" control={editControl} label="Purchase Price" type="number" inputProps={{ step: "0.01" }}/>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                         <FormTextField name="stock" control={editControl} label="Stock" required type="number" inputProps={{ step: "1" }}/>
                         <FormTextField name="lowStockThreshold" control={editControl} label="Low Stock Threshold" type="number" inputProps={{ step: "1" }}/>
                         <FormTextField name="slug" control={editControl} label="Slug" required />
                    </div>
                     <div className="mb-4">
                       <h3 className="font-semibold mb-3">Dimensions & Weight</h3>
                       <div className="grid grid-cols-4 gap-4">
                           <FormTextField name="weight" control={editControl} label="Weight" type="number" inputProps={{ min: "0", step: "0.01" }}/>
                           <FormTextField name="length" control={editControl} label="Length" type="number" inputProps={{ min: "0", step: "0.01" }}/>
                           <FormTextField name="width" control={editControl} label="Width" type="number" inputProps={{ min: "0", step: "0.01" }}/>
                           <FormTextField name="height" control={editControl} label="Height" type="number" inputProps={{ min: "0", step: "0.01" }}/>
                       </div>
                    </div>
                    <FormTextField name="barcode" control={editControl} label="Barcode" />
                    <div className="mt-2">
                    <Controller name="description" control={editControl} render={({ field, fieldState: { error } }) => (
                       <FormField label="Description" error={(error as FieldError)?.message}>
                           <textarea {...field} value={field.value ?? ''} className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white" />
                       </FormField>
                    )}/>
                    </div>

                    <div className="mt-4">
                      <h3 className="font-semibold mb-3">Image</h3>
                      {selectedVariant.images && selectedVariant.images.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          {selectedVariant.images.map((image: VariantImage, idx: number) => (
                            <div key={`${image.id}-${idx}`} className="relative border rounded p-1">
                              <img src={image.image_url} alt={`Variant image ${idx}`} className="w-full h-24 object-contain" />
                              <div className="absolute top-1 right-1">
                                <IconButton 
                                  size="small" 
                                  color="error" 
                                  className="bg-white" 
                                  onClick={() => handleDeleteImage(image.id)}
                                  disabled={isUpdating || isBulkSubmitting || isEditImageUploading}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </div>
                              <div className="mt-1 flex justify-center">
                                <input 
                                   type="radio" 
                                   name={`primary-edit-${selectedVariantIndex}`} 
                                   checked={image.is_primary} 
                                   onChange={() => handleSetPrimaryImage(image.id)}
                                   disabled={isUpdating || isBulkSubmitting || isEditImageUploading}
                                />
                                <span className="text-xs ml-1">Primary</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div {...editGetRootProps()} className={`border rounded flex flex-col items-center justify-center py-8 bg-gray-50 ${editIsDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'} ${isEditImageUploading ? 'opacity-70 cursor-wait' : 'cursor-pointer'} mb-3`}>
                        <input {...editGetInputProps()} disabled={isEditImageUploading || isUpdating || isBulkSubmitting} />
                        {(isEditImageUploading) ? (
                          <FuseLoading className="mb-2" />
                        ) : (
                          <>
                            <CloudUploadIcon className="text-gray-400 mb-2" />
                            <p className="text-center">{editIsDragActive ? "Drop files here" : "Upload More Images"}</p>
                            <p className="text-xs text-gray-500">5MB max file size</p>
                          </>
                        )}
                      </div>
                    </div>
                  </Paper>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkUpdateView; 
