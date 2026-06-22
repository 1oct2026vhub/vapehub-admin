"use client";

import { Alert, Typography } from "@mui/material";

export default function BlogPostTemplateBanner() {
  return (
    <Alert severity="info" sx={{ mb: 3 }}>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
        Geek Zone blog detail template
      </Typography>
      <Typography variant="body2" component="div">
        Fields map to the blog post API: title, content, slug, status, image,
        categories, tags, author_id, sources (label / href / description), and
        related_blog_ids (up to 3).
      </Typography>
    </Alert>
  );
}
