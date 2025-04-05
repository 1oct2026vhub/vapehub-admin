"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  MenuItem,
  ListItemIcon,
  Button,
} from "@mui/material";
import { useForm, FormProvider } from "react-hook-form";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { motion } from "motion/react";
import { MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import FuseLoading from "@fuse/core/FuseLoading";
import AddIcon from "@mui/icons-material/Add";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
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

export default function FooterSectionsApp() {
  const [sections, setSections] = useState<FooterSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentSection, setCurrentSection] = useState<FooterSection | null>(null);
  const [openLinksDialog, setOpenLinksDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState<FooterSection | null>(null);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });
  const [submitting, setSubmitting] = useState(false);

  // Form with react-hook-form
  const methods = useForm({
    defaultValues: {
      title: "",
      order: 0,
      is_active: true,
    }
  });

  // Fetch footer sections
  const fetchFooterSections = async () => {
    try {
      setLoading(true);
      const data = await getFooterSections(showActiveOnly ? { is_active: true } : {});
      if (Array.isArray(data)) {
        // Add temporary id if missing to satisfy type requirements
        const sectionsWithId = data.map(section => ({
          ...section,
          id: section.id || Math.random() * -1000, // Use negative random number for temporary id
          links: section.links?.map(link => ({
            ...link,
            id: link.id || Math.random() * -1000,
          }))
        }));
        setSections(sectionsWithId);
      }
    } catch (error) {
      console.error("Failed to fetch footer sections:", error);
      showNotification("Failed to load footer sections", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFooterSections();
  }, [showActiveOnly]);

  // Show notification
  const showNotification = (message: string, severity: "success" | "error" | "warning" | "info") => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

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
  const handleSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      if (currentSection?.id) {
        // Update existing section
        await updateFooterSection(currentSection.id, data);
        showNotification("Footer section updated successfully", "success");
      } else {
        // Create new section
        await createFooterSection(data);
        showNotification("Footer section created successfully", "success");
      }
      handleDialogClose();
      fetchFooterSections();
    } catch (error) {
      console.error("Failed to save footer section:", error);
      showNotification("Failed to save footer section", "error");
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
    if (!window.confirm(`Are you sure you want to delete the section "${section.title}"?`)) {
      return;
    }
    
    try {
      await deleteFooterSection(section.id);
      showNotification("Footer section deleted successfully", "success");
      fetchFooterSections();
    } catch (error) {
      console.error("Failed to delete footer section:", error);
      showNotification("Failed to delete footer section", "error");
    }
  };

  // Handle showing links for a section
  const handleShowLinks = (section: FooterSection) => {
    setSelectedSection(section);
    setOpenLinksDialog(true);
  };

  // Table columns
  const columns = useMemo<MRT_ColumnDef<FooterSection>[]>(
    () => [
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
          <div className={row.original.is_active ? "text-green-600" : "text-red-600"}>
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
    []
  );

  // Handle notification close
  const handleNotificationClose = () => {
    setNotification({
      ...notification,
      open: false,
    });
  };

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
                <AppButton
                  label="Add Section"
                  onClick={handleAddSection}
                  startIcon={<AddIcon />}
                />
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Paper className="overflow-hidden">
              <DataTable
                columns={columns}
                data={sections}
                enableRowActions
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
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentSection ? "Edit Footer Section" : "Add Footer Section"}
        </DialogTitle>
        <DialogContent>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)}>
              <Box sx={{ mt: 2 }}>
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
                      onChange={(e) => methods.setValue("is_active", e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Active"
                  sx={{ mt: 1 }}
                />
                
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 2 }}>
                  <Button onClick={handleDialogClose}>Cancel</Button>
                  <AppButton
                    label={currentSection ? "Update" : "Create"}
                    type="submit"
                    disabled={!methods.watch("title")}
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
          onSuccess={(message) => showNotification(message, "success")}
          onError={(message) => showNotification(message, "error")}
        />
      )}

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
      >
        <Alert onClose={handleNotificationClose} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 