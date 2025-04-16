"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  uploadProductImages,
  getProduct,
  updatePrimaryImage,
  deleteProductImage,
} from "@/services/apiProduct";
import { useProductForm } from "../ProductFormContext";
import AppButton from "@/components/Shared/AppButton";
import {
  Paper,
  Typography,
  Checkbox,
  FormControlLabel,
  Box,
  IconButton,
  CircularProgress,
} from "@mui/material";
import BrokenImageIcon from "@mui/icons-material/BrokenImage";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import FuseLoading from "@fuse/core/FuseLoading";

// Define constants for validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_WIDTH = 245;
const MAX_IMAGE_HEIGHT = 234;
const ACCEPTED_FILE_TYPES = ["image/png", "image/jpg", "image/jpeg", "image/webp"];

interface ProductImage {
  id: number;
  url: string;
  is_primary: boolean;
}

interface NewFile {
  file: File;
  is_primary: boolean;
  isUploading: boolean;
  uploadError?: string;
  validationError?: string;
  uploadedImageId?: number;
}

// Map API response structure to our internal structure
const mapApiImageToProductImage = (apiImage: any): ProductImage => {
  return {
    id: apiImage.id,
    url: apiImage.image_url,
    is_primary: apiImage.is_primary,
  };
};

// Helper function to validate image dimensions
const validateImageDimensions = (file: File): Promise<{ valid: boolean; dimensions?: { width: number; height: number } }> => {
  return new Promise((resolve) => {
    if (!file || !(file instanceof File)) {
      resolve({ valid: true });
      return;
    }

    const img = document.createElement('img');
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

function ProductImagesTab() {
  const [files, setFiles] = useState<NewFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<ProductImage[]>([]);
  const { showSnackbar } = useSnackbar();
  const { formData, updateFormData, nextStep, previousStep } = useProductForm();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use refs to track fetch status
  const fetchedRef = useRef(false);
  const productIdRef = useRef<string | number | null>(null);
  // Track if we're already uploading to prevent multiple upload calls
  const isUploadingRef = useRef(false);
  
  // Get productId from URL or formData
  const productId = formData.productId || searchParams.get("productId");

  // Fetch product data including images
  const fetchProductData = useCallback(async () => {
    // Skip if no productId
    if (!productId) {
      setIsLoading(false);
      return;
    }

    // Skip if we've already fetched data for this product ID
    if (fetchedRef.current && productIdRef.current === productId) {
      setIsLoading(false);
      return;
    }

    // Update refs to track current fetch state
    productIdRef.current = productId;

    setIsLoading(true);
    try {
      const response = await getProduct(Number(productId));

      if (
        response?.data?.ProductImages &&
        response.data.ProductImages.length > 0
      ) {
        // Map API response to our internal structure
        const mappedImages = response.data.ProductImages.map(
          mapApiImageToProductImage
        );

        // Check if there's an existing primary image
        const hasExistingPrimary = mappedImages.some((img) => img.is_primary);

        // If no primary image exists, set the first one as primary
        const updatedImages = mappedImages.map((img, index) => ({
          ...img,
          is_primary: hasExistingPrimary ? img.is_primary : index === 0,
        }));

        setUploadedImages(updatedImages);

        // If we auto-selected the first image as primary, update it on the server
        if (!hasExistingPrimary && updatedImages.length > 0) {
          try {
            await updatePrimaryImage(Number(productId), updatedImages[0].id);
          } catch (error) {
            console.error("Error setting default primary image:", error);
          }
        }

        // Update the form data with the images information
        updateFormData({
          productId: Number(productId),
          productImages: updatedImages,
        });
      } else {
        setUploadedImages([]);
      }

      // Mark fetch as completed
      fetchedRef.current = true;
    } catch (error) {
      console.error("Error fetching product data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [productId, updateFormData]);

  // Fetch product data on component mount
  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  // Validate file size, type and dimensions
  const validateFile = async (file: File): Promise<string | null> => {
    if (!file) return "File is required";
    
    // Check file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return "Only .jpg, .jpeg, .png, and .webp formats are supported";
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 5MB";
    }
    
    // Check dimensions
    const dimensionResult = await validateImageDimensions(file);
    if (!dimensionResult.valid) {
      return `Image dimensions must not exceed ${MAX_IMAGE_WIDTH}×${MAX_IMAGE_HEIGHT} pixels`;
    }
    
    return null;
  };

  // Upload all valid files in a single API call
  const uploadFiles = async (filesToUpload: NewFile[], fileStartIndex: number) => {
    if (!productId) {
      showSnackbar("Please complete the basic info first", "error");
      return false;
    }
    
    // Check if already uploading - prevent concurrent uploads
    if (isUploadingRef.current) {
      console.log("Upload already in progress, skipping new upload");
      return false;
    }
    
    // Set uploading flag to true
    isUploadingRef.current = true;

    // Mark all files as uploading in UI
    setFiles(prev => prev.map((file, i) => {
      const index = i - fileStartIndex;
      if (index >= 0 && index < filesToUpload.length) {
        return { ...file, isUploading: true, uploadError: undefined };
      }
      return file;
    }));

    try {
      // Create form data for the API
      const formData = new FormData();
      formData.append("product_id", productId.toString());
      
      // Append all files to the form data
      filesToUpload.forEach(fileItem => {
        formData.append("images", fileItem.file);
      });

      console.log(`Uploading ${filesToUpload.length} files in one API call`);
      
      // Call the upload API just once with all files
      const response = await uploadProductImages(
        Number(productId),
        filesToUpload.map(f => f.file)
      );

      console.log("Upload API response:", response);

      if (!response?.data?.images || response.data.images.length === 0) {
        throw new Error("No images were returned from the upload");
      }

      // Process the response for each file
      const uploadedImages = response.data.images;
      
      // Update file state with uploaded information
      setFiles(prev => {
        const newState = [...prev];
        
        // Map uploaded IDs to the respective files
        for (let i = 0; i < Math.min(uploadedImages.length, filesToUpload.length); i++) {
          const fileIndex = fileStartIndex + i;
          if (fileIndex < newState.length) {
            newState[fileIndex] = {
              ...newState[fileIndex],
              isUploading: false,
              uploadedImageId: uploadedImages[i].id
            };
          }
        }
        
        return newState;
      });

      // Find if any of the files should be primary
      const primaryFile = filesToUpload.find(file => file.is_primary);
      if (primaryFile && uploadedImages.length > 0) {
        try {
          // Get the index of the primary file
          const primaryIndex = filesToUpload.indexOf(primaryFile);
          if (primaryIndex >= 0 && primaryIndex < uploadedImages.length) {
            // Remove primary status from any existing images
            setUploadedImages(prev => prev.map(img => ({
              ...img,
              is_primary: false
            })));
            
            // Set this new image as primary
            await updatePrimaryImage(Number(productId), uploadedImages[primaryIndex].id);
          }
        } catch (error) {
          console.error("Error setting primary image:", error);
        }
      }

      // Refresh uploaded images once
      fetchedRef.current = false;
      await fetchProductData();
      
      showSnackbar("Images uploaded successfully", "success");
      
      // Reset the uploading flag
      isUploadingRef.current = false;
      return true;
    } catch (error) {
      console.error("Error uploading files:", error);
      
      // Mark all files as having an error
      setFiles(prev => prev.map((file, i) => {
        const index = i - fileStartIndex;
        if (index >= 0 && index < filesToUpload.length) {
          return { 
            ...file, 
            isUploading: false, 
            uploadError: "Failed to upload image" 
          };
        }
        return file;
      }));
      
      showSnackbar("Failed to upload images", "error");
      
      // Reset the uploading flag even on error
      isUploadingRef.current = false;
      return false;
    }
  };

  // Handle file drop/selection - this is where automatic upload happens
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!productId) {
      showSnackbar("Please complete the basic info first", "error");
      return;
    }
    
    if (acceptedFiles.length === 0) return;
    
    // Check if already uploading
    if (isUploadingRef.current) {
      showSnackbar("Please wait for current upload to complete", "warning");
      return;
    }
    
    // Process all accepted files
    const newFiles: NewFile[] = [];
    
    // Check if we should set first new file as primary
    const hasExistingPrimary = uploadedImages.some(img => img.is_primary) || 
                              files.some(file => file.is_primary);
    
    // Validate each file before adding
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const validationError = await validateFile(file);
      
      // Add all files to the preview, even those with validation errors
      // Only set first valid file as primary if no other primary exists
      const shouldBePrimary = !hasExistingPrimary && i === 0 && 
                              newFiles.filter(f => !f.validationError).length === 0 && 
                              !validationError;
      
      newFiles.push({
        file,
        is_primary: shouldBePrimary,
        isUploading: false,
        validationError: validationError || undefined
      });
    }
    
    if (newFiles.length > 0) {
      console.log(`Adding ${newFiles.length} images to preview`);
      
      // Add new files to state first - do this only once
      setFiles(prev => {
        const updatedFiles = [...prev, ...newFiles];
        
        // Start upload sequence for valid files only
        const fileStartIndex = prev.length;
        const validNewFiles = newFiles.filter(file => !file.validationError);

        // Skip upload if all files have validation errors
        if (validNewFiles.length === 0) {
          return updatedFiles;
        }

        // Use a setTimeout to ensure the state is updated before uploading
        // Only start upload if we're not already uploading (double-check)
        if (!isUploadingRef.current) {
          setTimeout(() => {
            // Upload all valid files in a single call
            uploadFiles(validNewFiles, fileStartIndex);
          }, 10);
        }
        
        return updatedFiles;
      });
    }
  }, [files, uploadedImages, productId, showSnackbar]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
  });

  // Handle primary image selection for a newly added file
  const handleNewFilePrimaryChange = async (index: number) => {
    const fileToUpdate = files[index];
    
    // Don't allow setting primary if file has errors or is uploading
    if (fileToUpdate.validationError || fileToUpdate.uploadError || fileToUpdate.isUploading) {
      showSnackbar("Cannot set an invalid or uploading image as primary", "error");
      return;
    }
    
    // Update local state first
    setFiles(prev => prev.map((file, i) => ({
      ...file,
      is_primary: i === index
    })));
    
    // If the file is already uploaded, update primary status on server
    if (fileToUpdate.uploadedImageId) {
      try {
        // Clear primary status from existing uploaded images
        setUploadedImages(prev => prev.map(img => ({
          ...img,
          is_primary: false
        })));
        
        // Call API to update primary image
        await updatePrimaryImage(Number(productId), fileToUpdate.uploadedImageId);
        
        // Refresh data
        fetchedRef.current = false;
        await fetchProductData();
        
        showSnackbar("Primary image updated successfully", "success");
      } catch (error) {
        console.error("Error updating primary image:", error);
        showSnackbar("Failed to update primary image", "error");
      }
    }
  };

  // Handle primary image selection for an uploaded image
  const handlePrimaryImageChange = async (imageId: number) => {
    if (!productId) {
      showSnackbar("Product ID is required", "error");
      return;
    }

    try {
      // Update UI optimistically
      setUploadedImages(prev => prev.map(img => ({
        ...img,
        is_primary: img.id === imageId
      })));
      
      // Clear primary from new files
      setFiles(prev => prev.map(file => ({
        ...file,
        is_primary: false
      })));

      // Update primary image on server
      await updatePrimaryImage(Number(productId), imageId);
      
      // Update form context
      updateFormData({
        productImages: uploadedImages.map(img => ({
          ...img,
          is_primary: img.id === imageId
        })),
      });

      showSnackbar("Primary image updated successfully", "success");
    } catch (error) {
      console.error("Error updating primary image:", error);
      
      // Revert UI state on error
      const originalPrimary = uploadedImages.find(img => img.is_primary);
      setUploadedImages(prev => prev.map(img => ({
        ...img,
        is_primary: originalPrimary ? img.id === originalPrimary.id : false
      })));
      
      showSnackbar("Failed to update primary image", "error");
    }
  };

  // Handle deleting a new file
  const removeNewFile = (index: number) => {
    const fileToRemove = files[index];
    
    // If file is already uploaded, delete from server
    if (fileToRemove.uploadedImageId) {
      deleteProductImage(Number(productId), fileToRemove.uploadedImageId)
        .then(() => {
          // Refresh data after deletion
          fetchedRef.current = false;
          fetchProductData();
          showSnackbar("Image deleted successfully", "success");
        })
        .catch(error => {
          console.error("Error deleting image:", error);
          showSnackbar("Failed to delete image", "error");
        });
    }
    
    // Remove from local state
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle deleting an uploaded image
  const handleDeleteImage = async (imageId: number) => {
    if (!productId) {
      showSnackbar("Product ID is required", "error");
      return;
    }

    try {
      // Call the delete API
      await deleteProductImage(Number(productId), imageId);
      
      // Check if deleted image was primary
      const deletedImage = uploadedImages.find(img => img.id === imageId);
      const wasPrimary = deletedImage?.is_primary;
      
      // Update local state
      const updatedImages = uploadedImages.filter(img => img.id !== imageId);
      setUploadedImages(updatedImages);
      
      // Update form context
      updateFormData({
        productImages: updatedImages,
      });
      
      // If we deleted the primary image, set a new one
      if (wasPrimary && updatedImages.length > 0) {
        const newPrimaryId = updatedImages[0].id;
        await updatePrimaryImage(Number(productId), newPrimaryId);
        
        // Update local state to reflect new primary
        setUploadedImages(prev => prev.map((img, i) => ({
          ...img,
          is_primary: i === 0
        })));
      }

      showSnackbar("Image deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting image:", error);
      showSnackbar("Failed to delete image", "error");
    }
  };

  // Handle navigation to next step
  const handleNext = () => {
    // Check if any files are still uploading
    const stillUploading = files.some(file => file.isUploading);
    if (stillUploading) {
      showSnackbar("Please wait for all uploads to complete", "warning");
      return;
    }

    // Check if any files have validation errors
    const hasErrors = files.some(file => file.validationError || file.uploadError);
    if (hasErrors) {
      showSnackbar("Please fix validation errors before continuing", "error");
      return;
    }

    // If no images at all, show error
    if (uploadedImages.length === 0 && files.length === 0) {
      showSnackbar("Please upload at least one image", "error");
      return;
    }

    // Move to next step
    nextStep();
  };

  // Image component with fallback
  const ImageWithFallback = ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: any;
  }) => {
    const [error, setError] = useState(false);

    if (error) {
      return (
        <Box className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
          <BrokenImageIcon className="text-gray-400 text-2xl" />
        </Box>
      );
    }

    return (
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
        onError={() => setError(true)}
        {...props}
      />
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <div className="flex justify-center items-center p-10">
    <FuseLoading />       
   </div>
      ) : (
        <>
          <Paper
            {...getRootProps()}
            className={`p-8 border-2 border-dashed ${
              isDragActive
                ? "border-primary-500 bg-primary-50"
                : "border-gray-300"
            } cursor-pointer text-center`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center">
              <div className="p-3 rounded-full mb-3">
                <AddIcon fontSize="large" className="text-gray-500" />
              </div>
              <Typography variant="body1" className="mb-2 font-medium">
                Click to upload or drag and drop
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Upload a product image ({MAX_IMAGE_WIDTH} × {MAX_IMAGE_HEIGHT} px, Max size: 5MB)
              </Typography>
              <Typography variant="body2" color="textSecondary" className="mt-1">
                Supported formats: PNG, JPG, JPEG, WebP
              </Typography>
            </div>
          </Paper>

          {/* Display files with validation errors or currently uploading */}
          {files.length > 0 && (
            <div className="mt-6">
              <Typography variant="subtitle1" className="mb-2">
                New Image Preview:
              </Typography>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {files.map((file, index) => (
                  <div key={`new-${index}`} className="flex flex-col items-center">
                    <div 
                      className={`relative group border ${
                        file.validationError || file.uploadError 
                          ? 'border-red-300' 
                          : 'border-gray-200'
                      } rounded overflow-hidden w-[150px] h-[150px] mx-auto`}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageWithFallback
                          src={URL.createObjectURL(file.file)}
                          alt={`New image ${index + 1}`}
                        />
                      </div>
                      <div className="absolute top-1 left-1 bg-white/90 px-1 py-0.5 rounded">
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={file.is_primary}
                              onChange={() => handleNewFilePrimaryChange(index)}
                              color="primary"
                              disabled={
                                file.is_primary || 
                                file.isUploading || 
                                !!file.validationError || 
                                !!file.uploadError
                              }
                              size="small"
                            />
                          }
                          label={<Typography variant="caption">Primary</Typography>}
                        />
                      </div>
                      <IconButton
                        className="absolute top-1 right-1 bg-white hover:bg-red-50 shadow-sm"
                        size="small"
                        onClick={() => removeNewFile(index)}
                        disabled={file.isUploading}
                      >
                        <DeleteIcon sx={{ color: "red", fontSize: "1rem" }} />
                      </IconButton>
                      
                      {/* Show loading indicator */}
                      {file.isUploading && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <CircularProgress size={20} sx={{ color: 'white' }} />
                        </div>
                      )}
                    </div>
                    
                    {/* Show validation or upload error message outside the border */}
                    {(file.validationError || file.uploadError) && (
                      <div className="mt-1 text-red-500 text-xs font-medium max-w-[150px] text-center">
                        {file.validationError || file.uploadError}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Display uploaded images */}
          {uploadedImages.length > 0 && (
            <div className="mt-6">
              <Typography variant="subtitle1" className="mb-2">
                Uploaded Images
              </Typography>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {uploadedImages.map((image) => (
                  <div key={`uploaded-${image.id}`} className="mx-auto relative group border border-gray-200 rounded overflow-hidden w-[150px] h-[150px]">
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageWithFallback
                        src={image.url}
                        alt={`Product image ${image.id}`}
                      />
                    </div>
                    <div className="absolute top-1 left-1 bg-white/90 px-1 py-0.5 rounded">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={image.is_primary}
                            onChange={() => handlePrimaryImageChange(image.id)}
                            color="primary"
                            disabled={image.is_primary}
                            size="small"
                          />
                        }
                        label={<Typography variant="caption">Primary</Typography>}
                      />
                    </div>
                    <IconButton
                      className="absolute top-1 right-1 bg-white hover:bg-red-50 shadow-sm"
                      size="small"
                      onClick={() => handleDeleteImage(image.id)}
                    >
                      <DeleteIcon sx={{ color: "red", fontSize: "1rem" }} />
                    </IconButton>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <AppButton
              label="Previous"
              onClick={previousStep}
              variant="outlined"
              disabled={files.some(f => f.isUploading)}
              className="bg-[#2E9970] text-white hover:bg-[#1E7A56] px-6"
            />
            <AppButton
              label={files.some(f => f.isUploading) ? "Uploading..." : "Next"}
              onClick={handleNext}
              loading={files.some(f => f.isUploading)}
              disabled={
                files.some(f => f.isUploading) || 
                files.some(f => f.validationError || f.uploadError) || 
                (uploadedImages.length === 0 && files.filter(f => !f.validationError && !f.uploadError).length === 0)
              }
              className="bg-[#2E9970] text-white hover:bg-[#1E7A56] px-6"
            />
          </div>
        </>
      )}
    </div>
  );
}

export default ProductImagesTab; 