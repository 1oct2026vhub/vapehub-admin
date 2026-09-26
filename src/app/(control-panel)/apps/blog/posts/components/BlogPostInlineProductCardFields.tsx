"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Control, Controller, UseFormSetValue, useFormState, useWatch } from "react-hook-form";
import { listProducts } from "@/services/apiProduct";
import { listProductCategory } from "@/services/apiProductCategory";
import { useDebounce } from "@/hooks/useDebounce";
import FormInputField from "@/components/Shared/FormInputField";
import FormTextareaField from "@/components/Shared/FormTextareaField";
import {
  commonFieldStyles,
  INLINE_PRODUCT_CARD_ENTITY_TYPE_OPTIONS,
  type BlogPostFormType,
} from "./blogPostFormShared";
import BlogPlaceholderInsertButton from "./BlogPlaceholderInsertButton";
import { BLOG_PLACEHOLDER_TOKENS } from "./blogPlaceholders";

interface EntityOption {
  id: number;
  name: string;
}

interface BlogPostInlineProductCardFieldsProps {
  control: Control<BlogPostFormType>;
  setValue: UseFormSetValue<BlogPostFormType>;
}

export default function BlogPostInlineProductCardFields({
  control,
  setValue,
}: BlogPostInlineProductCardFieldsProps) {
  const { errors } = useFormState({ control });
  const enabled = useWatch({ control, name: "inline_product_card.enabled" });
  const entityType = useWatch({ control, name: "inline_product_card.entity_type" });
  const selectedEntity = useWatch({ control, name: "inline_product_card.entity" });

  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const mergedOptions = useMemo(() => {
    const byId = new Map<number, EntityOption>();
    entities.forEach((entity) => byId.set(entity.id, entity));
    if (selectedEntity?.id && !byId.has(selectedEntity.id)) {
      byId.set(selectedEntity.id, {
        id: selectedEntity.id,
        name: selectedEntity.name || `#${selectedEntity.id}`,
      });
    }
    return Array.from(byId.values());
  }, [entities, selectedEntity]);

  useEffect(() => {
    const fetchEntities = async () => {
      if (!enabled || !entityType) {
        setEntities([]);
        return;
      }

      setLoadingEntities(true);

      const params: Record<string, string | number | boolean> = {
        limit: 50,
        sort_by: "id",
        order: "DESC",
      };

      if (debouncedSearch) {
        if (entityType === "product") {
          params.keyword = debouncedSearch;
          params.status = "published";
        } else {
          params.search = debouncedSearch;
          params.search_only_name = true;
        }
      } else if (entityType === "product") {
        params.status = "published";
      }

      try {
        if (entityType === "product") {
          const response = await listProducts(params);
          const products = response?.data?.products || [];
          setEntities(
            products
              .filter((product: { status?: string }) => product.status === "published")
              .map((product: { id: number; name?: string; title?: string }) => ({
                id: product.id,
                name: product.name || product.title || `Product #${product.id}`,
              })),
          );
        } else {
          const response = await listProductCategory(params);
          const categories = response?.data?.categories || [];
          setEntities(
            categories.map((category: { id: number; name: string }) => ({
              id: category.id,
              name: category.name,
            })),
          );
        }
      } catch (error) {
        console.error("Failed to fetch inline product card entities:", error);
        setEntities([]);
      } finally {
        setLoadingEntities(false);
      }
    };

    fetchEntities();
  }, [enabled, entityType, debouncedSearch]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          Inline product card
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Optional. Configure the card here. Paste {BLOG_PLACEHOLDER_TOKENS.inlineProductCard}{" "}
          into the article content only if you want it shown there — placement is optional.
          Max 1 per article.
        </Typography>
      </Box>

      <BlogPlaceholderInsertButton
        token={BLOG_PLACEHOLDER_TOKENS.inlineProductCard}
        label="Inline product card placeholder"
        description="Optional. Copy and paste into the Content editor only if you want placement in the article."
      />

      <Controller
        name="inline_product_card.enabled"
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
            label="Include inline product card"
          />
        )}
      />

      {enabled ? (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel
                id="inline-product-card-entity-type-label"
                sx={{ color: "#2E9970" }}
              >
                Entity type
              </InputLabel>
              <Controller
                name="inline_product_card.entity_type"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Select
                    {...field}
                    labelId="inline-product-card-entity-type-label"
                    label="Entity type"
                    error={!!error}
                    sx={commonFieldStyles}
                    onChange={(event) => {
                      field.onChange(event.target.value);
                      setValue("inline_product_card.entity", null, {
                        shouldValidate: true,
                      });
                      setSearch("");
                    }}
                  >
                    {INLINE_PRODUCT_CARD_ENTITY_TYPE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.inline_product_card?.entity_type && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  {errors.inline_product_card.entity_type.message}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="inline_product_card.entity"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Autocomplete
                  options={mergedOptions}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  value={field.value}
                  disabled={!entityType}
                  loading={loadingEntities}
                  onChange={(_, newValue) => field.onChange(newValue)}
                  onInputChange={(_, newInputValue) => setSearch(newInputValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={entityType === "category" ? "Category" : "Product"}
                      variant="outlined"
                      required
                      error={!!error}
                      helperText={
                        error?.message ||
                        (entityType === "product"
                          ? "Only published products can be selected."
                          : "Search and select a product category.")
                      }
                      sx={commonFieldStyles}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingEntities ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <FormTextareaField
              name="inline_product_card.blurb"
              control={control}
              label="Blurb"
              required
              rows={3}
              helperText="Required. Shown as {{product.blurb}} on the storefront."
              placeholder="Short copy explaining why this product or category fits the article..."
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormInputField
              name="inline_product_card.title"
              control={control}
              label="Title override"
              helperText="Optional. Overrides {{product.title}} on the storefront."
              sx={commonFieldStyles}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormInputField
              name="inline_product_card.cta_label"
              control={control}
              label="CTA label"
              helperText='Optional. e.g. "SHOP NIC SALTS"'
              sx={commonFieldStyles}
            />
          </Grid>
        </Grid>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No inline product card will be sent. On edit, saving clears any existing
          inline product card.
        </Typography>
      )}
    </Box>
  );
}
