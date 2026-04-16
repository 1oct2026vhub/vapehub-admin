"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Stack,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import AppButton from "@/components/Shared/AppButton";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  listNewsletterTemplates,
  deleteNewsletterTemplate,
  type NewsletterTemplate,
} from "@/services/apiNewsletterTemplates";

// Hides scrollbars without touching body overflow (which breaks float layouts).
const NO_SCROLL_CSS = `<style>
  html { overflow: hidden !important; }
  body { margin: 0 !important; padding: 0 !important; }
  ::-webkit-scrollbar { display: none !important; }
  /* Force desktop (non-responsive) layout so floats are never stacked */
  .es-left, .es-right, .es-adaptive table { float: unset !important; }
  .es-left { float: left !important; }
  .es-right { float: right !important; }
</style>`;

function injectNoScroll(html: string): string {
  return html.includes("</head>")
    ? html.replace("</head>", `${NO_SCROLL_CSS}</head>`)
    : NO_SCROLL_CSS + html;
}

function getPreviewHtml(template: NewsletterTemplate): string {
  // Top-level `html` is the fully compiled email — CSS already embedded.
  if (template.html && typeof template.html === "string") {
    return injectNoScroll(template.html);
  }

  // Fallback: assemble from designJson
  if (template.designJson) {
    try {
      const parsed = (
        typeof template.designJson === "string"
          ? JSON.parse(template.designJson)
          : template.designJson
      ) as { editor?: string; html?: string; css?: string };

      if (parsed.html) {
        let html = parsed.html;
        const css = parsed.css || "";
        if (css) {
          html = html.includes("</head>")
            ? html.replace("</head>", `<style>${css}</style></head>`)
            : `<style>${css}</style>${html}`;
        }
        return injectNoScroll(html);
      }
    } catch {
      // fall through
    }
  }

  return "<div style='padding:24px;font-family:Arial,sans-serif;color:#999;font-size:14px'>No preview available</div>";
}

interface CardMenuProps {
  template: NewsletterTemplate;
  onEdit: () => void;
  onDelete: () => void;
}

function CardMenu({ template, onEdit, onDelete }: CardMenuProps) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);

  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          setAnchor(e.currentTarget);
        }}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          backgroundColor: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(4px)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          "&:hover": { backgroundColor: "#fff" },
          zIndex: 2,
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        PaperProps={{ sx: { minWidth: 140, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" } }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            setAnchor(null);
            onEdit();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            setAnchor(null);
          }}
        >
          <ListItemIcon>
            <SendIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Send</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            setAnchor(null);
            onDelete();
          }}
          sx={{ color: "error.main", "& .MuiListItemIcon-root": { color: "error.main" } }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

interface TemplateCardProps {
  template: NewsletterTemplate;
  onEdit: () => void;
  onDelete: () => void;
}

// 601px so Stripo's "max-width: 600px" responsive breakpoint never fires inside the preview
const EMAIL_WIDTH = 601;
// Fixed visible card height — all cards are the same height in the grid
const CARD_HEIGHT = 380;
// Iframe renders at this height so email content never needs to scroll
const IFRAME_HEIGHT = 2000;

function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth;
      if (w > 0) setScale(w / EMAIL_WIDTH);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "#fff",
        "&:hover": { boxShadow: "0 6px 24px rgba(0,0,0,0.13)" },
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Clickable preview area only — excludes the menu button */}
      <Box
        ref={containerRef}
        onClick={onEdit}
        sx={{
          position: "relative",
          width: "100%",
          height: CARD_HEIGHT,
          overflow: "hidden",
          backgroundColor: "#f9f9f9",
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${EMAIL_WIDTH}px`,
            height: `${IFRAME_HEIGHT}px`,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
            pointerEvents: "none",
          }}
        >
          <iframe
            title={`preview-${template.id}`}
            srcDoc={getPreviewHtml(template)}
            style={{
              width: `${EMAIL_WIDTH}px`,
              height: `${IFRAME_HEIGHT}px`,
              border: "none",
              display: "block",
            }}
            scrolling="no"
            sandbox="allow-same-origin"
            loading="lazy"
          />
        </Box>
      </Box>

      {/* 3-dot menu */}
      <CardMenu template={template} onEdit={onEdit} onDelete={onDelete} />
    </Box>
  );
}

export default function NewsletterTemplatesPageClient() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [rows, setRows] = useState<NewsletterTemplate[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [loading, setLoading] = useState(true);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<NewsletterTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listNewsletterTemplates({ page, pageSize });
      if (res.success && Array.isArray(res.data)) {
        setRows(res.data);
        const total = typeof res.total === "number" ? res.total : res.data.length;
        setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
      } else {
        setRows([]);
        setTotalPages(1);
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Failed to load templates";
      showSnackbar(msg, "error");
      setRows([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, showSnackbar]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleEdit = (id: string) => {
    router.push(`/apps/newsletter/edit-email-builder/${encodeURIComponent(id)}`);
  };

  const handleDeleteRequest = (row: NewsletterTemplate) => {
    setDeleteTarget(row);
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteNewsletterTemplate(deleteTarget.id);
      if (res.success) {
        showSnackbar(`Template "${deleteTarget.name}" deleted successfully.`, "success");
        setDeleteTarget(null);
        // Reload — if current page is now empty, go back one page
        const remainingOnPage = rows.length - 1;
        if (remainingOnPage === 0 && page > 1) {
          setPage((p) => p - 1);
        } else {
          void load();
        }
      } else {
        showSnackbar(res.message ?? "Failed to delete template.", "error");
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Failed to delete template";
      showSnackbar(msg, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box className="p-6">
      <PageBreadcrumb />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
        }}
      >
        <Typography className="text-3xl font-extrabold leading-none tracking-tight">
          Email templates
        </Typography>
        <Stack direction="row" spacing={1}>
          <AppButton
            type="button"
            variant="outlined"
            label="Default Templates"
            onClick={() => router.push("/apps/newsletter/default-templates")}
          />
          <AppButton
            type="button"
            variant="contained"
            label="Create Email Builder"
            onClick={() => router.push("/apps/newsletter/create-email-builder")}
          />
        </Stack>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4 }}>
          No templates yet. Create one in the email builder.
        </Typography>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "1fr 1fr 1fr",
              },
              gap: 2,
              mb: 3,
            }}
          >
            {rows.map((row) => (
              <TemplateCard
                key={row.id}
                template={row}
                onEdit={() => handleEdit(row.id)}
                onDelete={() => handleDeleteRequest(row)}
              />
            ))}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary">
              Page {page} of {totalPages}
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              shape="rounded"
              size="small"
            />
          </Box>
        </>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete template?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete{" "}
            <strong>&quot;{deleteTarget?.name}&quot;</strong>? This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleDeleteConfirm()}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
