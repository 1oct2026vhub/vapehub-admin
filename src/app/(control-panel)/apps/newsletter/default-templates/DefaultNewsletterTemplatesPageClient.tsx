"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import AppButton from "@/components/Shared/AppButton";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  listDefaultNewsletterTemplates,
  type StripoDefaultTemplateListItem,
} from "@/services/apiNewsletterTemplates";

/** Portrait preview frame (width / height), Stripo-style gallery. */
const PREVIEW_MIN_HEIGHT = { xs: 340, sm: 400, md: 440 };

export default function DefaultNewsletterTemplatesPageClient() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [rows, setRows] = useState<StripoDefaultTemplateListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listDefaultNewsletterTemplates({ page, pageSize });
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
          : "Failed to load default templates";
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

  const openInBuilder = (row: StripoDefaultTemplateListItem) => {
    const q = new URLSearchParams();
    q.set("stripoDefaultTemplateId", String(row.templateId));
    q.set("defaultTemplateName", row.name || "Untitled");
    router.push(`/apps/newsletter/create-email-builder?${q.toString()}`);
  };

  /** Same editor shell as saved templates; segment must match `stripo-default-` parsing in CreateEmailBuilderPageClient. */
  const editDefaultInBuilder = (row: StripoDefaultTemplateListItem) => {
    const q = new URLSearchParams();
    q.set("defaultTemplateName", row.name || "Untitled");
    router.push(
      `/apps/newsletter/edit-email-builder/stripo-default-${row.templateId}?${q.toString()}`,
    );
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
          Default templates
        </Typography>
        <Stack direction="row" spacing={1}>
          <AppButton
            type="button"
            variant="outlined"
            label="My Templates"
            onClick={() => router.push("/apps/newsletter/templates")}
          />
          <AppButton
            type="button"
            variant="contained"
            label="Create Email Builder"
            onClick={() => router.push("/apps/newsletter/create-email-builder")}
          />
        </Stack>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Stripo catalog templates. Previews use the thumbnail from the API; the editor loads full HTML
        from{" "}
        <code>
          GET /api/admin/newsletter-templates/default-templates/{"{templateId}"}
        </code>
        .
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4 }}>
          No default templates found.
        </Typography>
      ) : (
        <>
          {/* Exactly 4 cards per row from `md` up; 2 on small tablets; 1 on mobile */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
              },
              gap: { xs: 2, md: 2.5 },
              mb: 3,
            }}
          >
            {rows.map((row) => (
              <Card
                key={row.templateId}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  width: "100%",
                  transition: "box-shadow 0.2s ease",
                  "@media (hover: hover) and (pointer: fine)": {
                    "&:hover": {
                      boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
                      "& .default-template-hover-overlay": {
                        opacity: 1,
                        pointerEvents: "auto",
                      },
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
                    minHeight: PREVIEW_MIN_HEIGHT,
                    maxHeight: { xs: 480, md: 560 },
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
                        imageRendering: "auto",
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No preview image
                    </Typography>
                  )}
                  <Stack
                    className="default-template-hover-overlay"
                    spacing={1.25}
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      px: 2,
                      bgcolor: "rgba(0,0,0,0.55)",
                      transition: "opacity 0.2s ease",
                      "@media (hover: none), (pointer: coarse)": {
                        opacity: 1,
                        pointerEvents: "auto",
                      },
                      "@media (hover: hover) and (pointer: fine)": {
                        opacity: 0,
                        pointerEvents: "none",
                      },
                    }}
                  >
                    <Button
                      type="button"
                      variant="outlined"
                      size="medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        editDefaultInBuilder(row);
                      }}
                      sx={{
                        minWidth: 120,
                        fontWeight: 700,
                        textTransform: "none",
                        borderColor: "rgba(255,255,255,0.95)",
                        color: "#fff",
                        borderRadius: 2,
                        "&:hover": {
                          borderColor: "#fff",
                          bgcolor: "rgba(255,255,255,0.12)",
                        },
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
                        openInBuilder(row);
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
    </Box>
  );
}
