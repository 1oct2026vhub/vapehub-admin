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
  Grid,
  IconButton,
  CircularProgress,
} from "@mui/material";
import Image from "next/image";
import BrokenImageIcon from "@mui/icons-material/BrokenImage";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";

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
  validationError?: string;
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
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<ProductImage[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);
  const { showSnackbar } = useSnackbar();
  const { formData, updateFormData, nextStep, previousStep } = useProductForm();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use refs to track fetch status
  const fetchedRef = useRef(false);
  const productIdRef = useRef<string | number | null>(null);

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
      console.log("Fetching product data for ID:", productId);
      const response = await getProduct(Number(productId));
      console.log("Product data received:", response?.data);

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
            console.log("Default primary image set to:", updatedImages[0].id);
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
      // showSnackbar("Failed to load product data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  // Fetch product data on component mount
  useEffect(() => {
    fetchProductData();
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

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setFileError(null);
      
      if (acceptedFiles.length === 0) return;
      
      const newFiles: NewFile[] = [];
      let hasErrors = false;
      
      // Process all existing valid files to determine if we have any valid ones already
      const existingValidFiles = files.filter(f => !f.validationError);
      const existingValidCount = existingValidFiles.length;
      
      // Validate each file before adding
      for (const file of acceptedFiles) {
        const validationError = await validateFile(file);
        const isValid = !validationError;
        
        // Only set as primary if this is the first valid file overall
        const shouldBePrimary = isValid && 
                                existingValidCount === 0 && 
                                newFiles.filter(f => !f.validationError).length === 0 &&
                                uploadedImages.length === 0;
        
        newFiles.push({
          file,
          is_primary: shouldBePrimary,
          validationError: validationError || undefined,
        });
        
        if (validationError) {
          hasErrors = true;
          showSnackbar(validationError, "error");
        }
      }
      
      // Check if we should update the primary status for the first valid file
      if (existingValidCount === 0 && uploadedImages.length === 0) {
        // Find the first valid file in the new batch
        const firstValidNewFile = newFiles.find(f => !f.validationError);
        
        if (firstValidNewFile) {
          // Update it to be primary
          firstValidNewFile.is_primary = true;
        }
      }
      
      if (newFiles.length > 0) {
        setFiles(prev => {
          const combinedFiles = [...prev, ...newFiles];
          
          // Check if any files have validation errors
          const hasAnyErrors = combinedFiles.some(file => !!file.validationError);
          setHasValidationErrors(hasAnyErrors);
          
          return combinedFiles;
        });
      }
    },
    [files, uploadedImages.length, showSnackbar]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
  });

  const handleUpload = async () => {
    if (!productId) {
      showSnackbar("Please complete the basic info first", "error");
      return;
    }

    if (files.length === 0) {
      // If no new files, but we've already uploaded images, we can proceed
      if (uploadedImages.length > 0) {
        nextStep();
        return;
      }

      showSnackbar("Please select at least one image", "error");
      return;
    }

    // Double-check for validation errors before proceeding
    const invalidFiles = files.filter(file => !!file.validationError);
    if (invalidFiles.length > 0) {
      showSnackbar("Please remove images with validation errors before proceeding", "error");
      return;
    }

    // Check if there's a primary image
    const hasPrimary = files.some(file => file.is_primary);
    if (!hasPrimary && uploadedImages.length === 0) {
      // If no primary image is selected, set the first valid one as primary
      const validFiles = files.filter(file => !file.validationError);
      if (validFiles.length > 0) {
        setFiles(prev => 
          prev.map((file, index) => {
            const isFirstValid = index === prev.findIndex(f => !f.validationError);
            return {
              ...file,
              is_primary: isFirstValid
            };
          })
        );
      }
    }

    setIsUploading(true);
    try {
      console.log("Uploading images for product ID:", productId);

      // Extract just the valid files for upload
      const filesToUpload = files.filter(f => !f.validationError).map(f => f.file);
      
      if (filesToUpload.length === 0) {
        showSnackbar("No valid files to upload", "error");
        setIsUploading(false);
        return;
      }
      
      const response = await uploadProductImages(
        Number(productId),
        filesToUpload
      );

      console.log("Upload response:", response);
      showSnackbar("Images uploaded successfully", "success");

      // Update the uploaded images list
      if (response?.data?.images) {
        // Find the primary image from the new files
        const primaryFile = files.find((f) => f.is_primary);
        
        // If there's a primary file among the new uploads, find its corresponding uploaded image
        let primaryImageId = null;
        if (primaryFile) {
          const primaryImage = response.data.images.find((img) =>
            img.url.includes(primaryFile.file.name)
          );
          primaryImageId = primaryImage?.id;
          
          // If we found the primary image in the response, update any existing primary images
          if (primaryImageId) {
            // Remove primary status from any existing uploaded images
            setUploadedImages(prev => prev.map(img => ({
              ...img,
              is_primary: false
            })));
          }
        } else if (
          uploadedImages.length === 0 &&
          response.data.images.length > 0 &&
          !uploadedImages.some(img => img.is_primary)
        ) {
          // If no existing images and no primary selected, make the first uploaded one primary
          primaryImageId = response.data.images[0].id;
        }

        // If we need to set a primary image
        if (primaryImageId) {
          try {
            await updatePrimaryImage(Number(productId), primaryImageId);
            console.log("Primary image set to:", primaryImageId);
          } catch (error) {
            console.error("Error setting primary image after upload:", error);
          }
        }

        // Reset fetch status to allow re-fetching after upload
        fetchedRef.current = false;

        // After uploading, refresh product data to get the latest images
        await fetchProductData();
      }

      // Clear the files array after successful upload
      setFiles([]);

      // Update form data and move to next step
      updateFormData({
        hasErrors: false,
      });

      // Move to the Attributes tab
      nextStep();
    } catch (error) {
      // console.error("Error uploading images:", error);
      showSnackbar("Failed to upload images", "error");
      updateFormData({
        hasErrors: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      
      // If we removed the primary image, we may need to update the primary status
      if (prev[index].is_primary && newFiles.length > 0) {
        // Only assign primary to another image if the removed one was valid and primary
        if (!prev[index].validationError) {
          // Find the first valid file (if any) and set it as primary
          const firstValidIndex = newFiles.findIndex(file => !file.validationError);
          if (firstValidIndex >= 0) {
            newFiles[firstValidIndex].is_primary = true;
          }
        }
      }
      
      // Check if any remaining files have validation errors
      const stillHasErrors = newFiles.some(file => !!file.validationError);
      setHasValidationErrors(stillHasErrors);
      
      return newFiles;
    });
  };

  const handleNewFilePrimaryChange = (index: number) => {
    setFiles((prev) => {
      // Only allow setting primary on valid files
      if (prev[index].validationError) {
        showSnackbar("Cannot set an invalid image as primary", "error");
        return prev;
      }
      
      // Remove primary from any uploaded images when setting a new file as primary
      if (uploadedImages.length > 0) {
        const hasUploadedPrimary = uploadedImages.some(img => img.is_primary);
        if (hasUploadedPrimary) {
          setUploadedImages(uploadedImages.map(img => ({
            ...img,
            is_primary: false
          })));
        }
      }
      
      return prev.map((file, i) => ({
        ...file,
        is_primary: i === index,
      }));
    });
  };

  const handlePrimaryImageChange = async (imageId: number) => {
    if (!productId) {
      showSnackbar("Product ID is required", "error");
      return;
    }

    try {
      setIsUploading(true);
      console.log("Setting primary image:", imageId, "for product:", productId);

      // Optimistically update UI
      const updatedImages = uploadedImages.map((img) => ({
        ...img,
        is_primary: img.id === imageId,
      }));
      setUploadedImages(updatedImages);

      // Remove primary flag from any newly added files
      setFiles(prev => prev.map(file => ({
        ...file,
        is_primary: false
      })));

      // Call API to update primary image
      await updatePrimaryImage(Number(productId), imageId);

      // Update form context with the updated images
      updateFormData({
        productImages: updatedImages,
      });

      showSnackbar("Primary image updated successfully", "success");
    } catch (error) {
      console.error("Error updating primary image:", error);

      // Revert the local state if the API call fails
      const originalPrimaryImage = uploadedImages.find((img) => img.is_primary);
      setUploadedImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_primary: originalPrimaryImage
            ? img.id === originalPrimaryImage.id
            : false,
        }))
      );

      showSnackbar("Failed to update primary image", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      if (!productId) {
        throw new Error("Product ID is required");
      }

      // Convert productId to number
      const numericProductId = Number(productId);
      if (isNaN(numericProductId)) {
        throw new Error("Invalid product ID");
      }

      // Call the delete API first
      await deleteProductImage(numericProductId, imageId);

      // After successful API call, update both UI and form context
      const updatedImages = uploadedImages.filter((img) => img.id !== imageId);
      setUploadedImages(updatedImages);
      updateFormData({
        productImages: updatedImages,
        hasErrors: false,
      });

      // Show success message
      showSnackbar("Image deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting image:", error);
      showSnackbar("Failed to delete image", "error");
      updateFormData({
        hasErrors: true,
      });
    }
  };

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
          <BrokenImageIcon className="text-gray-400 text-4xl" />
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
          <CircularProgress />
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

          {/* Display uploaded images */}
          {uploadedImages.length > 0 && (
            <div className="mt-6">
              <Typography variant="h6" className="mb-4">
                Uploaded Images
              </Typography>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {uploadedImages.map((image) => (
                  <div key={`uploaded-${image.id}`} className="relative group border border-gray-200 rounded">
                    <div style={{ height: "140px" }} className="w-full overflow-hidden">
                      <ImageWithFallback
                        src={image.url}
                        alt={`Product image ${image.id}`}
                      />
                    </div>
                    <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={image.is_primary}
                            onChange={() => handlePrimaryImageChange(image.id)}
                            color="primary"
                            disabled={image.is_primary || isUploading}
                          />
                        }
                        label="Primary"
                      />
                    </div>
                    <IconButton
                      className="absolute top-2 right-2 bg-white hover:bg-red-50 shadow-md"
                      size="small"
                      onClick={() => handleDeleteImage(image.id)}
                    >
                      <DeleteIcon sx={{ color: "red" }} />
                    </IconButton>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Display new files to be uploaded */}
          {files.length > 0 && (
            <div className="mt-6">
              <Typography variant="subtitle2" className="mb-2 font-semibold">
                New Image Preview:
              </Typography>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map((fileData, index) => (
                  <div key={`new-${index}-${fileData.file.name}`} className="flex flex-col">
                    <div
                      className={`relative border ${
                        fileData.validationError ? 'border-red-500' : 'border-gray-200'
                      } rounded overflow-hidden`}
                    >
                      <div className="w-full" style={{ height: "140px" }}>
                        <ImageWithFallback
                          src={URL.createObjectURL(fileData.file)}
                          alt={`Preview ${index + 1}`}
                        />
                      </div>
                      <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded">
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={fileData.is_primary}
                              onChange={() => handleNewFilePrimaryChange(index)}
                              color="primary"
                              disabled={fileData.is_primary || !!fileData.validationError}
                            />
                          }
                          label="Primary"
                        />
                      </div>
                      <IconButton
                        className="absolute top-2 right-2 bg-white hover:bg-red-50 shadow-md"
                        size="small"
                        onClick={() => removeFile(index)}
                      >
                        <DeleteIcon sx={{ color: "red" }} />
                      </IconButton>
                    </div>
                    {fileData.validationError && (
                      <Typography color="error" variant="caption" className="mt-1">
                        Image dimensions must not exceed {MAX_IMAGE_WIDTH}×{MAX_IMAGE_HEIGHT} pixels
                      </Typography>
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
              disabled={isUploading}
              className="bg-[#2E9970] text-white hover:bg-[#1E7A56] px-6"
            />
            <AppButton
              label={
                isUploading
                  ? "Uploading..."
                  : files.length > 0
                  ? "Upload & Next"
                  : "Next"
              }
              onClick={handleUpload}
              loading={isUploading}
              disabled={isUploading || hasValidationErrors}
              className="bg-[#2E9970] text-white hover:bg-[#1E7A56] px-6"
            />
          </div>
        </>
      )}
    </div>
  );
}

export default ProductImagesTab;
