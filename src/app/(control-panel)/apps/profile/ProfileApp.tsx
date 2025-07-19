"use client";

import { styled } from "@mui/material/styles";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SyntheticEvent, useState, useEffect } from "react";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import { useFetch, usePost, useUpdate } from "@/hooks/useFetch";
import { getUserProfile, updateUserProfile } from "@/services/apiService";
import { Paper, Typography, Button, Grid, Box, Modal } from "@mui/material";
import FormTextField from "@/components/Shared/FormTextField";
import AppButton from "@/components/Shared/AppButton";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useSWRConfig } from "swr";
import ChangePasswordForm from "./ChangePasswordForm";

const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function ProfileApp() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { data: user, isLoading } = useFetch("user-profile", getUserProfile);
  const { showSnackbar } = useSnackbar();
  const { mutate } = useSWRConfig();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (user?.data) {
      reset(user.data);
    }
  }, [user, reset]);

  const { trigger: updateUser, isMutating: isUpdating } = useUpdate(
    "user-profile",
    updateUserProfile
  );

  const onSubmit = async (data: FormData) => {
    try {
      await updateUser(data);
      showSnackbar("Profile updated successfully", "success");
      setIsEditMode(false);
      mutate("user-profile");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to update profile", "error");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Paper
      sx={{
        p: 4,
        borderRadius: 2,
        boxShadow: 3,
        backgroundColor: "white",
        textAlign: "center",
        margin: "auto",
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h6" component="h2">
          Personal Information
        </Typography>
        <div className="flex flex-1 justify-end gap-2">
      
        <Button variant="contained" onClick={() => setIsPasswordModalOpen(true)}>
          Change Password
        </Button>
    
        {!isEditMode && (
          <Button onClick={() => setIsEditMode(true)} variant="outlined">
            Edit
          </Button>
        )}
      </div>
      </Box>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormTextField
              name="first_name"
              label="First Name"
              control={control}
              disabled={!isEditMode}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormTextField
              name="last_name"
              label="Last Name"
              control={control}
              disabled={!isEditMode}
            />
          </Grid>
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
              name="phone"
              label="Mobile Number"
              control={control}
              disabled={!isEditMode}
              required
            />
          </Grid>
        </Grid>
        {isEditMode && (
          <Box display="flex" justifyContent="flex-end" mt={4} gap={2}>
            <Button
              onClick={() => {
                setIsEditMode(false);
                reset(user.data);
              }}
              color="secondary"
            >
              Cancel
            </Button>
            <AppButton
              label="Save"
              type="submit"
              loading={isUpdating}
              disabled={!isDirty || isUpdating}
            />
          </Box>
        )}
      </form>
      

      <Modal
        open={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <ChangePasswordForm onClose={() => setIsPasswordModalOpen(false)} />
        </Box>
      </Modal>
    </Paper>
  );
}

export default ProfileApp;
