"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Stack,
  FormControl,
  InputLabel,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import AppButton from "@/components/Shared/AppButton";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  listNewsletterTemplates,
  type NewsletterTemplate,
} from "@/services/apiNewsletterTemplates";
import { getAuthToken } from "@/utils/auth";

type StripoMessage =
  | { type: "STRIPO_EDITOR_READY" }
  | {
      type: "STRIPO_SAVE_RESULT";
      success: boolean;
      message?: string;
      templateId?: string;
    };

const CreateEmailBuilderPageClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appliedUrlTemplateRef = useRef(false);
  const urlTemplateMissingNotifiedRef = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [saving, setSaving] = useState(false);
  const { showSnackbar } = useSnackbar();

  const apiBase = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "");

  const pushConfigToIframe = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !apiBase || typeof window === "undefined") return;
    const token = getAuthToken();
    if (!token) {
      showSnackbar("You must be signed in to use the email builder.", "error");
      return;
    }
    win.postMessage(
      {
        type: "STRIPO_ADMIN_CONFIG",
        payload: {
          apiBase,
          token,
          templateId:
            selectedTemplateId && selectedTemplateId !== "__new__"
              ? selectedTemplateId
              : null,
        },
      },
      window.location.origin,
    );
  }, [apiBase, selectedTemplateId, showSnackbar]);

  const refreshTemplates = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await listNewsletterTemplates({ page: 1, pageSize: 100 });
      if (res.success && Array.isArray(res.data)) {
        setTemplates(res.data);
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Failed to load templates";
      showSnackbar(msg, "error");
    } finally {
      setListLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    void refreshTemplates();
  }, [refreshTemplates]);

  const templateIdFromUrl = searchParams.get("templateId");

  useEffect(() => {
    appliedUrlTemplateRef.current = false;
    urlTemplateMissingNotifiedRef.current = false;
  }, [templateIdFromUrl]);

  useEffect(() => {
    if (appliedUrlTemplateRef.current || listLoading || !templateIdFromUrl) {
      return;
    }
    const t = templates.find((x) => x.id === templateIdFromUrl);
    if (!t) {
      if (!listLoading && !urlTemplateMissingNotifiedRef.current) {
        urlTemplateMissingNotifiedRef.current = true;
        showSnackbar(
          "That template was not found in the loaded list. Open it from the Templates page or reload this page.",
          "error",
        );
      }
      return;
    }
    appliedUrlTemplateRef.current = true;
    setSelectedTemplateId(t.id);
    setName(t.name);
    setSubject(t.subject);
    setIframeKey((k) => k + 1);
  }, [templateIdFromUrl, templates, listLoading, showSnackbar]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (typeof window === "undefined" || event.origin !== window.location.origin)
        return;
      const data = event.data as StripoMessage;
      if (!data || typeof data !== "object" || !("type" in data)) return;
      if (data.type === "STRIPO_SAVE_RESULT") {
        setSaving(false);
        if (data.success) {
          if (data.templateId) {
            setSelectedTemplateId(data.templateId);
          }
          showSnackbar(data.message || "Template saved", "success");
          void refreshTemplates();
        } else {
          showSnackbar(data.message || "Save failed", "error");
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [refreshTemplates, showSnackbar]);

  const handleTemplateChange = (e: SelectChangeEvent<string>) => {
    const v = e.target.value;
    setSelectedTemplateId(v);
    if (v && v !== "__new__") {
      const t = templates.find((x) => x.id === v);
      if (t) {
        setName(t.name);
        setSubject(t.subject);
      }
    } else {
      setName("");
      setSubject("");
    }
    setIframeKey((k) => k + 1);
  };

  const handleSaveClick = () => {
    const n = name.trim();
    const s = subject.trim();
    if (!n || !s) {
      showSnackbar("Name and subject are required to save.", "error");
      return;
    }
    const win = iframeRef.current?.contentWindow;
    if (!win) {
      showSnackbar("Editor is not ready.", "error");
      return;
    }
    const token = getAuthToken();
    if (!token || !apiBase) {
      showSnackbar("Missing auth or API configuration.", "error");
      return;
    }
    setSaving(true);
    win.postMessage(
      {
        type: "STRIPO_REQUEST_SAVE",
        payload: {
          apiBase,
          token,
          name: n,
          subject: s,
          id:
            selectedTemplateId && selectedTemplateId !== "__new__"
              ? selectedTemplateId
              : undefined,
        },
      },
      window.location.origin,
    );
  };

  if (!apiBase) {
    return (
      <Box className="p-6">
        <PageBreadcrumb />
        <Typography className="text-3xl font-extrabold leading-none tracking-tight mb-4">
          Create Email Builder
        </Typography>
        <Typography color="error">
          Set <code>NEXT_PUBLIC_BASE_URL</code> to your backend API origin so
          templates can be saved and loaded.
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="p-6">
      <PageBreadcrumb />

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 1,
        }}
      >
        <Typography className="text-3xl font-extrabold leading-none tracking-tight">
          Create Email Builder
        </Typography>
        <AppButton
          type="button"
          variant="outlined"
          label="Templates"
          onClick={() => router.push("/apps/newsletter/templates")}
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Stripo editor with templates stored via your admin API. Auth token is
        passed to the builder iframe only on this origin. Stripo plugin auth
        still uses <code>/api/stripo-token</code>.
      </Typography>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 2, alignItems: { md: "flex-end" }, flexWrap: "wrap" }}
      >
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="template-select-label">Template</InputLabel>
          <Select
            labelId="template-select-label"
            label="Template"
            value={selectedTemplateId || "__new__"}
            onChange={handleTemplateChange}
            disabled={listLoading}
          >
            <MenuItem value="__new__">New template</MenuItem>
            {templates.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          sx={{ minWidth: 200, flex: 1 }}
        />
        <TextField
          size="small"
          label="Email subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          sx={{ minWidth: 220, flex: 1 }}
        />
        <AppButton
          type="button"
          variant="contained"
          label={saving ? "Saving…" : "Save template"}
          loading={saving}
          onClick={handleSaveClick}
        />
      </Stack>

      <Box
        sx={{
          height: "calc(100vh - 320px)",
          minHeight: "700px",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          overflow: "hidden",
          backgroundColor: "#f5f5f7",
        }}
      >
        <iframe
          key={iframeKey}
          ref={iframeRef}
          title="Stripo Email Builder"
          src="/stripo-builder.html"
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="clipboard-read; clipboard-write"
          onLoad={pushConfigToIframe}
        />
      </Box>
    </Box>
  );
};

export default CreateEmailBuilderPageClient;
