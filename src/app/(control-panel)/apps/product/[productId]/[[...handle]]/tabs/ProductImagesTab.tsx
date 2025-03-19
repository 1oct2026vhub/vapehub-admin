"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  uploadProductImages,
  getProduct,
  updatePrimaryImage,
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

interface ProductImage {
  id: number;
  url: string;
  is_primary: boolean;
}

interface NewFile {
  file: File;
  is_primary: boolean;
}

// Map API response structure to our internal structure
const mapApiImageToProductImage = (apiImage: any): ProductImage => {
  return {
    id: apiImage.id,
    url: apiImage.image_url,
    is_primary: apiImage.is_primary
  };
};

function ProductImagesTab() {
  const [files, setFiles] = useState<NewFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<ProductImage[]>([]);
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
      
      if (response?.data?.ProductImages && response.data.ProductImages.length > 0) {
        // Map API response to our internal structure
        const mappedImages = response.data.ProductImages.map(mapApiImageToProductImage);
        
        // Check if there's an existing primary image
        const hasExistingPrimary = mappedImages.some(img => img.is_primary);
        
        // If no primary image exists, set the first one as primary
        const updatedImages = mappedImages.map((img, index) => ({
          ...img,
          is_primary: hasExistingPrimary ? img.is_primary : index === 0
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
      showSnackbar("Failed to load product data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  // Fetch product data on component mount
  useEffect(() => {
    fetchProductData();
  }, [productId]); // Only depend on productId, not fetchProductData

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => {
      const newFiles = acceptedFiles.map((file) => ({
        file,
        is_primary: prev.length === 0 && uploadedImages.length === 0, // First image is primary only if no other images exist
      }));
      return [...prev, ...newFiles];
    });
  }, [uploadedImages.length]);

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

    setIsUploading(true);
    try {
      console.log("Uploading images for product ID:", productId);
      
      // Extract just the files for upload
      const filesToUpload = files.map((f) => f.file);
      const response = await uploadProductImages(
        Number(productId),
        filesToUpload,
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
        } else if (uploadedImages.length === 0 && response.data.images.length > 0) {
          // If no existing images and no primary selected, make the first uploaded one primary
          primaryImageId = response.data.images[0].id;
        }

        // If we need to set a primary image
        if (primaryImageId && !uploadedImages.some(img => img.is_primary)) {
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
      console.error("Error uploading images:", error);
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
      // If we removed the primary image, set the first remaining image as primary
      if (newFiles.length > 0 && prev[index].is_primary) {
        newFiles[0].is_primary = true;
      }
      return newFiles;
    });
  };

  const handleNewFilePrimaryChange = (index: number) => {
    setFiles((prev) =>
      prev.map((file, i) => ({
        ...file,
        is_primary: i === index,
      })),
    );
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
      const originalPrimaryImage = uploadedImages.find(img => img.is_primary);
      setUploadedImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_primary: originalPrimaryImage ? img.id === originalPrimaryImage.id : false,
        })),
      );

      showSnackbar("Failed to update primary image", "error");
    } finally {
      setIsUploading(false);
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
        <Box className="w-full h-48 flex items-center justify-center bg-gray-100 rounded">
          <BrokenImageIcon className="text-gray-400 text-4xl" />
        </Box>
      );
    }

    return (
      <img
        src={src}
        alt={alt}
        className="w-full h-48 object-cover rounded"
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
              isDragActive ? "border-primary-500 bg-primary-50" : "border-gray-300"
            } cursor-pointer text-center`}
          >
            <input {...getInputProps()} />
            <Typography variant="body1" className="mb-2">
              {isDragActive
                ? "Drop the files here..."
                : "Drag and drop images here, or click to select files"}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Supported formats: PNG, JPG, JPEG, WebP
            </Typography>
          </Paper>

          {/* Display uploaded images */}
          {uploadedImages.length > 0 && (
            <div className="mt-6">
              <Typography variant="h6" className="mb-4">
                Uploaded Images
              </Typography>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {uploadedImages.map((image) => (
                  <div
                    key={`uploaded-${image.id}`}
                    className="relative group"
                  >
                    <ImageWithFallback
                      src={image.url}
                      alt={`Product image ${image.id}`}
                    />
                    <div className="absolute top-2 left-2 bg-white/80 p-2 rounded">
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Display new files to be uploaded */}
          {files.length > 0 && (
            <div className="mt-6">
              <Typography variant="h6" className="mb-4">
                New Images to Upload
              </Typography>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {files.map((fileData, index) => (
                  <div
                    key={`new-${index}-${fileData.file.name}`}
                    className="relative group"
                  >
                    <ImageWithFallback
                      src={URL.createObjectURL(fileData.file)}
                      alt={`Preview ${index + 1}`}
                    />
                    <div className="absolute top-2 left-2 bg-white/80 p-2 rounded">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={fileData.is_primary}
                            onChange={() => handleNewFilePrimaryChange(index)}
                            color="primary"
                            disabled={fileData.is_primary}
                          />
                        }
                        label="Primary"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-4">
            <AppButton
              label="Previous"
              onClick={previousStep}
              variant="outlined"
              disabled={isUploading}
            />
            <AppButton
              label={isUploading ? "Uploading..." : files.length > 0 ? "Upload & Next" : "Next"}
              onClick={handleUpload}
              loading={isUploading}
              disabled={isUploading}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default ProductImagesTab;
