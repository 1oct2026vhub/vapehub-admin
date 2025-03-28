"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useRouter } from "next/navigation";
import { Alert, Typography, CircularProgress } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { usePost, useFetch } from "@/hooks/useFetch";
import {
  getAttributeTermDetails,
  updateAttributeTerm,
} from "@/services/apiAttributeTerm";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/PageBreadcrumb";

const schema = z.object({
  name: z
    .string()
    .min(1, "Term Name is required")
    .max(50, "Term Name must be 50 characters or less"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug  must be at most 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be a valid URL-friendly string (lowercase letters, numbers, and hyphens only)"
    ),
  description: z.string().optional(),
});

const defaultValues = {
  name: "",
  slug: "",
  description: "",
};

export type FormType = z.infer<typeof schema>;

function EditTerm() {
  const params = useParams();
  // Get the ID from URL params
  const id = params?.id;
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  console.log("Term ID from params:", id);

  // Fetch term details
  const { data: termData, isLoading: isLoadingTerm } = useFetch(
    ["termDetail", id],
    () => getAttributeTermDetails(id as string),
    { revalidateOnFocus: false }
  );

  const term = termData?.data;
  console.log("Term data fetched:", term);

  const { control, formState, handleSubmit, reset, watch } = useForm<FormType>({
    mode: "onChange",
    defaultValues,
    resolver: zodResolver(schema),
  });

  // Watch the name field to display character count
  const nameValue = watch("name") || "";
  const nameLength = nameValue.length;
  const nameRemaining = 50 - nameLength;

  // Prefill form when term data is available
  useEffect(() => {
    if (term) {
      console.log("Setting form values with term data:", term);
      reset({
        name: term?.name,
        slug: term?.slug,
        description: term.description || "",
      });
    }
  }, [term, reset]);

  const { isValid, errors } = formState;
  const { trigger: triggerUpdateTerm } = usePost(
    "updateTerm",
    updateAttributeTerm
  );

  const onSubmit = async (formData: FormType) => {
    try {
      setIsLoading(true);

      // Validate id parameter
      if (!id) {
        throw new Error("Term ID is missing");
      }

      // Check name field length
      if (formData.name.length > 50) {
        throw new Error("Term Name must be 50 characters or less");
      }

      // Make sure id is a valid number or string
      const termId = typeof id === "object" ? id.toString() : id;

      const termData = {
        name: formData.name.trim(),
        slug: formData.slug.toLowerCase().replace(/\s+/g, "-"),
        description: formData.description || "",
      };

      // Pass termId and termData as separate arguments
      await triggerUpdateTerm([termId, termData]);

      showSnackbar("Term updated successfully!", "success");
      router.push("/apps/attribute-terms");
    } catch (error: any) {
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

  if (isLoadingTerm) {
    return (
      <div className="flex justify-center items-center p-10">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="md:px-64 p-4">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          Edit Term
        </Typography>
      </div>

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

        <FormInputField
          name="name"
          control={control}
          label="Term Name"
          type="text"
          required
        />
        <div className="text-xs text-gray-500 -mt-3 mb-4">
          {nameLength} / 50 characters used{" "}
          {nameRemaining < 0 ? "(exceeded maximum)" : ""}
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

        <AppButton
          label="Update"
          loading={isLoading}
          type="submit"
          fullWidth
          size="large"
          disabled={!isValid || isLoading}
          className="mt-4 w-full"
        />
      </form>
    </div>
  );
}

export default EditTerm;
