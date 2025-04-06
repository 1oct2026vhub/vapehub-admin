"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  Alert,
  MenuItem,
  ListItemIcon,
  Button,
  IconButton,
} from "@mui/material";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { motion } from "motion/react";
import { MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import FuseLoading from "@fuse/core/FuseLoading";
import AddIcon from "@mui/icons-material/Add";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  FooterSection,
  FooterLink,
  getFooterSections,
  createFooterSection,
  updateFooterSection,
  deleteFooterSection,
  reorderFooterSection,
  createFooterLink,
  updateFooterLink,
  deleteFooterLink,
  reorderFooterLink,
} from "@/services/apiFooter";
import FooterLinksDialog from "./components/FooterLinksDialog";

// Define validation schema using Zod
const sectionSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(50, "Title must not exceed 50 characters"),

  order: z.coerce
    .number()
    .int("Order must be an integer")
    .min(0, "Order must be a positive number"),

  is_active: z.boolean().default(true),
});

// Define the form type
type SectionFormType = z.infer<typeof sectionSchema>;

export default function FooterSectionsApp() {
  const { showSnackbar } = useSnackbar();
  const [sections, setSections] = useState<FooterSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentSection, setCurrentSection] = useState<FooterSection | null>(
    null
  );
  const [openLinksDialog, setOpenLinksDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState<FooterSection | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [reordering, setReordering] = useState(false);

  // Form with react-hook-form and Zod validation
  const methods = useForm<SectionFormType>({
    mode: "all",
    defaultValues: {
      title: "",
      order: 0,
      is_active: true,
    },
    resolver: zodResolver(sectionSchema),
  });

  const { isValid, errors } = methods.formState;

  // Fetch footer sections
  const fetchFooterSections = async () => {
    try {
      setLoading(true);
      const data = await getFooterSections(
        showActiveOnly ? { is_active: true } : {}
      );
      if (Array.isArray(data)) {
        // Add temporary id if missing to satisfy type requirements
        const sectionsWithId = data.map((section) => ({
          ...section,
          id: section.id || Math.random() * -1000, // Use negative random number for temporary id
          links: section.links?.map((link) => ({
            ...link,
            id: link.id || Math.random() * -1000,
          })),
        }));
        // Sort by order
        sectionsWithId.sort((a, b) => a.order - b.order);
        setSections(sectionsWithId);
      }
    } catch (error) {
      console.error("Failed to fetch footer sections:", error);
      showSnackbar("Failed to load footer sections", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFooterSections();
  }, [showActiveOnly]);

  // Handle dialog close
  const handleDialogClose = () => {
    setOpenDialog(false);
    setCurrentSection(null);
    methods.reset({
      title: "",
      order: 0,
      is_active: true,
    });
  };

  // Handle form submit
  const handleSubmit = async (data: SectionFormType) => {
    try {
      setSubmitting(true);
      if (currentSection?.id) {
        // Update existing section
        await updateFooterSection(currentSection.id, data);
        showSnackbar("Footer section updated successfully", "success");
      } else {
        // Create new section
        await createFooterSection(data);
        showSnackbar("Footer section created successfully", "success");
      }
      handleDialogClose();
      fetchFooterSections();
    } catch (error: any) {
      console.error("Failed to save footer section:", error);

      // Display specific error messages if available
      if (error?.errors) {
        showSnackbar(
          error.errors[0]?.msg || "Failed to save footer section",
          "error"
        );
      } else {
        const errorMessage = error?.message || "Failed to save footer section";
        showSnackbar(errorMessage, "error");
      }

      // Handle API validation errors
      if (error?.error && typeof error.error === "object") {
        Object.entries(error.error).forEach(([field, message]) => {
          if (typeof message === "string") {
            showSnackbar(message, "error");
          }
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Open dialog to add new section
  const handleAddSection = () => {
    setCurrentSection(null);
    methods.reset({
      title: "",
      order: sections.length + 1,
      is_active: true,
    });
    setOpenDialog(true);
  };

  // Open dialog to edit existing section
  const handleEditSection = (section: FooterSection) => {
    setCurrentSection(section);
    methods.reset({
      title: section.title,
      order: section.order,
      is_active: section.is_active,
    });
    setOpenDialog(true);
  };

  // Handle section deletion
  const handleDeleteSection = async (section: FooterSection) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the section "${section.title}"?`
      )
    ) {
      return;
    }

    try {
      await deleteFooterSection(section.id);
      showSnackbar("Footer section deleted successfully", "success");
      fetchFooterSections();
    } catch (error: any) {
      console.error("Failed to delete footer section:", error);
      showSnackbar(
        error?.message || "Failed to delete footer section",
        "error"
      );
    }
  };

  // Handle showing links for a section
  const handleShowLinks = (section: FooterSection) => {
    setSelectedSection(section);
    setOpenLinksDialog(true);
  };

  // Toggle reordering mode
  const toggleReordering = () => {
    setReordering(!reordering);
  };

  // Move section up
  const moveSectionUp = async (section: FooterSection, index: number) => {
    if (index === 0) return; // Already at top

    try {
      const newOrder = sections[index - 1].order;
      await reorderFooterSection(section.id, newOrder);
      await fetchFooterSections();
      showSnackbar("Section order updated successfully", "success");
    } catch (error: any) {
      console.error("Failed to reorder section:", error);
      showSnackbar(error?.message || "Failed to reorder section", "error");
    }
  };

  // Move section down
  const moveSectionDown = async (section: FooterSection, index: number) => {
    if (index === sections.length - 1) return; // Already at bottom

    try {
      const newOrder = sections[index + 1].order;
      await reorderFooterSection(section.id, newOrder);
      await fetchFooterSections();
      showSnackbar("Section order updated successfully", "success");
    } catch (error: any) {
      console.error("Failed to reorder section:", error);
      showSnackbar(error?.message || "Failed to reorder section", "error");
    }
  };

  // Table columns
  const columns = useMemo<MRT_ColumnDef<FooterSection>[]>(
    () => [
      ...(reordering
        ? [
            {
              accessorKey: "reorder",
              header: "Reorder",
              size: 100,
              Cell: ({ row, table }) => {
                const index = row.index;
                return (
                  <Box className="flex items-center">
                    <IconButton
                      size="small"
                      disabled={index === 0}
                      onClick={() => moveSectionUp(row.original, index)}
                    >
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      disabled={index === sections.length - 1}
                      onClick={() => moveSectionDown(row.original, index)}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </Box>
                );
              },
            },
          ]
        : []),
      {
        accessorKey: "title",
        header: "Title",
        size: 200,
      },
      {
        accessorKey: "order",
        header: "Order",
        size: 100,
      },
      {
        accessorKey: "is_active",
        header: "Status",
        size: 100,
        Cell: ({ row }) => (
          <div
            className={
              row.original.is_active ? "text-green-600" : "text-red-600"
            }
          >
            {row.original.is_active ? "Active" : "Inactive"}
          </div>
        ),
      },
      {
        accessorKey: "links",
        header: "Links",
        size: 100,
        Cell: ({ row }) => {
          const linksCount = row.original.links?.length || 0;
          return (
            <div>
              {linksCount} {linksCount === 1 ? "link" : "links"}
            </div>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        size: 150,
        Cell: ({ row }) => {
          return row.original.created_at
            ? new Date(row.original.created_at).toLocaleDateString()
            : "N/A";
        },
      },
    ],
    [reordering, sections]
  );

  // Handle links dialog close
  const handleLinksDialogClose = () => {
    setOpenLinksDialog(false);
    setSelectedSection(null);
    fetchFooterSections(); // Refresh data after managing links
  };

  if (loading && sections.length === 0) {
    return <FuseLoading />;
  }

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h4" fontWeight="bold">
                Footer Management
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showActiveOnly}
                      onChange={(e) => setShowActiveOnly(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Show active only"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={reordering}
                      onChange={toggleReordering}
                      color="primary"
                    />
                  }
                  label="Reorder mode"
                />
                <AppButton
                  label={<>Add Section</>}
                  onClick={handleAddSection}
                />
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Paper className="overflow-hidden">
              <DataTable
                columns={columns}
                data={sections}
                enableRowActions={!reordering}
                renderRowActionMenuItems={({ closeMenu, row }) => [
                  <MenuItem
                    key="edit"
                    onClick={() => {
                      handleEditSection(row.original);
                      closeMenu();
                    }}
                  >
                    <ListItemIcon>
                      <FuseSvgIcon>heroicons-outline:pencil</FuseSvgIcon>
                    </ListItemIcon>
                    Edit
                  </MenuItem>,
                  <MenuItem
                    key="manage-links"
                    onClick={() => {
                      handleShowLinks(row.original);
                      closeMenu();
                    }}
                  >
                    <ListItemIcon>
                      <FuseSvgIcon>heroicons-outline:link</FuseSvgIcon>
                    </ListItemIcon>
                    Manage Links
                  </MenuItem>,
                  <MenuItem
                    key="delete"
                    onClick={() => {
                      handleDeleteSection(row.original);
                      closeMenu();
                    }}
                  >
                    <ListItemIcon>
                      <FuseSvgIcon className="text-red-500">
                        heroicons-outline:trash
                      </FuseSvgIcon>
                    </ListItemIcon>
                    <Typography color="error">Delete</Typography>
                  </MenuItem>,
                ]}
              />
            </Paper>
          </Grid>
        </Grid>
      </motion.div>

      {/* Add/Edit Section Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentSection ? "Edit Footer Section" : "Add Footer Section"}
        </DialogTitle>
        <DialogContent>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)}>
              <Box sx={{ mt: 2 }}>
                {errors?.root?.message && (
                  <Alert className="mb-4" severity="error">
                    {errors?.root?.message}
                  </Alert>
                )}

                <FormInputField
                  name="title"
                  control={methods.control}
                  label="Title"
                  required
                  autoFocus
                />

                <FormInputField
                  name="order"
                  control={methods.control}
                  label="Order"
                  type="number"
                  required
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={methods.watch("is_active")}
                      onChange={(e) =>
                        methods.setValue("is_active", e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label="Active"
                  sx={{ mt: 1 }}
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    mt: 3,
                    gap: 2,
                  }}
                >
                  <Button onClick={handleDialogClose}>Cancel</Button>
                  <AppButton
                    label={currentSection ? "Update" : "Create"}
                    type="submit"
                    disabled={!isValid || submitting}
                    loading={submitting}
                  />
                </Box>
              </Box>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      {/* Footer Links Dialog */}
      {selectedSection && (
        <FooterLinksDialog
          open={openLinksDialog}
          onClose={handleLinksDialogClose}
          section={selectedSection}
          onSuccess={(message) => showSnackbar(message, "success")}
          onError={(message) => showSnackbar(message, "error")}
        />
      )}
    </Container>
  );
}
