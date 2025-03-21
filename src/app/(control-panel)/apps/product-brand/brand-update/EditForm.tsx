"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Alert, Typography } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormFileUpload from "@/components/Shared/FormFileUpload";
import { usePost, useFetch } from "@/hooks/useFetch";
import { updateBrand, brandDetails } from "@/services/apiProductBrand";
import { useSnackbar } from "@/contexts/SnackbarContext";
import axiosInstance from "@/utils/axiosApi";

const schema = z.object({
  name: z.string().min(1, "Brand Name is required").max(50, "Name must be less than 50 characters"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  logo: z.instanceof(File).optional(),
});

const defaultValues = {
  name: "",
  slug: "",
  description: "",
  logo: null,
};

export type FormType = {
  name: string;
  slug: string;
  description?: string;
  logo?: File;
  logo_url?: string;
};

const EditBrandForm = ({ brand }: { brand: FormType }) => {
  const router = useRouter();
  const { id } = useParams();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  const { control, formState, handleSubmit, setValue, watch } = useForm({
    mode: "all",
    defaultValues,
    resolver: zodResolver(schema),
  });

  // Watch the name field to display character count
  const nameValue = watch("name") || "";
  const nameLength = nameValue.length;
  const nameRemaining = 50 - nameLength;

  const { isValid, errors } = formState;
  const { trigger: triggerUpdateBrand, isMutating } = usePost(
    "updateBrand",
    updateBrand,
  );

  // Prefill form when brand data is available
  useEffect(() => {
    if (brand) {
      setValue("name", brand.name);
      setValue("slug", brand.slug);
      setValue("description", brand.description || "");
    }
  }, [brand, setValue]);

  // async function onSubmit(formData: FormType) {
  //     setIsLoading(true);

  //     try {
  //         const formDataObj = new FormData();

  //         // Ensure required fields are present and properly formatted
  //         if (!formData.name || !formData.slug) {
  //             throw new Error('Name and slug are required fields');
  //         }

  //         // Append each field to FormData
  //         formDataObj.append('name', formData.name.trim());
  //         formDataObj.append('slug', formData.slug.toLowerCase().replace(/\s+/g, '-'));

  //         if (formData.description) {
  //             formDataObj.append('description', formData.description);
  //         }

  //         if (formData.logo instanceof File) {
  //             formDataObj.append('logo', formData.logo);
  //         }

  //         // Log the form data for debugging
  //         for (let [key, value] of formDataObj.entries()) {
  //             console.log(`${key}:`, value);
  //         }

  //         // Make the API call with proper configuration
  //         const response = await axiosInstance.put(`/api/admin/brand/${id}`, formDataObj, {
  //             headers: {
  //                 'Content-Type': 'multipart/form-data',
  //             },
  //         });

  //         if (response.data.success) {
  //             showSnackbar('Brand updated successfully!', 'success');
  //             router.push('/apps/product-brand');
  //         } else {
  //             throw new Error(response.data.message || 'Failed to update brand');
  //         }
  //     } catch (error) {
  //         console.error('Update error:', error);
  //         showSnackbar(error?.message || 'An unexpected error occurred', 'error');
  //     } finally {
  //         setIsLoading(false);
  //     }
  // }

  const onSubmit = async (formData: FormType) => {
    setIsLoading(true);

    try {
      const formDataObj = new FormData();

      // Ensure required fields are present and properly formatted
      if (!formData.name || !formData.slug) {
        throw new Error("Name and slug are required fields");
      }

      // Append each field to FormData
      formDataObj.append("name", formData.name.trim());
      formDataObj.append(
        "slug",
        formData.slug.toLowerCase().replace(/\s+/g, "-"),
      );

      if (formData.description) {
        formDataObj.append("description", formData.description);
      }

      if (formData.logo instanceof File) {
        formDataObj.append("logo", formData.logo);
      }

      // Debugging: Log form data
      for (let [key, value] of formDataObj.entries()) {
        console.log(`${key}:`, value);
      }

      // ✅ Use the API service function instead of direct API call
      const response = await updateBrand(id, formDataObj);

      showSnackbar("Brand updated successfully!", "success");
      router.push("/apps/product-brand");
    } catch (error) {
      console.error("Update error:", error);
      showSnackbar(error || "An unexpected error occurred", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="md:px-64 p-4">
      <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-8 mt-8">
        Edit Brand
      </Typography>

      {isLoading && <p>Loading brand data...</p>}

      {!isLoading && (
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

          <FormInputField
            name="name"
            control={control}
            label="Brand Name"
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
          <FormFileUpload
            name="logo"
            control={control}
            label="Brand Logo"
            setValue={setValue}
            existingImage={brand?.logo_url}
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

export default EditBrandForm;
