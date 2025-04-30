'use client';

import React, { useEffect, useState } from 'react';
import { Controller, SubmitHandler, Control, UseFormHandleSubmit, UseFormWatch, UseFormReset, FieldErrors, UseFormTrigger, UseFormSetValue } from 'react-hook-form';
import { Paper, IconButton, Select, MenuItem, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AppButton from '@/components/Shared/AppButton';
import FormTextField from '@/components/Shared/FormTextField'; 
import FuseLoading from '@fuse/core/FuseLoading';
import { FieldError } from 'react-hook-form'; // Import FieldError
import { DropzoneRootProps, DropzoneInputProps } from 'react-dropzone';
import TextField from '@mui/material/TextField'; // Re-import TextField
import CloseIcon from '@mui/icons-material/Close';

// Assuming VariantFormData, Variant, VariantAttributeField, VariantImage etc. types are defined elsewhere or passed/defined here
// Using placeholder types for now
type VariantFormData = Record<string, any>;
type Variant = Record<string, any> & { id: string; images?: any[]; attributes: Record<string, string>; };
type VariantAttributeField = { name: string; value: string };
type VariantImage = { id: number; image_url: string; is_primary: boolean };

// Define FormField wrapper or import
const FormField = ({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean; }) => (
  <div className="mb-4">
    <label className="text-sm text-green-700 mb-1 font-medium block">
        {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

interface ManualVariantViewProps {
  // EDIT Form Props
  editControl: Control<VariantFormData>;
  handleEditSubmit: UseFormHandleSubmit<VariantFormData>; // Wrapper for edit submit
  editErrors: FieldErrors<VariantFormData>;
  editFormState: any; // Pass edit formState
  setEditValue: UseFormSetValue<VariantFormData>;
  // CREATE Form Props
  createControl: Control<VariantFormData>;
  handleCreateSubmit: UseFormHandleSubmit<VariantFormData>; // Wrapper for create submit
  createErrors: FieldErrors<VariantFormData>;
  createFormState: any; // Pass create formState
  setCreateValue: UseFormSetValue<VariantFormData>;
  // Submit Handlers (Business Logic)
  onSubmitCreate: SubmitHandler<VariantFormData>; // Renamed for clarity
  onSubmitUpdate: SubmitHandler<VariantFormData>; // Renamed for clarity
  // WATCH functions if needed downstream (can be derived from control)
  // watchEdit: UseFormWatch<VariantFormData>; 
  // watchCreate: UseFormWatch<VariantFormData>;
  // TRIGGER functions if needed downstream (likely handled in parent)
  // triggerEdit: UseFormTrigger<VariantFormData>;
  // triggerCreate: UseFormTrigger<VariantFormData>;

  // Variant & Attribute State
  variants: Variant[];
  selectedVariant: Variant | null;
  selectedVariantIndex: number;
  setSelectedVariantIndex: (index: number) => void;
  setVariants: React.Dispatch<React.SetStateAction<Variant[]>>;
  productAttributes: any[];
  attributeTerms: Record<number, any[]>;
  attributeFields: VariantAttributeField[];
  setAttributeFields: (fields: VariantAttributeField[]) => void;
  pendingCombination: Record<string, any> | null;
  setPendingCombination: (combo: Record<string, any> | null) => void;
  allPossibleCombinations: Array<Record<string, any>>;
  usedCombinations: Array<Record<string, any>>;
  isCombinationMatch: (combo1: any, combo2: any) => boolean; // Pass helper
  setupFormForCombination: (combination: Record<string, any>) => void;
  allCombinationsUsed: boolean;
  filteredVariants: Variant[]; // Pass filtered list

  // Loading & Submission States
  isSubmitting: boolean;
  imageUploading: boolean;
  isEditUploading?: boolean; // Optional prop if needed

  // Image Handling
  pendingCreateImages: File[];
  setPendingCreateImages: (files: File[]) => void;
  pendingCreateImagePreviews: string[];
  setPendingCreateImagePreviews: (previews: string[]) => void;
  createGetRootProps: (props?: any) => DropzoneRootProps;
  createGetInputProps: (props?: any) => DropzoneInputProps;
  createIsDragActive: boolean;
  editGetRootProps: (props?: any) => DropzoneRootProps;
  editGetInputProps: (props?: any) => DropzoneInputProps;
  editIsDragActive: boolean;
  handleSetPrimaryImage: (imageId: number) => void;
  handleDeleteImage: (imageId: number) => void;

  // Dialog State & Handlers
  setVariantToDeleteId: (id: string | null) => void;
  setIsDeleteDialogOpen: (isOpen: boolean) => void;

  // Other
  showSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

// Add helper function for number transformation
const transformOptionalNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

// Add helper function for dimension fields
const transformDimensionValue = (value: number | string | null | undefined): number | undefined => {
  const num = transformOptionalNumber(value);
  // Only return numbers greater than 0, otherwise undefined (field won't be included in payload)
  return num && num > 0 ? num : undefined;
};

const ManualVariantView: React.FC<ManualVariantViewProps> = ({
  editControl,
  handleEditSubmit,
  editErrors,
  editFormState,
  setEditValue,
  createControl,
  handleCreateSubmit,
  createErrors,
  createFormState,
  setCreateValue,
  onSubmitCreate,
  onSubmitUpdate,
  variants,
  selectedVariant,
  selectedVariantIndex,
  setSelectedVariantIndex,
  setVariants,
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
  filteredVariants,
  isSubmitting,
  imageUploading,
  isEditUploading,
  pendingCreateImages,
  setPendingCreateImages,
  pendingCreateImagePreviews,
  setPendingCreateImagePreviews,
  createGetRootProps,
  createGetInputProps,
  createIsDragActive,
  editGetRootProps,
  editGetInputProps,
  editIsDragActive,
  handleSetPrimaryImage,
  handleDeleteImage,
  setVariantToDeleteId,
  setIsDeleteDialogOpen,
  showSnackbar,
}) => {
  // Use specific form states
  const { isValid: isCreateValid, isDirty: isCreateDirty } = createFormState;

  // Add new state for notification
  const [showNotification, setShowNotification] = useState(false);

  // Add useEffect to handle notification
  useEffect(() => {
    if (allCombinationsUsed) {
      setShowNotification(true);
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [allCombinationsUsed]);

  // Update useEffect to handle form reset with empty fields for null values
  useEffect(() => {
    console.log(`[useEffect resetEditForm] Running for index: ${selectedVariantIndex}`);
    // Explicitly check if variants exist and index is valid before resetting
    if (variants.length > 0 && selectedVariantIndex >= 0 && selectedVariantIndex < variants.length) {
      const currentSelectedVariant = variants[selectedVariantIndex];
      // Log the variant data being used
      console.log('[useEffect resetEditForm] currentSelectedVariant:', JSON.stringify(currentSelectedVariant, null, 2)); 
      
      // Helper function to handle null/undefined/empty values
      const getFieldValue = (value: any) => {
        if (value === null || value === undefined || value === '') {
          return '';  // Return empty string for null/undefined/empty values
        }
        return value.toString();  // Convert numbers to strings
      };

      // Set form values - show empty field for null values
      setEditValue('slug', getFieldValue(currentSelectedVariant.slug));
      setEditValue('price', currentSelectedVariant.price || '');
      setEditValue('stock', currentSelectedVariant.stock || '');
      setEditValue('status', (currentSelectedVariant.status === 'Active' ? 'active' : 'inactive'));
      setEditValue('depositPrice', currentSelectedVariant.depositPrice || '');
      setEditValue('purchasePrice', currentSelectedVariant.purchasePrice || '');
      setEditValue('lowStockThreshold', currentSelectedVariant.lowStockThreshold || '');
      setEditValue('stockStatus', ((currentSelectedVariant.stock !== null && currentSelectedVariant.stock > 0) ? "In Stock" : "Out of Stock"));
      setEditValue('weight', currentSelectedVariant.weight || '');
      setEditValue('length', currentSelectedVariant.length || '');
      setEditValue('width', currentSelectedVariant.width || '');
      setEditValue('height', currentSelectedVariant.height || '');
      setEditValue('barcode', getFieldValue(currentSelectedVariant.barcode));
      setEditValue('description', getFieldValue(currentSelectedVariant.description));
    } else {
      console.log('[useEffect resetEditForm] No valid variant selected, resetting to defaults.');
      // Reset all fields to empty
      setEditValue('slug', '');
      setEditValue('price', '');
      setEditValue('stock', '');
      setEditValue('status', 'active');
      setEditValue('depositPrice', '');
      setEditValue('purchasePrice', '');
      setEditValue('lowStockThreshold', '');
      setEditValue('stockStatus', 'In Stock');
      setEditValue('weight', '');
      setEditValue('length', '');
      setEditValue('width', '');
      setEditValue('height', '');
      setEditValue('barcode', '');
      setEditValue('description', '');
    }
  }, [variants, selectedVariantIndex, setEditValue, variants[selectedVariantIndex]]);

  console.log(
    `[ManualVariantView Render] Received selectedVariant prop:`, 
    selectedVariant ? { id: selectedVariant.id, data: selectedVariant } : null
  );

  // Update the submit handler to properly handle variant updates
  const handleUpdateSubmit = async (data: VariantFormData) => {
    try {
      // Transform dimension fields - only include if value is > 0
      const apiPayload = {
        ...data,
        // Required fields remain as is
        price: transformOptionalNumber(data.price),
        stock: transformOptionalNumber(data.stock),
        // Optional fields - only include if value is > 0
        weight: transformDimensionValue(data.weight),
        length: transformDimensionValue(data.length),
        width: transformDimensionValue(data.width),
        height: transformDimensionValue(data.height),
        // Other optional fields
        discount_price: transformOptionalNumber(data.depositPrice),
        purchase_price: transformOptionalNumber(data.purchasePrice),
        low_stock_threshold: transformOptionalNumber(data.lowStockThreshold),
        barcode: data.barcode || null,
        description: data.description?.trim() || null,
      };

      // Remove undefined fields from payload
      Object.keys(apiPayload).forEach(key => {
        // Modify the condition to remove both undefined and null keys for optional fields
        if (apiPayload[key] === undefined || apiPayload[key] === null) {
          // We need to be careful not to remove required fields if they happen to be null,
          // although based on validation, required fields like price/stock shouldn't be null here.
          // Let's assume for optional fields like dimensions, optional prices, barcode, description,
          // null means "not provided" and should be omitted.
          const requiredFields = ['slug', 'price', 'stock', 'status']; // Define potentially required fields
          if (!requiredFields.includes(key)) {
             delete apiPayload[key];
          }
        }
      });

      // Call API to update variant
    const response=  await onSubmitUpdate(apiPayload);

      // After successful update, update the local variant state
      if (selectedVariant && selectedVariantIndex >= 0) {
        // Create a copy of the variants array
        const updatedVariants = variants.map((variant, index) => {
          if (index === selectedVariantIndex) {
            // Update the selected variant
            return {
              ...variant,
              price: data.price || null,
              stock: data.stock || null,
              status: data.status === 'active' ? 'Active' : 'Inactive',
              depositPrice: data.depositPrice || null,
              purchasePrice: data.purchasePrice || null,
              lowStockThreshold: data.lowStockThreshold || null,
              weight: data.weight || null,
              length: data.length || null,
              width: data.width || null,
              height: data.height || null,
              barcode: data.barcode || null,
              description: data.description || null
            };
          }
          return variant;
        });

        // Update variants state
        setVariants(updatedVariants);

        // Update form fields with the new values
        const getFieldValue = (value: any) => {
          if (value === null || value === undefined || value === '') {
            return '';  // Return empty string for null/undefined/empty values
          }
          return value.toString();  // Convert numbers to strings
        };

        // Set form values with updated data
        setEditValue('slug', getFieldValue(data.slug));
        setEditValue('price', data.price || '');
        setEditValue('stock', data.stock || '');
        setEditValue('status', data.status);
        setEditValue('depositPrice', data.depositPrice || '');
        setEditValue('purchasePrice', data.purchasePrice || '');
        setEditValue('lowStockThreshold', data.lowStockThreshold || '');
        setEditValue('stockStatus', data.stock > 0 ? 'In Stock' : 'Out of Stock');
        setEditValue('weight', data.weight || '');
        setEditValue('length', data.length || '');
        setEditValue('width', data.width || '');
        setEditValue('height', data.height || '');
        setEditValue('barcode', getFieldValue(data.barcode));
        setEditValue('description', getFieldValue(data.description));
      }
      if(response){
        showSnackbar("Variant updated successfully", "success");
      }
    } catch (error) {
      console.error("Error updating variant:", error);
      showSnackbar(error.message || "Failed to update variant", "error");
    }
  };

  // Add wrapper for create submit to clean data before passing to parent onSubmitCreate
  const handleCreateSubmitWrapper = async (data: VariantFormData) => {
    try {
      // Base payload with required fields
      const apiPayload: Record<string, any> = {
        // Required fields - always include these
        slug: data.slug,
        price: transformOptionalNumber(data.price),
        stock: transformOptionalNumber(data.stock),
        status: data.status,
      };

      // Optional fields - only add if they have values
      const optionalFields = {
        discount_price: transformOptionalNumber(data.depositPrice),
        purchase_price: transformOptionalNumber(data.purchasePrice),
        low_stock_threshold: transformOptionalNumber(data.lowStockThreshold),
        weight: transformOptionalNumber(data.weight),
        length: transformOptionalNumber(data.length),
        width: transformOptionalNumber(data.width),
        height: transformOptionalNumber(data.height),
        barcode: data.barcode?.trim() || undefined,
        description: data.description?.trim() || undefined
      };

      // Only add non-null/undefined optional fields to payload
      Object.entries(optionalFields).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          apiPayload[key] = value;
        }
      });

      console.log("[ManualVariantView] Cleaned data being passed to onSubmitCreate prop:", apiPayload);

      // Call the original submit handler from props with the cleaned data
      await onSubmitCreate(apiPayload);

    } catch (error) {
      console.error("[ManualVariantView] Error during create submission wrapper:", error);
      throw error;
    }
  };

  return (
    <div className="w-full">
      {/* Notification Card */}
      {/* {showNotification && (
        <Paper 
          elevation={3} 
          className="p-4 bg-white mb-6 relative"
          sx={{ 
            borderLeft: '4px solid #4CAF50',
            backgroundColor: '#F1F8E9'
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-green-600 font-medium mb-1">All combinations are completely added.</h3>
              <p className="text-gray-600">You have created all possible variant combinations for this product.</p>
            </div>
            <IconButton 
              size="small" 
              onClick={() => setShowNotification(false)}
              sx={{ padding: '4px' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
        </Paper>
      )} */}

      {/* New Variant Form - Only show if there are combinations remaining */}
      {!allCombinationsUsed ? (
        <Paper elevation={3} className="p-4 bg-white mb-6">
          <h2 className="text-xl font-bold mb-4">Manual Variant Management</h2>
          
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
                  const allTerms = attributeId ? attributeTerms[attributeId] || [] : [];
                  
                  // Simplified available terms logic (adjust if needed based on original logic)
                  const availableTerms = allTerms;
                  
                  return (
                    <div key={index} className="mb-3">
                      <label className="block text-sm text-green-700 font-medium mb-1">
                        {field.name || "Attribute"}
                      </label>
                      <select
                        value={field.value}
                        onChange={(e) => {
                          const newAttributeFields = [...attributeFields];
                          newAttributeFields[index].value = e.target.value;
                          setAttributeFields(newAttributeFields);
                          
                          if (pendingCombination && attributeId) {
                            const updatedCombination = {...pendingCombination};
                            const selectedTerm = allTerms.find(term => term.name === e.target.value);
                            
                            if (selectedTerm) {
                              updatedCombination[field.name] = {
                                term_id: selectedTerm.id,
                                attribute_id: attributeId,
                                value: selectedTerm.name
                              };
                              setPendingCombination(updatedCombination);
                              
                              // Update slug based on new combination
                              const newSlug = Object.entries(updatedCombination)
                                .filter(([_, val]) => typeof val === 'object' && val.value)
                                .map(([_, val]) => (val as any).value)
                                .join('-').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50);
                              setCreateValue("slug", newSlug);
                            }
                          }
                        }}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white appearance-none"
                      >
                        <option value="">Select {field.name}</option>
                        {availableTerms.map((term: any) => (
                          <option key={term.id} value={term.name}>
                            {term.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* --- CREATE NEW VARIANT FORM --- */}
          <form onSubmit={handleCreateSubmit(handleCreateSubmitWrapper)}>
            {/* --- Row 1: Price Fields --- */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <FormTextField name="price" control={createControl} label="Price" required type="number" placeholder="e.g., 19.99" />
              <FormTextField name="depositPrice" control={createControl} label="Deposit Price" type="number" />
              <FormTextField name="purchasePrice" control={createControl} label="Purchase Price" type="number" />
            </div>

            {/* --- Row 2: Stock, Low Stock, Slug --- */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <FormTextField name="stock" control={createControl} label="Stock" required type="number" />
              <FormTextField name="lowStockThreshold" control={createControl} label="Low Stock Threshold" type="number" />
              <FormTextField name="slug" control={createControl} label="Slug" required placeholder="e.g., fresh-mint-10mg" />
            </div>

            {/* --- Row 3: Status Fields (Kept original grid layout) --- */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Controller
                name="stockStatus"
                control={createControl}
                render={({ field, fieldState: { error } }) => (
                  <FormField label="Stock Status" required error={(error as FieldError)?.message}>
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
                control={createControl}
                render={({ field, fieldState: { error } }) => (
                  <FormField label="Status" required error={(error as FieldError)?.message}>
                    <select {...field} className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white h-10 appearance-none">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </FormField>
                )}
              />
            </div>

            {/* --- Dimensions & Weight (Unchanged) --- */}
            <div className="mb-4">
              <h3 className="font-semibold mb-3">Dimensions & Weight</h3>
              <div className="grid grid-cols-4 gap-4">
                <FormTextField name="weight" control={createControl} label="Weight" type="number" />
                <FormTextField name="length" control={createControl} label="Length" type="number" />
                <FormTextField name="width" control={createControl} label="Width" type="number" />
                <FormTextField name="height" control={createControl} label="Height" type="number" />
              </div>
            </div>

            {/* --- Barcode (Unchanged) --- */}
            <FormTextField name="barcode" control={createControl} label="Barcode" />

            {/* --- Description (Unchanged) --- */}
            <Controller
              name="description"
              control={createControl}
              render={({ field, fieldState: { error } }) => (
                <FormField label="Description" error={(error as FieldError)?.message}>
                  <textarea {...field} className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white" />
                </FormField>
              )}
            />

            {/* Image section for Create New Variant */} 
            <div className="mt-4">
              <h3 className="font-semibold mb-3">Image</h3>
              {pendingCreateImagePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {pendingCreateImagePreviews.map((previewUrl, idx) => (
                    <div key={idx} className="relative border rounded p-1">
                      <img src={previewUrl} alt={`Pending image ${idx + 1}`} className="w-full h-24 object-contain" />
                      <div className="absolute top-1 right-1">
                        <IconButton size="small" color="error" className="bg-white" onClick={() => {
                            const updatedImages = [...pendingCreateImages];
                            const updatedPreviews = [...pendingCreateImagePreviews];
                            URL.revokeObjectURL(updatedPreviews[idx]);
                            updatedImages.splice(idx, 1);
                            updatedPreviews.splice(idx, 1);
                            setPendingCreateImages(updatedImages);
                            setPendingCreateImagePreviews(updatedPreviews);
                          }}
                          disabled={isSubmitting}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div {...createGetRootProps()} className={`border rounded flex flex-col items-center justify-center py-8 bg-gray-50 ${createIsDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'} ${(imageUploading || isSubmitting) ? 'opacity-70 cursor-wait' : 'cursor-pointer'} mb-3`}>
                <input {...createGetInputProps()} disabled={isSubmitting || imageUploading} />
                {(isSubmitting || imageUploading) ? (
                  <FuseLoading className="mb-2" />
                ) : (
                  <>
                    <CloudUploadIcon className="text-gray-400 mb-2" />
                    <p className="text-center">{createIsDragActive ? "Drop files here" : "Upload Image"}</p>
                    <p className="text-xs text-gray-500">5MB max file size</p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 text-right">
              <AppButton label="Add" type="submit" disabled={!isCreateValid || isSubmitting || !pendingCombination} loading={isSubmitting} />
            </div>
          </form>
        </Paper>
      ) : (
        <>
        {showNotification && (
        <Paper 
          elevation={3} 
          className="p-4 bg-white mb-6 relative"
          sx={{ 
            borderLeft: '4px solid #4CAF50',
            backgroundColor: '#F1F8E9'
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-green-600 font-medium mb-1">All combinations are completely added.</h3>
              <p className="text-gray-600">You have created all possible variant combinations for this product.</p>
            </div>
            <IconButton 
              size="small" 
              onClick={() => setShowNotification(false)}
              sx={{ padding: '4px' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
        </Paper>
      )}
      </>
      )}
      
      {/* Existing Variants List & Edit Form */} 
      {variants.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mb-4">Created Variants</h3>
          {filteredVariants.length === 0 && (
            <div className="text-center py-8 border rounded bg-gray-50">
              <p className="text-gray-500">No variants match your search</p>
              <p className="mt-2 text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
          
          {filteredVariants.length > 0 && (
            <div className="flex gap-6">
              {/* Left side - Variant cards */} 
              <div className="w-1/2">
                <div>
                  {filteredVariants.map((variant) => {
                    const variantIndex = variants.findIndex(v => v.id === variant.id);
                    return (
                      <div
                        key={variant.id}
                        data-variant-id={variant.id}
                        className={`border border-gray-200 overflow-hidden cursor-pointer bg-white mb-2 ${
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
                                    {variant.stock}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 border border-[#005B2F] rounded-md bg-green-50 px-2.5 py-1">
                                  <span className="text-[#14854E] text-sm font-medium">Price:</span>
                                  <div className="bg-[#14854E] px-1.5 py-0.5 rounded-sm text-white text-sm font-semibold price-value">
                                    ${variant.price}
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
                            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setVariantToDeleteId(variant.id); setIsDeleteDialogOpen(true); }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Right side - Details form (EDIT) */} 
              {selectedVariant && (
                <div className="w-1/2">
                  <Paper elevation={3} className="p-4 bg-white">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-bold">Variant Details</h2>
                      <AppButton 
                        label="Save" 
                        onClick={handleEditSubmit(handleUpdateSubmit)}
                        disabled={isSubmitting || !editFormState.isDirty || !editFormState.isValid}
                        loading={isSubmitting}
                      />
                    </div>
                    
                    {/* EDIT FORM FIELDS */} 
                    <div className="grid grid-cols-2 gap-4 mb-4">
                       <FormTextField name="slug" control={editControl} label="Slug" required />
                       <FormTextField name="price" control={editControl} label="Price" required type="number" inputProps={{ step: "0.01" }}/>
                       
                       {/* Use FormTextField for consistency */}
                       <FormTextField 
                           name="depositPrice"
                           control={editControl} 
                           label="Deposit Price" 
                           type="number" 
                           inputProps={{ step: "0.01" }}
                       />

                       {/* Use FormTextField for consistency */}
                       <FormTextField 
                           name="purchasePrice"
                           control={editControl} 
                           label="Purchase Price" 
                           type="number" 
                           inputProps={{ step: "0.01" }}
                       />

                       {/* Use FormTextField for consistency */}
                       <FormTextField 
                           name="stock"
                           control={editControl} 
                           label="Stock" 
                           required 
                           type="number" 
                           inputProps={{ step: "1" }} // Integer
                       />
                       
                       {/* Use FormTextField for consistency */}
                       <FormTextField 
                           name="lowStockThreshold"
                           control={editControl} 
                           label="Low Stock Threshold" 
                           type="number" 
                           inputProps={{ step: "1" }} // Integer
                       />

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
                    <div className="mb-4">
                       <h3 className="font-semibold mb-3">Dimensions & Weight</h3>
                       <div className="grid grid-cols-4 gap-4">
                           {/* Use FormTextField for consistency */}
                           <FormTextField 
                               name="weight" 
                               control={editControl} 
                               label="Weight" 
                               type="number"
                               inputProps={{ min: "1", step: "0.01" }}
                           />

                           {/* Use FormTextField for consistency */}
                           <FormTextField 
                               name="length" 
                               control={editControl} 
                               label="Length" 
                               type="number"
                               inputProps={{ min: "1", step: "0.01" }}
                           />

                           {/* Use FormTextField for consistency */}
                           <FormTextField 
                               name="width" 
                               control={editControl} 
                               label="Width" 
                               type="number"
                               inputProps={{ min: "1", step: "0.01" }}
                           />

                           {/* Use FormTextField for consistency */}
                           <FormTextField 
                               name="height" 
                               control={editControl} 
                               label="Height" 
                               type="number"
                               inputProps={{ min: "1", step: "0.01" }}
                           />
                       </div>
                    </div>
                    <FormTextField name="barcode" control={editControl} label="Barcode" />
                    <Controller name="description" control={editControl} render={({ field, fieldState: { error } }) => (
                       <FormField label="Description" error={(error as FieldError)?.message}>
                           <textarea {...field} className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white" />
                       </FormField>
                    )}/>
                    
                    {/* Edit Image Section */} 
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
                                  onClick={async (e) => { // Make onClick async
                                    e.stopPropagation(); 
                                    try {
                                      // Call the prop function to delete via API and wait for it
                                      await handleDeleteImage(image.id);
                                
                                      // Manually update the local state to reflect the deletion immediately
                                      if (selectedVariantIndex !== -1) {
                                        const updatedVariants = [...variants]; // Create a mutable copy
                                        const currentVariant = updatedVariants[selectedVariantIndex];
                                        if (currentVariant && currentVariant.images) {
                                          // Filter out the deleted image
                                          currentVariant.images = currentVariant.images.filter((img: VariantImage) => img.id !== image.id);
                                          
                                          // If the deleted image was primary, set the first remaining image as primary
                                          const wasPrimary = image.is_primary;
                                          const hasImagesRemaining = currentVariant.images.length > 0;
                                          const noPrimaryRemaining = !currentVariant.images.some((img: VariantImage) => img.is_primary);

                                          if (wasPrimary && hasImagesRemaining && noPrimaryRemaining) {
                                            currentVariant.images[0].is_primary = true;
                                            // Optional: If the parent needs to know about the primary change immediately,
                                            // you might need to call handleSetPrimaryImage(currentVariant.images[0].id) here,
                                            // but be cautious of potential infinite loops or redundant calls.
                                          }

                                          setVariants(updatedVariants); // Update the state
                                        }
                                      }
                                      // Assuming handleDeleteImage shows its own snackbar on success/failure
                                    } catch (error) {
                                      console.error("Error processing image deletion in UI:", error);
                                      showSnackbar("Failed to update image display after deletion", "error");
                                    }
                                  }}
                                  disabled={isSubmitting || imageUploading} // Keep disabled logic
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </div>
                              <div className="mt-1 flex justify-center">
                                <input type="radio" name={`primary-edit-${selectedVariantIndex}`} checked={image.is_primary} onChange={() => handleSetPrimaryImage(image.id)} disabled={imageUploading || isSubmitting} />
                                <span className="text-xs ml-1">Primary</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div {...editGetRootProps()} className={`border rounded flex flex-col items-center justify-center py-8 bg-gray-50 ${editIsDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'} ${imageUploading ? 'opacity-70 cursor-wait' : 'cursor-pointer'} mb-3`}>
                        <input {...editGetInputProps()} disabled={imageUploading || isSubmitting} />
                        {(imageUploading) ? (
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
        </>
      )}
    </div>
  );
};

export default ManualVariantView; 