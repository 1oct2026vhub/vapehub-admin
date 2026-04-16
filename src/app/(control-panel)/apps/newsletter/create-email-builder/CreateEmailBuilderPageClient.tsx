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
  getDefaultNewsletterTemplateById,
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
  | { type: "STRIPO_DIRTY_STATE"; dirty: boolean }
  | { type: "STRIPO_DIRTY_CHECK_RESULT"; dirty: boolean; requestId?: string }
  | {
      type: "STRIPO_SAVE_RESULT";
      success: boolean;
      message?: string;
      templateId?: string;
    };

type CreateEmailBuilderPageClientProps = {
  initialTemplateId?: string;
};

/** Route segment for Stripo catalog defaults on edit URL (must not match saved template ids). */
const STRIPO_DEFAULT_ROUTE_PREFIX = "stripo-default-";

function stripoDefaultIdFromRouteSegment(segment: string | null | undefined): string | null {
  if (!segment?.startsWith(STRIPO_DEFAULT_ROUTE_PREFIX)) return null;
  const id = segment.slice(STRIPO_DEFAULT_ROUTE_PREFIX.length);
  return id.length > 0 ? id : null;
}

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
  const [hasUnsavedEditorChanges, setHasUnsavedEditorChanges] = useState(false);
  const dirtyCheckResolversRef = useRef<Map<string, (dirty: boolean) => void>>(new Map());

  const stripoDefaultTemplateIdFromUrl =
    searchParams.get("stripoDefaultTemplateId") ||
    stripoDefaultIdFromRouteSegment(initialTemplateId) ||
    stripoDefaultIdFromRouteSegment(searchParams.get("templateId"));

  const templateIdFromUrl =
    stripoDefaultTemplateIdFromUrl != null
      ? null
      : searchParams.get("templateId") || initialTemplateId || null;

  const defaultTemplateNameFromUrl = searchParams.get("defaultTemplateName");
  const isEditMode = Boolean(templateIdFromUrl || stripoDefaultTemplateIdFromUrl);

  /** Promotional send API expects a saved admin template id, not a Stripo catalog id. */
  const sendableTemplateId =
    (selectedTemplateId && selectedTemplateId !== "__new__"
      ? selectedTemplateId
      : null) ||
    templateIdFromUrl ||
    null;

  const apiBase = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "");

  // New email: iframe mounts immediately. Saved template or Stripo default: wait for metadata fetch.
  const [iframeReady, setIframeReady] = useState(
    !templateIdFromUrl && !stripoDefaultTemplateIdFromUrl,
  );

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
          // Saved admin template id (disk). Mutually exclusive with Stripo default catalog id.
          templateId: stripoDefaultTemplateIdFromUrl
            ? null
            : selectedTemplateId || templateIdFromUrl || null,
          stripoDefaultTemplateId: stripoDefaultTemplateIdFromUrl || null,
        },
      },
      window.location.origin,
    );
  }, [
    apiBase,
    selectedTemplateId,
    templateIdFromUrl,
    stripoDefaultTemplateIdFromUrl,
    showSnackbar,
  ]);

  // Prefill name/subject + remount iframe when opening a saved template or a Stripo default template.
  useEffect(() => {
    if (stripoDefaultTemplateIdFromUrl) {
      setSelectedTemplateId("");
      setIframeReady(false);
      void (async () => {
        try {
          const res = await getDefaultNewsletterTemplateById(stripoDefaultTemplateIdFromUrl);
          if (res.success && res.data) {
            const tpl = res.data;
            setName(tpl.name ?? "");
            setSubject(tpl.subject ?? tpl.name ?? "");
          } else if (defaultTemplateNameFromUrl) {
            const n = decodeURIComponent(defaultTemplateNameFromUrl);
            setName(n);
            setSubject(n);
          } else {
            setName("");
            setSubject("");
          }
        } catch {
          if (defaultTemplateNameFromUrl) {
            const n = decodeURIComponent(defaultTemplateNameFromUrl);
            setName(n);
            setSubject(n);
          } else {
            setName("");
            setSubject("");
            showSnackbar("Could not load default template metadata.", "warning");
          }
        } finally {
          setIframeReady(true);
          setIframeKey((k) => k + 1);
        }
      })();
      return;
    }

    if (!templateIdFromUrl) {
      setSelectedTemplateId("");
      setName("");
      setSubject("");
      setIframeReady(true);
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
  }, [
    templateIdFromUrl,
    stripoDefaultTemplateIdFromUrl,
    defaultTemplateNameFromUrl,
    showSnackbar,
  ]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (typeof window === "undefined" || event.origin !== window.location.origin)
        return;
      const data = event.data as StripoMessage;
      if (!data || typeof data !== "object" || !("type" in data)) return;
      if (data.type === "STRIPO_DIRTY_STATE") {
        setHasUnsavedEditorChanges(Boolean(data.dirty));
        return;
      }
      if (data.type === "STRIPO_DIRTY_CHECK_RESULT") {
        const dirty = Boolean(data.dirty);
        setHasUnsavedEditorChanges(dirty);
        if (data.requestId) {
          const resolver = dirtyCheckResolversRef.current.get(data.requestId);
          if (resolver) {
            dirtyCheckResolversRef.current.delete(data.requestId);
            resolver(dirty);
          }
        }
        return;
      }
      if (data.type === "STRIPO_SAVE_RESULT") {
        setSaving(false);
        if (data.success) {
          setHasUnsavedEditorChanges(false);
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

  const requestCurrentDirtyState = useCallback(async (): Promise<boolean> => {
    const win = iframeRef.current?.contentWindow;
    if (!win || typeof window === "undefined") return hasUnsavedEditorChanges;
    const requestId = `dirty-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return await new Promise<boolean>((resolve) => {
      dirtyCheckResolversRef.current.set(requestId, resolve);
      win.postMessage(
        { type: "STRIPO_CHECK_DIRTY", requestId },
        window.location.origin,
      );
      setTimeout(() => {
        const resolver = dirtyCheckResolversRef.current.get(requestId);
        if (resolver) {
          dirtyCheckResolversRef.current.delete(requestId);
          resolver(hasUnsavedEditorChanges);
        }
      }, 1000);
    });
  }, [hasUnsavedEditorChanges]);

  const handleUsersConfirm = (
    emails: string[],
    shouldSendToAll: boolean,
    groupId?: string | null,
  ) => {
    setSelectedEmails(emails);
    setSendToAll(shouldSendToAll);
    setSelectUsersOpen(false);

    if (!sendableTemplateId) {
      showSnackbar(
        "Save the template first. Sending uses your saved template in the library.",
        "warning",
      );
      return;
    }

    void (async () => {
      setIsSending(true);
      try {
        const payload: PromotionalEmailData = {
          templateId: sendableTemplateId,
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
        <Stack direction="row" spacing={1}>
          <AppButton
            type="button"
            variant="outlined"
            label="Templates"
            onClick={() => router.push("/apps/newsletter/templates")}
          />
          <AppButton
            type="button"
            variant="outlined"
            label="Default Templates"
            onClick={() => router.push("/apps/newsletter/default-templates")}
          />
        </Stack>
      </Box>

      {/* <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Stripo editor with templates stored via your admin API. Auth token is
        passed to the builder iframe only on this origin. Stripo plugin auth
        is loaded from <code>/api/admin/newsletter-templates/auth</code>.
      </Typography> */}

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
        {(templateIdFromUrl ||
          stripoDefaultTemplateIdFromUrl ||
          (selectedTemplateId && selectedTemplateId !== "__new__")) && (
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
            disabled={isSending || (isEditMode && hasUnsavedEditorChanges)}
            onClick={() => {
              void (async () => {
                const dirtyNow = isEditMode ? await requestCurrentDirtyState() : false;
                if (isEditMode && dirtyNow) {
                  showSnackbar(
                    "You have unsaved editor changes. Click Save template before sending.",
                    "warning",
                  );
                  return;
                }
                if (!sendableTemplateId) {
                  showSnackbar(
                    "Save the template first. Sending uses your saved template in the library.",
                    "warning",
                  );
                  return;
                }
                setSelectUsersOpen(true);
              })();
            }}
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
