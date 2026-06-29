"use client";

import { useCallback, useState, type ComponentType } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Typography,
} from "@mui/material";
import CropperImport, {
  Area,
  Point,
  type CropperProps,
} from "react-easy-crop";
import AppButton from "@/components/Shared/AppButton";
import { getCroppedImageFile } from "@/utils/cropImage";

const Cropper = CropperImport as unknown as ComponentType<Partial<CropperProps>>;

interface ImageCropperDialogProps {
  open: boolean;
  imageSrc: string | null;
  fileName?: string;
  title?: string;
  onClose: () => void;
  onCropComplete: (file: File) => void;
  aspect?: number;
  cropShape?: "rect" | "round";
  outputSize?: number;
}

export default function ImageCropperDialog({
  open,
  imageSrc,
  fileName = "avatar.jpg",
  title = "Crop profile photo",
  onClose,
  onCropComplete,
  aspect = 1,
  cropShape = "round",
  outputSize = 400,
}: ImageCropperDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((value: number) => {
    setZoom(value);
  }, []);

  const onCropAreaComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleClose = () => {
    if (isSaving) {
      return;
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  };

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      return;
    }

    try {
      setIsSaving(true);
      const croppedFile = await getCroppedImageFile(
        imageSrc,
        croppedAreaPixels,
        fileName,
        outputSize,
      );
      onCropComplete(croppedFile);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      onClose();
    } catch (error) {
      console.error("Failed to crop image:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Drag to reposition and use the slider to zoom. The circular preview
          matches how the photo appears in the author bio block.
        </Typography>
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: 320,
            bgcolor: "#111827",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              showGrid={false}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropAreaComplete}
            />
          )}
        </Box>
        <Box sx={{ mt: 3, px: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Zoom
          </Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.05}
            aria-label="Zoom"
            onChange={(_, value) => onZoomChange(value as number)}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <AppButton
          label="Cancel"
          variant="outlined"
          onClick={handleClose}
          disabled={isSaving}
          disableGradient
        />
        <AppButton
          label="Apply crop"
          onClick={handleApply}
          loading={isSaving}
          disabled={!imageSrc || !croppedAreaPixels}
        />
      </DialogActions>
    </Dialog>
  );
}
