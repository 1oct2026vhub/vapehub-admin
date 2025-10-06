"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { Alert, Typography } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormTextareaField from "@/components/Shared/FormTextareaField";
import FormCheckboxField from "@/components/Shared/FormCheckboxField";
import { 
  updateShippingMethod, 
  getShippingMethodDetails 
} from "@/services/apiShippingMethod";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import FuseLoading from "@fuse/core/FuseLoading";

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


export default function EditShippingMethod() {
  const router = useRouter();
  const params = useParams();
  const { showSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormType>({
    mode: "all",
    defaultValues,
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (params?.id) {
      setShippingMethodId(params.id as string);
      fetchShippingMethodDetails(params.id as string);
    }
  }, [params?.id]);

  const fetchShippingMethodDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await getShippingMethodDetails(id);
      if (response.success && response.data) {
        const shippingMethod = response.data;
        reset({
          shipping_method: shippingMethod.shipping_method,
          description: shippingMethod.description,
          display_text: shippingMethod.display_text,
          shipping_cost: parseFloat(shippingMethod.shipping_cost),
          method_order: shippingMethod.method_order,
          is_enabled: shippingMethod.is_enabled,
          service_code: shippingMethod.service_code,
          carrier_code: shippingMethod.carrier_code
        });
      }
    } catch (error: any) {
      console.error("Error fetching shipping method details:", error);
      showSnackbar(
        error?.response?.data?.message || "Failed to fetch shipping method details",
        "error"
      );
      router.push("/apps/shipping-methods");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormType) => {
    if (!shippingMethodId) return;

    try {
      setIsSubmitting(true);
      await updateShippingMethod(shippingMethodId, data);
      showSnackbar("Shipping method updated successfully", "success");
      router.push("/apps/shipping-methods");
    } catch (error: any) {
      console.error("Error updating shipping method:", error);
      showSnackbar(
        error?.response?.data?.message || "Failed to update shipping method",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <FuseLoading />;
  }

  return (
    <div className="w-full p-8">
      <div className="mb-6">
        <PageBreadcrumb className="mb-2" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight">
          Edit Shipping Method
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
            label={isSubmitting ? "Updating..." : "Update Shipping Method"}
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
