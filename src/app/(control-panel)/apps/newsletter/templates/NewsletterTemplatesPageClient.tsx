"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  TablePagination,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import AppButton from "@/components/Shared/AppButton";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  listNewsletterTemplates,
  type NewsletterTemplate,
} from "@/services/apiNewsletterTemplates";

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function getPreviewHtml(template: NewsletterTemplate) {
  if (template.designJson) {
    try {
      const parsed = (typeof template.designJson === "string"
        ? JSON.parse(template.designJson)
        : template.designJson) as {
        editor?: string;
        html?: string;
        css?: string;
      };
      if (parsed.editor === "stripo" && parsed.html) {
        return `<!doctype html><html><head><style>${parsed.css || ""}</style></head><body>${parsed.html}</body></html>`;
      }
    } catch {
      // fall back to html field
    }
  }
  if (template.html) {
    return template.html;
  }
  return "<div style='padding:16px;font-family:Arial,sans-serif;color:#666'>No preview available</div>";
}

export default function NewsletterTemplatesPageClient() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [rows, setRows] = useState<NewsletterTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listNewsletterTemplates({
        page: page + 1,
        pageSize,
      });
      if (res.success && Array.isArray(res.data)) {
        setRows(res.data);
        setTotal(typeof res.total === "number" ? res.total : res.data.length);
      } else {
        setRows([]);
        setTotal(0);
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Failed to load templates";
      showSnackbar(msg, "error");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, showSnackbar]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setPageSize(Math.min(parseInt(e.target.value, 10) || 20, 100));
    setPage(0);
  };

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
          mb: 2,
        }}
      >
        <Typography className="text-3xl font-extrabold leading-none tracking-tight">
          Email templates
        </Typography>
        <AppButton
          type="button"
          variant="contained"
          label="Create Email Builder"
          onClick={() =>
            router.push("/apps/newsletter/create-email-builder")
          }
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Templates from{" "}
        <code>GET /api/admin/newsletter-templates/templates</code> (paginated).
      </Typography>

      <Paper sx={{ width: "100%", overflow: "hidden", p: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {rows.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2, px: 1 }}>
                No templates yet. Create one in the email builder.
              </Typography>
            ) : (
              <Grid container spacing={2} sx={{ mb: 1 }}>
                {rows.map((row) => (
                  <Grid item xs={12} sm={6} lg={4} key={row.id}>
                    <Card
                      variant="outlined"
                      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
                    >
                      <Box
                        sx={{
                          height: 220,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          backgroundColor: "#fff",
                        }}
                      >
                        <iframe
                          title={`template-preview-${row.id}`}
                          srcDoc={getPreviewHtml(row)}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            pointerEvents: "none",
                          }}
                          sandbox=""
                        />
                      </Box>
                      <CardContent sx={{ pb: 1 }}>
                        <Typography variant="h6" sx={{ mb: 0.5 }} noWrap>
                          {row.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {row.subject}
                        </Typography>
                        <Box sx={{ mt: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <Chip size="small" label={`Updated: ${formatDate(row.updatedAt)}`} />
                        </Box>
                      </CardContent>
                      <Divider />
                      <CardActions sx={{ p: 1.5, pt: 1 }}>
                        <AppButton
                          type="button"
                          variant="outlined"
                          size="small"
                          label="Edit"
                          onClick={() =>
                            router.push(
                              `/apps/newsletter/edit-email-builder/${encodeURIComponent(row.id)}`,
                            )
                          }
                        />
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={pageSize}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 20, 50, 100]}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}
