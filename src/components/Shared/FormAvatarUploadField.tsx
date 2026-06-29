"use client";

import React, { useEffect, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import { SxProps, Theme } from "@mui/material/styles";
import ImageCropperDialog from "@/components/Shared/ImageCropperDialog";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface FormAvatarUploadFieldProps {
  name: string;
  control: any;
  label: string;
  helperText?: string;
  onFileChange?: (file: File | null) => void;
  onDeleteDefaultImage?: () => Promise<void> | void;
  sx?: SxProps<Theme>;
  defaultImage?: string;
  error?: boolean;
  errorMessage?: string | null;
}

const FormAvatarUploadField: React.FC<FormAvatarUploadFieldProps> = ({
  name,
  control,
  label,
  helperText = "Optional. PNG, JPG, JPEG, or WebP (max 5MB). Crop to a square for the author bio.",
  onFileChange,
  onDeleteDefaultImage,
  sx,
  defaultImage,
  error: customError,
  errorMessage: customErrorMessage,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    defaultImage || null,
  );
  const [lastDefaultImage, setLastDefaultImage] = useState<string | undefined>(
    defaultImage,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState("avatar.jpg");
  const pendingOnChangeRef = useRef<((file: File | null) => void) | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (defaultImage !== lastDefaultImage) {
      if (defaultImage) {
        setPreviewUrl(defaultImage);
      } else if (!defaultImage && lastDefaultImage) {
        setPreviewUrl((prev) => {
          if (prev && (prev.startsWith("http://") || prev.startsWith("https://"))) {
            return null;
          }
          return prev;
        });
      }
      setLastDefaultImage(defaultImage);
    }
  }, [defaultImage, lastDefaultImage]);

  useEffect(() => {
    return () => {
      if (cropImageSrc) {
        URL.revokeObjectURL(cropImageSrc);
      }
      if (previewUrl && previewUrl !== defaultImage && previewUrl !== cropImageSrc) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [cropImageSrc, previewUrl, defaultImage]);

  const validateFile = (file: File | null) => {
    if (!file) {
      return null;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return "Unsupported file format. Please use PNG, JPG, JPEG, or WebP";
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`;
    }

    return null;
  };

  const clearCropState = () => {
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
    }
    setCropImageSrc(null);
    setCropDialogOpen(false);
    pendingOnChangeRef.current = null;
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (file: File | null) => void,
  ) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      onChange(null);
      if (onFileChange) {
        onFileChange(null);
      }
      clearCropState();
      return;
    }

    if (previewUrl && previewUrl !== defaultImage) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    const url = URL.createObjectURL(file);
    setCropImageSrc(url);
    setPendingFileName(file.name);
    pendingOnChangeRef.current = onChange;
    setCropDialogOpen(true);
  };

  const handleCropComplete = (file: File) => {
    const onChange = pendingOnChangeRef.current;
    if (!onChange) {
      return;
    }

    if (previewUrl && previewUrl !== defaultImage) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onChange(file);
    if (onFileChange) {
      onFileChange(file);
    }
    clearCropState();
  };

  const handleCropClose = () => {
    clearCropState();
  };

  const handleRemoveFile = (onChange: (file: null) => void) => {
    if (previewUrl && previewUrl !== defaultImage) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(defaultImage || null);
    onChange(null);
    if (onFileChange) {
      onFileChange(null);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDeleteDefaultImage = async () => {
    if (!onDeleteDefaultImage) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDeleteDefaultImage();
      setPreviewUrl(null);
      setLastDefaultImage(undefined);
    } catch (error) {
      console.error("Failed to delete image:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        validate: (value) => validateFile(value),
      }}
      render={({ field: { onChange }, fieldState: { error } }) => (
        <Box className="mb-6" sx={sx}>
          <Typography className="mb-2">{label}</Typography>

          <Box
            className="border-2 border-dashed border-[#2E9970] rounded-none p-6 text-center cursor-pointer hover:border-[#1E7A56] transition-colors mb-2"
            onClick={() => inputRef.current?.click()}
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
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
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

          {previewUrl && previewUrl !== defaultImage && (
            <Box className="mb-3">
              <Typography variant="subtitle2" color="textSecondary" className="mb-2">
                New Image Preview:
              </Typography>
              <Box className="relative w-32 h-32 overflow-hidden mb-2">
                <Box
                  component="img"
                  src={previewUrl}
                  alt="New Preview"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
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

          {(error || customError) && (
            <Typography color="error" variant="caption" className="block mb-3">
              {customErrorMessage || error?.message}
            </Typography>
          )}

          {defaultImage && (
            <Box className="mt-4">
              <Typography variant="subtitle2" color="textSecondary" className="mb-2">
                Current Image:
              </Typography>
              <Box className="relative w-32 h-32 overflow-hidden">
                <Box
                  component="img"
                  src={defaultImage}
                  alt="Current"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
                {onDeleteDefaultImage && (
                  <IconButton
                    className="absolute top-2 right-2 bg-white hover:bg-red-50 shadow-md"
                    size="small"
                    onClick={handleDeleteDefaultImage}
                    disabled={isDeleting}
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
                    {isDeleting ? (
                      <CircularProgress size={20} sx={{ color: "#ef4444" }} />
                    ) : (
                      <DeleteIcon />
                    )}
                  </IconButton>
                )}
              </Box>
            </Box>
          )}

          <ImageCropperDialog
            open={cropDialogOpen}
            imageSrc={cropImageSrc}
            fileName={pendingFileName}
            onClose={handleCropClose}
            onCropComplete={handleCropComplete}
            aspect={1}
            cropShape="round"
            outputSize={400}
          />
        </Box>
      )}
    />
  );
};

export default FormAvatarUploadField;
