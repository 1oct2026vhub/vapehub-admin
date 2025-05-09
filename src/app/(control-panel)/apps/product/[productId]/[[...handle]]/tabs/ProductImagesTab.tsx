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
  id: number | string;
  url: string;
  is_primary: boolean;
  isUploading?: boolean;
  validationError?: string;
  isTemp?: boolean;
  file?: File;
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

// Update form context with the correctly mapped data
function getFormattedProductImages(images: ProductImage[]) {
  return images
    .filter(img => !img.isTemp)
    .map(img => ({
      id: Number(img.id),
      url: img.url,
      is_primary: img.is_primary
    }));
}

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
  const productId = formData.productId || (searchParams ? searchParams.get("productId") : null);

  // Fetch product data including images
  const fetchProductData = useCallback(async () => {
    // Skip if no productId
    if (!productId) {
      setIsLoading(false);
      return;
    }

    // Skip if we've already fetched data for this product ID and not explicitly forced to refetch
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
            const firstImageId = updatedImages[0].id; // Get the ID
            if (productId) {
              const numericProductId = Number(productId); 
              if (!isNaN(numericProductId) && typeof firstImageId === 'number') { // Check both ID types
                 await updatePrimaryImage(numericProductId, firstImageId); // Pass numeric IDs
              } else {
                 console.error("Invalid Product ID or Image ID for setting default primary image.", {productId, firstImageId});
              }
            } else {
              console.error("Product ID is missing, cannot set default primary image.");
            }
          } catch (error) {
            console.error("Error setting default primary image:", error);
          }
        }

        // Update the form data with the images information
        updateFormData({
          productId: Number(productId),
          productImages: getFormattedProductImages(updatedImages),
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
    if (productId) {
      fetchProductData();
    }
  }, [productId]); // Only depend on productId, not fetchProductData

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
  const uploadFiles = async (filesToUpload: NewFile[], fileStartIndex: number): Promise<boolean> => {
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

    // Mark files as uploading in UI
    setUploadedImages(prev => prev.map(img => {
      if (img.isTemp && img.file) {
        const matchingNewFile = filesToUpload.find(f => f.file === img.file);
        if (matchingNewFile && !img.validationError) {
          return { ...img, isUploading: true };
        }
      }
      return img;
    }));

    try {
      console.log(`Uploading ${filesToUpload.length} files in one API call`);
      
      // Call the upload API just once with all files
      const response = await uploadProductImages(
        Number(productId),
        filesToUpload.map(f => f.file)
      );

      console.log("Upload API response:", response);

      // Check for different possible response formats and handle accordingly
      if (!response?.data?.images && !response?.images) {
        console.error("Unexpected API response format:", response);
        throw new Error("Unexpected API response format");
      }

      // Get uploaded images from response
      const uploadedImagesData = response.data?.images || response.images || [];
      
      if (uploadedImagesData.length === 0) {
        throw new Error("No images were returned from the upload");
      }

      // Remove temp images that were just uploaded
      setUploadedImages(prev => {
        const updatedImages = prev.filter(img => {
          // Keep if not a temp image or has validation error
          if (!img.isTemp || img.validationError) return true;
          
          // Remove temp images that were just uploaded
          return !filesToUpload.some(f => f.file === img.file);
        });
        
        return updatedImages;
      });

      // Find if any of the files should be primary
      const primaryFile = filesToUpload.find(file => file.is_primary);
      let primaryImageId = null;
      
      if (primaryFile && uploadedImagesData.length > 0) {
        try {
          // Get the index of the primary file
          const primaryIndex = filesToUpload.indexOf(primaryFile);
          if (primaryIndex >= 0 && primaryIndex < uploadedImagesData.length) {
            primaryImageId = uploadedImagesData[primaryIndex].id;
            
            // Set this new image as primary
            if (productId) { 
              const numericProductId = Number(productId); // Convert here
              // Check primaryImageId as well
              if (!isNaN(numericProductId) && primaryImageId != null && typeof primaryImageId === 'number') { 
                 await updatePrimaryImage(numericProductId, primaryImageId);
              } else {
                 console.error("Invalid Product ID or Primary Image ID for setting primary image.", { numericProductId, primaryImageId });
              }
            } else {
              console.error("Product ID is missing, cannot set primary image.");
              // Optionally show a snackbar error here
            }
          }
        } catch (error) {
          console.error("Error setting primary image:", error);
        }
      }

      // After uploads are complete, manually fetch the updated data once
      const updatedResponse = await getProduct(Number(productId));
      if (updatedResponse?.data?.ProductImages) {
        const mappedImages = updatedResponse.data.ProductImages.map(
          mapApiImageToProductImage
        );
        setUploadedImages(mappedImages);
        
        // Update form context
        updateFormData({
          productImages: getFormattedProductImages(mappedImages),
        });
      }
      
      showSnackbar("Images uploaded successfully", "success");
      
      // Reset the uploading flag
      isUploadingRef.current = false;
      return true;
    } catch (error) {
      console.error("Error uploading files:", error);
      
      // Mark uploads as failed
      setUploadedImages(prev => prev.map(img => {
        if (img.isTemp && img.file) {
          const matchingNewFile = filesToUpload.find(f => f.file === img.file);
          if (matchingNewFile) {
            return { 
              ...img, 
              isUploading: false, 
              validationError: "Failed to upload image" 
            };
          }
        }
        return img;
      }));
      
      showSnackbar("Failed to upload images", "error");
      
      // Reset the uploading flag even on error
      isUploadingRef.current = false;
      return false;
    }
  };

  // Handle file drop/selection
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
    const validFiles: NewFile[] = [];
    
    // Check if we should set first new file as primary
    const hasExistingPrimary = uploadedImages.some(img => img.is_primary) || 
                              files.some(file => file.is_primary);
    
    // Validate each file before adding
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const validationError = await validateFile(file);
      
      // Only set first valid file as primary if no other primary exists
      const shouldBePrimary = !hasExistingPrimary && i === 0 && 
                              newFiles.filter(f => !f.validationError).length === 0 && 
                              !validationError;
      
      const newFile = {
        file,
        is_primary: shouldBePrimary,
        isUploading: false,
        validationError: validationError || undefined
      };
      
      newFiles.push(newFile);
      
      // Add valid files to a separate array for upload
      if (!validationError) {
        validFiles.push(newFile);
      }
    }
    
    if (newFiles.length > 0) {
      console.log(`Adding ${newFiles.length} images to preview`);
      
      // Add new files to uploadedImages with temporary IDs
      const tempFiles = newFiles.map((newFile, index) => {
        const tempId = `temp-${Date.now()}-${index}`;
        const tempUrl = URL.createObjectURL(newFile.file);
        
        return {
          id: tempId,
          url: tempUrl,
          is_primary: newFile.is_primary,
          isUploading: !newFile.validationError,
          validationError: newFile.validationError,
          isTemp: true,
          file: newFile.file
        };
      });
      
      // Add temp files to uploaded images
      setUploadedImages(prev => [...prev, ...tempFiles]);
      
      // Store new files in state so we can reference them later
      setFiles(prev => [...prev, ...newFiles]);
      
      // Upload all valid files together
      if (validFiles.length > 0 && !isUploadingRef.current) {
        setTimeout(() => {
          uploadFiles(validFiles, files.length);
        }, 10);
      }
    }
  }, [files, uploadedImages, productId, showSnackbar]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
  });

  // Handle primary image selection
  const handlePrimaryImageChange = async (imageId: number | string) => {
    if (!productId) {
      showSnackbar("Product ID is required", "error");
      return;
    }

    // Check if this is a temporary image
    const isTemp = typeof imageId === 'string' && imageId.startsWith('temp-');
    
    // Don't allow setting temporary images with errors as primary
    if (isTemp) {
      const tempImage = uploadedImages.find(img => img.id === imageId);
      if (tempImage?.validationError) {
        showSnackbar("Cannot set an invalid image as primary", "error");
        return;
      }
      
      // Update UI for temp images
      setUploadedImages(prev => prev.map(img => ({
        ...img,
        is_primary: img.id === imageId
      })));
      
      return;
    }

    try {
      // Update UI optimistically
      setUploadedImages(prev => prev.map(img => ({
        ...img,
        is_primary: img.id === imageId
      })));

      // Update primary image on server only for non-temp images
      if (!isTemp) {
        const numericProductId = Number(productId);
        if (!isNaN(numericProductId)) {
          await updatePrimaryImage(numericProductId, imageId as number);
        } else {
          console.error("Product ID is not a valid number:", productId);
        }
      }
      
      // Update form context directly without triggering another fetch
      const updatedImages = uploadedImages.map(img => ({
        ...img,
        is_primary: img.id === imageId
      }));
      
      updateFormData({
        productImages: getFormattedProductImages(updatedImages),
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

  // Handle deleting an image
  const handleDeleteImage = async (imageId: number | string) => {
    if (!productId) {
      showSnackbar("Product ID is required", "error");
      return;
    }

    // Check if this is a temporary image
    const isTemp = typeof imageId === 'string' && imageId.startsWith('temp-');

    try {
      if (isTemp) {
        // For temporary images, just remove from UI
        setUploadedImages(prev => prev.filter(img => img.id !== imageId));
        
        // Also revoke the object URL to prevent memory leaks
        const tempImage = uploadedImages.find(img => img.id === imageId);
        if (tempImage?.url) {
          URL.revokeObjectURL(tempImage.url);
        }
      } else {
        // Call the delete API for server images
        await deleteProductImage(Number(productId), imageId as number);
        
        // Check if deleted image was primary
        const deletedImage = uploadedImages.find(img => img.id === imageId);
        const wasPrimary = deletedImage?.is_primary;
        
        // Update local state
        const updatedImages = uploadedImages.filter(img => img.id !== imageId);
        setUploadedImages(updatedImages);
        
        // Update form context
        updateFormData({
          productImages: getFormattedProductImages(updatedImages),
        });
        
        // If we deleted the primary image, set a new one
        if (wasPrimary && updatedImages.length > 0) {
          const nonTempImages = updatedImages.filter(img => !img.isTemp);
          if (nonTempImages.length > 0) {
            const newPrimaryId = nonTempImages[0].id;
            const numericProductId = Number(productId);
            if (!isNaN(numericProductId)) {
              await updatePrimaryImage(numericProductId, newPrimaryId as number);
            } else {
              console.error("Product ID is not a valid number:", productId);
            }
            
            // Update local state to reflect new primary
            setUploadedImages(prev => prev.map(img => ({
              ...img,
              is_primary: img.id === newPrimaryId
            })));
          }
        }
      }

      showSnackbar("Image deleted successfully", "success");
    } catch (error) {
      showSnackbar(error.message || "Failed to delete image", "error");
    }
  };

  // Handle navigation to next step
  const handleNext = () => {
    // Check if any images are still uploading
    const stillUploading = uploadedImages.some(img => img.isUploading);
    if (stillUploading) {
      showSnackbar("Please wait for all uploads to complete", "warning");
      return;
    }

    // Check if any images have validation errors
    const hasErrors = uploadedImages.some(img => img.validationError);
    if (hasErrors) {
      showSnackbar("Please fix validation errors before continuing", "error");
      return;
    }

    // If no valid images at all, show error
    if (uploadedImages.filter(img => !img.isTemp).length === 0) {
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

          {/* Display all images in a single section */}
          {uploadedImages.length > 0 && (
            <div className="mt-6">
              <Typography variant="subtitle1" className="mb-2">
                Product Images
              </Typography>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {uploadedImages.map((image) => (
                  <div key={`image-${image.id}`} className="flex flex-col items-center">
                    <div 
                      className={`relative group border ${
                        image.validationError ? 'border-red-300' : 'border-gray-200'
                      } rounded overflow-hidden w-[150px] h-[150px] mx-auto`}
                    >
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
                              color="success"
                              disabled={image.is_primary || image.isUploading || !!image.validationError}
                              size="small"
                              sx={{ 
                                color: '#2E9970',
                                '&.Mui-checked': {
                                  color: '#2E9970',
                                },
                              }}
                            />
                          }
                          label={<Typography variant="caption">Primary</Typography>}
                        />
                      </div>
                      <IconButton
                        className="absolute top-1 right-1 bg-white hover:bg-red-50 shadow-sm"
                        size="small"
                        onClick={() => handleDeleteImage(image.id)}
                        disabled={image.isUploading}
                      >
                        <DeleteIcon sx={{ color: "red", fontSize: "1rem" }} />
                      </IconButton>
                      
                      {/* Show loading indicator */}
                      {image.isUploading && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <CircularProgress size={20} sx={{ color: 'white' }} />
                        </div>
                      )}
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
            </div>
          )}

          <div className="flex justify-between mt-6">
            <AppButton
              label="Previous"
              onClick={previousStep}
              variant="outlined"
              disabled={uploadedImages.some(img => img.isUploading)}
              className="bg-[#2E9970] text-white hover:bg-[#1E7A56] px-6"
            />
            <AppButton
              label={uploadedImages.some(img => img.isUploading) ? "Uploading..." : "Next"}
              onClick={handleNext}
              loading={uploadedImages.some(img => img.isUploading)}
              disabled={
                uploadedImages.some(img => img.isUploading) || 
                uploadedImages.some(img => img.validationError) || 
                uploadedImages.filter(img => !img.isTemp).length === 0
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