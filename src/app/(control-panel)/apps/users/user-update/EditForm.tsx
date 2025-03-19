"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import _ from "lodash";
import { useRouter } from "next/navigation";
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  FormHelperText,
  Alert,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { updateUser } from "@/services/apiService";
import { useSnackbar } from "@/contexts/SnackbarContext";
import Header from "./Header";
import FormSelectField from "@/components/Shared/SelectField";
import FormRadioGroup from "@/components/Shared/RadioButton";
import FormDatePicker from "@/components/Shared/FormDatePicker";

// Validation Schema
const schema = z.object({
  first_name: z.string().nonempty("First Name is required"),
  last_name: z.string().nonempty("Last Name is required"),
  // phone: z
  //   .string()
  //   .min(8, { message: "Phone number must be between 8 to 16 digits." }) // Min 8 digits
  //   .regex(/^\+?\d+$/, { message: "Phone number must contain only numbers." }) // Only numbers with optional '+'
  //   .refine((val) => val.replace(/\D/g, "").length <= 16, {
  //     message: "Phone number must not exceed 16 digits.",
  //   }),
  phone: z
    .string()
    .regex(/^\+?\d*$/, { message: "Phone number must contain only numbers." }) // Allows only numbers with optional '+'
    .refine((val) => val.replace(/\D/g, "").length >= 8, {
      message: "Phone number must be between 8 to 16 digits.",
    }) // Ensures at least 8 digits (ignoring '+')
    .refine((val) => val.replace(/\D/g, "").length <= 16, {
      message: "Phone number must not exceed 16 digits.",
    }), // Ensures max 16 digits (ignoring '+')
  dob: z
    .string()
    .min(1, "DOB is required") // Ensures the field is required
    .regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be in YYYY-MM-DD format") // Ensures correct format
    .refine((dob) => {
      const birthDate = new Date(dob);
      const today = new Date();
      return today.getFullYear() - birthDate.getFullYear() >= 18;
    }, "User must be at least 18 years old."),
  roleId: z.preprocess(
    (val) => Number(val),
    z.union([z.literal(1), z.literal(2)]),
  ),
  gender: z.enum(["male", "female", "other"], {
    message: "Gender is required",
  }),
});

// Form Type
export type FormType = {
  first_name: string;
  last_name: string;
  phone: string;
  dob: string;
  roleId: number;
  gender: string;
  id: string;
};

const EditForm = ({ user }: { user: FormType }) => {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  // Form handling
  const { control, formState, handleSubmit, setError, reset } =
    useForm<FormType>({
      mode: "onChange",
      resolver: zodResolver(schema),
    });

  const { isValid, dirtyFields, errors } = formState;

  // Prefill form when user data is available
  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        dob: user.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
        roleId: user.roleId,
        gender: user.gender,
      });
    }
  }, [user, reset]);

  async function onSubmit(formData: FormType) {
    setIsLoading(true); // Start loading
    try {
      const formattedData = { ...formData, roleId: Number(formData.roleId) };
      const response = await updateUser(user?.id, formattedData);
      showSnackbar(response?.message, "success");
      router.push("/apps/users"); // Redirect after successful signup
      return true;
    } catch (error) {
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
  }

  return (
    <div className="md:px-64 p-4">
      <Header />
      <form
        name="editUserForm"
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
          name="first_name"
          control={control}
          label="First Name"
          type="text"
          required
        />
        <FormInputField
          name="last_name"
          control={control}
          label="Last Name"
          type="text"
          required
        />
        {/* <FormInputField name="email" control={control} label="Email" type="email" required /> */}
        <FormInputField
          name="phone"
          control={control}
          label="Phone"
          type="text"
          required
        />
        {/* <FormInputField name="dob" control={control} label="DOB (YYYY-MM-DD)" type="text" required /> */}
        <FormDatePicker
          name="dob"
          control={control}
          label="Date of Birth"
          required
        />
        <FormSelectField
          name="roleId"
          control={control}
          label="Role"
          options={[
            { value: 1, label: "Admin" },
            // { value: 2, label: 'Customer' },
          ]}
          defaultValue={user?.roleId ?? ""} // Default to Customer if not provided
        />

        <FormRadioGroup
          name="gender"
          control={control}
          label="Gender"
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" },
          ]}
          defaultValue={user?.gender ?? ""} // Ensure a valid default value
        />

        {/* Submit Button */}
        <AppButton
          // label={isMutating ? 'Updating...' : 'Update User'}
          label="Update User"
          loading={isLoading}
          type="submit"
          fullWidth
          size="large"
          aria-label="Update"
          className="mt-4 w-full"
        />
      </form>
    </div>
  );
};

export default EditForm;
