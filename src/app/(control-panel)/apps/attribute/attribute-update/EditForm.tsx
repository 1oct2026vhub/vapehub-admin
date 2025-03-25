"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Alert, Typography } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { usePost } from "@/hooks/useFetch";
import { updateAttribute } from "@/services/apiAttribute";
import { useSnackbar } from "@/contexts/SnackbarContext";
import FormSelectField from "@/components/Shared/SelectField";
import PageBreadcrumb from "@/components/PageBreadcrumb";

const schema = z.object({
  name: z.string().min(1, "Attribute Name is required").max(50, "Name must be less than 50 characters"),
  slug: z.string()
    .min(1, "Slug is required")
    .max(50, "Slug must be at most 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be a valid URL-friendly string (lowercase letters, numbers, and hyphens only)"), description: z.string().optional(),
  type: z.string().min(1, "Type is required"),
  sort_order: z.string().min(1, "Sort order is required"),
});

const defaultValues = {
  name: "",
  slug: "",
  description: "",
  type: "select",
  sort_order: "custom",
};

const typeOptions = [
  { label: "Select", value: "select" },
  { label: "Radio", value: "radio" },
  { label: "Checkbox", value: "checkbox" },
];

const sortOrderOptions = [
  { label: "Custom", value: "custom" },
  { label: "Name", value: "name" },
  { label: "Name (Numeric)", value: "name_numeric" },
];

export type FormType = {
  name: string;
  slug: string;
  description?: string;
  type: string;
  sort_order: string;
};


const EditAttributeForm = ({ attribute }: { attribute: FormType }) => {
  const router = useRouter();
  const { id } = useParams();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  const { control, formState, handleSubmit, setValue, watch } = useForm<FormType>({
    mode: "all",
    defaultValues,
    resolver: zodResolver(schema),
  });

  // Watch the name field to display character count
  const nameValue = watch("name") || "";
  const nameLength = nameValue.length;
  const nameRemaining = 50 - nameLength;

  const { isValid, errors } = formState;
  const { trigger: triggerUpdateAttribute, isMutating } = usePost(
    "updateAttribute",
    updateAttribute,
  );

  // Prefill form when attribute data is available
  useEffect(() => {
    if (attribute) {
      setValue("name", attribute.name);
      setValue("slug", attribute.slug);
      setValue("description", attribute.description || "");
      setValue("type", attribute.type);
      setValue("sort_order", attribute.sort_order);
    }
  }, [attribute, setValue]);

  const onSubmit = async (formData: FormType) => {
    setIsLoading(true);

    try {
      // Ensure required fields are present and properly formatted
      if (
        !formData.name ||
        !formData.slug ||
        !formData.type ||
        !formData.sort_order
      ) {
        throw new Error("Required fields are missing");
      }

      // Validate id parameter
      if (!id) {
        throw new Error("Attribute ID is missing");
      }

      // Make sure id is a valid number or string
      const attributeId = typeof id === 'object' ? id.toString() : id;

      const attributeData = {
        name: formData.name.trim(),
        slug: formData.slug.toLowerCase().replace(/\s+/g, "-"),
        description: formData.description,
        type: formData.type,
        sort_order: formData.sort_order,
      };

      // Pass validated ID and attributeData as separate arguments
      await triggerUpdateAttribute([attributeId, attributeData]);
      showSnackbar("Attribute updated successfully!", "success");
      router.push("/apps/attribute");
    } catch (error) {
      if (error?.errors) {
        showSnackbar(error?.errors[0]?.msg, "error");
      } else {
        const errorMessage = error?.message || "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }

      const errorData = error || error;
      if (errorData?.error && typeof errorData.error === "object") {
        Object.entries(errorData.error).forEach(([field, message]) => {
          if (typeof message === "string") {
            showSnackbar(message, "error");
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="md:px-64 p-4">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          Edit Attribute
        </Typography>
      </div>
      {isLoading && <p>Loading attribute data...</p>}

      {!isLoading && (
        <form
          name="attributeForm"
          noValidate
          className="flex w-full flex-col justify-center"
          onSubmit={handleSubmit(onSubmit)}
        >
          {errors?.root?.message && (
            <Alert className="mb-8" severity="error">
              {errors?.root?.message}
            </Alert>
          )}

          <FormInputField
            name="name"
            control={control}
            label="Attribute Name"
            type="text"
            required
          />
          <div className="text-xs text-gray-500 -mt-3 mb-4">
            {nameLength} / 50 characters used {nameRemaining < 0 ? "(exceeded maximum)" : ""}
          </div>
          <FormInputField
            name="slug"
            control={control}
            label="Slug"
            type="text"
            required
          />
          <FormInputField
            name="description"
            control={control}
            label="Description"
            type="text"
          />
          <FormSelectField
            name="type"
            control={control}
            label="Type"
            options={typeOptions}
            required
          />
          <FormSelectField
            name="sort_order"
            control={control}
            label="Sort Order"
            options={sortOrderOptions}
            required
          />

          <AppButton
            label="Update"
            loading={isLoading}
            type="submit"
            fullWidth
            size="large"
            // disabled={!isValid || isMutating}
            className="mt-4 w-full"
          />
        </form>
      )}
    </div>
  );
};

export default EditAttributeForm;
