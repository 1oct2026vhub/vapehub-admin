"use client";

import { useState, useEffect } from "react";
import { Controller, Control, UseFormSetValue } from "react-hook-form";
import {
  Button,
  Typography,
  Box,
  IconButton,
  CircularProgress,
} from "@mui/material";
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
  control: Control<any>;
  label: string;
  setValue: UseFormSetValue<any>;
  existingImage?: string;
  onDelete?: () => void;
  isDeleting?: boolean;
}

function FormFileUpload({
  name,
  control,
  label,
  setValue,
  existingImage,
  onDelete,
  isDeleting = false,
}: FormFileUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingImage && !previewUrl) {
      setPreviewUrl(existingImage);
    } else if (!existingImage && previewUrl === existingImage) {
      setPreviewUrl(null);
    }
  }, [existingImage, previewUrl]);

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
    onChange: (file: File | null) => void
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

  const handleDelete = () => {
    // Don't update the preview here - let the parent component control it
    // based on the API response to prevent flickering

    // Just call the onDelete callback
    onDelete?.();
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({
        field: { onChange, value },
        fieldState: { error: fieldError },
      }) => {
        useEffect(() => {
          if (existingImage && !(value instanceof File) && previewUrl !== existingImage) {
            setPreviewUrl(existingImage);
          }
          else if (!existingImage && !(value instanceof File)) {
            setPreviewUrl(null);
          }
          else if (!value && !existingImage) {
             setPreviewUrl(null);
          }
        }, [existingImage, value, previewUrl]);

        return (
          <Box className="flex flex-col space-y-4">
            <Typography>{label}</Typography>

            {/* Upload Area - Always visible unless deleting */}
            {!isDeleting && (
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
                    className={`border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#2E9970] transition-colors`}
                    sx={{
                      "&:hover": {
                        "& .upload-icon": {
                          color: "#2E9970",
                        },
                      },
                    }}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      {/* Always show icon */}
                      <CloudUploadIcon
                        className="upload-icon text-gray-400"
                        style={{ fontSize: 48 }}
                      />
                      <Typography variant="body1" className="font-medium">
                        {previewUrl
                          ? "Click to change image"
                          : "Click to upload or drag and drop"
                        }
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        PNG, JPG, JPEG or WEBP (max. 5MB)
                      </Typography>
                    </div>
                  </Box>
                </label>
              </>
            )}
            {/* Deleting state indicator */}
            {isDeleting && (
              <Box
                className={`border-2 border-dashed border-gray-300 rounded-lg p-6 opacity-70 transition-colors`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <CircularProgress size={48} />
                  <Typography variant="body1" className="font-medium">
                    Deleting...
                  </Typography>
                </div>
              </Box>
            )}

            {/* Preview Area - Moved below upload area */}
            {previewUrl && (
              <Box className="relative w-48 h-48 border rounded-lg overflow-hidden group mt-4"> {/* Added mt-4 for spacing */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className={`w-full h-full object-contain ${ 
                    isDeleting ? "opacity-60" : ""
                  }`}
                  style={{ maxHeight: '100px' }} 
                />
                {isDeleting && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <CircularProgress size={30} sx={{ color: "#2E9970" }} />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isDeleting && (
                    <>
                      {previewUrl === existingImage ? (
                        <IconButton
                          className="bg-white hover:bg-red-50 shadow-md"
                          size="small"
                          onClick={handleDelete}
                          disabled={isDeleting}
                          sx={{
                            "& .MuiSvgIcon-root": { color: "#ef4444" },
                            "&:hover": { "& .MuiSvgIcon-root": { color: "#dc2626" } },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      ) : (
                        <IconButton
                          className="bg-white hover:bg-red-50 shadow-md"
                          size="small"
                          onClick={() => handleRemove(onChange)}
                          disabled={isDeleting}
                          sx={{
                            "& .MuiSvgIcon-root": { color: "#ef4444" },
                            "&:hover": { "& .MuiSvgIcon-root": { color: "#dc2626" } },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </>
                  )}
                </div>
              </Box>
            )}

            {/* Error Messages */}
            {(error || fieldError) && (
              <Typography color="error" variant="caption">
                {error || fieldError?.message}
              </Typography>
            )}
          </Box>
        );
      }}
    />
  );
}

export default FormFileUpload;
