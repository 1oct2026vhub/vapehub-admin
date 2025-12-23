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
import FormFileUploadField from "@/components/Shared/FormFileUploadField";

// Image validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"];
const REQUIRED_WIDTH = 58;
const REQUIRED_HEIGHT = 58;

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
    .any()
    .optional()
    .nullable()
    .refine((file) => {
      if (!file || typeof file === 'string') return true; // Allow existing image URL (string) or no file
      if (!(file instanceof File)) return true; // Should be a File object if new
      return file.size <= MAX_FILE_SIZE;
    }, `Max image size is 5MB.`)
    .refine((file) => {
      if (!file || typeof file === 'string') return true;
      if (!(file instanceof File)) return true;
      return ACCEPTED_IMAGE_TYPES.includes(file.type);
    }, "Only .jpg, .jpeg, .png, .webp, and .svg formats are supported.")
    .refine(async (file) => {
      if (!file || typeof file === 'string') return true; // Allow existing image URL or no new file
      if (!(file instanceof File)) return true; // Not a file, so skip dimension check for this path
      
      return new Promise<boolean>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            resolve(img.naturalWidth === REQUIRED_WIDTH && img.naturalHeight === REQUIRED_HEIGHT);
          };
          img.onerror = () => resolve(false);
          if (e.target?.result) {
            img.src = e.target.result as string;
          } else {
            resolve(false); // Could not read file result
          }
        };
        reader.onerror = () => resolve(false);
        reader.readAsDataURL(file);
      });
    }, `Image dimensions must be ${REQUIRED_WIDTH}px x ${REQUIRED_HEIGHT}px.`),
});

export type FormType = {
  name: string;
  slug: string;
  description?: string;
  type: string;
  sort_order: string;
  image?: File | string | null;
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

const EditAttributeForm = ({ attribute: initialAttributeData }: { attribute?: Attribute }) => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : undefined;
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  const { data: fetchedAttribute, error: fetchError, isLoading: isFetchingAttribute } = useFetch(
    id ? `attributeDetails-${id}` : null,
    () => getAttributeDetails(id!),
    { enabled: !!id, revalidateOnFocus: false }
  );

  // The API returns data directly, not nested under 'attribute'
  const attribute = fetchedAttribute?.data || initialAttributeData;

  const { control, formState, handleSubmit, setValue, reset, setError } = useForm<FormType>({
    mode: "all",
    defaultValues,
    resolver: zodResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;

  const { trigger: triggerUpdateAttribute, isMutating } = usePost(
    `updateAttribute-${id}`,
    (data: UpdateAttributeData) => updateAttribute(id!, data)
  );

  useEffect(() => {
    if (attribute) {
      console.log("Populating form with attribute data:", attribute);
      const defaultImageData = (attribute as any).image_url || null;
      const formData = {
        name: attribute.name || "",
        slug: attribute.slug || "",
        description: attribute.description || "",
        type: attribute.type || "select",
        sort_order: attribute.sort_order?.toString() || "custom",
        image: defaultImageData,
      };
      console.log("Form data being set:", formData);
      reset(formData);
      setNewImageFile(null);
    } else if (fetchError) {
      showSnackbar("Failed to load attribute data.", "error");
    }
  }, [attribute, reset, fetchError, showSnackbar]);

  const handleFileChange = (file: File | null) => {
    setNewImageFile(file);
    setValue("image", file, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (formData: FormType) => {
    if (!id) {
      showSnackbar("Attribute ID is missing.", "error");
      return;
    }
    setIsLoading(true);

    const dataToUpdate: UpdateAttributeData = {};
    if (dirtyFields.name) dataToUpdate.name = formData.name;
    if (dirtyFields.slug) dataToUpdate.slug = formData.slug;
    if (dirtyFields.description || formData.description === '') dataToUpdate.description = formData.description;
    if (dirtyFields.type) dataToUpdate.type = formData.type;
    if (dirtyFields.sort_order) dataToUpdate.sort_order = formData.sort_order;
    
    if (newImageFile) {
      dataToUpdate.image = newImageFile;
    } else if (formData.image === null) {
      // This case is handled by the separate DELETE API call via handleDeleteExistingImage
    }

    const hasTextChanges = (dirtyFields.name || dirtyFields.slug || dirtyFields.description || dirtyFields.type || dirtyFields.sort_order);

    if (!hasTextChanges && !newImageFile && formData.image !== null) {
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
      setValue('image', null, { shouldDirty: true, shouldValidate: true });
      setNewImageFile(null);
    } catch (err: any) {
      showSnackbar(err.message || "Failed to remove image.", "error");
    } finally {
      setIsDeletingImage(false);
    }
  };

  if (isFetchingAttribute && id) {
    return <Typography>Loading attribute data...</Typography>;
  }
  if (fetchError && id) {
    return <Alert severity="error">Failed to load attribute data. Please try again later.</Alert>;
  }
  if (!attribute && !isFetchingAttribute && id) {
    return <Alert severity="error">Attribute not found.</Alert>;
  }
  if (!id) {
    return <Alert severity="error">Attribute ID is missing from URL.</Alert>;
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

        <FormFileUploadField 
          name="image"
          control={control}
          label="Attribute Image (Optional)"
          onFileChange={handleFileChange}
          accept="image/jpeg, image/png, image/webp, image/jpg, image/svg+xml"
          helperText={`Upload an image for the attribute (max 5MB, ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}px).`}
          defaultImage={typeof control._getWatch("image") === 'string' ? control._getWatch("image") : undefined}
        />

        <AppButton
          label="Update"
          loading={isLoading || isMutating}
          type="submit"
          fullWidth
          size="large"
          disabled={!dirtyFields && !newImageFile && control._getWatch("image") !== null || !isValid || isMutating || isLoading}
          className="mt-4 w-full"
        />
      </form>
    </div>
  );
};

export default EditAttributeForm;
