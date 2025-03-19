"use client";

import { useSnackbar } from "@/contexts/SnackbarContext";
import { useState, useEffect } from "react";
import { Paper, Grid, TextField, IconButton } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormCheckboxField from "@/components/Shared/FormCheckboxField";
import { useProductForm, type ProductFormData } from "../ProductFormContext";
import {
  createProductVariants,
  deleteProductVariant,
} from "@/services/apiProduct";
import FormSelectField from "@/components/Shared/SelectField";
import DeleteIcon from "@mui/icons-material/Delete";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type Variant = NonNullable<ProductFormData["variants"]>[number];

interface FormData {
  variants: Array<{
    id?: number;
    slug: string;
    price: number;
    stock: number;
    status: boolean;
    discount_price: number | null;
    purchase_price: number | null;
    low_stock_threshold: number | null;
    weight: number | null;
    length: number | null;
    width: number | null;
    height: number | null;
    barcode: string | null;
    description: string | null;
    attributes: Array<{
      attribute_id: number;
      term_id: number;
    }>;
  }>;
}

const variantSchema = z.object({
  variants: z
    .array(
      z.object({
        id: z.number().optional(),
        slug: z.string().min(1, "Slug is required"),
        price: z.preprocess(
          (val) => (val === "" ? null : Number(val)),
          z.number().min(0, "Price must be >= 0"),
        ),
        stock: z.preprocess(
          (val) => (val === "" ? null : Number(val)),
          z.number().min(0, "Stock must be >= 0"),
        ),
        status: z.boolean(),
        discount_price: z.preprocess(
          (val) => (val === "" ? null : Number(val)),
          z.number().nullable(),
        ),
        purchase_price: z.preprocess(
          (val) => (val === "" ? null : Number(val)),
          z.number().nullable(),
        ),
        low_stock_threshold: z.preprocess(
          (val) => (val === "" ? null : Number(val)),
          z.number().nullable(),
        ),
        weight: z.preprocess(
          (val) => (val === "" ? null : Number(val)),
          z.number().nullable(),
        ),
        length: z.preprocess(
          (val) => (val === "" ? null : Number(val)),
          z.number().nullable(),
        ),
        width: z.preprocess(
          (val) => (val === "" ? null : Number(val)),
          z.number().nullable(),
        ),
        height: z.preprocess(
          (val) => (val === "" ? null : Number(val)),
          z.number().nullable(),
        ),
        barcode: z.string().nullable(),
        description: z.string().nullable(),
        attributes: z.array(
          z.object({
            attribute_id: z.number(),
            term_id: z.number(),
          }),
        ),
      }),
    )
    .min(1, "At least one variant is required"),
});

function VariantTab() {
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const {
    formData,
    updateFormData,
    nextStep,
    previousStep,
    markStepAsCompleted,
  } = useProductForm();

  useEffect(() => {
    if (formData.attributesResponse) {
      console.log("Attributes API Response:", formData.attributesResponse);
    }
    
    if (formData.productId) {
      console.log("VariantTab - Product ID:", formData.productId);
      if (formData.productImages) {
        console.log("VariantTab - Product Images:", formData.productImages);
        // Here you can use the product images data if needed
      }
    }
  }, [formData.attributesResponse, formData.productId, formData.productImages]);

  const variationAttributes = (formData.attributes || [])
    .filter((attr) => attr.used_in_variation && attr.attribute_id > 0)
    .map((attr) => ({
      ...attr,
      terms: attr.term_ids
        .map((termId: number) => {
          const term = formData.attributesResponse?.productAttributeTerms?.find(
            (term) => term.term_id === termId && term.used_in_variation
          );

          return term ? {
            value: termId,
            label: term.term?.name || `Term ${termId}`,
          } : null;
        })
        .filter(Boolean), // Remove null values
    }))
    .filter((attr) => attr.terms.length > 0); // Only keep attributes with terms

  const defaultVariant = {
    slug: "",
    price: 0,
    stock: 0,
    status: true,
    discount_price: null,
    purchase_price: null,
    low_stock_threshold: null,
    weight: null,
    length: null,
    width: null,
    height: null,
    barcode: null,
    description: null,
    attributes: variationAttributes.map((attr) => ({
      attribute_id: attr.attribute_id,
      term_id: attr.terms[0]?.value || 0, // Use first term or 0 if no terms
    })),
  };

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      variants:
        formData.variants && formData.variants.length > 0
          ? formData.variants
          : [defaultVariant],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const handleDeleteVariant = async (variantId: number, index: number) => {
    try {
      setIsLoading(true);

      if (fields.length <= 1) {
        showSnackbar("Cannot delete the last variant", "error");
        return;
      }

      if (variantId) {
        await deleteProductVariant(variantId);
      }

      remove(index);

      const updatedVariants = [...(formData.variants || [])];
      updatedVariants.splice(index, 1);
      updateFormData({ variants: updatedVariants });

      showSnackbar("Variant deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting variant:", error);
      showSnackbar("Failed to delete variant", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    console.log("Form submitted:", data);
    setIsLoading(true);

    try {
      // Ensure we have a productId
      if (!formData.productId) {
        throw new Error("Product ID is required");
      }

      // Transform the data to match API requirements
      const transformedData = {
        variants: data.variants.map((variant) => ({
          slug: variant.slug,
          price: Number(variant.price),
          stock: Number(variant.stock),
          status: variant.status,
          discount_price: variant.discount_price
            ? Number(variant.discount_price)
            : null,
          purchase_price: variant.purchase_price
            ? Number(variant.purchase_price)
            : null,
          low_stock_threshold: variant.low_stock_threshold
            ? Number(variant.low_stock_threshold)
            : null,
          weight: variant.weight ? Number(variant.weight) : null,
          length: variant.length ? Number(variant.length) : null,
          width: variant.width ? Number(variant.width) : null,
          height: variant.height ? Number(variant.height) : null,
          barcode: variant.barcode,
          description: variant.description,
          attributes: variant.attributes,
        })),
      };

      console.log("Calling API with transformed data:", transformedData);

      // Call the API
      const response = await createProductVariants(
        formData.productId,
        transformedData,
      );
      console.log("API response:", response);

      // Update form data with the response
      updateFormData({
        variants: data.variants,
        hasErrors: false,
      });

      showSnackbar("Product variants saved successfully", "success");
      markStepAsCompleted(3);
      nextStep();
    } catch (error) {
      console.error("API error:", error);

      if (error.response) {
        showSnackbar(
          error.response.data.message || "Failed to save variants",
          "error",
        );
      } else if (error.request) {
        showSnackbar("Network error, please try again", "error");
      } else {
        showSnackbar(error.message || "An unexpected error occurred", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {fields.map((field, index) => (
        <Paper key={field.id || index} className="p-4 relative">
          <Grid container spacing={2}>
            {variationAttributes.map((attr, attrIndex) => (
              <Grid item xs={12} sm={6} key={attr.attribute_id}>
                <FormSelectField
                  name={`variants.${index}.attributes.${attrIndex}.term_id`}
                  control={control}
                  label={`Attribute ${attrIndex + 1}`}
                  options={attr.terms} // Use transformed terms with name labels
                  required
                />
                <input
                  type="hidden"
                  {...register(
                    `variants.${index}.attributes.${attrIndex}.attribute_id`,
                  )}
                  value={attr.attribute_id}
                />
              </Grid>
            ))}

            <Grid item xs={12} sm={6}>
              <TextField
                {...register(`variants.${index}.slug`)}
                fullWidth
                label="Variant Slug"
                error={!!errors.variants?.[index]?.slug}
                helperText={errors.variants?.[index]?.slug?.message}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register(`variants.${index}.price`, {
                  valueAsNumber: true,
                })}
                fullWidth
                label="Price"
                type="number"
                error={!!errors.variants?.[index]?.price}
                helperText={errors.variants?.[index]?.price?.message}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register(`variants.${index}.discount_price`, {
                  valueAsNumber: true,
                })}
                fullWidth
                label="Discount Price"
                type="number"
                error={!!errors.variants?.[index]?.discount_price}
                helperText={errors.variants?.[index]?.discount_price?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register(`variants.${index}.stock`, {
                  valueAsNumber: true,
                })}
                fullWidth
                label="Stock"
                type="number"
                error={!!errors.variants?.[index]?.stock}
                helperText={errors.variants?.[index]?.stock?.message}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register(`variants.${index}.low_stock_threshold`, {
                  valueAsNumber: true,
                })}
                fullWidth
                label="Low Stock Threshold"
                type="number"
                error={!!errors.variants?.[index]?.low_stock_threshold}
                helperText={
                  errors.variants?.[index]?.low_stock_threshold?.message
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register(`variants.${index}.weight`, {
                  valueAsNumber: true,
                })}
                fullWidth
                label="Weight"
                type="number"
                error={!!errors.variants?.[index]?.weight}
                helperText={errors.variants?.[index]?.weight?.message}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                {...register(`variants.${index}.length`, {
                  valueAsNumber: true,
                })}
                fullWidth
                label="Length"
                type="number"
                error={!!errors.variants?.[index]?.length}
                helperText={errors.variants?.[index]?.length?.message}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                {...register(`variants.${index}.width`, {
                  valueAsNumber: true,
                })}
                fullWidth
                label="Width"
                type="number"
                error={!!errors.variants?.[index]?.width}
                helperText={errors.variants?.[index]?.width?.message}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                {...register(`variants.${index}.height`, {
                  valueAsNumber: true,
                })}
                fullWidth
                label="Height"
                type="number"
                error={!!errors.variants?.[index]?.height}
                helperText={errors.variants?.[index]?.height?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                {...register(`variants.${index}.barcode`)}
                fullWidth
                label="Barcode"
                error={!!errors.variants?.[index]?.barcode}
                helperText={errors.variants?.[index]?.barcode?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                {...register(`variants.${index}.description`)}
                fullWidth
                label="Description"
                multiline
                rows={3}
                error={!!errors.variants?.[index]?.description}
                helperText={errors.variants?.[index]?.description?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <FormCheckboxField
                name={`variants.${index}.status`}
                control={control}
                label="Active"
              />
            </Grid>
          </Grid>

          {/* Delete Variant Button - Only show for non-default variants */}
          {fields.length > 1 && (
            <IconButton
              onClick={() =>
                handleDeleteVariant(field.id ? Number(field.id) : 0, index)
              }
              disabled={isLoading}
              className="absolute top-2 right-2"
              color="error"
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Paper>
      ))}

      {/* Add New Variant Button */}
      <div className="flex justify-center">
        <AppButton
          label="Add Variant"
          onClick={() => append(defaultVariant)}
          variant="outlined"
          type="button"
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-between mt-4">
        <AppButton
          label="Previous"
          onClick={previousStep}
          variant="outlined"
          disabled={isLoading}
        />
        <AppButton label="Next" type="submit" loading={isLoading} />
      </div>
    </form>
  );
}

export default VariantTab;
