import React from 'react';
import { Control, Controller, UseFormHandleSubmit, FieldErrors, SubmitHandler } from 'react-hook-form';
import { Paper, Select, MenuItem, FormControl, InputLabel, FormHelperText, Typography } from '@mui/material';
import { DropzoneRootProps, DropzoneInputProps } from 'react-dropzone';
import AppButton from '@/components/Shared/AppButton';
import FormTextField from '@/components/Shared/FormTextField';
import FuseLoading from '@fuse/core/FuseLoading';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { Add as AddIcon } from "@mui/icons-material";

// Assuming these types might be moved or refined
export interface VariantImage {
  id: number;
  image_url: string;
  is_primary: boolean;
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
  regular_price: number;
  stock: number;
  status: 'active' | 'inactive';
  stockStatus: 'In Stock' | 'Out of Stock' | 'Back Order';
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
  isSaveDisabled: boolean; 

  // Image handling props
  imageGetRootProps: (props?: any) => DropzoneRootProps;
  imageGetInputProps: (props?: any) => DropzoneInputProps;
  isImageDragActive: boolean;
  isImageUploading: boolean; 
  onSetPrimaryImage: (imageId: number) => void;
  onDeleteImage: (imageId: number) => void;
}

const VariantDetailsForm: React.FC<VariantDetailsFormProps> = ({
  control,
  handleSubmit,
  onSubmit,
  selectedVariant,
  isSaving,
  isSaveDisabled,
  imageGetRootProps,
  imageGetInputProps,
  isImageDragActive,
  isImageUploading,
  onSetPrimaryImage,
  onDeleteImage,
}) => {

  
  return (
    <Paper elevation={3} className="p-4 bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Variant Details</h2>
        <AppButton 
          label="Save" 
          onClick={handleSubmit(onSubmit)} // RHF handleSubmit wraps your onSubmit
          disabled={isSaveDisabled || isSaving}
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
                <MenuItem value="Back Order">Back Order</MenuItem>
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
        <FormTextField name="slug" control={control} label="Slug" required />
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
      <Controller
        name="description"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <FormField label="Description" error={error?.message}>
            <textarea 
              {...field} 
              value={field.value ?? ''}
              className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
            />
          </FormField>
        )}
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
                    alt={`Variant ${selectedVariant.id}`}
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
    </Paper>
  );
};

export default VariantDetailsForm; 