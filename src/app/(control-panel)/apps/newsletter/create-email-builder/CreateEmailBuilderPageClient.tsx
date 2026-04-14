"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  TextField,
  Stack,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import AppButton from "@/components/Shared/AppButton";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  getNewsletterTemplateById,
} from "@/services/apiNewsletterTemplates";
import {
  sendPromotionalEmail,
  type PromotionalEmailData,
} from "@/services/apiMailSubscriptionSettings";
import { getAuthToken, getUser } from "@/utils/auth";
import SelectUsersModal from "../promotional/_components/SelectUsersModal";

type StripoMessage =
  | { type: "STRIPO_EDITOR_READY" }
  | {
      type: "STRIPO_SAVE_RESULT";
      success: boolean;
      message?: string;
      templateId?: string;
    };

type CreateEmailBuilderPageClientProps = {
  initialTemplateId?: string;
};

const CreateEmailBuilderPageClient = ({
  initialTemplateId,
}: CreateEmailBuilderPageClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [saving, setSaving] = useState(false);
  const { showSnackbar } = useSnackbar();

  // Send newsletter state
  const [selectUsersOpen, setSelectUsersOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const templateIdFromUrl = searchParams.get("templateId") || initialTemplateId || null;

  const apiBase = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "");

  // For new templates there is nothing to fetch; iframe is immediately ready.
  // For edit mode we wait until the metadata fetch completes before mounting.
  const [iframeReady, setIframeReady] = useState(!templateIdFromUrl);

  const pushConfigToIframe = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !apiBase || typeof window === "undefined") return;
    const token = getAuthToken();
    const user = getUser();
    const userId = user?.id ? String(user.id) : "";
    const userRole = user?.role
      ? Array.isArray(user.role)
        ? String(user.role[0] ?? "user")
        : String(user.role)
      : "user";
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
          userId,
          userRole,
          templateId: selectedTemplateId || templateIdFromUrl || null,
        },
      },
      window.location.origin,
    );
  }, [apiBase, selectedTemplateId, templateIdFromUrl, showSnackbar]);

  // Fetch template metadata (name/subject) for prefilling the form fields.
  // The iframe independently fetches the full design from the backend.
  useEffect(() => {
    if (!templateIdFromUrl) {
      setSelectedTemplateId("");
      setName("");
      setSubject("");
      return;
    }

    void (async () => {
      try {
        const res = await getNewsletterTemplateById(templateIdFromUrl);
        if (res.success && res.data) {
          const tpl = res.data;
          setSelectedTemplateId(tpl.id);
          setName(tpl.name ?? "");
          setSubject(tpl.subject ?? "");
          setIframeReady(true);
          setIframeKey((k) => k + 1);
          return;
        }
        showSnackbar("Template not found.", "error");
      } catch (e: unknown) {
        const msg =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: unknown }).message)
            : "Failed to load template.";
        showSnackbar(msg, "error");
      }
    })();
  }, [templateIdFromUrl]);

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
        } else {
          showSnackbar(data.message || "Save failed", "error");
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [showSnackbar]);

  const handleUsersConfirm = (
    emails: string[],
    shouldSendToAll: boolean,
    groupId?: string | null,
  ) => {
    setSelectedEmails(emails);
    setSendToAll(shouldSendToAll);
    setSelectUsersOpen(false);

    const activeTemplateId = selectedTemplateId || templateIdFromUrl;
    if (!activeTemplateId) return;

    void (async () => {
      setIsSending(true);
      try {
        const payload: PromotionalEmailData = {
          templateId: activeTemplateId,
          sendToAll: shouldSendToAll,
        };
        if (!shouldSendToAll) {
          if (groupId) {
            payload.groupId = groupId;
          } else {
            payload.selectedEmails = emails;
          }
        }
        const res = await sendPromotionalEmail(payload);
        if (res.success) {
          showSnackbar("Email sent successfully.", "success");
        } else {
          showSnackbar(
            (res as { message?: string }).message || "Failed to send email.",
            "error",
          );
        }
      } catch (e: unknown) {
        const msg =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: unknown }).message)
            : "Failed to send email.";
        showSnackbar(msg, "error");
      } finally {
        setIsSending(false);
      }
    })();
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
        is loaded from <code>/api/admin/newsletter-templates/auth</code>.
      </Typography>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 2, alignItems: { md: "flex-end" }, flexWrap: "wrap" }}
      >
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
        {(selectedTemplateId || templateIdFromUrl) && (
          <Button
            variant="contained"
            color="success"
            startIcon={
              isSending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SendIcon />
              )
            }
            disabled={isSending}
            onClick={() => setSelectUsersOpen(true)}
          >
            {isSending ? "Sending…" : "Send"}
          </Button>
        )}
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
        {!iframeReady ? (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              color: "text.secondary",
            }}
          >
            <CircularProgress size={24} />
            <Typography variant="body2">Loading template…</Typography>
          </Box>
        ) : (
          <iframe
            key={iframeKey}
            ref={iframeRef}
            title="Stripo Email Builder"
            src="/stripo-builder.html"
            style={{ width: "100%", height: "100%", border: "none" }}
            allow="clipboard-read; clipboard-write"
            onLoad={pushConfigToIframe}
          />
        )}
      </Box>

      <SelectUsersModal
        open={selectUsersOpen}
        onClose={() => setSelectUsersOpen(false)}
        onConfirm={handleUsersConfirm}
        initialSelectedEmails={selectedEmails}
        initialSendToAll={sendToAll}
      />
    </Box>
  );
};

export default CreateEmailBuilderPageClient;
