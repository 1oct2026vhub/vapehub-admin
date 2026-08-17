"use client";

import { useState } from "react";
import { Box, Button, Grid, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Control, UseFormGetValues, useFieldArray } from "react-hook-form";
import FormInputField from "@/components/Shared/FormInputField";
import FormTextareaField from "@/components/Shared/FormTextareaField";
import ConfirmActionDialog from "@/app/(control-panel)/apps/faq/ConfirmActionDialog";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { updateBlogPost } from "@/services/apiBlog";
import {
  buildBlogPostFormData,
  commonFieldStyles,
  type BlogPostFormType,
} from "./blogPostFormShared";

interface BlogPostEeatSectionsProps {
  control: Control<BlogPostFormType>;
  getValues: UseFormGetValues<BlogPostFormType>;
  postId?: number;
}

export default function BlogPostEeatSections({
  control,
  getValues,
  postId,
}: BlogPostEeatSectionsProps) {
  const { showSnackbar } = useSnackbar();
  const {
    fields: sourceFields,
    append: appendSource,
    remove: removeSource,
  } = useFieldArray({ control, name: "sources" });
  const [sourceToDelete, setSourceToDelete] = useState<{
    index: number;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!sourceToDelete || deleting) return;

    const { index } = sourceToDelete;
    setDeleting(true);

    try {
      if (postId) {
        const formValues = getValues();
        const remainingSources = formValues.sources.filter((_, i) => i !== index);
        const formData = buildBlogPostFormData(
          { ...formValues, sources: remainingSources },
          { isEdit: true },
        );
        await updateBlogPost(postId, formData);
        showSnackbar("Source deleted successfully", "success");
      } else {
        showSnackbar("Source removed. Save the post to keep this change.", "success");
      }

      removeSource(index);
      setSourceToDelete(null);
    } catch (error: any) {
      showSnackbar(
        error?.errors?.[0]?.msg || error?.message || "Failed to delete source",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Sources & citations
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Sent as the &quot;sources&quot; field — each entry has label, href, and optional
          description.
        </Typography>
      </Box>
      {sourceFields.map((field, index) => (
        <Box
          key={field.id}
          sx={{
            border: "1px solid #e0e0e0",
            p: 2,
            mb: 2,
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={1.5}
          >
            <Typography variant="body2" fontWeight={600}>
              Source {index + 1}
            </Typography>
            <Button
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={() =>
                setSourceToDelete({
                  index,
                  label: getValues(`sources.${index}.label`)?.trim() || `Source ${index + 1}`,
                })
              }
              sx={{ textTransform: "none" }}
            >
              Delete
            </Button>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormInputField
                name={`sources.${index}.label`}
                control={control}
                label="Label"
                helperText="e.g. Medicines and Healthcare products Regulatory Agency (MHRA)"
                sx={commonFieldStyles}
              />
            </Grid>
            <Grid item xs={12}>
              <FormInputField
                name={`sources.${index}.href`}
                control={control}
                label="URL (href)"
                sx={commonFieldStyles}
              />
            </Grid>
            <Grid item xs={12}>
              <FormTextareaField
                name={`sources.${index}.description`}
                control={control}
                label="Description (optional)"
                rows={2}
                placeholder="e-cigarette product notification scheme & manufacturer guidance"
              />
            </Grid>
          </Grid>
        </Box>
      ))}
      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={() => appendSource({ label: "", href: "", description: "" })}
        sx={{ textTransform: "none", borderColor: "#2E9970", color: "#247c5c" }}
      >
        Add source
      </Button>

      <ConfirmActionDialog
        open={Boolean(sourceToDelete)}
        onClose={() => {
          if (!deleting) setSourceToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete source"
        itemName={sourceToDelete?.label}
        actionButtonText={deleting ? "Deleting..." : "Delete"}
        actionButtonColorClass="!bg-red-600"
      />
    </Box>
  );
}
