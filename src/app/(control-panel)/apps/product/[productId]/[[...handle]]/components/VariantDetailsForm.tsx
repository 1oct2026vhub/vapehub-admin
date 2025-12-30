import React, { useState } from 'react';
import { Control, Controller, UseFormHandleSubmit, FieldErrors, SubmitHandler, UseFormGetValues, UseFormSetValue } from 'react-hook-form';
import { Paper, Select, MenuItem, FormControl, InputLabel, FormHelperText, Typography, Button as MuiButton, Box as MuiBox, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import { DropzoneRootProps, DropzoneInputProps } from 'react-dropzone';
import AppButton from '@/components/Shared/AppButton';
import FormTextField from '@/components/Shared/FormTextField';
import FormCKEditor from '@/components/Shared/FormCKEditor';
import FuseLoading from '@fuse/core/FuseLoading';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import { Add as AddIcon } from "@mui/icons-material";
import { updateVariantImageAltText } from '@/services/apiProduct';

// Assuming these types might be moved or refined
export interface VariantImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  alt_text?: string;
  validationError?: string;
}
// Define constants for validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_IMAGE_WIDTH = 280;
const MIN_IMAGE_HEIGHT = 280;
const ACCEPTED_FILE_TYPES = ["image/png", "image/jpg", "image/jpeg", "image/webp"];


// --- Add validation helper function ---
// Helper function to validate image dimensions
export const validateImageDimensions = (file: File): Promise<{ valid: boolean; dimensions?: { width: number; height: number } }> => {
  return new Promise((resolve) => {
    if (!file || !(file instanceof File)) {
      resolve({ valid: true }); // Let other validations catch it or consider as an error.
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
      // If image can't be loaded, dimensions can't be checked. Treat as invalid for dimension check.
      resolve({ valid: false }); 
    };
    img.src = URL.createObjectURL(file);
  });
};

// Validate file size, type and dimensions
export const validateFile = async (file: File): Promise<string | null> => {
  if (!file) return "File is required";
  
  // Check file type
  if (!ACCEPTED_FILE_TYPES.includes(file.type.toLowerCase())) {
    return "Only .jpg, .jpeg, .png, and .webp formats are supported";
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return "File size must be less than 5MB";
  }
  
  // Check dimensions
  const dimensionResult = await validateImageDimensions(file);
  if (!dimensionResult.valid) {
    if (dimensionResult.dimensions) {
        return `Image dimensions must be at least ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}px. Found: ${dimensionResult.dimensions.width}x${dimensionResult.dimensions.height}px.`;
    }
    return `Image dimensions must be at least ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}px. Could not verify dimensions.`;
  }
  
  return null;
};
// --- End add validation helper function ---

export interface VariantFormData {
  slug: string;
  sku?: string;
  regular_price: number;
  stock: number;
  status: 'active' | 'inactive';
  stockStatus: 'In Stock' | 'Out of Stock';
  depositPrice?: number | null;
  purchasePrice?: number | null;
  lowStockThreshold?: number | null;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  barcode?: string | null;
  description?: string | null;
  // Note: Images are handled separately via props, not as a direct form field in RHF for this component
}

// This is the data structure the form expects for the selected variant to display its images
interface SelectedVariantForForm {
  id: number; // Or string, depending on your actual ID type
  slug?: string; // For alt text
  variantImages?: VariantImage[]; 
}

interface FormFieldProps {
    label: string;
    error?: string;
    children: React.ReactNode;
    required?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ label, error, children, required }) => (
    <div className="mb-4">
        <label className="text-sm text-green-700 mb-1 font-medium block">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
);

interface VariantDetailsFormProps {
  control: Control<VariantFormData>;
  handleSubmit: UseFormHandleSubmit<VariantFormData>;
  onSubmit: SubmitHandler<VariantFormData>; // The actual save/update function logic passed from parent
  selectedVariant: SelectedVariantForForm | null; 
  isSaving: boolean; 
  isSaveDisabled?: boolean; // Made optional since it's no longer used
  getValues?: UseFormGetValues<VariantFormData>;
  setValue?: UseFormSetValue<VariantFormData>;
  showSnackbar?: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
  productSlug?: string; // Product slug for "Same as slug" button
  productId?: string | number; // Product ID for alt_text API calls
  variantId?: string | number; // Variant ID for alt_text API calls

  // Image handling props
  imageGetRootProps: (props?: any) => DropzoneRootProps;
  imageGetInputProps: (props?: any) => DropzoneInputProps;
  isImageDragActive: boolean;
  isImageUploading: boolean; 
  onSetPrimaryImage: (imageId: number) => void;
  onDeleteImage: (imageId: number) => void;
  onUpdateImageAltText?: (imageId: number, altText: string) => void; // Optional callback for parent to handle alt_text updates
}

const VariantDetailsForm: React.FC<VariantDetailsFormProps> = ({
  control,
  handleSubmit,
  onSubmit,
  selectedVariant,
  isSaving,
  getValues,
  setValue,
  showSnackbar,
  productSlug,
  productId,
  variantId,
  imageGetRootProps,
  imageGetInputProps,
  isImageDragActive,
  isImageUploading,
  onSetPrimaryImage,
  onDeleteImage,
  onUpdateImageAltText,
}) => {
  // State for alt_text edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<VariantImage | null>(null);
  const [editAltText, setEditAltText] = useState<string>('');
  const [isUpdatingAltText, setIsUpdatingAltText] = useState(false);

  // Handle opening edit alt_text dialog
  const handleEditAltText = (image: VariantImage) => {
    const defaultAltText = image.alt_text || selectedVariant?.slug || '';
    setEditingImage(image);
    setEditAltText(defaultAltText);
    setEditDialogOpen(true);
  };

  // Handle closing edit dialog
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingImage(null);
    setEditAltText('');
  };

  // Handle updating alt_text
  const handleUpdateAltText = async () => {
    if (!editingImage || !productId || !variantId) {
      return;
    }

    setIsUpdatingAltText(true);
    try {
      // Update on server
      await updateVariantImageAltText(productId, variantId, editingImage.id, { 
        alt_text: editAltText 
      });

      // If parent provided callback, use it; otherwise just show success
      if (onUpdateImageAltText) {
        onUpdateImageAltText(editingImage.id, editAltText);
      }

      if (showSnackbar) {
        showSnackbar("Alt text updated successfully", "success");
      }
      handleCloseEditDialog();
    } catch (error: any) {
      console.error("Error updating alt_text:", error);
      if (showSnackbar) {
        showSnackbar(error?.message || "Failed to update alt text", "error");
      }
    } finally {
      setIsUpdatingAltText(false);
    }
  };

  
  return (
    <Paper elevation={3} className="p-4 bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Variant Details</h2>
        <AppButton 
          label="Save" 
          onClick={handleSubmit(onSubmit)} // RHF handleSubmit wraps your onSubmit
          disabled={isSaving}
          loading={isSaving}
        />
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Controller
          name="stockStatus"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <FormField label="Stock Status" required error={error?.message}>
              <Select {...field} className="w-full rounded-lg p-0 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white h-10 appearance-none text-sm pl-3" displayEmpty>
                <MenuItem value="In Stock">In Stock</MenuItem>
                <MenuItem value="Out of Stock">Out of Stock</MenuItem>
              </Select>
            </FormField>
          )}
        />
        <Controller
          name="status"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <FormField label="Status" required error={error?.message}>
              <Select {...field} className="w-full rounded-lg p-0 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white h-10 appearance-none text-sm pl-3" displayEmpty>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormField>
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <FormTextField name="regular_price" control={control} label="Regular Price" required type="number" inputProps={{ step: "0.01" }} />
        <FormTextField name="depositPrice" control={control} label="Sale Price" type="number" inputProps={{ step: "0.01" }} />
        <FormTextField name="purchasePrice" control={control} label="Purchase Price" type="number" inputProps={{ step: "0.01" }} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <FormTextField name="stock" control={control} label="Stock" required type="number" inputProps={{ step: "1" }} />
        <FormTextField name="lowStockThreshold" control={control} label="Low Stock Threshold" type="number" inputProps={{ step: "1" }} />
        {/* <FormTextField name="slug" control={control} label="Slug" required /> */}
      </div>

      <div className="mb-4">
        <MuiBox sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <MuiBox sx={{ flex: 1 }}>
            <FormTextField
              name="sku"
              control={control}
              label="SKU"
              type="text"
            />
          </MuiBox>
          {getValues && setValue && (
            <MuiButton 
              variant="outlined" 
              onClick={() => {
                const productSlugValue = productSlug || "";
                if (productSlugValue) {
                  // Use the exact product slug value without any transformation
                  setValue("sku", productSlugValue, { shouldValidate: true });
                  if (showSnackbar) {
                    showSnackbar("SKU filled with product slug value", "success");
                  }
                } else {
                  if (showSnackbar) {
                    showSnackbar("Product slug not available", "warning");
                  }
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
          )}
        </MuiBox>
      </div>

      {/* Dimensions & Weight */}
      <div className="mb-4">
        <h3 className="font-semibold mb-3">Dimensions & Weight</h3>
        <div className="grid grid-cols-4 gap-4">
          <FormTextField name="weight" control={control} label="Weight" type="number" inputProps={{ min: "0", step: "0.01" }} />
          <FormTextField name="length" control={control} label="Length" type="number" inputProps={{ min: "0", step: "0.01" }} />
          <FormTextField name="width" control={control} label="Width" type="number" inputProps={{ min: "0", step: "0.01" }} />
          <FormTextField name="height" control={control} label="Height" type="number" inputProps={{ min: "0", step: "0.01" }} />
        </div>
      </div>

      {/* Barcode */}
      <FormTextField name="barcode" control={control} label="Barcode" />

      {/* Description */}
      <div className="mt-2">
        <FormCKEditor
          name="description"
          control={control}
          label="Description"
        />
      </div>

      {/* Image section */}
      {selectedVariant && (
        <div className="mt-4">
          <h3 className="font-semibold mb-3">Image</h3>
          {selectedVariant.variantImages && selectedVariant.variantImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {selectedVariant.variantImages.map((image) => (
                <div key={image.id} className="relative border rounded p-1">
                  <img 
                    src={image.image_url} 
                    alt={image.alt_text || selectedVariant?.slug || `Variant ${selectedVariant.id}`}
                    className="w-full h-24 object-contain" 
                  />
                  <div className="absolute top-1 right-1">
                    <IconButton 
                      size="small" 
                      color="error" 
                      className="bg-white"
                      onClick={() => onDeleteImage(image.id)}
                      disabled={isSaving || isImageUploading}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </div>
                  <div className="mt-1 flex justify-center">
                    <input 
                      type="radio" 
                      name={`variant-${selectedVariant.id}-primary-image`}
                      checked={image.is_primary} 
                      onChange={() => onSetPrimaryImage(image.id)}
                      disabled={isSaving || isImageUploading} 
                    />
                    <span className="text-xs ml-1">Primary</span>
                  </div>
                   {/* Show validation error message outside the border */}
                   {image.validationError && (
                      <div className="mt-1 text-red-500 text-xs font-medium max-w-[150px] text-center">
                        {image.validationError}
                      </div>
                    )}
                    {/* Alt Text Display with Edit Button */}
                    <MuiBox 
                      sx={{ 
                        mt: 1, 
                        width: '100%', 
                        maxWidth: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                        padding: '4px 8px',
                        borderRadius: '4px',
                      }}
                      onClick={() => handleEditAltText(image)}
                    >
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          flex: 1,
                          fontSize: '0.7rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'text.secondary',
                        }}
                        title={image.alt_text || selectedVariant?.slug || 'Click to edit alt text'}
                      >
                        {image.alt_text || selectedVariant?.slug || 'Click to edit alt text'}
                      </Typography>
                      <EditIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                    </MuiBox>
                </div>
              ))}
            </div>
          )}

          {/* Upload section */}
          <div  
            className={`border rounded flex flex-col items-center justify-center py-8 bg-gray-50 
              ${isImageDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'}
              ${(isImageUploading || isSaving) ? 'opacity-70 cursor-wait' : 'cursor-pointer'} mb-3`}
          >       
            {(isImageUploading) ? (
              <FuseLoading className="mb-2" />
            ) : (
              <>
                {/* <CloudUploadIcon className="text-gray-400 mb-2" />
                <p className="text-center">{isImageDragActive ? "Drop files here" : "Upload More Images"}</p>
                <p className="text-xs text-gray-500">5MB max file size</p> */}
                <Paper
            {...imageGetRootProps()} 
            className={`p-8 border-2 border-dashed ${
              isImageDragActive
                ? "border-primary-500 bg-primary-50"
                : "border-gray-300"
            } cursor-pointer text-center`}
          >
            <input {...imageGetInputProps()} />
            <div className="flex flex-col items-center justify-center">
              <div className="p-3 rounded-full mb-3">
                <AddIcon fontSize="large" className="text-gray-500" />
              </div>
              <Typography variant="body1" className="mb-2 font-medium">
                Click to upload or drag and drop
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Upload a product image (Min {MIN_IMAGE_WIDTH}x{MIN_IMAGE_HEIGHT}px, Max size: 5MB)
              </Typography>
              <Typography variant="body2" color="textSecondary" className="mt-1">
                Supported formats: PNG, JPG, JPEG, WebP
              </Typography>
            </div>
          </Paper>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Alt Text Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Alt Text</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Alt Text"
            fullWidth
            variant="outlined"
            value={editAltText}
            onChange={(e) => setEditAltText(e.target.value)}
            placeholder={selectedVariant?.slug || "Enter alt text"}
            helperText="Alt text helps with accessibility and SEO. If left empty, variant slug will be used."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={isUpdatingAltText}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateAltText} 
            variant="contained"
            disabled={isUpdatingAltText}
            sx={{ 
              bgcolor: '#2E9970',
              '&:hover': { bgcolor: '#1E7A56' }
            }}
          >
            {isUpdatingAltText ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default VariantDetailsForm; 