"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Box, Button, Chip, Typography } from "@mui/material";
import { useBlogPostContentEditor } from "./BlogPostContentEditorContext";

interface BlogPlaceholderInsertButtonProps {
  token: string;
  label: string;
  description?: string;
}

export default function BlogPlaceholderInsertButton({
  token,
  label,
  description,
}: BlogPlaceholderInsertButtonProps) {
  const { copyPlaceholder } = useBlogPostContentEditor();

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1,
        p: 1.5,
        border: "1px dashed #2E9970",
        borderRadius: 0,
        bgcolor: "rgba(46, 153, 112, 0.04)",
      }}
    >
      <Chip label={token} size="small" sx={{ fontFamily: "monospace", fontWeight: 600 }} />
      <Typography variant="body2" color="text.secondary" sx={{ flex: "1 1 200px" }}>
        {description ?? label}
      </Typography>
      <Button
        size="small"
        variant="outlined"
        startIcon={<ContentCopyIcon />}
        onClick={() => void copyPlaceholder(token)}
        sx={{ textTransform: "none", borderColor: "#2E9970", color: "#2E9970" }}
      >
        Copy
      </Button>
    </Box>
  );
}
