"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Alert, Typography } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormTextareaField from "@/components/Shared/FormTextareaField";
import FormCheckboxField from "@/components/Shared/FormCheckboxField";
import { createShippingMethod, type CreateShippingMethodData } from "@/services/apiShippingMethod";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useState } from "react";
import PageBreadcrumb from "@/components/PageBreadcrumb";

const schema = z.object({
  shipping_method: z
    .string()
    .min(1, "Shipping Method is required")
    .max(100, "Shipping Method must be at most 100 characters"),

  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be at most 500 characters"),

  display_text: z
    .string()
    .min(1, "Display Text is required")
    .max(200, "Display Text must be at most 200 characters"),

  shipping_cost: z
    .union([z.string(), z.number()])
    .refine((val) => {
      if (val === "" || val === null || val === undefined) {
        return false;
      }
      return true;
    }, "Shipping Cost is required")
    .transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num)) throw new Error("Invalid number");
      return num;
    })
    .refine((val) => val >= 0, "Shipping Cost must be a positive number")
    .refine((val) => val <= 999.99, "Shipping Cost must be less than 1000"),

  method_order: z
    .union([z.string(), z.number()])
    .refine((val) => {
      if (val === "" || val === null || val === undefined) {
        return false;
      }
      return true;
    }, "Method Order is required")
    .transform((val) => {
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      if (isNaN(num)) throw new Error("Invalid number");
      return num;
    })
    .refine((val) => val >= 1, "Method Order must be at least 1")
    .refine((val) => val <= 999, "Method Order must be less than 1000"),

  is_enabled: z.boolean(),

  service_code: z
    .string()
    .optional(),

  carrier_code: z
    .string()
    .optional()
});

export type FormType = z.infer<typeof schema>;

const defaultValues: FormType = {
  shipping_method: "",
  description: "",
  display_text: "",
  shipping_cost: 0,
  method_order: 1,
  is_enabled: true,
  service_code: "",
  carrier_code: "",
};


export default function CreateShippingMethod() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormType>({
    mode: "all",
    defaultValues,
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormType) => {
    try {
      setIsSubmitting(true);
      await createShippingMethod(data as CreateShippingMethodData);
      showSnackbar("Shipping method created successfully", "success");
      router.push("/apps/shipping-methods");
    } catch (error: any) {
      console.error("Error creating shipping method:", error);
      showSnackbar(
        error?.response?.data?.message || "Failed to create shipping method",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full p-8">
      <div className="mb-6">
        <PageBreadcrumb className="mb-2" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight">
          Create Shipping Method
        </Typography>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInputField
            name="shipping_method"
            control={control}
            label="Shipping Method"
            required
            // helperText="Enter the name of the shipping method"
          />

          <FormInputField
            name="display_text"
            control={control}
            label="Display Text"
            required
            // helperText="Text shown to customers"
          />

          <FormTextareaField
            name="description"
            control={control}
            label="Description"
            required
            rows={3}
            // helperText="Detailed description of the shipping method"
          />

          <FormInputField
            name="shipping_cost"
            control={control}
            label="Shipping Cost"
            type="number"
            required
            inputProps={{ step: "0.01", min: "0" }}
            // helperText="Cost in pounds (£)"
          />

          <FormInputField
            name="method_order"
            control={control}
            label="Method Order"
            type="number"
            required
            inputProps={{ min: "1" }}
            // helperText="Display order (lower numbers appear first)"
          />

          <FormInputField
            name="carrier_code"
            control={control}
            label="Carrier Code"
            // helperText="Enter the carrier code"
          />

          <FormInputField
            name="service_code"
            control={control}
            label="Service Code"
            // helperText="Internal service code for the carrier"
          />
        </div>

        <div className="flex items-center space-x-2">
          <FormCheckboxField
            name="is_enabled"
            control={control}
            label="Enabled"
          />
        </div>

        {/* {Object.keys(errors).length > 0 && (
          <Alert severity="error">
            Please fix the errors above before submitting.
          </Alert>
        )} */}

        <div className="flex gap-4 pt-6">
          <AppButton
            label="Cancel"
            variant="outlined"
            onClick={() => router.push("/apps/shipping-methods")}
            disabled={isSubmitting}
          />
          <AppButton
            label={isSubmitting ? "Creating..." : "Create Shipping Method"}
            type="submit"
            variant="contained"
            disabled={!isValid || isSubmitting}
            loading={isSubmitting}
          />
        </div>
      </form>
    </div>
  );
}
