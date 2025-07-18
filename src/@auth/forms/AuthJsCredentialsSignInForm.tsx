"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { z } from "zod";
import _ from "lodash";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Link from "@fuse/core/Link";
import { Alert } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { usePost } from "@/hooks/useFetch";
import { login } from "@/services/apiService";
import { storeAuthToken, storeUser } from "@/utils/auth";
import { useRouter } from "next/navigation";
import { useSnackbar } from "@/contexts/SnackbarContext";

/**
 * Validation Schema using Zod
 */
const schema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean(),
});

const defaultValues = {
  email: "",
  password: "",
  remember: false,
};

function AuthJsCredentialsSignInForm() {
  const {
    control,
    formState: { isValid, dirtyFields, errors },
    handleSubmit,
    setValue,
    watch,
  } = useForm({
    mode: "all",
    defaultValues,
    resolver: zodResolver(schema),
  });

  const { trigger: triggerLogin, isMutating } = usePost("login", login);
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  // Watch form values
  const email = watch("email");
  const password = watch("password");
  const remember = watch("remember");

  // Load saved credentials from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail") || "";
    const savedPassword = localStorage.getItem("rememberedPassword") || "";
    const savedRemember = localStorage.getItem("rememberMe") === "true";

    if (savedRemember) {
      setValue("email", savedEmail);
      setValue("password", savedPassword);
      setValue("remember", true);
    }
  }, [setValue]);

  async function onSubmit(formData) {
    const { email, password, remember } = formData;

    try {
      const result = await triggerLogin({ email, password });

      // Store token
      storeAuthToken(result?.data?.accessToken);

      // Store user info
      storeUser(result?.data);

      // Save credentials if "Remember Me" is checked
      if (remember) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("rememberedPassword", password);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
        localStorage.removeItem("rememberMe");
      }

      showSnackbar("Login successful! Redirecting...", "success");
      router.replace("/dashboards/admin");
      // router.push("/dashboards/project");
    } catch (error) {
      console.log("Login Error:", error);
      showSnackbar(
        error?.message || "Login failed. Please try again.",
        "error"
      );
    }
  }

  return (
    <form
      name="loginForm"
      noValidate
      className="flex w-full flex-col justify-center"
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* Show error alert if any */}
      {errors?.root?.message && (
        <Alert className="mb-8" severity="error">
          {errors.root.message}
        </Alert>
      )}

      {/* Email Field */}
      <FormInputField
        name="email"
        control={control}
        label="Email"
        type="email"
        autoFocus
        required
      />

      {/* Password Field */}
      <FormInputField
        name="password"
        control={control}
        label="Password"
        type="password"
        required
      />

      {/* Remember Me & Forgot Password */}
      <div className="flex flex-col items-center justify-center sm:flex-row sm:justify-between">
        <Controller
          name="remember"
          control={control}
          render={({ field }) => (
            <FormControl>
              <FormControlLabel
                label="Remember me"
                control={
                  <Checkbox
                    {...field}
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    sx={{
                      "&.Mui-checked": {
                        color: "#2E9970",
                      },
                    }}
                  />
                }
              />
            </FormControl>
          )}
        />
        <Link
          className="text-md font-medium text-[#2E9970]"
          to="/forgot-password"
        >
          Forgot password?
        </Link>
      </div>

      {/* Sign-in Button */}
      <AppButton
        label={isMutating ? "Signing in..." : "Sign in"}
        type="submit"
        fullWidth
        size="large"
        disabled={
          isMutating || (!isValid && !(remember && email && password)) // Enable button if "Remember Me" is checked and fields are filled
        }
        className={`mt-4 w-full ${
          isMutating || (!isValid && !(remember && email && password))
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer"
        }`}
      />
    </form>
  );
}

export default AuthJsCredentialsSignInForm;
