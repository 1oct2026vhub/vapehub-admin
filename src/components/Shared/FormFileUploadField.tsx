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
}

const FormFileUploadField: React.FC<FormFileUploadFieldProps> = ({
  name,
  control,
  label,
  required = false,
  accept = "image/*",
  helperText = "Supported formats: PNG, JPG, JPEG, WebP (max 5MB)",
  onFileChange,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const validateFile = (file: File) => {
    if (required && !file) return "File is required";
    
    if (file) {
      if (accept.includes("image/") && !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        return "Unsupported file format. Please use PNG, JPG, JPEG, or WebP";
      }
      
      if (file.size > MAX_FILE_SIZE) {
        return "File size must be less than 5MB";
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
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    
    if (file) {
      // Create preview URL for images
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
    
    onChange(file);
    if (onFileChange) onFileChange(file);
    setTouched(true);
  };

  const handleRemoveFile = (onChange: (file: null) => void) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    
    onChange(null);
    if (onFileChange) onFileChange(null);
  };

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Controller
      name={name}
      control={control}
      rules={{ 
        validate: validateFile 
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <Box className="mb-6">
          <Typography className="mb-2">
            {label} {required && <span style={{ color: "red" }}>*</span>}
          </Typography>
          
          {/* Preview for image files */}
          {previewUrl && (
            <Box className="mb-3 flex flex-col items-center">
              <Box className="relative w-full max-w-xs h-56 border rounded-lg overflow-hidden mb-2">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                <IconButton
                  className="absolute top-2 right-2 bg-white hover:bg-red-50 shadow-md"
                  size="small"
                  onClick={() => handleRemoveFile(onChange)}
                  sx={{
                    "& .MuiSvgIcon-root": {
                      color: "#ef4444", // Red color
                    },
                    "&:hover": {
                      "& .MuiSvgIcon-root": {
                        color: "#dc2626", // Darker red on hover
                      },
                    },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          )}
          
          {/* Upload button/area */}
          {!previewUrl && (
            <Box
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#2E9970] transition-colors mb-2"
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
          )}
          
          {/* Error message */}
          {error && (
            <Typography color="error" variant="caption">
              {error.message}
            </Typography>
          )}
        </Box>
      )}
    />
  );
};

export default FormFileUploadField; 