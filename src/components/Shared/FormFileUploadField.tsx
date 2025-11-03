import React, { useState, useEffect } from "react";
import { Controller } from "react-hook-form";
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import { SxProps, Theme } from "@mui/material/styles";
import { validateImageDimensions } from "@/utils/imageUtils";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface FormFileUploadFieldProps {
  name: string;
  control: any;
  label: string;
  required?: boolean;
  accept?: string;
  helperText?: string;
  onFileChange?: (file: File | null) => void;
  sx?: SxProps<Theme>;
  defaultImage?: string;
  error?: boolean;
  errorMessage?: string | null;
  exactWidth?: number;
  exactHeight?: number;
  hidePreview?: boolean;
}

const FormFileUploadField: React.FC<FormFileUploadFieldProps> = ({
  name,
  control,
  label,
  required = false,
  accept = "image/*",
  helperText = "Supported formats: PNG, JPG, JPEG, WebP (max 5MB)",
  onFileChange,
  sx,
  defaultImage,
  error: customError,
  errorMessage: customErrorMessage,
  exactWidth,
  exactHeight,
  hidePreview = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    defaultImage || null
  );
  const [touched, setTouched] = useState(false);
  const [lastDefaultImage, setLastDefaultImage] = useState<string | undefined>(defaultImage);

  useEffect(() => {
    // Sync previewUrl with defaultImage changes
    if (defaultImage !== lastDefaultImage) {
      if (defaultImage) {
        // New default image provided
        setPreviewUrl(defaultImage);
      } else if (!defaultImage && lastDefaultImage) {
        // Default image was removed - clear the preview only if showing server image
        setPreviewUrl((prev) => {
          // Only clear if showing an http URL (server image), not a blob URL (newly uploaded)
          if (prev && (prev.startsWith('http://') || prev.startsWith('https://'))) {
            return null;
          }
          return prev;
        });
      }
      setLastDefaultImage(defaultImage);
    }
  }, [defaultImage, lastDefaultImage]);

  const validateFile = async (file: File | null) => {
    if (required && !file) return "File is required";
    
    if (file) {
      if (accept.includes("image/") && !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        return "Unsupported file format. Please use PNG, JPG, JPEG, or WebP";
      }
      
      if (file.size > MAX_FILE_SIZE) {
        return `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024*1024)}MB.`;
      }

      // Dimension validation
      if (file.type.startsWith("image/") && (exactWidth || exactHeight)) {
        const dimensionValidation = await validateImageDimensions(file, exactWidth, exactHeight);
        if (!dimensionValidation.valid) {
          return dimensionValidation.message || "Image dimensions are invalid.";
        }
      }
    }
    
    return null;
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0] || null;
    
    // Clear existing preview if any
    if (previewUrl && previewUrl !== defaultImage) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    
    if (file) {
      // Create preview URL for images
      if (file.type.startsWith("image/") && !hidePreview) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
    
    onChange(file);
    if (onFileChange) onFileChange(file);
    setTouched(true);
  };

  const handleRemoveFile = (onChange: (file: null) => void) => {
    if (previewUrl && previewUrl !== defaultImage) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(defaultImage || null);
    onChange(null);
    if (onFileChange) onFileChange(null);
  };

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl !== defaultImage) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, defaultImage]);

  return (
    <Controller
      name={name}
      control={control}
      rules={{ 
        validate: async (value) => validateFile(value)
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <Box className="mb-6" sx={sx}>
          <Typography className="mb-2">
            {label} {required && <span style={{ color: "red" }}>*</span>}
          </Typography>
          
          {/* Upload button/area - Always shown */}
          <Box
            className="border-2 border-dashed border-[#2E9970] rounded-none p-6 text-center cursor-pointer hover:border-[#1E7A56] transition-colors mb-2"
            onClick={() => document.getElementById(name)?.click()}
            sx={{
              "&:hover": {
                "& .MuiSvgIcon-root": {
                  color: "#2E9970", 
                },
              },
            }}
          >
            <input
              id={name}
              type="file"
              accept={accept}
              onChange={(e) => handleFileChange(e, onChange)}
              style={{ display: "none" }}
            />
            <CloudUploadIcon 
              style={{ fontSize: 48, color: "#9ca3af", margin: "0 auto" }} 
              className="mb-2"
            />
            <Typography variant="body1" className="font-medium mb-1">
              Click to upload or drag and drop
            </Typography>
            {helperText && (
              <Typography variant="body2" color="textSecondary">
                {helperText}
              </Typography>
            )}
          </Box>

          {/* Preview for newly uploaded image */}
          {!hidePreview && previewUrl && previewUrl !== defaultImage && (
            <Box className="mb-3">
              <Typography variant="subtitle2" color="textSecondary" className="mb-2">
                New Image Preview:
              </Typography>
              <Box className="relative w-full max-w-xs h-40 overflow-hidden mb-2">
                <img
                  src={previewUrl}
                  alt="New Preview"
                  className="w-full h-full object-contain"
                />
                <IconButton
                  className="absolute top-2 right-2 bg-white hover:bg-red-50 shadow-md"
                  size="small"
                  onClick={() => handleRemoveFile(onChange)}
                  sx={{
                    "& .MuiSvgIcon-root": {
                      color: "#ef4444",
                    },
                    "&:hover": {
                      "& .MuiSvgIcon-root": {
                        color: "#dc2626",
                      },
                    },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          )}
          
          {/* Display validation error right after the upload area or new image preview */}
          {(error || customError) && (
            <Typography color="error" variant="caption" className="block mb-3">
              {customErrorMessage || error?.message}
            </Typography>
          )}
          
          {/* Current/Default image preview - shown at bottom */}
          {!hidePreview && defaultImage && (
            <Box className="mt-4">
              <Typography variant="subtitle2" color="textSecondary" className="mb-2">
                Current Image:
              </Typography>
              <Box className="relative w-32 h-32 overflow-hidden">
                <img
                  src={defaultImage}
                  alt="Current"
                  className="w-full h-full object-contain"
                />
              </Box>
            </Box>
          )}
        </Box>
      )}
    />
  );
};

export default FormFileUploadField; 