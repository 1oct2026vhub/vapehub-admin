"use client";

import { useProductForm } from "../ProductFormContext";
import { Box, Button, Grid } from "@mui/material";
import FormInputField from "@/components/Shared/FormInputField";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSnackbar } from "@/contexts/SnackbarContext";

const pricingSchema = z.object({
  price: z.string().min(1, "Price is required"),
  discount_price: z.string().optional(),
  cost_price: z.string().optional(),
  tax_rate: z.string().optional(),
});

type PricingFormData = z.infer<typeof pricingSchema>;

/**
 * The pricing tab.
 */
export default function PricingTab() {
  const { formData, updateFormData, previousStep, nextStep } = useProductForm();
  const { showSnackbar } = useSnackbar();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      price: formData.price,
      discount_price: formData.discount_price,
      cost_price: formData.cost_price,
      tax_rate: formData.tax_rate,
    },
  });

  const onSubmit = async (data: PricingFormData) => {
    try {
      updateFormData(data);
      showSnackbar("Pricing information saved successfully", "success");
      nextStep();
    } catch (error) {
      console.error("Error saving pricing information:", error);
      showSnackbar("Failed to save pricing information", "error");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormInputField
            name="price"
            control={control}
            label="Price ($)"
            type="number"
            required
            error={!!errors.price}
            helperText={errors.price?.message}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormInputField
            name="discount_price"
            control={control}
            label="Discount Price ($)"
            type="number"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormInputField
            name="cost_price"
            control={control}
            label="Cost Price ($)"
            type="number"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormInputField
            name="tax_rate"
            control={control}
            label="Tax Rate (%)"
            type="number"
          />
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button variant="contained" color="inherit" onClick={previousStep}>
          Previous
        </Button>
        <Button type="submit" variant="contained" color="primary">
          Next
        </Button>
      </Box>
    </Box>
  );
}
