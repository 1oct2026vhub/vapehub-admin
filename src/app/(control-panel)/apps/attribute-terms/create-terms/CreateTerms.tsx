"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Alert, Typography } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormSearchableSelectField from "@/components/Shared/FormSearchableSelectField";
import { usePost, useFetch } from "@/hooks/useFetch";
import { listAttributes } from "@/services/apiAttribute";
import { createAttributeTerm } from "@/services/apiAttributeTerm";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useState, useEffect, useMemo, useCallback } from "react";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import debounce from 'lodash/debounce';

interface Option {
  value: number | string;
  label: string;
}

const schema = z.object({
  attribute_id: z
    .coerce
    .number()
    .or(z.null())
    .refine((val) => val === null || val >= 1, {
      message: "Attribute is required",
    })
    .nullable(),
  name: z
    .string()
    .min(1, "Term Name is required")
    .max(50, "Term Name must be at most 50 characters"),
  slug: z.string()
    .min(1, "Slug is required")
    .max(50, "Slug must be at most 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be a valid URL-friendly string (lowercase letters, numbers, and hyphens only)"),
  description: z
    .string()
    .min(1, "Description is required")
    .optional(),
});

export type FormType = z.infer<typeof schema>;

const defaultValues: FormType = {
  attribute_id: null,
  name: "",
  slug: "",
  description: "",
};

function CreateTerms() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  
  const [attributeLoading, setAttributeLoading] = useState(false);
  const [attributeOptions, setAttributeOptions] = useState<Option[]>([]);
  const [attributeError, setAttributeError] = useState("");
  const [attributeSearchInput, setAttributeSearchInput] = useState("");

  const { control, formState, handleSubmit, setError, setValue } = useForm<FormType>({
    mode: "all",
    defaultValues,
    resolver: zodResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;
  const { trigger: triggerCreateTerm } = usePost(
    "createTerm",
    createAttributeTerm
  );

  const fetchAttributes = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length === 0 || query.length >= 2) {
          try {
            setAttributeLoading(true);
            setAttributeError("");
            const response = await listAttributes({
              keyword: query,
              limit: 100,
              sort_by: 'name',
              order: 'ASC'
            });
            if (response?.data?.attributes) {
              const options = response.data.attributes.map((attr: any) => ({
                value: attr.id,
                label: attr.name,
              }));
              setAttributeOptions(options);
            } else {
              setAttributeOptions([]);
            }
          } catch (error) {
            console.error("Error fetching attributes:", error);
            setAttributeError("Failed to load attributes.");
            setAttributeOptions([]);
          }
          finally {
            setAttributeLoading(false);
          }
        }
      }, 400),
    []
  );
  
  useEffect(() => {
    fetchAttributes("");
  }, [fetchAttributes]);

  async function onSubmit(formData: FormType) {
    setIsLoading(true);
    try {
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

      const errorData = error || error;
      if (errorData?.error && typeof errorData.error === "object") {
        Object.entries(errorData.error).forEach(([field, message]) => {
          if (typeof message === "string") {
            setError(field as any, { type: "manual", message });
            showSnackbar(message, "error");
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="md:px-64 p-4">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          New Attribute Term
        </Typography>
      </div>
      <form
        name="termForm"
        noValidate
        className="flex flex-col"
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* {errors?.root?.message && (
          <Alert className="mb-8" severity="error">
            {errors?.root?.message}
          </Alert>
        )} */}

        <FormSearchableSelectField
          name="attribute_id"
          control={control}
          label="Attribute"
          options={attributeOptions}
          loading={attributeLoading}
          errorMessage={attributeError || errors.attribute_id?.message?.toString()}
          onInputChange={(query) => {
            setAttributeSearchInput(query);
            fetchAttributes(query);
          }}
          searchTerm={attributeSearchInput}
          required
          loadingText="Searching attributes..."
          noOptionsText={
            attributeSearchInput.length < 2 && attributeSearchInput.length > 0
              ? "Please enter at least 2 characters"
              : attributeOptions.length === 0 
                ? "No attributes found" 
                : "No matching attributes"
          }
          placeholder="Search for an attribute..."
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
            required
          />

        
          <AppButton
            label="Create"
            loading={isLoading}
            type="submit"
            fullWidth
            size="large"
            aria-label="Create"
            disabled={!isValid || !dirtyFields}
          />

      </form>
    </div>
  );
}

export default CreateTerms;
