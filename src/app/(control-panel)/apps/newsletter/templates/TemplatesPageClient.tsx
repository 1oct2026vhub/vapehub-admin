'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Typography,
} from '@mui/material';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {
  NewsletterTemplate,
  deleteNewsletterTemplate,
  listNewsletterTemplates,
} from '@/services/apiNewsletterTemplates';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useRouter } from 'next/navigation';

const TemplatesPageClient = () => {
  const { showSnackbar } = useSnackbar();
  const router = useRouter();
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadTemplates = async () => {
      setIsLoading(true);
      try {
        const res = await listNewsletterTemplates({ page, pageSize });
        if (!res.success) {
          throw new Error(res.message || 'Failed to load templates');
        }
        if (!cancelled) {
          setTemplates(res.data);
          setTotalPages(res.totalPages || 1);
        }
      } catch (error: any) {
        if (!cancelled) {
          showSnackbar(error?.message || 'Failed to load templates', 'error');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadTemplates();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, showSnackbar]);

  const handleEdit = (id: string) => {
    router.push(`/apps/newsletter/create-email?templateId=${encodeURIComponent(id)}`);
  };

  const handleConfirmDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const performDelete = async (id: string) => {
    setIsDeletingId(id);
    try {
      const res = await deleteNewsletterTemplate(id);
      if (!res.success) {
        throw new Error(res.message || 'Failed to delete template');
      }
      // Remove from current list
      setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
      showSnackbar('Template deleted successfully.', 'success');
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to delete template.', 'error');
    } finally {
      setIsDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="p-6">
      <PageBreadcrumb />
      <Box className="mt-4 bg-white rounded-lg p-6">
        <Typography variant="h5" className="mb-4 font-semibold">
          My Email Templates
        </Typography>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <>
            {templates.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No templates found. Create one from &quot;Create Email&quot;.
              </Typography>
            ) : (
              <>
                <Grid container spacing={3}>
                  {templates.map((tpl) => (
                    <Grid item key={tpl.id} xs={12} sm={6} md={4} lg={3}>
                      <Card variant="outlined" className="h-full flex flex-col overflow-hidden">
                        <CardActionArea
                          className="flex-1"
                          onClick={() => handleEdit(tpl.id)}
                        >
                          {/* Simple HTML preview */}
                          <CardMedia
                            component="div"
                            sx={{
                              width: '100%',
                              height: 260,
                              overflow: 'hidden',
                              backgroundColor: '#f5f5f5',
                            }}
                          >
                            <div
                              style={{
                                width: '200%',
                                height: '200%',
                                transform: 'scale(0.5)',
                                transformOrigin: 'top left',
                                pointerEvents: 'none',
                              }}
                              dangerouslySetInnerHTML={{ __html: tpl.html }}
                            />
                          </CardMedia>
                        </CardActionArea>
                        <Box p={1.5} display="flex" justifyContent="space-between">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleEdit(tpl.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            disabled={isDeletingId === tpl.id}
                            onClick={() => handleConfirmDelete(tpl.id)}
                          >
                            {isDeletingId === tpl.id ? 'Deleting…' : 'Delete'}
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                <Box
                  mt={3}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" color="text.secondary">
                    Page {page} of {totalPages}
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((p) => (p < totalPages ? p + 1 : p))
                      }
                    >
                      Next
                    </Button>
                  </Box>
                </Box>
              </>
            )}
          </>
        )}
      </Box>

      <Dialog
        open={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        aria-labelledby="delete-template-dialog-title"
      >
        <DialogTitle id="delete-template-dialog-title">
          Delete template?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete the selected template. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)} disabled={Boolean(isDeletingId)}>
            Cancel
          </Button>
          <Button
            onClick={() => deleteConfirmId && performDelete(deleteConfirmId)}
            color="error"
            disabled={Boolean(isDeletingId)}
          >
            {isDeletingId ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TemplatesPageClient;

