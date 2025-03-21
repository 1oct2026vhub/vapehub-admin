"use client";

import { useProductForm } from "../ProductFormContext";
import { Box, Button, Grid } from "@mui/material";
import FormInputField from "@/components/Shared/FormInputField";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSnackbar } from "@/contexts/SnackbarContext";

const inventorySchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  stock_quantity: z.string().min(1, "Stock quantity is required"),
  stock_status: z.enum(["in_stock", "out_of_stock", "low_stock"]).optional(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

/**
 * The inventory tab.
 */
export default function InventoryTab() {
  const { formData, updateFormData, previousStep, nextStep } = useProductForm();
  const { showSnackbar } = useSnackbar();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      sku: formData.sku || "",
      stock_quantity: formData.stock_quantity || "",
      stock_status: formData.stock_status || "in_stock",
    },
  });

  const onSubmit = async (data: InventoryFormData) => {
    try {
      updateFormData(data);
      showSnackbar("Inventory information saved successfully", "success");
      nextStep();
    } catch (error) {
      console.error("Error saving inventory information:", error);
      showSnackbar("Failed to save inventory information", "error");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormInputField
            name="sku"
            control={control}
            label="SKU"
            type="text"
            required
          />
        </Grid>
        <Grid item xs={12}>
          <FormInputField
            name="stock_quantity"
            control={control}
            label="Stock Quantity"
            type="number"
            required
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
