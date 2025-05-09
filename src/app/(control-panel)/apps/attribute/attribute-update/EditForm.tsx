"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Alert, Typography } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { usePost, useFetch } from "@/hooks/useFetch";
import { updateAttribute, getAttributeDetails, Attribute, UpdateAttributeData, removeAttributeImage } from "@/services/apiAttribute";
import { useSnackbar } from "@/contexts/SnackbarContext";
import FormSelectField from "@/components/Shared/SelectField";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import FormFileUpload from "@/components/Shared/FormFileUpload";

// Image validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const schema = z.object({
  name: z.string().min(1, "Attribute Name is required").max(50, "Name must be less than 50 characters"),
  slug: z.string()
    .min(1, "Slug is required")
    .max(50, "Slug must be at most 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be a valid URL-friendly string (lowercase letters, numbers, and hyphens only)"),
  description: z.string().optional(),
  type: z.string().min(1, "Type is required"),
  sort_order: z.string().min(1, "Sort order is required"),
  image: z
    .instanceof(File, { message: "Invalid file type." })
    .optional()
    .nullable()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png, and .webp formats are supported."
    ),
});

export type FormType = {
  name: string;
  slug: string;
  description?: string;
  type: string;
  sort_order: string;
  image?: File | null;
};

const defaultValues: Partial<FormType> = {
  name: "",
  slug: "",
  description: "",
  type: "select",
  sort_order: "custom",
  image: undefined,
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

const EditAttributeForm = ({ attribute: initialAttributeData }: { attribute: Attribute }) => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : undefined;
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [existingImageUrl, setExistingImageUrl] = useState<string | undefined>(undefined);

  const { data: fetchedAttribute, error: fetchError } = useFetch(
    id ? `attributeDetails-${id}` : null,
    () => getAttributeDetails(id!),
    { enabled: !!id }
  );

  const attribute = fetchedAttribute?.data?.attribute || initialAttributeData;

  const { control, formState, handleSubmit, setValue, reset, setError } = useForm<FormType>({
    mode: "all",
    defaultValues: defaultValues as FormType,
    resolver: zodResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;

  const { trigger: triggerUpdateAttribute, isMutating } = usePost(
    `updateAttribute-${id}`,
    (data: UpdateAttributeData) => updateAttribute(id!, data)
  );

  useEffect(() => {
    if (attribute) {
      reset({
        name: attribute.name || "",
        slug: attribute.slug || "",
        description: attribute.description || "",
        type: attribute.type || "select",
        sort_order: attribute.sort_order?.toString() || "custom",
        image: undefined,
      });
      setExistingImageUrl((attribute as any).image_url || undefined);
    } else if (fetchError) {
      showSnackbar("Failed to load attribute data.", "error");
    }
  }, [attribute, reset, fetchError, showSnackbar]);

  const onSubmit = async (formData: FormType) => {
    if (!id) {
      showSnackbar("Attribute ID is missing.", "error");
      return;
    }
    setIsLoading(true);

    const dataToUpdate: UpdateAttributeData = {
      ...(dirtyFields.name && { name: formData.name }),
      ...(dirtyFields.slug && { slug: formData.slug }),
      ...(dirtyFields.description && { description: formData.description }),
      ...(dirtyFields.type && { type: formData.type }),
      ...(dirtyFields.sort_order && { sort_order: formData.sort_order }),
      ...(formData.image instanceof File && { image: formData.image }),
    };

    const hasChanges = Object.keys(dataToUpdate).length > 0;

    if (!hasChanges) {
      showSnackbar("No changes detected.", "info");
      setIsLoading(false);
      return;
    }

    try {
      await triggerUpdateAttribute(dataToUpdate);
      showSnackbar("Attribute updated successfully!", "success");
      router.push("/apps/attribute");
    } catch (error: any) {
      if (error?.errors) {
        showSnackbar(error?.errors[0]?.msg, "error");
      } else {
        const errorMessage = error?.message || "An unexpected error occurred during update";
        showSnackbar(errorMessage, "error");
      }
      const errorData = error || error;
      if (errorData?.error && typeof errorData.error === "object") {
        Object.entries(errorData.error).forEach(([field, message]) => {
          if (typeof message === "string") {
            setError(field as keyof FormType, { type: "manual", message });
          }
        });
      } else {
        setError("root", { type: "manual", message: error?.message || "Failed to update attribute." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExistingImage = async () => {
    if (!id) {
      showSnackbar("Attribute ID is missing.", "error");
      return;
    }
    setIsDeletingImage(true);
    try {
      const response = await removeAttributeImage(id);
      showSnackbar(response.message || "Image removed successfully!", "success");
      setExistingImageUrl(undefined);
      setValue('image', undefined, { shouldValidate: true });
    } catch (err: any) {
      showSnackbar(err.message || "Failed to remove image.", "error");
    } finally {
      setIsDeletingImage(false);
    }
  };

  if (!attribute && !fetchError && id) {
    return <Typography>Loading attribute data...</Typography>;
  }
  if (fetchError) {
    return <Alert severity="error">Failed to load attribute data. Please try again later.</Alert>;
  }
  if (!attribute) {
    return <Alert severity="error">Attribute data not available.</Alert>;
  }

  return (
    <div className="md:px-64 p-4">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          Edit Attribute
        </Typography>
      </div>

      <form
        name="attributeForm"
        noValidate
        className="flex w-full flex-col justify-center space-y-6"
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
          existingImage={existingImageUrl}
          onDelete={handleDeleteExistingImage}
          isDeleting={isDeletingImage}
        />

        <AppButton
          label="Update"
          loading={isLoading || isMutating}
          type="submit"
          fullWidth
          size="large"
          disabled={!dirtyFields || !isValid || isMutating || isLoading}
          className="mt-4 w-full"
        />
      </form>
    </div>
  );
};

export default EditAttributeForm;
