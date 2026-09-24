"use client";

import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Autocomplete,
  Typography,
} from "@mui/material";
import { Control, Controller, UseFormSetValue } from "react-hook-form";
import FormInputField from "@/components/Shared/FormInputField";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import FormFileUploadField from "@/components/Shared/FormFileUploadField";
import FormDateTimeField from "@/components/Shared/FormDateTimeField";
import type { BlogCategory, BlogTag } from "@/services/apiBlog";
import {
  commonFieldStyles,
  MAX_IMAGE_HEIGHT,
  MAX_IMAGE_WIDTH,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
  type BlogPostFormType,
} from "./blogPostFormShared";
import { BLOG_PLACEHOLDER_TOKENS } from "./blogPlaceholders";
import BlogPlaceholderInsertButton from "./BlogPlaceholderInsertButton";
import BlogPostAuthorField from "./BlogPostAuthorField";

interface BlogPostDetailsFieldsProps {
  control: Control<BlogPostFormType>;
  setValue: UseFormSetValue<BlogPostFormType>;
  currentStatus: BlogPostFormType["status"];
  categories: BlogCategory[];
  tags: BlogTag[];
  onCategorySearchChange: (value: string) => void;
  onTagSearchChange: (value: string) => void;
  onTitleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (file: File | null) => void;
  onAddCategoryClick: () => void;
  imageError?: string | null;
  defaultImage?: string;
  showAltText?: boolean;
  showRedirectUrl?: boolean;
}

export default function BlogPostDetailsFields({
  control,
  setValue,
  currentStatus,
  categories,
  tags,
  onCategorySearchChange,
  onTagSearchChange,
  onTitleChange,
  onFileChange,
  onAddCategoryClick,
  imageError,
  defaultImage,
  showAltText,
  showRedirectUrl,
}: BlogPostDetailsFieldsProps) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormInputField
          name="title"
          control={control}
          label="Title"
          required
          onChange={onTitleChange}
          sx={commonFieldStyles}
        />
      </Grid>

      <Grid item xs={12}>
        <FormInputField
          name="slug"
          control={control}
          label="Slug"
          required
          helperText="URL-friendly identifier (e.g., my-blog-post)"
          sx={commonFieldStyles}
        />
      </Grid>

      <Grid item xs={12}>
        <BlogPostAuthorField control={control} />
      </Grid>

      <Grid item xs={12}>
        <FormCKEditor
          name="content"
          control={control}
          label="Content"
          required
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Use H2 headings for each major section — the live page auto-builds a sticky
          table of contents from them. Add 2–4 internal product or category links via
          the link tool (accent-green underline on the storefront).
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Place optional inline blocks anywhere in the article using placeholders. Configure
          each block in its tab, then copy the matching token below into the content editor.
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
          <BlogPlaceholderInsertButton
            token={BLOG_PLACEHOLDER_TOKENS.pullQuote}
            label="Pull quote"
            description="Renders the pull quote block configured in the Pull Quote tab."
          />
          <BlogPlaceholderInsertButton
            token={BLOG_PLACEHOLDER_TOKENS.inlineProductCard}
            label="Inline product card"
            description="Renders the product card configured in the Inline Product Card tab."
          />
          <BlogPlaceholderInsertButton
            token={BLOG_PLACEHOLDER_TOKENS.firstPersonCallout(1)}
            label="First-person callout"
            description="Use {{firstPersonCallout:1}} and {{firstPersonCallout:2}} for multiple callouts."
          />
        </Box>
      </Grid>

      <Grid item xs={12}>
        <FormFileUploadField
          name="image"
          control={control}
          label="Featured Image"
          onFileChange={onFileChange}
          accept="image/*"
          helperText={`Upload a featured image for the blog post (${MIN_IMAGE_WIDTH}-${MAX_IMAGE_WIDTH} × ${MIN_IMAGE_HEIGHT}-${MAX_IMAGE_HEIGHT} px, Max size: 5MB). Supported formats: PNG, JPG, JPEG, WebP`}
          sx={commonFieldStyles}
          defaultImage={defaultImage}
          error={!!imageError}
          errorMessage={imageError}
        />
      </Grid>

      {showAltText && (
        <Grid item xs={12}>
          <FormInputField
            name="alt_text"
            control={control}
            label="Alt Text (Optional)"
            sx={commonFieldStyles}
          />
        </Grid>
      )}

      {showRedirectUrl && (
        <Grid item xs={12}>
          <FormInputField
            name="redirect_url"
            control={control}
            label="Redirect URL (optional)"
            helperText="Leave empty to skip. Enter a valid URL (e.g. https://example.com)."
            sx={commonFieldStyles}
          />
        </Grid>
      )}

      <Grid item xs={12} md={currentStatus === "published" ? 6 : 12}>
        <FormControl fullWidth>
          <InputLabel id="status-label" sx={{ color: "#2E9970" }}>
            Status
          </InputLabel>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                labelId="status-label"
                label="Status"
                sx={commonFieldStyles}
                onChange={(e) => {
                  field.onChange(e);
                  if (e.target.value !== "published") {
                    setValue("published_at", null);
                  }
                }}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            )}
          />
        </FormControl>
      </Grid>

      {currentStatus === "published" && (
        <Grid item xs={12} md={6}>
          <FormDateTimeField
            name="published_at"
            control={control}
            label="Published Date"
            required
            sx={commonFieldStyles}
          />
        </Grid>
      )}

      <Grid item xs={12}>
        <Controller
          name="categories"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Autocomplete
              multiple
              options={categories}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, val) => option.id === val.id}
              value={value}
              onChange={(_, newValue) => onChange(newValue)}
              onInputChange={(_, newInputValue) =>
                onCategorySearchChange(newInputValue)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Categories"
                  variant="outlined"
                  sx={commonFieldStyles}
                />
              )}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    label={option.name}
                    {...getTagProps({ index })}
                    key={option.id}
                  />
                ))
              }
            />
          )}
        />
        <Button
          variant="text"
          size="small"
          onClick={onAddCategoryClick}
          sx={{
            alignSelf: "flex-start",
            mt: 2,
            textTransform: "none",
            color: "#247c5c",
          }}
        >
          + Add New Category
        </Button>
      </Grid>

      <Grid item xs={12}>
        <Controller
          name="tags"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Autocomplete
              multiple
              options={tags}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, val) => option.id === val.id}
              value={value}
              onChange={(_, newValue) => onChange(newValue)}
              onInputChange={(_, newInputValue) =>
                onTagSearchChange(newInputValue)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  variant="outlined"
                  sx={commonFieldStyles}
                />
              )}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    label={option.name}
                    {...getTagProps({ index })}
                    key={option.id}
                  />
                ))
              }
            />
          )}
        />
      </Grid>
    </Grid>
  );
}
