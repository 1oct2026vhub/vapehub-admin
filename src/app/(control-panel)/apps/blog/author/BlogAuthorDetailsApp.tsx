"use client";

import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Container,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { motion } from "motion/react";
import FuseLoading from "@fuse/core/FuseLoading";
import AppButton from "@/components/Shared/AppButton";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import ConfirmActionDialog from "@/app/(control-panel)/apps/faq/ConfirmActionDialog";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  BlogAuthor,
  deleteBlogAuthor,
  getBlogAuthorDisplayName,
  getBlogAuthors,
} from "@/services/apiBlog";
import AuthorFormDialog from "./AuthorFormDialog";

export default function BlogAuthorDetailsApp() {
  const { showSnackbar } = useSnackbar();
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentAuthor, setCurrentAuthor] = useState<BlogAuthor | null>(null);
  const [authorToDelete, setAuthorToDelete] = useState<BlogAuthor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const response = await getBlogAuthors({ limit: 200 });
      setAuthors(response);
    } catch (error) {
      console.error("Failed to load authors:", error);
      showSnackbar("Failed to load authors", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const handleConfirmDelete = async () => {
    if (!authorToDelete || deleting) return;

    // Close the dialog immediately after the user confirms, so it doesn't stay open
    // while the API request is in-flight.
    const deletingAuthor = authorToDelete;
    setAuthorToDelete(null);
    setDeleting(true);
    try {
      await deleteBlogAuthor(deletingAuthor.id);
      showSnackbar("Author deleted successfully", "success");
      fetchAuthors();
    } catch (error: any) {
      showSnackbar(
        error?.errors?.[0]?.msg ||
          error?.message ||
          "Cannot delete this author. They may still have posts.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <FuseLoading />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageBreadcrumb />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          mb={3}
          gap={2}
        >
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Authors
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              First-class author records used by the blog byline. Select an author
              when creating or editing a post.
            </Typography>
          </Box>
          <AppButton
            label="Add author"
            onClick={() => {
              setCurrentAuthor(null);
              setDialogOpen(true);
            }}
          />
        </Box>

        {authors.length === 0 ? (
          <Paper sx={{ p: 4 }}>
            <Typography color="text.secondary">
              No authors yet. Click &quot;Add author&quot; to create one.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {authors.map((author) => {
              const name = getBlogAuthorDisplayName(author) || `Author ${author.id}`;
              const avatar = author.avatar_url;
              const linkedUser = author.user?.email;

              return (
                <Paper key={author.id} sx={{ p: 2.5 }}>
                  <Box display="flex" gap={2} alignItems="flex-start">
                    <Avatar src={avatar || undefined} sx={{ width: 56, height: 56 }}>
                      {!avatar && <PersonOutlineIcon />}
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Typography fontWeight={700}>{name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {author.role || "No role set"}
                      </Typography>
                      {/* {author.slug && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Slug: {author.slug}
                        </Typography>
                      )} */}
                      {/* {linkedUser && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Linked user: {linkedUser}
                        </Typography>
                      )} */}
                      {author.bio && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {author.bio}
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <Tooltip title="Edit">
                        <IconButton
                          onClick={() => {
                            setCurrentAuthor(author);
                            setDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => setAuthorToDelete(author)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </motion.div>

      <AuthorFormDialog
        open={dialogOpen}
        author={currentAuthor}
        onClose={() => {
          setDialogOpen(false);
          setCurrentAuthor(null);
        }}
        onSaved={fetchAuthors}
        onSuccess={(message) => showSnackbar(message, "success")}
        onError={(message) => showSnackbar(message, "error")}
      />

      <ConfirmActionDialog
        open={Boolean(authorToDelete)}
        onClose={() => {
          if (!deleting) setAuthorToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete author"
        itemName={authorToDelete ? getBlogAuthorDisplayName(authorToDelete) : undefined}
        actionButtonText={deleting ? "Deleting..." : "Delete"}
        actionButtonColorClass="!bg-red-600"
      >
        Authors who still have posts cannot be deleted. Reassign those posts first.
      </ConfirmActionDialog>
    </Container>
  );
}
