"use client";

import { useState, useCallback, useEffect } from "react";
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
} from "@mui/material";
import Image from "next/image";
import BrokenImageIcon from "@mui/icons-material/BrokenImage";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

interface ProductImage {
  id: number;
  url: string;
  is_primary: boolean;
}

interface NewFile {
  file: File;
  is_primary: boolean;
}

function ProductImagesTab() {
  const [files, setFiles] = useState<NewFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<ProductImage[]>([]);
  const { showSnackbar } = useSnackbar();
  const { formData, updateFormData, nextStep, previousStep } = useProductForm();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  // Fetch existing product images when component mounts
  useEffect(() => {
    const fetchProductImages = async () => {
      if (!formData.productId) return;
      try {
        const response = await getProduct(formData.productId);
        if (response?.data?.images) {
          // Set the first image as primary if none is set
          const hasExistingPrimary = response.data.images.some(
            (img) => img.is_primary,
          );
          const updatedImages = response.data.images.map((img, index) => ({
            ...img,
            is_primary: hasExistingPrimary ? img.is_primary : index === 0,
          }));
          setUploadedImages(updatedImages);
        }
      } catch (error) {
        console.error("Error fetching product images:", error);
      }
    };

    fetchProductImages();
  }, [formData.productId]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => {
      const newFiles = acceptedFiles.map((file) => ({
        file,
        is_primary: prev.length === 0, // Set first file as primary by default
      }));
      return [...prev, ...newFiles];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
  });

  const handleUpload = async () => {
    if (!formData.productId) {
      showSnackbar("Please complete the basic info first", "error");
      return;
    }

    if (files.length === 0) {
      showSnackbar("Please select at least one image", "error");
      return;
    }

    setIsUploading(true);
    try {
      // Extract just the files for upload
      const filesToUpload = files.map((f) => f.file);
      const response = await uploadProductImages(
        formData.productId,
        filesToUpload,
      );
      showSnackbar("Images uploaded successfully", "success");

      // Update the uploaded images list
      if (response?.data?.images) {
        // Find the primary image from the new files
        const primaryFile = files.find((f) => f.is_primary);
        const primaryImage = response.data.images.find((img) =>
          img.url.includes(primaryFile?.file.name || ""),
        );

        // Update the images with primary status
        const updatedImages = response.data.images.map((img) => ({
          ...img,
          is_primary: img.id === primaryImage?.id,
        }));

        setUploadedImages((prev) => [...prev, ...updatedImages]);
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
      if (newFiles.length > 0 && !newFiles.some((f) => f.is_primary)) {
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
    try {
      setIsUploading(true);

      if (!formData.productId) {
        throw new Error("Product ID is required");
      }

      // Optimistically update UI
      setUploadedImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_primary: img.id === imageId,
        })),
      );

      // Call API to update primary image
      await updatePrimaryImage(formData.productId, imageId);
      showSnackbar("Primary image updated successfully", "success");
    } catch (error) {
      console.error("Error updating primary image:", error);

      // Revert the local state if the API call fails
      setUploadedImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_primary: false, // Reset all to false and let the original primary image be set
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
            {uploadedImages.map((image, index) => (
              <div
                key={
                  image.id
                    ? `uploaded-${image.id}`
                    : `uploaded-${index}-${image.url}`
                }
                className="relative group"
              >
                <ImageWithFallback
                  src={image.url}
                  alt={`Product image ${image.id || index + 1}`}
                />
                <div className="absolute top-2 left-2 bg-white/80 p-2 rounded">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={image.is_primary}
                        onChange={() => handlePrimaryImageChange(image.id)}
                        color="primary"
                        disabled={isUploading}
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
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={fileData.is_primary}
                      onChange={() => handleNewFilePrimaryChange(index)}
                      color="primary"
                    />
                  }
                  label="Primary"
                />
                <ImageWithFallback
                  src={URL.createObjectURL(fileData.file)}
                  alt={`Preview ${index + 1}`}
                />
                <button
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
          label={isUploading ? "Uploading..." : "Next"}
          onClick={handleUpload}
          loading={isUploading}
          disabled={files.length === 0 || isUploading}
        />
      </div>
    </div>
  );
}

export default ProductImagesTab;
