"use client";

import { useState, useEffect } from "react";
import { Controller } from "react-hook-form";
import { Button, Typography, Box, IconButton } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";

const ACCEPTED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface FormFileUploadProps {
  name: string;
  control: any;
  label: string;
  setValue: any;
  existingImage?: string;
}

function FormFileUpload({
  name,
  control,
  label,
  setValue,
  existingImage,
}: FormFileUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingImage && !previewUrl) {
      setPreviewUrl(existingImage);
    }
  }, [existingImage]);

  const validateFile = (file: File) => {
    if (!file) return "Please select a file";
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return "File type must be PNG, JPG, JPEG, or WEBP";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 5MB";
    }
    return null;
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (file: File | null) => void,
  ) => {
    const file = e.target.files?.[0];
    setError(null);

    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setPreviewUrl(null);
        onChange(null);
        return;
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onChange(file);
    }
  };

  const handleRemove = (onChange: (file: null) => void) => {
    if (previewUrl && previewUrl !== existingImage) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    onChange(null);
    setValue(name, null, { shouldValidate: true });
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({
        field: { onChange, value },
        fieldState: { error: fieldError },
      }) => (
        <Box className="flex flex-col space-y-4">
          <Typography>{label}</Typography>

          {/* Preview Area */}
          {previewUrl && (
            <Box className="relative w-48 h-48 border rounded-lg overflow-hidden group">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <IconButton
                  className="bg-white hover:bg-gray-100"
                  size="small"
                  onClick={() => handleRemove(onChange)}
                >
                  <DeleteIcon />
                </IconButton>
              </div>
            </Box>
          )}

          {/* Upload Button */}
          {!previewUrl && (
            <>
              <input
                type="file"
                accept={ACCEPTED_FILE_TYPES.join(",")}
                onChange={(e) => handleFileChange(e, onChange)}
                hidden
                id={name}
              />
              <label htmlFor={name}>
                <Box
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#2E9970] transition-colors"
                  sx={{
                    "&:hover": {
                      "& .upload-icon": {
                        color: "#2E9970",
                      },
                    },
                  }}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <CloudUploadIcon
                      className="upload-icon text-gray-400"
                      style={{ fontSize: 48 }}
                    />
                    <Typography variant="body1" className="font-medium">
                      Click to upload or drag and drop
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      PNG, JPG, JPEG or WEBP (max. 5MB)
                    </Typography>
                  </div>
                </Box>
              </label>
            </>
          )}

          {/* Error Messages */}
          {(error || fieldError) && (
            <Typography color="error" variant="caption">
              {error || fieldError?.message}
            </Typography>
          )}
        </Box>
      )}
    />
  );
}

export default FormFileUpload;
