"use client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Alert, Typography, InputLabel, FormHelperText } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { usePost } from "@/hooks/useFetch";
import { createAttribute } from "@/services/apiAttribute";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useState } from "react";
import FormSelectField from "@/components/Shared/SelectField";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import FormFileUpload from "@/components/Shared/FormFileUpload";

// Image validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// ✅ Schema with strict validation rules and image field
const schema = z.object({
  name: z
    .string()
    .min(1, "Attribute Name is required")
    .max(50, "Attribute Name must be at most 50 characters")
    .regex(/^[a-zA-Z0-9\s]+$/, "Only alphanumeric characters and spaces allowed"),

  slug: z.string()
    .min(1, "Slug is required")
    .max(50, "Slug must be at most 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be a valid URL-friendly string (lowercase letters, numbers, and hyphens only)"),

  description: z
    .string()
    .optional(),

  type: z.enum(["select", "radio", "text", "image"], {
    message: "Type is required",
  }),

  sort_order: z.enum(["custom", "name", "id"], {
    message: "Invalid sort order value",
  }),

  // Added image file validation
  image: z
    .instanceof(File, { message: "Please select an image." })
    .optional()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png, and .webp formats are supported."
    ),
});

export type FormType = z.infer<typeof schema>;

const defaultValues: FormType = {
  name: "",
  slug: "",
  description: "",
  type: "select",
  sort_order: "custom",
  image: undefined, // Initialize image field
};

const typeOptions = [
  { label: "Select", value: "select" },
  { label: "Radio", value: "radio" },
  { label: "Text", value: "text" },
  { label: "Image", value: "image" },
];

const sortOrderOptions = [
  { label: "Custom", value: "custom" },
  { label: "Name", value: "name" },
  { label: "Id", value: "id" },
];

function CreateAttribute() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  const { control, formState, handleSubmit, setError, setValue } = useForm<FormType>({
    mode: "all",
    defaultValues,
    resolver: zodResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;

  const { trigger: triggerCreateAttribute, isMutating } = usePost(
    "createAttribute",
    createAttribute
  );

  const onSubmit = async (formData: FormType) => {
    setIsLoading(true); // Start loading
    try {
      // The `createAttribute` service now handles FormData creation
      await triggerCreateAttribute(formData); 
      showSnackbar("Attribute created successfully!", "success");
      router.push("/apps/attribute");
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
            setError(field as keyof FormType, { type: "manual", message }); // Use keyof FormType
          }
        });
      } else {
         setError("root", { type: "manual", message: error?.message || "Failed to create attribute." });
      }
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <div className="md:px-64 p-4">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          New Attribute
        </Typography>
      </div>

      <form
        name="attributeForm"
        noValidate
        className="flex flex-col space-y-6" // Added space-y for better spacing
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

        <FormFileUpload 
          name="image" 
          control={control} 
          label="Attribute Image (Optional)" 
          setValue={setValue}
        />

        <AppButton
          label="Create"
          loading={isLoading}
          type="submit"
          fullWidth
          size="large"
          aria-label="Create Attribute"
          disabled={isMutating || isLoading} // Disable only if submitting
          className="mt-4 w-full"
        />
      </form>
    </div>
  );
}

export default CreateAttribute;
