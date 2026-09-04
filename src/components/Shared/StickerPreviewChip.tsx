"use client";

import { Box, Typography } from "@mui/material";
import { getContrastTextColor } from "@/types/productSticker";

type StickerPreviewChipProps = {
  name: string;
  backgroundColor: string;
  size?: "small" | "medium";
};

export default function StickerPreviewChip({
  name,
  backgroundColor,
  size = "medium",
}: StickerPreviewChipProps) {
  const bg = HEX_OR_FALLBACK(backgroundColor);
  const label = name?.trim() || "Preview";

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: size === "small" ? 1 : 1.5,
        py: size === "small" ? 0.25 : 0.5,
        borderRadius: 1,
        backgroundColor: bg,
        color: getContrastTextColor(bg),
        fontWeight: 700,
        fontSize: size === "small" ? 11 : 13,
        letterSpacing: 0.4,
        textTransform: "uppercase",
        lineHeight: 1.4,
        maxWidth: "100%",
      }}
    >
      <Typography
        component="span"
        sx={{
          fontSize: "inherit",
          fontWeight: "inherit",
          color: "inherit",
          letterSpacing: "inherit",
          textTransform: "inherit",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function HEX_OR_FALLBACK(hex: string): string {
  if (hex && /^#[0-9A-Fa-f]{6}$/.test(hex)) return hex;
  return "#000000";
}
