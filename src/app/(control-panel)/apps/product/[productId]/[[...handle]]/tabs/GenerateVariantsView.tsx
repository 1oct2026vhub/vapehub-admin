"use client";

import React, { useEffect, useState } from 'react';
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
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { uploadVariantImages, setVariantPrimaryImage, deleteVariantImage } from '@/services/apiProduct';

interface GenerateVariantsViewProps {
  isLoading: boolean;
  onSuccess?: () => void;
    allCombinationsUsed: boolean;

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

const GenerateVariantsView: React.FC<GenerateVariantsViewProps> = ({ isLoading: initialLoading, onSuccess , allCombinationsUsed}) => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetchErrorOccurred, setFetchErrorOccurred] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<GeneratedVariant | null>(null);
  const { showSnackbar } = useSnackbar();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedThisLoad, setHasGeneratedThisLoad] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [variantToDeleteId, setVariantToDeleteId] = useState<number | null>(null);

  // Add form handling
  const {
    control,
    handleSubmit,
    getValues,
    reset: resetForm,
    formState: { errors, isDirty, isValid, dirtyFields },
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

  const getValidStockStatus = (status: string | null | undefined): "In Stock" | "Out of Stock" | "Back Order" => {
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
      case "back_order":
      case "back order":
        return "Back Order";
      default:
        // Provide a fallback based on stock value if status is invalid/missing
        return currentStock > 0 ? "In Stock" : "Out of Stock";
    }
  };
  // --- End Helper Functions --- 

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
        console.log("[onDrop] Upload API Response:", uploadResponse); // <-- Log response

        // Process response - Standardize extraction
        let newImages: VariantImage[] = []; // Explicit type
        if (uploadResponse && Array.isArray(uploadResponse.data?.variantImages)) {
          // Assuming response structure { success: true, data: { variantImages: [...] } }
          newImages = uploadResponse.data.variantImages;
        } else if (uploadResponse && Array.isArray(uploadResponse.data?.variant?.variantImages)) {
           // Assuming response structure { success: true, data: { variant: { variantImages: [...] } } }
           newImages = uploadResponse.data.variant.variantImages;
        } else if (Array.isArray(uploadResponse)) {
           // Direct array response (less likely based on other calls)
           newImages = uploadResponse; 
        }
        console.log("[onDrop] Extracted new images:", newImages); // <-- Log extracted images

        // Update local state only if new images were processed
        if (newImages.length > 0) {

          // --- Logic to set first image as primary if none exists ---
          let firstImageIdToSetPrimary: number | null = null;
          const hasExistingPrimary = newImages.some(img => img.is_primary);
          
          if (!hasExistingPrimary && newImages[0]) {
            console.log("[onDrop] No primary image found in response. Setting first image as primary.");
            // Modify the first image in the array to be primary
            newImages[0].is_primary = true;
            firstImageIdToSetPrimary = newImages[0].id; // Remember ID for API call
          }
          // --- End Logic ---

          let updatedSelectedVariant : GeneratedVariant | null = null; // Variable to hold updated selected variant

          setGeneratedVariants(prevVariants => 
            prevVariants.map(variant => {
              if (variant.id === selectedVariant.id) {
                // <<< Step 1: Get current unsaved form values >>>
                const currentFormValues = getValues();
                console.log("[onDrop] Current form values:", currentFormValues);

                // Create the updated variant object - REPLACE images with potentially modified newImages list
                const newlyUpdatedVariant = {
                  ...variant,
                  ...currentFormValues, // Overwrite with unsaved form values
                  // <<< Step 3: Ensure correct types and map field names, using null for empty/invalid >>>
                  price: String(getNumericValue(currentFormValues.price) ?? variant.price ?? 0), // Use helper, fallback to existing, then 0
                  stock: getNumericValue(currentFormValues.stock) ?? variant.stock ?? 0, // Use helper, fallback to existing, then 0
                  slug: String(currentFormValues.slug || variant.slug || ''),
                  discount_price: String(getNumericValue(currentFormValues.depositPrice) ?? variant.discount_price ?? null), // Map form name, use null
                  purchase_price: String(getNumericValue(currentFormValues.purchasePrice) ?? variant.purchase_price ?? null), // Use null
                  low_stock_threshold: getNumericValue(currentFormValues.lowStockThreshold) ?? variant.low_stock_threshold ?? null, // Use null
                  weight: String(getNumericValue(currentFormValues.weight) ?? variant.weight ?? null), // Use null
                  length: String(getNumericValue(currentFormValues.length) ?? variant.length ?? null), // Use null
                  width: String(getNumericValue(currentFormValues.width) ?? variant.width ?? null), // Use null
                  height: String(getNumericValue(currentFormValues.height) ?? variant.height ?? null), // Keep null possible
                  barcode: String(currentFormValues.barcode || variant.barcode || ''),
                  description: String(currentFormValues.description || variant.description || ''),
                  status: String(currentFormValues.status || variant.status || 'inactive'),
                  stock_status: String(currentFormValues.stockStatus || variant.stock_status || 'Out of Stock'),
                  // <<< Step 4: NOW overwrite the images with the new list >>>
                  variantImages: newImages.map(img => ({ 
                    id: img.id,
                    image_url: img.image_url,
                    is_primary: img.is_primary, // Will reflect the change above if applied
                    variant_id: variant.id 
                  }))
                };
                updatedSelectedVariant = newlyUpdatedVariant;
                return newlyUpdatedVariant; // Return the new object
              }
              return variant;
            })
          );

          // Update selectedVariant state AFTER generatedVariants state
          if (updatedSelectedVariant) {
            setSelectedVariant(updatedSelectedVariant);
          }
          
          // --- If we set a default primary, call the API --- 
          if (firstImageIdToSetPrimary !== null) {
             console.log(`[onDrop] Calling API to persist default primary image ID: ${firstImageIdToSetPrimary}`);
             // Use try/catch for safety, but don't block UI updates if it fails
             try {
                await setVariantPrimaryImage(productId, String(selectedVariant.id), String(firstImageIdToSetPrimary));
                showSnackbar("First uploaded image set as primary", "success"); // Give specific feedback
             } catch(primaryApiError) {
                 console.error("[onDrop] Failed to persist default primary image via API:", primaryApiError);
                 showSnackbar("Failed to save default primary image setting", "warning");
             }
          } else {
              showSnackbar("Images uploaded successfully", "success"); // Original success message
          }
          // --- End API Call ---

        } else {
           console.warn("[onDrop] No new images extracted from response.");
           showSnackbar("Upload successful, but couldn't display new images immediately.", "warning");
        }

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
      console.log(`[handleSetPrimaryImage] API call successful for image ID: ${imageId}`);

      let updatedSelectedVariantAfterPrimary : GeneratedVariant | null = null;

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

            // Create the updated variant object
            const newlyUpdatedVariant = {
              ...variant,
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

  const handleDeleteImage = async (imageId: number) => {
    if (!selectedVariant) return;

    const productId = searchParams.get('productId');
    if (!productId) {
      showSnackbar("Product ID not found", "error");
      return;
    }

    try {
      await deleteVariantImage(productId, String(selectedVariant.id), String(imageId));
      console.log(`[handleDeleteImage] Successfully called API to delete image ID: ${imageId}`);

      let updatedSelectedVariantAfterDelete : GeneratedVariant | null = null;
      let newPrimaryImageId: number | null = null; // <-- Store new primary ID if needed

      // Update local state - Ensure this triggers re-render
      setGeneratedVariants(prevVariants => 
        prevVariants.map(variant => {
          if (variant.id === selectedVariant.id) {
            const originalImages = Array.isArray(variant.variantImages) ? variant.variantImages : [];
            const deletedImageWasPrimary = originalImages.find(img => img.id === imageId)?.is_primary;
            
            // Filter out the deleted image first
            let updatedImages = originalImages.filter(img => img.id !== imageId);
            console.log(`[handleDeleteImage] Images after filtering ID ${imageId}:`, updatedImages);

            // --- Auto-set new primary if needed ---
            if (deletedImageWasPrimary && updatedImages.length > 0) {
              console.log("[handleDeleteImage] Deleted image was primary. Setting first remaining image as primary.");
              // Create a new array with the first image marked as primary
              updatedImages = updatedImages.map((img, index) => ({
                ...img,
                is_primary: index === 0 // Set only the first one (index 0) to true
              }));
              newPrimaryImageId = updatedImages[0].id; // Store its ID for API call
              console.log(`[handleDeleteImage] New primary image ID to set via API: ${newPrimaryImageId}`);
            }
            // --- End Auto-set ---

            // Create the updated variant object
            const newlyUpdatedVariant = {
              ...variant,
              variantImages: updatedImages // Use the potentially modified list
            };
            updatedSelectedVariantAfterDelete = newlyUpdatedVariant;
            return newlyUpdatedVariant; // Return the new object
          }
          return variant;
        })
      );

      // Update selectedVariant state AFTER generatedVariants state
      if (updatedSelectedVariantAfterDelete) {
         setSelectedVariant(updatedSelectedVariantAfterDelete);
      }

      // --- If a new primary was set, call the API to persist it --- 
      if (newPrimaryImageId !== null) {
         console.log(`[handleDeleteImage] Calling API to persist new default primary image ID: ${newPrimaryImageId}`);
         try {
             await setVariantPrimaryImage(productId, String(selectedVariant.id), String(newPrimaryImageId));
             showSnackbar("Image deleted and new primary set successfully", "success"); // Combined message
         } catch (primaryApiError) {
             console.error("[handleDeleteImage] Failed to persist new primary image via API:", primaryApiError);
             showSnackbar("Image deleted, but failed to save new primary setting", "warning");
         }
      } else {
           showSnackbar("Image deleted successfully", "success"); // Original success message if primary wasn't changed
      }
      // --- End API Call ---

    } catch (error) {
      console.error("[handleDeleteImage] Error deleting image:", error);
      showSnackbar("Failed to delete image", "error");
    }
  };

  // Fetch EXISTING variants (Simplified: No dialog logic here)
  const fetchVariants = async (productId: string, isMounted: boolean) => {
    setIsLoading(true); 
    setError(null);
    setFetchErrorOccurred(false);
    try {
      console.log(`[fetchVariants] Fetching variants for ID: ${productId}`);
      const response = await getProductVariants(Number(productId));
      console.log("[fetchVariants] Response:", response);
      if (!isMounted) return; // Check mount state after await

      if (response.success) {
        const fetchedVariants = response.data || [];
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
      // showSnackbar(error.message || 'Failed to fetch variants', 'error');
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

    const productId = searchParams.get('productId');
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
  }, [searchParams, showSnackbar]); // Dependencies: only things that trigger initial load/reset

  // --- ADDED: useEffect to control dialog visibility --- 
  useEffect(() => {    
    // Open dialog if EITHER fetch failed OR (combinations available AND not generated this load)
    if (!allCombinationsUsed && !hasGeneratedThisLoad) {
       setIsConfirmationDialogOpen(true);
    } else {
        console.log(`[DialogEffect] Conditions NOT met. Dialog remains closed.`);
        // Ensure dialog is closed if conditions aren't met (e.g., after generation)
        setIsConfirmationDialogOpen(false); 
    }
  }, [ allCombinationsUsed, hasGeneratedThisLoad, generatedVariants.length]); // Add fetchErrorOccurred and generatedVariants.length

  // Update useEffect to handle form reset with selected variant
  useEffect(() => {
    console.log(`[useEffect resetEditForm] Running for variant ID: ${selectedVariant?.id}`);
    // Explicitly check if variants exist and index is valid before resetting
    if (selectedVariant) {
      // Log the variant data being used
      console.log('[useEffect resetEditForm] currentSelectedVariant:', JSON.stringify(selectedVariant, null, 2));

      const resetValues = {
        slug: getFieldValue(selectedVariant.slug),
        price: getNumericValue(selectedVariant.price), // Required, should not be null from valid state
        stock: getNumericValue(selectedVariant.stock), // Required, should not be null from valid state
        status: (selectedVariant.status?.toLowerCase() === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
        // --- MODIFIED: Pass null for optional fields if value is null --- 
        depositPrice: getNumericValue(selectedVariant.discount_price), // Use helper which returns null
        purchasePrice: getNumericValue(selectedVariant.purchase_price), // Use helper which returns null
        lowStockThreshold: getNumericValue(selectedVariant.low_stock_threshold), // Use helper which returns null
        stockStatus: getValidStockStatus(selectedVariant.stock_status),
        weight: getNumericValue(selectedVariant.weight), // Use helper which returns null
        length: getNumericValue(selectedVariant.length), // Use helper which returns null
        width: getNumericValue(selectedVariant.width), // Use helper which returns null
        height: getNumericValue(selectedVariant.height), // Use helper which returns null
        barcode: getFieldValue(selectedVariant.barcode),
        description: getFieldValue(selectedVariant.description)
      };
      console.log('[useEffect resetEditForm] Values passed to resetForm:', JSON.stringify(resetValues, null, 2));
      resetForm(resetValues); 

    } else {
      console.log('[useEffect resetEditForm] No variant selected, resetting to defaults.');
      // Reset all fields to empty strings or null for potentially required fields
      resetForm({
        slug: '',
        price: null, // Use null for potentially required number fields initially
        stock: null, // Use null for potentially required number fields initially
        status: 'active',
        depositPrice: null, // Use null for optional numbers
        purchasePrice: null, // Use null for optional numbers
        lowStockThreshold: null, // Use null for optional numbers
        stockStatus: 'In Stock',
        weight: null, // Use null for optional numbers
        length: null, // Use null for optional numbers
        width: null, // Use null for optional numbers
        height: null, // Use null for optional numbers
        barcode: '', // Use empty string for optional strings
        description: '' // Use empty string for optional strings
      });
    }
  }, [selectedVariant, resetForm]);

  // Add onSubmit handler for variant updates
  const onSubmit = async (data: VariantFormData) => {
    if (!selectedVariant) return;

    // Check if the form is actually dirty before proceeding
    if (!isDirty) {
      console.log("[onSubmit] Form is not dirty, no update necessary.");
      showSnackbar("No changes to save.", "info");
      return;
    }

    setIsSubmitting(true);
    try {
      const productId = searchParams.get('productId');
      if (!productId) {
        showSnackbar("Product ID not found", "error");
        setIsSubmitting(false); // Stop submission
        return;
      }

      const transformOptionalNumber = (value: number | string | null | undefined): number | null => {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        return isNaN(num) ? null : num;
      };

      // Start with an empty payload, explicitly typed
      const apiPayload: Partial<UpdateProductVariantRequest> = {};

      console.log("[onSubmit] Dirty fields:", dirtyFields);
      console.log("[onSubmit] Submitted data:", data);

      // Dynamically add fields to payload ONLY if they are dirty
      if (dirtyFields.slug) apiPayload.slug = data.slug;
      if (dirtyFields.price) apiPayload.price = transformOptionalNumber(data.price);
      if (dirtyFields.stock) apiPayload.stock = transformOptionalNumber(data.stock);
      if (dirtyFields.depositPrice) apiPayload.discount_price = transformOptionalNumber(data.depositPrice);
      if (dirtyFields.purchasePrice) apiPayload.purchase_price = transformOptionalNumber(data.purchasePrice);
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
          case 'Back Order': apiPayload.stock_status = 'back_order'; break;
          default: apiPayload.stock_status = null; // Or handle as error/default
        }
      }

      // --- IMPORTANT: Always include attributes if required by backend --- 
      apiPayload.attributes = selectedVariant.variantAttributes.map(attr => ({
        attribute_id: attr.attribute_id,
        term_id: attr.term_id
      }));

      // --- Safety check: Include required fields if they weren't dirty ---
      if (apiPayload.slug === undefined && data.slug !== undefined) apiPayload.slug = data.slug;
      if (apiPayload.price === undefined && data.price !== undefined) apiPayload.price = transformOptionalNumber(data.price);
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
              slug: data.slug,
              price: String(data.price || 0),
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
              status: data.status
            };
          }
          return variant;
        })
      );

      showSnackbar("Variant updated successfully", "success");

      // --- Explicitly reset dirty state after successful update --- 
      // This tells RHF that the current form values are now the 'clean' baseline
      resetForm(data, { keepValues: true, keepDirty: false });

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
    const productId = searchParams.get('productId');
    if (!productId) {
      showSnackbar('Product ID is missing.', 'error');
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
    
    const productId = searchParams.get('productId');
    if (!productId) {
        showSnackbar('Product ID is missing.', 'error');
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

  // --- Loading States ---
  // Initial loading or fetching variants
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <FuseLoading />
        <span className="ml-2">Loading variants...</span>
      </div>
    );
  }

  // Specific loading during generation process
  if (isGenerating) {
       return (
         <div className="flex justify-center items-center py-8">
           <FuseLoading />
           <span className="ml-2">Generating new variants...</span>
         </div>
       );
  }

  // --- Render component ---
  return (
    <div>
      {/* REMOVE Generate Button Div */}
      {/* <div className="mb-4 flex justify-end"> ... </div> */}

      {/* Update conditional rendering for empty state */}
      {generatedVariants.length === 0 && !isLoading && !isGenerating && (
         <div className="p-4 border rounded bg-gray-50 text-center text-gray-600">
           {allCombinationsUsed 
             ? "No variants found. All possible combinations seem to be generated."
             : "No variants found. New combinations might be available."}
             {/* Optionally add: " Generating variants might create them." if !allCombinationsUsed */} 
         </div>
      )}

      {/* Keep variant list and form rendering */}
      {generatedVariants.length > 0 && (
        <>
            <h3 className="text-lg font-semibold mb-4">Created Variants</h3>
            <div className="flex gap-6">
              {/* Left side - Variant cards */}
              <div className="w-1/2">
                {generatedVariants.map((variant) => (
                  <div
                    key={variant.id}
                    className={`border border-gray-200 overflow-hidden cursor-pointer bg-white mb-2 rounded-xl ${
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
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={(e) => { 
                            e.stopPropagation(); // Prevent card click selection
                            handleDeleteClick(variant.id); 
                          }}
                          disabled={isSubmitting} 
                        >
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
                    <div className="mt-2">
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
                    </div>

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