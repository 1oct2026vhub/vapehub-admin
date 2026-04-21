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
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  Chip,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiSelectItem,
  type SelectChangeEvent,
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
  listDefaultNewsletterTemplates,
  listDefaultTemplateTypes,
  listDefaultTemplateSeasons,
  listDefaultTemplateFeatures,
  listDefaultTemplateIndustries,
  deleteNewsletterTemplate,
  type NewsletterTemplate,
  type StripoDefaultTemplateListItem,
  type StripoFilterOption,
} from "@/services/apiNewsletterTemplates";

type TemplateListMode = "saved" | "basic" | "prebuilt";

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
  onSend: () => void;
  onDelete: () => void;
}

function CardMenu({ template, onEdit, onSend, onDelete }: CardMenuProps) {
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
            onSend();
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
  onSend: () => void;
  onDelete: () => void;
}

// 601px so Stripo's "max-width: 600px" responsive breakpoint never fires inside the preview
const EMAIL_WIDTH = 601;
// Fixed visible card height — all cards are the same height in the grid
const CARD_HEIGHT = 380;
// Iframe renders at this height so email content never needs to scroll
const IFRAME_HEIGHT = 2000;

function TemplateCard({ template, onEdit, onSend, onDelete }: TemplateCardProps) {
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
      <CardMenu template={template} onEdit={onEdit} onSend={onSend} onDelete={onDelete} />
    </Box>
  );
}

const CATALOG_PREVIEW_MIN_HEIGHT = { xs: 280, sm: 320, md: 360 };

interface CatalogTemplateCardProps {
  row: StripoDefaultTemplateListItem;
  onEdit: () => void;
  onUseInBuilder: () => void;
}

function CatalogTemplateCard({ row, onEdit, onUseInBuilder }: CatalogTemplateCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "box-shadow 0.2s ease",
        "@media (hover: hover) and (pointer: fine)": {
          "&:hover": {
            boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
            "& .catalog-template-hover-overlay": { opacity: 1, pointerEvents: "auto" },
          },
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          position: "relative",
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "#ececec",
          overflow: "hidden",
          aspectRatio: "10 / 16",
          minHeight: CATALOG_PREVIEW_MIN_HEIGHT,
          maxHeight: { xs: 400, md: 480 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 1,
        }}
      >
        {row.logo ? (
          <Box
            component="img"
            src={row.logo}
            alt=""
            sx={{
              display: "block",
              width: "auto",
              height: "auto",
              maxWidth: "min(145%, 520px)",
              maxHeight: "min(108%, 480px)",
              objectFit: "contain",
              objectPosition: "center",
              transform: "scale(1.35)",
              transformOrigin: "center center",
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No preview image
          </Typography>
        )}
        <Stack
          className="catalog-template-hover-overlay"
          spacing={1.25}
          alignItems="center"
          justifyContent="center"
          sx={{
            position: "absolute",
            inset: 0,
            px: 2,
            bgcolor: "rgba(0,0,0,0.55)",
            transition: "opacity 0.2s ease",
            "@media (hover: none), (pointer: coarse)": { opacity: 1, pointerEvents: "auto" },
            "@media (hover: hover) and (pointer: fine)": { opacity: 0, pointerEvents: "none" },
          }}
        >
          <Button
            type="button"
            variant="outlined"
            size="medium"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            sx={{
              minWidth: 120,
              fontWeight: 700,
              textTransform: "none",
              borderColor: "rgba(255,255,255,0.95)",
              color: "#fff",
              borderRadius: 2,
              "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.12)" },
            }}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="text"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onUseInBuilder();
            }}
            sx={{
              color: "common.white",
              textTransform: "none",
              fontWeight: 600,
              textDecoration: "underline",
              textUnderlineOffset: 3,
              "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
            }}
          >
            Use in Builder
          </Button>
        </Stack>
      </Box>
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", pt: 1.5, pb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.75 }} noWrap title={row.name}>
          {row.name || "Untitled template"}
        </Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {row.premium ? (
            <Chip size="small" label="Premium" color="warning" variant="outlined" />
          ) : null}
          {row.hasAmp ? <Chip size="small" label="AMP" variant="outlined" /> : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function NewsletterTemplatesPageClient() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [listMode, setListMode] = useState<TemplateListMode>("saved");
  const [rows, setRows] = useState<NewsletterTemplate[]>([]);
  const [catalogRows, setCatalogRows] = useState<StripoDefaultTemplateListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [loading, setLoading] = useState(true);
  const [freeOnly, setFreeOnly] = useState<"free">("free");

  const [typeOptions, setTypeOptions] = useState<StripoFilterOption[]>([]);
  const [seasonOptions, setSeasonOptions] = useState<StripoFilterOption[]>([]);
  const [featureOptions, setFeatureOptions] = useState<StripoFilterOption[]>([]);
  const [industryOptions, setIndustryOptions] = useState<StripoFilterOption[]>([]);

  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<NewsletterTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (listMode === "saved") {
        const res = await listNewsletterTemplates({ page, pageSize });
        if (res.success && Array.isArray(res.data)) {
          setRows(res.data);
          setCatalogRows([]);
          const total = typeof res.total === "number" ? res.total : res.data.length;
          setTotalCount(total);
          setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
        } else {
          setRows([]);
          setCatalogRows([]);
          setTotalCount(0);
          setTotalPages(1);
        }
      } else {
        const type = listMode === "basic" ? "BASIC" : "FREE";
        const res = await listDefaultNewsletterTemplates({
          page,
          pageSize,
          type,
          ...(listMode === "prebuilt" && selectedType
            ? { templateTypes: String(selectedType) }
            : {}),
          ...(listMode === "prebuilt" && selectedSeasons.length
            ? { templateSeasons: selectedSeasons.join(",") }
            : {}),
          ...(listMode === "prebuilt" && selectedFeatures.length
            ? { templateFeatures: selectedFeatures.join(",") }
            : {}),
          ...(listMode === "prebuilt" && selectedIndustries.length
            ? { templateIndustries: selectedIndustries.join(",") }
            : {}),
        });
        if (res.success && Array.isArray(res.data)) {
          setCatalogRows(res.data);
          setRows([]);
          const total = typeof res.total === "number" ? res.total : res.data.length;
          setTotalCount(total);
          setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
        } else {
          setCatalogRows([]);
          setRows([]);
          setTotalCount(0);
          setTotalPages(1);
        }
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Failed to load templates";
      showSnackbar(msg, "error");
      setRows([]);
      setCatalogRows([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    listMode,
    page,
    pageSize,
    showSnackbar,
    freeOnly,
    selectedType,
    selectedSeasons,
    selectedFeatures,
    selectedIndustries,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (listMode !== "prebuilt") return;

    const loadFilterOptions = async () => {
      try {
        const [types, seasons, features, industries] = await Promise.all([
          listDefaultTemplateTypes(),
          listDefaultTemplateSeasons(),
          listDefaultTemplateFeatures(),
          listDefaultTemplateIndustries(),
        ]);
        setTypeOptions(types);
        setSeasonOptions(seasons);
        setFeatureOptions(features);
        setIndustryOptions(industries);
        const freeType = types.find((t) => t.name.toLowerCase() === "free");
        if (freeType) {
          setSelectedType(String(freeType.id));
        } else {
          // Fallback when API omits explicit type id
          setSelectedType("free");
        }
      } catch (e: unknown) {
        const msg =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: unknown }).message)
            : "Failed to load filter options";
        showSnackbar(msg, "error");
      }
    };

    void loadFilterOptions();
  }, [listMode, showSnackbar]);

  const handleListModeChange = (_event: unknown, value: TemplateListMode | null) => {
    if (value !== null) {
      setListMode(value);
      setPage(1);
      if (value !== "prebuilt") {
        setSelectedType("");
        setSelectedSeasons([]);
        setSelectedFeatures([]);
        setSelectedIndustries([]);
      }
    }
  };

  const handleMultiSelectChange =
    (setter: (value: string[]) => void) => (event: SelectChangeEvent<string[]>) => {
      const value = event.target.value;
      setter(typeof value === "string" ? value.split(",") : value);
      setPage(1);
    };

  const openCatalogInBuilder = (row: StripoDefaultTemplateListItem) => {
    const q = new URLSearchParams();
    q.set("stripoDefaultTemplateId", String(row.templateId));
    q.set("defaultTemplateName", row.name || "Untitled");
    router.push(`/apps/newsletter/create-email-builder?${q.toString()}`);
  };

  const editCatalogInBuilder = (row: StripoDefaultTemplateListItem) => {
    const q = new URLSearchParams();
    q.set("defaultTemplateName", row.name || "Untitled");
    router.push(
      `/apps/newsletter/edit-email-builder/stripo-default-${row.templateId}?${q.toString()}`,
    );
  };

  const listTitle =
    listMode === "saved"
      ? "Saved templates"
      : listMode === "basic"
        ? "Basic templates"
        : "Prebuilt templates";

  const emptyMessage =
    listMode === "saved"
      ? "No saved templates yet. Create one in the email builder."
      : listMode === "basic"
        ? "No basic templates found."
        : "No prebuilt templates found.";

  const showPrebuiltFilters = listMode === "prebuilt";
  const findLabel = (options: StripoFilterOption[], id: string) =>
    options.find((x) => String(x.id) === id)?.name || id;
  const selectedFilterChips = [
    { key: "type", label: "Free Templates", active: true },
    ...selectedSeasons.map((id) => ({ key: `season-${id}`, label: findLabel(seasonOptions, id), active: true })),
    ...selectedFeatures.map((id) => ({ key: `feature-${id}`, label: findLabel(featureOptions, id), active: true })),
    ...selectedIndustries.map((id) => ({ key: `industry-${id}`, label: findLabel(industryOptions, id), active: true })),
  ];

  const clearPrebuiltFilters = () => {
    setSelectedSeasons([]);
    setSelectedFeatures([]);
    setSelectedIndustries([]);
    setPage(1);
  };

  const handleEdit = (id: string) => {
    router.push(`/apps/newsletter/edit-email-builder/${encodeURIComponent(id)}`);
  };

  const handleSend = (id: string) => {
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
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography className="text-3xl font-extrabold leading-none tracking-tight">
          Email templates
        </Typography>
        <AppButton
          type="button"
          variant="contained"
          label="Create Email Builder"
          onClick={() => router.push("/apps/newsletter/create-email-builder")}
        />
      </Box>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, flexWrap: "wrap" }}>
        <ToggleButtonGroup
          exclusive
          value={listMode}
          onChange={handleListModeChange}
          size="small"
          sx={{
            bgcolor: "action.hover",
            p: 0.25,
            borderRadius: 2,
            "& .MuiToggleButtonGroup-grouped": { border: 0, mx: 0 },
            "& .MuiToggleButton-root": {
              px: 2,
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "6px !important",
            },
            "& .Mui-selected": {
              bgcolor: "background.paper",
              boxShadow: 1,
            },
          }}
        >
          <ToggleButton value="saved">Saved</ToggleButton>
          <ToggleButton value="basic">Basic</ToggleButton>
          <ToggleButton value="prebuilt">Prebuilt</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {showPrebuiltFilters ? (
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", md: "center" }}
          sx={{ mb: 2.5 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup value={freeOnly} exclusive size="small">
              <ToggleButton value="free" disabled>
                Free
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="body2" color="text.secondary">
              Filters
            </Typography>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel id="season-filter-label">Season</InputLabel>
              <Select
                labelId="season-filter-label"
                multiple
                value={selectedSeasons}
                label="Season"
                onChange={handleMultiSelectChange(setSelectedSeasons)}
                renderValue={(selected) =>
                  (selected as string[]).length
                    ? (selected as string[]).map((id) => findLabel(seasonOptions, id)).join(", ")
                    : "All"
                }
              >
                {seasonOptions.map((opt) => (
                  <MuiSelectItem key={`season-${opt.id}`} value={String(opt.id)}>
                    <Checkbox size="small" checked={selectedSeasons.includes(String(opt.id))} />
                    {opt.name}
                  </MuiSelectItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel id="feature-filter-label">Feature</InputLabel>
              <Select
                labelId="feature-filter-label"
                multiple
                value={selectedFeatures}
                label="Feature"
                onChange={handleMultiSelectChange(setSelectedFeatures)}
                renderValue={(selected) =>
                  (selected as string[]).length
                    ? (selected as string[]).map((id) => findLabel(featureOptions, id)).join(", ")
                    : "All"
                }
              >
                {featureOptions.map((opt) => (
                  <MuiSelectItem key={`feature-${opt.id}`} value={String(opt.id)}>
                    <Checkbox size="small" checked={selectedFeatures.includes(String(opt.id))} />
                    {opt.name}
                  </MuiSelectItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 190 }}>
              <InputLabel id="industry-filter-label">Industry</InputLabel>
              <Select
                labelId="industry-filter-label"
                multiple
                value={selectedIndustries}
                label="Industry"
                onChange={handleMultiSelectChange(setSelectedIndustries)}
                renderValue={(selected) =>
                  (selected as string[]).length
                    ? (selected as string[]).map((id) => findLabel(industryOptions, id)).join(", ")
                    : "All"
                }
              >
                {industryOptions.map((opt) => (
                  <MuiSelectItem key={`industry-${opt.id}`} value={String(opt.id)}>
                    <Checkbox size="small" checked={selectedIndustries.includes(String(opt.id))} />
                    {opt.name}
                  </MuiSelectItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      ) : null}

      {showPrebuiltFilters ? (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mb: 2, flexWrap: "wrap", rowGap: 1 }}
        >
          <Button
            type="button"
            size="small"
            variant="text"
            onClick={clearPrebuiltFilters}
            sx={{ textTransform: "none", minWidth: "auto", px: 0.5 }}
          >
            Clear All
          </Button>
          {selectedFilterChips.map((chip) => (
            <Chip
              key={chip.key}
              label={chip.label}
              size="small"
              variant="outlined"
              sx={{ borderRadius: "8px", fontWeight: 600 }}
            />
          ))}
        </Stack>
      ) : null}

      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          {listTitle}
        </Typography>
        <Box
          component="span"
          sx={{
            minWidth: 28,
            height: 28,
            px: 1,
            borderRadius: "999px",
            bgcolor: "grey.300",
            color: "text.primary",
            fontSize: 13,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {totalCount}
        </Box>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : listMode === "saved" && rows.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4 }}>
          {emptyMessage}
        </Typography>
      ) : listMode !== "saved" && catalogRows.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4 }}>
          {emptyMessage}
        </Typography>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                listMode === "saved"
                  ? { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }
                  : {
                      xs: "minmax(0, 1fr)",
                      sm: "repeat(2, minmax(0, 1fr))",
                      md: "repeat(4, minmax(0, 1fr))",
                    },
              gap: 2,
              mb: 3,
            }}
          >
            {listMode === "saved"
              ? rows.map((row) => (
                  <TemplateCard
                    key={row.id}
                    template={row}
                    onEdit={() => handleEdit(row.id)}
                    onSend={() => handleSend(row.id)}
                    onDelete={() => handleDeleteRequest(row)}
                  />
                ))
              : catalogRows.map((row) => (
                  <CatalogTemplateCard
                    key={row.templateId}
                    row={row}
                    onEdit={() => editCatalogInBuilder(row)}
                    onUseInBuilder={() => openCatalogInBuilder(row)}
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
