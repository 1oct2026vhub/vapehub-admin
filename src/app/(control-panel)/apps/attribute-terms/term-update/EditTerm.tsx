"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Alert, Typography } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { usePost, useFetch } from "@/hooks/useFetch";
import {
  getAttributeTermDetails,
  updateAttributeTerm,
} from "@/services/apiAttributeTerm";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useEffect, useState } from "react";

const schema = z.object({
  name: z.string().min(1, "Term Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
});

const defaultValues = {
  name: "",
  slug: "",
  description: "",
};

export type FormType = z.infer<typeof schema>;

interface EditTermProps {
  id: string;
}

function EditTerm({ id }: EditTermProps) {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch term details
  const { data: termData } = useFetch(
    ["termDetail", id],
    () => getAttributeTermDetails(id),
    { revalidateOnFocus: false },
  );

  const term = termData?.data;
  const { control, formState, handleSubmit, reset } = useForm<FormType>({
    mode: "onChange",
    defaultValues,
    resolver: zodResolver(schema),
  });

  // Prefill form when term data is available
  useEffect(() => {
    if (term) {
      reset({
        name: term?.attribute?.name,
        slug: term?.attribute?.slug,
        description: term.description || "",
      });
    }
  }, [term, reset]);

  const { isValid, errors } = formState;
  const { trigger: triggerUpdateTerm } = usePost(
    "updateTerm",
    updateAttributeTerm,
  );

  const onSubmit = async (formData: FormType) => {
    try {
      setIsLoading(true);
      await triggerUpdateTerm(id, formData);
      showSnackbar("Term updated successfully!", "success");
      router.push("/apps/attribute-terms");
    } catch (error: any) {
      if (error?.errors) {
        showSnackbar(error?.errors[0]?.msg, "error");
      } else {
        const errorMessage = error?.message || "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // if (!term) {
  //   return <Typography>Loading...</Typography>;
  // }

  return (
    <div className="md:px-64 p-4">
      <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-8 mt-8">
        Edit Term
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

        <AppButton
          label="Update"
          loading={isLoading}
          type="submit"
          fullWidth
          size="large"
          // disabled={!isValid}
          className="mt-4 w-full"
        />
      </form>
    </div>
  );
}

export default EditTerm;
