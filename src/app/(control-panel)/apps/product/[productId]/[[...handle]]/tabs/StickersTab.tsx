"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";
import { useProductForm } from "../ProductFormContext";
import { getProduct, updateProduct } from "@/services/apiProduct";
import { useSnackbar } from "@/contexts/SnackbarContext";
import AppButton from "@/components/Shared/AppButton";
import StickerPreviewChip from "@/components/Shared/StickerPreviewChip";
import {
  HEX_COLOR_REGEX,
  getStickerStatusLabel,
  type ProductSticker,
  type StickerMode,
  type StickerWritePayload,
} from "@/types/productSticker";

type ManualFields = {
  name: string;
  background_color: string;
  active_from: string | null;
  active_until: string | null;
};

const EMPTY_MANUAL: ManualFields = {
  name: "",
  background_color: "#000000",
  active_from: null,
  active_until: null,
};

function sourceLabel(source: string): string {
  switch (source) {
    case "manual":
      return "Manual";
    case "auto_new":
      return "Auto — NEW";
    case "auto_new_flavours":
      return "Auto — NEW FLAVOURS";
    default:
      return source;
  }
}

function buildWritePayload(fields: ManualFields): StickerWritePayload | null {
  const name = fields.name.trim();
  if (!name || !fields.active_until) return null;
  if (!HEX_COLOR_REGEX.test(fields.background_color)) return null;

  const payload: StickerWritePayload = {
    name: name.slice(0, 64),
    background_color: fields.background_color.toUpperCase(),
    active_until: fields.active_until,
  };
  if (fields.active_from) {
    payload.active_from = fields.active_from;
  }
  return payload;
}

const StickersTab: React.FC = () => {
  const { formData, updateFormData } = useProductForm();
  const { showSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<StickerMode>("auto");
  const [currentSticker, setCurrentSticker] = useState<ProductSticker>(null);
  const [manual, setManual] = useState<ManualFields>(EMPTY_MANUAL);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [initialMode, setInitialMode] = useState<StickerMode>("auto");

  const productId = formData.productId;
  const isCreate = !productId;

  const hydrateFromSticker = useCallback((sticker: ProductSticker) => {
    setCurrentSticker(sticker);
    if (!sticker) {
      setMode("auto");
      setInitialMode("auto");
      setManual(EMPTY_MANUAL);
      return;
    }

    if (sticker.source === "manual") {
      setMode("manual");
      setInitialMode("manual");
      setManual({
        name: sticker.name,
        background_color: sticker.background_color,
        active_from: sticker.active_from,
        active_until: sticker.active_until,
      });
    } else {
      // Auto sticker: show read-only; admin can override or clear
      setMode("auto");
      setInitialMode("auto");
      setManual({
        name: sticker.name,
        background_color: sticker.background_color,
        active_from: sticker.active_from,
        active_until: sticker.active_until,
      });
    }
  }, []);

  const loadSticker = useCallback(async () => {
    if (!productId) {
      // Prefer values already staged in form context (create flow)
      if (formData.clear_sticker) {
        setMode("clear");
        setInitialMode("clear");
        setCurrentSticker(null);
        setManual(EMPTY_MANUAL);
      } else if (formData.sticker) {
        setMode("manual");
        setInitialMode("manual");
        setManual({
          name: formData.sticker.name,
          background_color: formData.sticker.background_color,
          active_from: formData.sticker.active_from ?? null,
          active_until: formData.sticker.active_until,
        });
        setCurrentSticker(null);
      } else {
        setMode("auto");
        setInitialMode("auto");
        setCurrentSticker(null);
        setManual(EMPTY_MANUAL);
      }
      setDirty(false);
      return;
    }

    setLoading(true);
    try {
      const response = await getProduct(productId);
      const sticker = (response?.data?.sticker ?? null) as ProductSticker;
      hydrateFromSticker(sticker);
      updateFormData({
        sticker: sticker
          ? {
              name: sticker.name,
              background_color: sticker.background_color,
              active_from: sticker.active_from,
              active_until: sticker.active_until,
            }
          : undefined,
        clear_sticker: false,
        currentSticker: sticker,
        stickerMode: sticker?.source === "manual" ? "manual" : "auto",
        stickerDirty: false,
      });
      setDirty(false);
    } catch (error) {
      console.error("Failed to load product sticker:", error);
      showSnackbar("Failed to load product sticker", "error");
    } finally {
      setLoading(false);
    }
  }, [productId, formData.clear_sticker, formData.sticker, hydrateFromSticker, updateFormData, showSnackbar]);

  useEffect(() => {
    loadSticker();
    // Only re-fetch when product id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const validateManual = (): boolean => {
    const errors: Record<string, string> = {};
    const name = manual.name.trim();
    if (!name) errors.name = "Sticker name is required";
    else if (name.length > 64) errors.name = "Max 64 characters";

    if (!HEX_COLOR_REGEX.test(manual.background_color)) {
      errors.background_color = "Must be a valid hex colour (#RRGGBB)";
    }
    if (!manual.active_until) {
      errors.active_until = "Active until is required";
    } else if (manual.active_from) {
      const from = new Date(manual.active_from).getTime();
      const until = new Date(manual.active_until).getTime();
      if (!Number.isNaN(from) && !Number.isNaN(until) && until <= from) {
        errors.active_until = "Active until must be after active from";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const syncToContext = (nextMode: StickerMode, nextManual: ManualFields) => {
    if (nextMode === "clear") {
      updateFormData({
        sticker: undefined,
        clear_sticker: true,
        stickerMode: "clear",
        stickerDirty: true,
      });
      return;
    }
    if (nextMode === "manual") {
      const payload = buildWritePayload(nextManual);
      updateFormData({
        sticker: payload ?? undefined,
        clear_sticker: false,
        stickerMode: "manual",
        stickerDirty: true,
      });
      return;
    }
    // auto — omit sticker fields so auto rules / leave unchanged apply
    updateFormData({
      sticker: undefined,
      clear_sticker: false,
      stickerMode: "auto",
      stickerDirty: nextMode !== initialMode || dirty,
    });
  };

  const handleModeChange = (next: StickerMode) => {
    setMode(next);
    setDirty(true);
    setFieldErrors({});
    if (next === "manual" && !manual.name && currentSticker) {
      const nextManual = {
        name: currentSticker.name,
        background_color: currentSticker.background_color,
        active_from: currentSticker.active_from,
        active_until: currentSticker.active_until,
      };
      setManual(nextManual);
      syncToContext(next, nextManual);
      return;
    }
    syncToContext(next, manual);
  };

  const updateManual = (patch: Partial<ManualFields>) => {
    const next = { ...manual, ...patch };
    setManual(next);
    setDirty(true);
    syncToContext("manual", next);
  };

  const statusChip = useMemo(() => {
    if (!currentSticker) return null;
    const status = getStickerStatusLabel(currentSticker);
    const color =
      status === "Active" ? "success" : status === "Scheduled" ? "warning" : "default";
    return <Chip size="small" label={status} color={color} />;
  }, [currentSticker]);

  const handleSave = async () => {
    if (mode === "manual" && !validateManual()) return;

    // Create flow: stage into context; Basic Info submit will send it
    if (isCreate) {
      syncToContext(mode, manual);
      setDirty(false);
      showSnackbar(
        mode === "clear"
          ? "Sticker will be cleared on create (auto NEW will not apply)"
          : mode === "manual"
            ? "Manual sticker will be saved with the product"
            : "Auto sticker rules may apply on create",
        "success"
      );
      return;
    }

    setSaving(true);
    try {
      let payload: { sticker?: StickerWritePayload | null; clear_sticker?: boolean } = {};

      if (mode === "clear") {
        payload = { clear_sticker: true };
      } else if (mode === "manual") {
        const sticker = buildWritePayload(manual);
        if (!sticker) {
          validateManual();
          setSaving(false);
          return;
        }
        payload = { sticker };
      } else {
        // Auto / leave unchanged — if currently manual and switching to auto without clear,
        // we leave unchanged (omit). If they want to remove manual they use Clear.
        if (!dirty && mode === initialMode) {
          showSnackbar("No sticker changes to save", "info");
          setSaving(false);
          return;
        }
        // Switching to auto without clearing leaves existing sticker as-is
        showSnackbar(
          "Sticker left unchanged. Use Clear to remove, or Manual to override.",
          "info"
        );
        setSaving(false);
        setDirty(false);
        updateFormData({ stickerDirty: false, stickerMode: "auto" });
        return;
      }

      const response = await updateProduct(productId!, payload);
      const nextSticker = (response?.data?.sticker ?? null) as ProductSticker;
      hydrateFromSticker(nextSticker);
      updateFormData({
        currentSticker: nextSticker,
        sticker: nextSticker
          ? {
              name: nextSticker.name,
              background_color: nextSticker.background_color,
              active_from: nextSticker.active_from,
              active_until: nextSticker.active_until,
            }
          : undefined,
        clear_sticker: false,
        stickerMode: nextSticker?.source === "manual" ? "manual" : "auto",
        stickerDirty: false,
      });
      setDirty(false);
      showSnackbar(response?.message || "Product sticker updated successfully", "success");
    } catch (error: any) {
      const message =
        error?.message ||
        error?.error?.message ||
        "Failed to update product sticker";
      showSnackbar(message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box className="flex justify-center py-12">
        <CircularProgress />
      </Box>
    );
  }

  const showAutoReadonly =
    mode === "auto" &&
    currentSticker &&
    (currentSticker.source === "auto_new" ||
      currentSticker.source === "auto_new_flavours");

  const previewName =
    mode === "manual"
      ? manual.name
      : currentSticker?.name || manual.name || "Preview";
  const previewColor =
    mode === "manual"
      ? manual.background_color
      : currentSticker?.background_color || manual.background_color || "#000000";

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, bgcolor: "white" }}>
      <Box className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <Typography variant="h6" fontWeight={700}>
          Product card sticker
        </Typography>
        {(mode === "manual" || currentSticker) && (
          <StickerPreviewChip name={previewName} backgroundColor={previewColor} />
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        A manual sticker is not overwritten by NEW / NEW FLAVOURS rules.
      </Typography>

      {isCreate && (
        <Alert severity="info" sx={{ mb: 2 }}>
          On create: <strong>Auto</strong> lets the NEW rule apply,{" "}
          <strong>Manual</strong> sets a sticker, <strong>None / Clear</strong>{" "}
          prevents auto NEW. Save Basic Info to create the product — or save
          sticker here to stage it first.
        </Alert>
      )}

      {currentSticker && (
        <Box className="flex flex-wrap items-center gap-2 mb-3">
          <Chip size="small" label={sourceLabel(currentSticker.source)} variant="outlined" />
          {statusChip}
          <Typography variant="caption" color="text.secondary">
            {dayjs(currentSticker.active_from).format("DD MMM YYYY HH:mm")} →{" "}
            {dayjs(currentSticker.active_until).format("DD MMM YYYY HH:mm")}
          </Typography>
        </Box>
      )}

      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <RadioGroup
          row
          value={mode}
          onChange={(e) => handleModeChange(e.target.value as StickerMode)}
        >
          <FormControlLabel value="auto" control={<Radio />} label="Auto" />
          <FormControlLabel value="manual" control={<Radio />} label="Manual" />
          <FormControlLabel
            value="clear"
            control={<Radio />}
            label={isCreate ? "None / Clear" : "Clear sticker"}
          />
        </RadioGroup>
        <FormHelperText>
          {mode === "auto" &&
            (isCreate
              ? "Do not send a sticker — NEW rule may apply after save."
              : "Leave sticker unchanged (auto rules will not overwrite a manual sticker).")}
          {mode === "manual" && "Set name, colour, and schedule. Source becomes manual."}
          {mode === "clear" && "Removes the sticker (send clear_sticker: true)."}
        </FormHelperText>
      </FormControl>

      {showAutoReadonly && mode === "auto" && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Current sticker was applied automatically ({sourceLabel(currentSticker!.source)}
          ). Choose <strong>Manual</strong> to override, or <strong>Clear sticker</strong>{" "}
          to remove it.
        </Alert>
      )}

      {mode === "manual" && (
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Sticker text"
              required
              value={manual.name}
              onChange={(e) => updateManual({ name: e.target.value })}
              error={!!fieldErrors.name}
              helperText={fieldErrors.name}
              inputProps={{ maxLength: 64 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box className="flex gap-2 items-start">
              <TextField
                type="color"
                size="small"
                value={
                  HEX_COLOR_REGEX.test(manual.background_color)
                    ? manual.background_color
                    : "#000000"
                }
                onChange={(e) =>
                  updateManual({ background_color: e.target.value.toUpperCase() })
                }
                sx={{ width: 64 }}
                inputProps={{ "aria-label": "Colour picker" }}
              />
              <TextField
                fullWidth
                size="small"
                label="Background colour"
                required
                value={manual.background_color}
                onChange={(e) =>
                  updateManual({ background_color: e.target.value.toUpperCase() })
                }
                error={!!fieldErrors.background_color}
                helperText={fieldErrors.background_color || "#RRGGBB"}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Active from (optional)"
                value={manual.active_from ? dayjs(manual.active_from) : null}
                onChange={(value: Dayjs | null) =>
                  updateManual({
                    active_from: value?.isValid() ? value.toISOString() : null,
                  })
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    helperText: "Defaults to now on the server if empty",
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Active until"
                value={manual.active_until ? dayjs(manual.active_until) : null}
                onChange={(value: Dayjs | null) =>
                  updateManual({
                    active_until: value?.isValid() ? value.toISOString() : null,
                  })
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    required: true,
                    error: !!fieldErrors.active_until,
                    helperText: fieldErrors.active_until,
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      )}

      {mode === "clear" && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {isCreate
            ? "No sticker will be set, and auto NEW will not apply on create."
            : "Saving will remove the current sticker from this product."}
        </Alert>
      )}

      <Divider sx={{ my: 3 }} />

      <Box className="flex justify-end gap-2">
        {!isCreate && (
          <AppButton
            type="button"
            label="Reload"
            variant="outlined"
            onClick={() => loadSticker()}
            disabled={saving || loading}
          />
        )}
        <AppButton
          type="button"
          label={isCreate ? "Stage sticker" : "Save sticker"}
          onClick={handleSave}
          loading={saving}
          disabled={saving}
        />
      </Box>
    </Paper>
  );
};

export default StickersTab;
