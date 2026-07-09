"use client";

import {
  Box,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
} from "@mui/material";
import { Control, Controller, useFormState } from "react-hook-form";
import FormInputField from "@/components/Shared/FormInputField";
import FormTextareaField from "@/components/Shared/FormTextareaField";
import {
  commonFieldStyles,
  PULL_QUOTE_SOURCE_TYPE_OPTIONS,
  type BlogPostFormType,
} from "./blogPostFormShared";

interface BlogPostPullQuoteFieldsProps {
  control: Control<BlogPostFormType>;
}

export default function BlogPostPullQuoteFields({
  control,
}: BlogPostPullQuoteFieldsProps) {
  const { errors } = useFormState({ control });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          Pull quote (authoritative source)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Optional. Renders mid-body after a major H2 on the live article. Attribute
          to an authoritative external source — not internal staff.
        </Typography>
      </Box>

      <Controller
        name="pull_quote.enabled"
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={
              <Switch
                checked={field.value}
                onChange={(event) => field.onChange(event.target.checked)}
                color="primary"
              />
            }
            label="Include pull quote"
          />
        )}
      />

      <Controller
        name="pull_quote.enabled"
        control={control}
        render={({ field: { value: enabled } }) =>
          enabled ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormTextareaField
                  name="pull_quote.body"
                  control={control}
                  label="Quote body"
                  required
                  rows={4}
                  helperText="Max 1,000 characters. Shown as {{quote.body}} on the storefront."
                  placeholder="Enter the authoritative quote text..."
                />
              </Grid>

              <Grid item xs={12}>
                <FormInputField
                  name="pull_quote.attribution"
                  control={control}
                  label="Attribution"
                  required
                  helperText='Shown as {{quote.attribution}}. Use an external authority (e.g. "UK Vaping Industry Association") — not VapeHub, Geek Zone, or internal teams.'
                  sx={commonFieldStyles}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="pull-quote-source-type-label" sx={{ color: "#2E9970" }}>
                    Source type
                  </InputLabel>
                  <Controller
                    name="pull_quote.source_type"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <Select
                        {...field}
                        labelId="pull-quote-source-type-label"
                        label="Source type"
                        error={!!error}
                        sx={commonFieldStyles}
                      >
                        {PULL_QUOTE_SOURCE_TYPE_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.pull_quote?.source_type && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.pull_quote.source_type.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormInputField
                  name="pull_quote.source_url"
                  control={control}
                  label="Source URL"
                  required
                  helperText="Valid http/https URL from an external domain (not VapeHub)."
                  sx={commonFieldStyles}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Placement is fixed to mid-body after a major H2 section heading.
                </Typography>
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No pull quote will be sent. On edit, saving clears any existing pull quote.
            </Typography>
          )
        }
      />
    </Box>
  );
}
