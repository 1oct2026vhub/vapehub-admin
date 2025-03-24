"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Alert, Typography } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { usePost } from "@/hooks/useFetch";
import { createBrand } from "@/services/apiProductBrand";
import { useSnackbar } from "@/contexts/SnackbarContext";
import FormFileUpload from "@/components/Shared/FormFileUpload";
import { useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const schema = z.object({
  name: z.string()
    .min(1, "Brand Name is required")
    .max(50, "Brand Name must not exceed 50 characters"),
  
  slug: z.string()
    .min(1, "Slug is required")
    .max(50, "Slug must be at most 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be a valid URL-friendly string (lowercase letters, numbers, and hyphens only)"),

  description: z.string().optional(),

   logo: z
      .instanceof(File, { message: "Logo is required" })
      .refine((file) => file instanceof File, "Logo is required")
      .refine(
        (file) => file.size <= MAX_FILE_SIZE,
        "File size must be less than 5MB"
      )
      .refine(
        (file) => ACCEPTED_FILE_TYPES.includes(file.type),
        "Only .jpg, .jpeg, .png, and .webp formats are supported"
      ),
});

const defaultValues = {
  name: "",
  slug: "",
  description: "",
  logo: undefined,
};

export type FormType = z.infer<typeof schema>;

function CreateBrandForm() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  const { control, formState, handleSubmit, setValue } = useForm<FormType>({
    mode: "all",
    defaultValues,
    resolver: zodResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;
  const { trigger: triggerCreateBrand, isMutating } = usePost(
    "createBrand",
    createBrand,
  );

  async function onSubmit(formData: FormType) {
    setIsLoading(true);

    try {
      const formDataObj = new FormData();

      // Append name and slug
      formDataObj.append("name", formData.name.trim());
      formDataObj.append("slug", formData.slug.toLowerCase());

      // Append description if it exists
      if (formData.description) {
        formDataObj.append("description", formData.description);
      }

      // Only append logo if it's a File instance
      if (formData.logo instanceof File) {
        formDataObj.append("logo", formData.logo);
      }

      await triggerCreateBrand(formDataObj);
      showSnackbar("Brand created successfully!", "success");
      router.push("/apps/product-brand");
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
  }

  return (
    <div className="md:px-64 p-4">
      <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-8 mt-8">
        New Brand
      </Typography>
      <form
        name="brandForm"
        noValidate
        className="flex w-full flex-col justify-center"
        onSubmit={handleSubmit(onSubmit)}
      >
        {errors?.root?.message && (
          <Alert className="mb-8" severity="error">
            {errors?.root?.message}
          </Alert>
        )}

        <div className="flex flex-col">
          <FormInputField
            name="name"
            control={control}
            label="Brand Name"
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
            multiline
            rows={4}
          />
          <FormFileUpload
            name="logo"
            control={control}
            label="Brand Logo"
            setValue={setValue}
            onDelete={() => setValue("logo", undefined)}
          />

          <AppButton
            label="Create"
            loading={isLoading}
            type="submit"
            fullWidth
            size="large"
            disabled={!isValid || isMutating}
            className="mt-4 w-full"
          />
        </div>
      </form>
    </div>
  );
}

export default CreateBrandForm;
