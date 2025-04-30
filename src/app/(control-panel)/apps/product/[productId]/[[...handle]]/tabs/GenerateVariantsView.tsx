"use client";

import React, { useEffect, useState } from 'react';
import FuseLoading from '@fuse/core/FuseLoading';
import { generateProductVariants, getProductVariants, updateProductVariant, UpdateProductVariantRequest } from '@/services/apiProduct';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useSearchParams } from 'next/navigation';
import { IconButton, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormTextField from '@/components/Shared/FormTextField';
import AppButton from '@/components/Shared/AppButton';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { uploadVariantImages, setVariantPrimaryImage, deleteVariantImage } from '@/services/apiProduct';

interface GenerateVariantsViewProps {
  isLoading: boolean;
  onSuccess?: () => void;
}

interface VariantImage {
  id: number;
  variant_id: number;
  image_url: string;
  is_primary: boolean;
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
  price: string;
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
  variantImages: VariantImage[];
  variantAttributes: VariantAttribute[];
}

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
        .min(0, "Deposit price cannot be negative")
        .max(9999999.99, "Deposit price exceeds maximum limit")
        .refine(
          (val) => {
            const str = val.toString();
            return !str.includes(".") || str.split(".")[1].length <= 2;
          },
          { message: "Deposit price can have at most 2 decimal places" }
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

const GenerateVariantsView: React.FC<GenerateVariantsViewProps> = ({ isLoading: initialLoading, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<GeneratedVariant | null>(null);
  const { showSnackbar } = useSnackbar();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // Add form handling
  const {
    control,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isDirty, isValid },
  } = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema),
    mode: "all",
    defaultValues: { 
      slug: "",
      price: null as any,
      stock: null as any,
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

  // Add dropzone hook for image uploads
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (!selectedVariant) return;
      
      const productId = searchParams.get('productId');
      if (!productId) {
        showSnackbar("Product ID not found", "error");
        return;
      }

      // Basic validation for uploaded files
      const validFiles = acceptedFiles.filter(file => {
        if (file.size > 5 * 1024 * 1024) { 
          showSnackbar(`File ${file.name} exceeds 5MB limit.`, "error");
          return false; 
        }
        if (!['image/png', 'image/jpg', 'image/jpeg', 'image/webp'].includes(file.type)) {
          showSnackbar(`File ${file.name} has an invalid type. Only PNG, JPG, JPEG, WEBP allowed.`, "error");
          return false; 
        }
        return true;
      });

      if (validFiles.length === 0) {
        showSnackbar("No valid files to upload.", "warning");
        return;
      }

      setImageUploading(true);

      try {
        // Create FormData for upload
        const formData = new FormData();
        validFiles.forEach((file) => {
          formData.append("files", file);
        });

        // Upload images
        const uploadResponse = await uploadVariantImages(productId, String(selectedVariant.id), formData);

        // Process response
        let newImages = [];
        if (Array.isArray(uploadResponse)) {
          newImages = uploadResponse;
        } else if (uploadResponse?.data?.variant?.variantImages) {
          newImages = uploadResponse.data.variant.variantImages;
        } else if (uploadResponse?.data?.variantImages) {
          newImages = uploadResponse.data.variantImages;
        }

        // Update local state
        setGeneratedVariants(prev => 
          prev.map(variant => {
            if (variant.id === selectedVariant.id) {
              return {
                ...variant,
                variantImages: [
                  ...(variant.variantImages || []),
                  ...newImages.map(img => ({
                    id: img.id,
                    image_url: img.image_url,
                    is_primary: img.is_primary,
                    variant_id: variant.id
                  }))
                ]
              };
            }
            return variant;
          })
        );

        showSnackbar("Images uploaded successfully", "success");
      } catch (error) {
        console.error("Error uploading images:", error);
        showSnackbar("Failed to upload images", "error");
      } finally {
        setImageUploading(false);
      }
    },
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: true
  });

  // Add image handling functions
  const handleSetPrimaryImage = async (imageId: number) => {
    if (!selectedVariant) return;

    const productId = searchParams.get('productId');
    if (!productId) {
      showSnackbar("Product ID not found", "error");
      return;
    }

    try {
      await setVariantPrimaryImage(productId, String(selectedVariant.id), String(imageId));

      // Update local state
      setGeneratedVariants(prev => 
        prev.map(variant => {
          if (variant.id === selectedVariant.id) {
            return {
              ...variant,
              variantImages: variant.variantImages.map(img => ({
                ...img,
                is_primary: img.id === imageId
              }))
            };
          }
          return variant;
        })
      );

      showSnackbar("Primary image updated", "success");
    } catch (error) {
      console.error("Error setting primary image:", error);
      showSnackbar("Failed to set primary image", "error");
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!selectedVariant) return;

    const productId = searchParams.get('productId');
    if (!productId) {
      showSnackbar("Product ID not found", "error");
      return;
    }

    try {
      await deleteVariantImage(productId, String(selectedVariant.id), String(imageId));

      // Update local state
      setGeneratedVariants(prev => 
        prev.map(variant => {
          if (variant.id === selectedVariant.id) {
            return {
              ...variant,
              variantImages: variant.variantImages.filter(img => img.id !== imageId)
            };
          }
          return variant;
        })
      );

      showSnackbar("Image deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting image:", error);
      showSnackbar("Failed to delete image", "error");
    }
  };

  const fetchVariants = async (productId: string) => {
    try {
      const response = await getProductVariants(Number(productId));
      if (response.success) {
        setGeneratedVariants(response.data || []);
        if (response.data?.length > 0) {
          setSelectedVariant(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
      // showSnackbar('Failed to fetch variants', 'error');
    }
  };

  // Update useEffect to handle form reset with selected variant
  useEffect(() => {
    console.log(`[useEffect resetEditForm] Running for variant ID: ${selectedVariant?.id}`);
    // Explicitly check if variants exist and index is valid before resetting
    if (selectedVariant) {
      // Log the variant data being used
      console.log('[useEffect resetEditForm] currentSelectedVariant:', JSON.stringify(selectedVariant, null, 2));

      const getFieldValue = (value: any): string => {
        if (value === null || value === undefined || value === '') {
          return '';
        }
        return value.toString();
      };

      // Updated to return 0 if value is null/undefined/empty
      const getNumericValue = (value: any): number => { // Return type is now number
        if (value === null || value === undefined || value === '') return 0; // Return 0 for null/undefined/empty
        const num = Number(value);
        return isNaN(num) ? 0 : num; // Return 0 if NaN, otherwise the number
      };

      const getValidStockStatus = (status: string | null | undefined): "In Stock" | "Out of Stock" | "Back Order" => {
        const lowerStatus = status?.toLowerCase();
        switch (lowerStatus) {
          case "in_stock":
          case "in stock":
            return "In Stock";
          case "out_of_stock":
          case "out of stock":
            return "Out of Stock";
          case "back_order":
          case "back order":
            return "Back Order";
          default:
            // Provide a fallback based on stock value if status is invalid/missing
            return (selectedVariant.stock ?? 0) > 0 ? "In Stock" : "Out of Stock";
        }
      };

      const resetValues = {
        slug: getFieldValue(selectedVariant.slug), // Text field: use getFieldValue -> ''
        price: getNumericValue(selectedVariant.price), // Numeric field: use getNumericValue -> 0 for null
        stock: getNumericValue(selectedVariant.stock), // Numeric field: use getNumericValue -> 0 for null
        status: (selectedVariant.status?.toLowerCase() === 'active' ? 'active' : 'inactive') as 'active' | 'inactive', // Explicit cast
        depositPrice: getNumericValue(selectedVariant.discount_price), // Numeric field: use getNumericValue -> 0 for null
        purchasePrice: getNumericValue(selectedVariant.purchase_price), // Numeric field: use getNumericValue -> 0 for null
        lowStockThreshold: getNumericValue(selectedVariant.low_stock_threshold), // Numeric field: use getNumericValue -> 0 for null
        stockStatus: getValidStockStatus(selectedVariant.stock_status),
        weight: getNumericValue(selectedVariant.weight), // Numeric field: use getNumericValue -> 0 for null
        length: getNumericValue(selectedVariant.length), // Numeric field: use getNumericValue -> 0 for null
        width: getNumericValue(selectedVariant.width), // Numeric field: use getNumericValue -> 0 for null
        height: getNumericValue(selectedVariant.height), // Numeric field: use getNumericValue -> 0 for null
        barcode: getFieldValue(selectedVariant.barcode), // Text field: use getFieldValue -> ''
        description: getFieldValue(selectedVariant.description) // Text field: use getFieldValue -> ''
      };
      console.log('[useEffect resetEditForm] Values passed to resetForm:', JSON.stringify(resetValues, null, 2));
      resetForm(resetValues); // No need for 'as any' now

    } else {
      console.log('[useEffect resetEditForm] No variant selected, resetting to defaults.');
      // Reset all fields to empty strings or 0 for numbers
      resetForm({
        slug: '',
        price: 0, // Use 0 for numbers
        stock: 0, // Use 0 for numbers
        status: 'active',
        depositPrice: 0, // Use 0 for numbers
        purchasePrice: 0, // Use 0 for numbers
        lowStockThreshold: 0, // Use 0 for numbers
        stockStatus: 'In Stock',
        weight: 0, // Use 0 for numbers
        length: 0, // Use 0 for numbers
        width: 0, // Use 0 for numbers
        height: 0, // Use 0 for numbers
        barcode: '',
        description: ''
      });
    }
  }, [selectedVariant, resetForm]);

  // Add onSubmit handler for variant updates
  const onSubmit = async (data: VariantFormData) => {
    if (!selectedVariant) return;

    setIsSubmitting(true);
    try {
      const productId = searchParams.get('productId');
      if (!productId) {
        showSnackbar("Product ID not found", "error");
        return;
      }

      // Helper function for number transformation
      const transformOptionalNumber = (value: number | string | null | undefined): number | null => {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        return isNaN(num) ? null : num;
      };

      // Build API payload with correct types
      const apiPayload: UpdateProductVariantRequest = {
        slug: data.slug,
        price: transformOptionalNumber(data.price),
        stock: transformOptionalNumber(data.stock),
        discount_price: transformOptionalNumber(data.depositPrice),
        purchase_price: transformOptionalNumber(data.purchasePrice),
        low_stock_threshold: transformOptionalNumber(data.lowStockThreshold),
        weight: transformOptionalNumber(data.weight),
        length: transformOptionalNumber(data.length),
        width: transformOptionalNumber(data.width),
        height: transformOptionalNumber(data.height),
        barcode: data.barcode || null,
        attributes: selectedVariant.variantAttributes.map(attr => ({
          attribute_id: attr.attribute_id,
          term_id: attr.term_id
        }))
      };

      await updateProductVariant(Number(productId), selectedVariant.id, apiPayload);

      // Update local state with correct types
      setGeneratedVariants(prev => 
        prev.map(variant => {
          if (variant.id === selectedVariant.id) {
            return {
              ...variant,
              slug: apiPayload.slug,
              price: String(apiPayload.price || 0),
              stock: apiPayload.stock || 0,
              discount_price: apiPayload.discount_price ? String(apiPayload.discount_price) : '0',
              purchase_price: apiPayload.purchase_price ? String(apiPayload.purchase_price) : '0',
              low_stock_threshold: apiPayload.low_stock_threshold || 0,
              weight: apiPayload.weight ? String(apiPayload.weight) : '0',
              length: apiPayload.length ? String(apiPayload.length) : '0',
              width: apiPayload.width ? String(apiPayload.width) : '0',
              height: apiPayload.height ? String(apiPayload.height) : null,
              barcode: apiPayload.barcode || '',
              stock_status: data.stockStatus
            };
          }
          return variant;
        })
      );

      showSnackbar("Variant updated successfully", "success");
    } catch (error) {
      console.error("Error updating variant:", error);
      showSnackbar("Failed to update variant", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const generateVariants = async () => {
      const productId = searchParams.get('productId');
      
      if (!productId) {
        setError('Product ID not found');
        showSnackbar('Product ID not found', 'error');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await generateProductVariants(Number(productId));
        
        if (response.success) {
          showSnackbar('Variants generated successfully', 'success');
          // Fetch the generated variants
          await fetchVariants(productId);
          if (onSuccess) {
            onSuccess();
          }
        } 
      } catch (error) {
        console.error('Error generating variants:', error);
        await fetchVariants(productId);
        // showSnackbar(error.message || 'Failed to generate variants', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    generateVariants();
  }, [searchParams, showSnackbar, onSuccess]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <FuseLoading />
        <span className="ml-2">Generating variants...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded bg-red-50 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (generatedVariants.length === 0) {
    return (
      <div className="p-4 border rounded bg-gray-50 text-center text-gray-600">
        No variants were generated. This could be because there are no attributes marked for variation.
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Created Variants</h3>
      <div className="flex gap-6">
        {/* Left side - Variant cards */}
        <div className="w-1/2">
          {generatedVariants.map((variant) => (
            <div
              key={variant.id}
              className={`border border-gray-200 overflow-hidden cursor-pointer bg-white mb-2 ${
                selectedVariant?.id === variant.id ? 'border-l-4 border-l-green-600' : 'border-l-transparent'
              }`}
              onClick={() => setSelectedVariant(variant)}
            >
              <div className="flex p-3">
                <div className="w-16 mr-3">
                  <div className="h-16 w-16 flex items-center justify-center">
                    {variant.variantImages?.find(img => img.is_primary)?.image_url ? (
                      <img
                        src={variant.variantImages.find(img => img.is_primary)?.image_url}
                        alt={variant.slug}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-400">No image</div>
                    )}
                  </div>
                </div>
                <div className="flex-1 pl-4">
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-gray-700">ID: {variant.id}</p>
                  </div>
                  <div className="space-y-2">
                    {variant.variantAttributes.map((attr) => (
                      <div key={attr.id}>
                        <p className="text-sm text-green-800 font-semibold mb-0.5">{attr.attribute.name}:</p>
                        <input
                          type="text"
                          readOnly
                          value={attr.term.name}
                          className="w-full text-sm border border-gray-300 px-3 py-1 rounded bg-gray-50 text-gray-800 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center pt-3 justify-between">
                    <div className="flex items-center flex-wrap gap-2">
                      <div className="flex items-center space-x-1 border border-[#005B2F] rounded-md bg-green-50 px-2.5 py-1">
                        <span className="text-[#14854E] text-sm font-medium">Stock:</span>
                        <div className="bg-[#14854E] px-1.5 py-0.5 rounded-sm text-white text-sm font-semibold">
                          {variant.stock}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 border border-[#005B2F] rounded-md bg-green-50 px-2.5 py-1">
                        <span className="text-[#14854E] text-sm font-medium">Price:</span>
                        <div className="bg-[#14854E] px-1.5 py-0.5 rounded-sm text-white text-sm font-semibold">
                          ${Number(variant.price).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-md text-sm font-medium ${
                      variant.status === 'active' 
                        ? 'bg-white border border-[#005B2F] text-[#14854E]' 
                        : 'bg-white border border-red-500 text-red-500'
                    }`}>
                      {variant.status === 'active' ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
                <div className="ml-2">
                  <IconButton size="small" color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right side - Variant Details Form */}
        {selectedVariant && (
          <div className="w-1/2" key={selectedVariant.id}>
            <Paper elevation={3} className="p-4 bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Variant Details</h2>
                <AppButton 
                  label="Save" 
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting || !isDirty || !isValid}
                  loading={isSubmitting}
                />
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <FormTextField name="slug" control={control} label="Slug" required />
                <FormTextField name="price" control={control} label="Price" required type="number" />
                <FormTextField name="depositPrice" control={control} label="Deposit Price" type="number" />
                <FormTextField name="purchasePrice" control={control} label="Purchase Price" type="number" />
                <FormTextField name="stock" control={control} label="Stock" required type="number" />
                <FormTextField name="lowStockThreshold" control={control} label="Low Stock Threshold" type="number" />

                <Controller
                  name="stockStatus"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <FormField label="Stock Status" required error={error?.message}>
                      <select {...field} className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white h-10 appearance-none">
                        <option value="In Stock">In Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                        <option value="Back Order">Back Order</option>
                      </select>
                    </FormField>
                  )}
                />

                <Controller
                  name="status"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <FormField label="Status" required error={error?.message}>
                      <select {...field} className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white h-10 appearance-none">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </FormField>
                  )}
                />
              </div>

              {/* Dimensions & Weight */}
              <div className="mb-4">
                <h3 className="font-semibold mb-3">Dimensions & Weight</h3>
                <div className="grid grid-cols-4 gap-4">
                  <FormTextField name="weight" control={control} label="Weight" type="number" />
                  <FormTextField name="length" control={control} label="Length" type="number" />
                  <FormTextField name="width" control={control} label="Width" type="number" />
                  <FormTextField name="height" control={control} label="Height" type="number" />
                </div>
              </div>

              {/* Barcode */}
              <FormTextField name="barcode" control={control} label="Barcode" />

              {/* Description */}
              <Controller
                name="description"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <FormField label="Description" error={error?.message}>
                    <textarea 
                      {...field} 
                      className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white" 
                    />
                  </FormField>
                )}
              />

              {/* Image section */}
              <div className="mt-4">
                <h3 className="font-semibold mb-3">Image</h3>
                {selectedVariant.variantImages && selectedVariant.variantImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {selectedVariant.variantImages.map((image) => (
                      <div key={image.id} className="relative border rounded p-1">
                        <img 
                          src={image.image_url} 
                          alt={`Variant ${selectedVariant.id}`} 
                          className="w-full h-24 object-contain" 
                        />
                        <div className="absolute top-1 right-1">
                          <IconButton 
                            size="small" 
                            color="error" 
                            className="bg-white"
                            onClick={() => handleDeleteImage(image.id)}
                            disabled={isSubmitting || imageUploading}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </div>
                        <div className="mt-1 flex justify-center">
                          <input 
                            type="radio" 
                            checked={image.is_primary} 
                            onChange={() => handleSetPrimaryImage(image.id)}
                            disabled={isSubmitting || imageUploading} 
                          />
                          <span className="text-xs ml-1">Primary</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload section */}
                <div 
                  {...getRootProps()} 
                  className={`border rounded flex flex-col items-center justify-center py-8 bg-gray-50 
                    ${isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                    ${(imageUploading || isSubmitting) ? 'opacity-70 cursor-wait' : 'cursor-pointer'} mb-3`}
                >
                  <input {...getInputProps()} disabled={isSubmitting || imageUploading} />
                  {(imageUploading) ? (
                    <FuseLoading className="mb-2" />
                  ) : (
                    <>
                      <CloudUploadIcon className="text-gray-400 mb-2" />
                      <p className="text-center">{isDragActive ? "Drop files here" : "Upload More Images"}</p>
                      <p className="text-xs text-gray-500">5MB max file size</p>
                    </>
                  )}
                </div>
              </div>
            </Paper>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateVariantsView; 