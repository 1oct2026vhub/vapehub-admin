"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Paper, Typography, Button, Grid, Box } from "@mui/material";
import FormTextField from "@/components/Shared/FormTextField";
import AppButton from "@/components/Shared/AppButton";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useUpdate } from "@/hooks/useFetch";
import { changePassword } from "@/services/apiService";
import { getUser } from "@/utils/auth";
import { useEffect } from "react";

const schema = z
  .object({
    email: z.string().email("Invalid email format"),
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/\d/, "Password must contain at least one number")
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const ChangePasswordForm = ({ onClose }: { onClose: () => void }) => {
  const { showSnackbar } = useSnackbar();
  const user = getUser();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user?.email) {
      setValue("email", user.email);
    }
  }, [user, setValue]);

  const { trigger: updatePassword, isMutating: isUpdating } = useUpdate(
    "change-password",
    changePassword
  );

  const onSubmit = async (data: FormData) => {
    try {
      await updatePassword(data);
      showSnackbar("Password changed successfully", "success");
      reset();
      onClose();
    } catch (error: any) {
      showSnackbar(error.message || "Failed to change password", "error");
    }
  };

  return (
    <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 3, mt: 4 ,backgroundColor: "white"}}>
      <Typography variant="h6" component="h2" mb={4}>
        Change Password
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormTextField
              name="email"
              label="Email"
              control={control}
              disabled
            />
          </Grid>
          <Grid item xs={12}>
            <FormTextField
              name="currentPassword"
              label="Current Password"
              type="password"
              control={control}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <FormTextField
              name="newPassword"
              label="New Password"
              type="password"
              control={control}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <FormTextField
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              control={control}
              required
            />
          </Grid>
        </Grid>
        <Box display="flex" justifyContent="flex-end" mt={4} gap={2}>
          <Button onClick={onClose} color="secondary">
            Cancel
          </Button>
          <AppButton
            label="Change Password"
            type="submit"
            loading={isUpdating}
            disabled={!isDirty || isUpdating}
          />
        </Box>
      </form>
    </Paper>
  );
};

export default ChangePasswordForm; 