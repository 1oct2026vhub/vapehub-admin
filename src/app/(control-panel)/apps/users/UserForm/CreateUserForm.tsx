"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import _ from "lodash";
import { useRouter } from "next/navigation";
import { Alert } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { usePost } from "@/hooks/useFetch";
import { createUser } from "@/services/apiService";
import { useSnackbar } from "@/contexts/SnackbarContext";
import Header from "./Header";
import { useRoles } from "@/hooks/roleFetch";
import FormSelectField from "@/components/Shared/FormSelectFiled";
import FormRadioGroup from "@/components/Shared/RadioButton";
import FormDatePicker from "@/components/Shared/FormDatePicker";
import { useState } from "react";

const schema = z.object({
  first_name: z.string()
    .min(1, "First Name is required")
    .max(50, "First Name must not exceed 50 characters"),
  last_name: z.string()
    .min(1, "Last Name is required")
    .max(50, "Last Name must not exceed 50 characters"),
  email: z
    .string()
    .min(1, "Email is required") // Ensures the field is required
    .email("Invalid email format"), // Validates email format
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

  password: z
    .string()
    .min(1, "Password is required") // Ensures the field is required
    .min(8, "Password must be at least 8 characters long") // Minimum length validation
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[@$!%*?&]/, "Password must contain at least one special character"),
  dob: z
    .string()
    .min(1, { message: "Date of Birth is required" }) // Ensures the field is required
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "DOB must be in YYYY-MM-DD format",
    }) // Ensures correct format
    .refine(
      (dob) => {
        const birthDate = new Date(dob);
        const today = new Date();
        return today.getFullYear() - birthDate.getFullYear() >= 18;
      },
      { message: "User must be at least 18 years old." },
    ),

  roleId: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)), // Convert non-empty values to numbers
    z
      .number({ required_error: "Role is required" })
      .min(1, "Invalid role ID")
      .max(2, "Invalid role ID"),
  ),
  gender: z.enum(["male", "female", "other"], {
    message: "Gender is required",
  }),
});

const defaultValues = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  phone: "",
  dob: "",
  roleId: "",
  gender: "",
};

export type FormType = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  dob: string;
  roleId: number;
  gender: string;
};

function CreateUserForm() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar(); //Use Snackbar
  const [isLoading, setIsLoading] = useState(false);
  const { roles } = useRoles();

  const { control, formState, handleSubmit, setError } = useForm({
    mode: "all",
    defaultValues,
    resolver: zodResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;
  const { trigger: triggerSignup, isMutating } = usePost("signup", createUser);

  async function onSubmit(formData) {
    setIsLoading(true); // Start loading
    try {
      const formattedData = { ...formData, roleId: Number(formData.roleId) };
      const response = await triggerSignup(formattedData);
      showSnackbar(
        "User created successfully. Please check your email for verification!",
        "success",
      );
      router.push("/apps/users"); // Redirect after successful signup
      return true;
    } catch (error) {
      // console.error('Signup Error:', error); // Log full error object
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
        name="registerForm"
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
        <FormInputField
          name="email"
          control={control}
          label="Email"
          type="email"
          required
        />
        <FormInputField
          name="password"
          control={control}
          label="Password"
          type="password"
          required
        />
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
          options={
            roles
              ? roles
                  .filter(
                    (role) =>
                      role?.is_admin_panel && role.role === "super_admin",
                  ) // Filter first
                  .map((role) => ({
                    value: Number(role.id), // Ensure conversion
                    label: "Admin", // Directly set label as "Admin"
                  }))
              : []
          }
          required
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
        />
        {/* Submit Button */}
        <AppButton
          // label={isMutating ? 'Creating...' : 'Create'}
          label="Create"
          loading={isLoading}
          type="submit"
          fullWidth
          size="large"
          aria-label="Register"
          disabled={_.isEmpty(dirtyFields) || !isValid || isMutating}
          className="mt-4 w-full"
        />
      </form>
    </div>
  );
}

export default CreateUserForm;
