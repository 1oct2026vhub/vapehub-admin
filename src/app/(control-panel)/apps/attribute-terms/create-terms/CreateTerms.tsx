"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Alert, Typography, MenuItem } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormSelectField from "@/components/Shared/SelectField";
import { usePost, useFetch } from "@/hooks/useFetch";
import { listAttributes } from "@/services/apiAttribute";
import { createAttributeTerm } from "@/services/apiAttributeTerm";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useEffect, useState } from "react";

const schema = z.object({
  attribute_id: z.number().min(1, "Attribute is required"),
  name: z.string().min(1, "Term Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  // sort_order: z.number().min(0, 'Sort order must be a positive number'),
});

const defaultValues = {
  attribute_id: 0,
  name: "",
  slug: "",
  description: "",
  // sort_order: 0,
};

export type FormType = z.infer<typeof schema>;

function CreateTerms() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch attributes for the select box
  const { data: attributesData } = useFetch(
    ["attributesList", { limit: 100, show_deleted: false }],
    () => listAttributes({ limit: 100, show_deleted: false }),
  );

  const attributes = attributesData?.data?.attributes || [];

  const { control, formState, handleSubmit, watch, setValue } =
    useForm<FormType>({
      mode: "onChange",
      defaultValues,
      resolver: zodResolver(schema),
    });

  const { isValid, errors } = formState;
  const { trigger: triggerCreateTerm } = usePost(
    "createTerm",
    createAttributeTerm,
  );

  // Auto-generate slug from name
  // const name = watch('name');
  // useEffect(() => {
  //   if (name) {
  //     const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  //     setValue('slug', slug);
  //   }
  // }, [name, setValue]);

  const onSubmit = async (formData: FormType) => {
    try {
      setIsLoading(true);
      await triggerCreateTerm(formData);
      showSnackbar("Term created successfully!", "success");
      router.push("/apps/attribute-terms");
    } catch (error: any) {
      if (error?.errors) {
        showSnackbar(error?.errors[0]?.msg, "error");
      } else {
        const errorMessage = error?.message || "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }
      const errorData = error || error; // Handle both API and unexpected errors
      if (errorData?.error && typeof errorData.error === "object") {
        Object.entries(errorData.error).forEach(([field, message]) => {
          if (typeof message === "string") {
            // setError(field, { type: 'manual', message });
            showSnackbar(` ${message}`, "error");
          }
        });
      } else {
        // setError('root', { type: 'manual', message: errorMessage });
      }
      return false;
    } finally {
      setIsLoading(false); // Stop loading after success or failure
    }
  };

  return (
    <div className="md:px-64 p-4">
      <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-8 mt-8">
        New Attribute Term
      </Typography>

      <form
        name="termForm"
        noValidate
        className="flex flex-col"
        onSubmit={handleSubmit(onSubmit)}
      >
        {errors?.root?.message && (
          <Alert className="mb-8" severity="error">
            {errors?.root?.message}
          </Alert>
        )}

        <FormSelectField
          name="attribute_id"
          control={control}
          label="Attribute"
          required
          options={attributes.map((attr) => ({
            label: attr.name,
            value: attr.id,
          }))}
        />

        <FormInputField
          name="name"
          control={control}
          label="Term Name"
          type="text"
          required
        />

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

        {/* <FormInputField
          name="sort_order"
          control={control}
          label="Sort Order"
          type="number"
          required
        /> */}

        <AppButton
          label="Create"
          loading={isLoading}
          type="submit"
          fullWidth
          size="large"
          disabled={!isValid}
          className="mt-4 w-full"
        />
      </form>
    </div>
  );
}

export default CreateTerms;
