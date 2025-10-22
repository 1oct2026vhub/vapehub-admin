"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Box,
  Grid,
  FormControlLabel,
  Switch,
  Typography,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
} from "@mui/material";
import { useRouter } from "next/navigation";
import AppButton from "@/components/Shared/AppButton";
import FormTextField from "@/components/Shared/FormTextField";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import {
  createOrUpdateSetting,
  updateSetting,
  getSettingDetails,
  getLegalContentKeys,
  type Setting,
} from "@/services/apiSetting";
import { useSnackbar } from "@/contexts/SnackbarContext";
import FuseLoading from "@fuse/core/FuseLoading";

const settingsFormSchema = z.object({
  content_key: z.string().min(1, "Content key is required"),
  content: z.string().min(1, "Content is required"),
  is_active: z.boolean().default(true),
});

type SettingsFormType = z.infer<typeof settingsFormSchema>;

interface SettingsFormProps {
  mode: "create" | "edit";
  settingId?: string;
}

export default function SettingsForm({ mode, settingId }: SettingsFormProps) {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [legalContentKeys, setLegalContentKeys] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [existingSetting, setExistingSetting] = useState<Setting | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<SettingsFormType>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      content_key: "",
      content: "",
      is_active: true,
    },
    mode: "onChange",
  });

  const contentKeyValue = watch("content_key");

  // Fetch legal content keys
  useEffect(() => {
    const fetchLegalContentKeys = async () => {
      try {
        const response = await getLegalContentKeys();
        if (response.data?.legal_content_keys) {
          const keysArray = Object.entries(response.data.legal_content_keys).map(
            ([label, value]) => ({
              label,
              value: value as string,
            })
          );
          setLegalContentKeys(keysArray);
        }
      } catch (error: any) {
        showSnackbar(
          error?.message || "Failed to load content keys",
          "error"
        );
      } finally {
        setLoadingKeys(false);
      }
    };

    fetchLegalContentKeys();
  }, [showSnackbar]);

  // Fetch existing setting data in edit mode
  useEffect(() => {
    if (mode === "edit" && settingId) {
      const fetchSettingData = async () => {
        try {
          setIsLoading(true);
          const response = await getSettingDetails(settingId);
          if (response.data) {
            setExistingSetting(response.data);
            reset({
              content_key: response.data.content_key,
              content: response.data.content,
              is_active: response.data.is_active,
            });
          }
        } catch (error: any) {
          showSnackbar(
            error?.message || "Failed to load setting data",
            "error"
          );
          router.push("/apps/settings");
        } finally {
          setIsLoading(false);
        }
      };

      fetchSettingData();
    } else {
      setIsLoading(false);
    }
  }, [mode, settingId, reset, showSnackbar, router]);

  const onSubmit = async (data: SettingsFormType) => {
    try {
      if (mode === "edit" && settingId) {
        // Update existing setting by ID (content_key cannot be changed)
        const updateData = {
          content: data.content,
          is_active: data.is_active,
        };
        const response = await updateSetting(settingId, updateData);
        showSnackbar(
          response.message || "Setting updated successfully!",
          "success"
        );
      } else {
        // Create new setting or update by content_key
        const createData = {
          content_key: data.content_key,
          content: data.content,
          is_active: data.is_active,
        };
        const response = await createOrUpdateSetting(createData);
        showSnackbar(
          response.message || "Setting saved successfully!",
          "success"
        );
      }
      router.push("/apps/settings");
    } catch (error: any) {
      if (error?.response?.data?.error) {
        const errorData = error.response.data.error;
        if (typeof errorData === "object") {
          Object.entries(errorData).forEach(([field, message]) => {
            if (typeof message === "string") {
              showSnackbar(`${field}: ${message}`, "error");
            }
          });
        } else {
          showSnackbar(errorData || "Failed to save setting", "error");
        }
      } else {
        showSnackbar(
          error?.message || "Failed to save setting",
          "error"
        );
      }
    }
  };

  const handleCancel = () => {
    router.push("/apps/settings");
  };

  if (isLoading || loadingKeys) {
    return <FuseLoading />;
  }

  const pageTitle = mode === "edit" ? "Edit Setting" : "Create Setting";
  const submitButtonText = isSubmitting
    ? mode === "edit"
      ? "Updating..."
      : "Creating..."
    : mode === "edit"
    ? "Update Setting"
    : "Create Setting";

  return (
    <div className="mt-10 px-10 mb-10">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          {pageTitle}
        </Typography>
      </div>

      <Paper className="flex flex-col flex-auto shadow-1 rounded-lg overflow-hidden w-full p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl
                fullWidth
                size="small"
                error={!!errors.content_key}
                disabled={mode === "edit"} // Disable in edit mode
              >
                <InputLabel id="content-key-label">
                  Content Key <span style={{ color: "red" }}>*</span>
                </InputLabel>
                <Select
                  labelId="content-key-label"
                  value={contentKeyValue}
                  label="Content Key *"
                  onChange={(e) => {
                    reset({
                      ...watch(),
                      content_key: e.target.value,
                    });
                  }}
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: errors.content_key ? "#d32f2f" : undefined,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: errors.content_key ? "#d32f2f" : undefined,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: errors.content_key ? "#d32f2f" : "#2E9970",
                    },
                  }}
                >
                  {legalContentKeys.map((key) => (
                    <MenuItem key={key.value} value={key.value}>
                      {key.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.content_key && (
                  <FormHelperText error>
                    {errors.content_key.message}
                  </FormHelperText>
                )}
                {mode === "edit" && (
                  <FormHelperText>
                    Content key cannot be changed in edit mode
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormCKEditor
                name="content"
                control={control}
                label="Content"
                required
                defaultValue={existingSetting?.content || ""}
              />
              {/* {errors.content && (
                <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                  {errors.content.message}
                </Typography>
              )} */}
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={watch("is_active")}
                    onChange={(e) => {
                      reset({
                        ...watch(),
                        is_active: e.target.checked,
                      });
                    }}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "#2E9970",
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        {
                          backgroundColor: "#2E9970",
                        },
                    }}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "flex-end",
              mt: 4,
            }}
          >
            <AppButton
              label="Cancel"
              onClick={handleCancel}
              variant="text"
              disabled={isSubmitting}
            />
            <AppButton
              label={submitButtonText}
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            />
          </Box>
        </form>
      </Paper>
    </div>
  );
}
