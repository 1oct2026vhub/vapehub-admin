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
  Card,
  CardHeader,
  CardContent,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import LinkIcon from "@mui/icons-material/Link";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
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
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

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
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<FooterSection | null>(null);

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
        
        // Initialize expanded sections state
        const expanded: Record<number, boolean> = {};
        sectionsWithId.forEach(section => {
          expanded[section.id] = expandedSections[section.id] || false;
        });
        setExpandedSections(expanded);
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

  // Toggle section expansion
  const handleToggleExpand = (sectionId: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
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
  const handleSubmit = async (data: SectionFormType) => {
    try {
      setSubmitting(true);
      if (currentSection?.id) {
        // Update existing section
        await updateFooterSection(currentSection.id, {
          title: data.title,
          order: data.order,
          is_active: data.is_active
        });
        showSnackbar("Footer section updated successfully", "success");
      } else {
        // Create new section
        await createFooterSection(data as { title: string; order: number; is_active: boolean });
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
  const handleDeleteSection = (section: FooterSection) => {
    setSectionToDelete(section);
    setDeleteDialogOpen(true);
  };

  // Confirm section deletion
  const confirmDeleteSection = async () => {
    if (!sectionToDelete) return;
    
    try {
      await deleteFooterSection(sectionToDelete.id);
      showSnackbar("Footer section deleted successfully", "success");
      fetchFooterSections();
    } catch (error: any) {
      console.error("Failed to delete footer section:", error);
      showSnackbar(
        error?.message || "Failed to delete footer section",
        "error"
      );
    } finally {
      setDeleteDialogOpen(false);
      setSectionToDelete(null);
    }
  };

  // Close delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSectionToDelete(null);
  };

  // Handle showing links for a section
  const handleShowLinks = (section: FooterSection) => {
    setSelectedSection(section);
    setOpenLinksDialog(true);
  };

  // Handle links dialog close
  const handleLinksDialogClose = () => {
    setOpenLinksDialog(false);
    setSelectedSection(null);
    fetchFooterSections(); // Refresh to get updated links
  };

  // Handle drag end for sections
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const { source, destination, type } = result;
    
    if (source.index === destination.index) return;
    
    if (type === 'section') {
      // Reorder sections
      const reorderedSections = [...sections];
      const [movedSection] = reorderedSections.splice(source.index, 1);
      reorderedSections.splice(destination.index, 0, movedSection);
      
      // Update orders
      const updatedSections = reorderedSections.map((section, index) => ({
        ...section,
        order: index + 1
      }));
      
      setSections(updatedSections);
      
      // Call API to persist the change
      try {
        const sectionId = movedSection.id;
        const newOrder = destination.index + 1;
        await reorderFooterSection(sectionId, { new_order: newOrder });
        showSnackbar("Section reordered successfully", "success");
      } catch (error) {
        console.error("Failed to reorder section:", error);
        showSnackbar("Failed to reorder section", "error");
        fetchFooterSections(); // Reset to original order
      }
    } else if (type.startsWith('link-')) {
      // Extract section ID from the type
      const sectionId = parseInt(type.replace('link-', ''));
      const section = sections.find(s => s.id === sectionId);
      
      if (!section || !section.links) return;
      
      // Reorder links within the section
      const reorderedLinks = [...section.links];
      const [movedLink] = reorderedLinks.splice(source.index, 1);
      reorderedLinks.splice(destination.index, 0, movedLink);
      
      // Update orders
      const updatedLinks = reorderedLinks.map((link, index) => ({
        ...link,
        order: index + 1
      }));
      
      // Update the section with reordered links
      const updatedSections = sections.map(s => 
        s.id === sectionId ? { ...s, links: updatedLinks } : s
      );
      
      setSections(updatedSections);
      
      // Call API to persist the change
      try {
        const linkId = movedLink.id;
        const newOrder = destination.index + 1;
        await reorderFooterLink(linkId, { new_order: newOrder });
        showSnackbar("Link reordered successfully", "success");
      } catch (error) {
        console.error("Failed to reorder link:", error);
        showSnackbar("Failed to reorder link", "error");
        fetchFooterSections(); // Reset to original order
      }
    }
  };

  if (loading) return <FuseLoading />;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg" className="py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box className="flex justify-between items-center mb-6">
            <Typography variant="h4" fontWeight="bold">
              Footer Management
            </Typography>
            <Box className="flex items-center gap-4">
              <FormControlLabel
                control={
                  <Switch
                    checked={showActiveOnly}
                    onChange={(e) => setShowActiveOnly(e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Active Only"
              />
              <AppButton
                label="Add Section"
                onClick={handleAddSection}
              />
            </Box>
          </Box>

          {sections.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary" gutterBottom>
                No footer sections found.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddSection}
                sx={{ mt: 2 }}
              >
                Add Your First Section
              </Button>
            </Paper>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="footer-sections" type="section">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {sections.map((section, index) => (
                      <Draggable
                        key={section.id.toString()}
                        draggableId={section.id.toString()}
                        index={index}
                      >
                        {(provided) => (
                          <Paper
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            elevation={1}
                            className="overflow-hidden"
                          >
                            <Card>
                              <CardHeader
                                avatar={
                                  <div {...provided.dragHandleProps}>
                                    <DragIndicatorIcon color="action" />
                                  </div>
                                }
                                title={
                                  <Box className="flex items-center justify-between">
                                    <Typography variant="h6" className="font-medium">
                                      {section.title}
                                    </Typography>
                                    <Box className="flex items-center gap-1">
                                      <Typography variant="body2" color="text.secondary">
                                        Order: {section.order}
                                      </Typography>
                                      {!section.is_active && (
                                        <Typography
                                          variant="caption"
                                          className="ml-2 bg-red-100 text-red-800 px-2 py-0.5 rounded"
                                        >
                                          Inactive
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                }
                                action={
                                  <Box className="flex items-center">
                                    <Tooltip title="Manage Links">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleShowLinks(section)}
                                      >
                                        <LinkIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Edit Section">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleEditSection(section)}
                                      >
                                        <EditIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Section">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteSection(section)}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title={expandedSections[section.id] ? "Collapse" : "Expand"}>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleToggleExpand(section.id)}
                                      >
                                        {expandedSections[section.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                }
                              />
                              <Collapse in={expandedSections[section.id]} timeout="auto" unmountOnExit>
                                <CardContent className="pt-0">
                                  {section.links && section.links.length > 0 ? (
                                    <Droppable droppableId={`links-${section.id}`} type={`link-${section.id}`}>
                                      {(provided) => (
                                        <List
                                          ref={provided.innerRef}
                                          {...provided.droppableProps}
                                          className="w-full"
                                          dense
                                        >
                                          {section.links.map((link, linkIndex) => (
                                            <Draggable
                                              key={link.id.toString()}
                                              draggableId={link.id.toString()}
                                              index={linkIndex}
                                            >
                                              {(provided) => (
                                                <>
                                                  <ListItem
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`${
                                                      link.is_active ? "" : "opacity-60"
                                                    }`}
                                                  >
                                                    <DragIndicatorIcon className="mr-2 text-gray-400" fontSize="small" />
                                                    <ListItemText
                                                      primary={link.label}
                                                      secondary={
                                                        <Box component="span" className="flex items-center gap-2">
                                                          <span>{link.url}</span>
                                                          <span className="text-xs text-gray-500">
                                                            (Order: {link.order})
                                                          </span>
                                                          {!link.is_active && (
                                                            <span className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded">
                                                              Inactive
                                                            </span>
                                                          )}
                                                        </Box>
                                                      }
                                                    />
                                                  </ListItem>
                                                  {linkIndex < section.links.length - 1 && <Divider />}
                                                </>
                                              )}
                                            </Draggable>
                                          ))}
                                          {provided.placeholder}
                                        </List>
                                      )}
                                    </Droppable>
                                  ) : (
                                    <Typography color="text.secondary" className="py-2 text-center">
                                      No links added to this section yet
                                    </Typography>
                                  )}
                                  <Box className="mt-3 flex justify-end">
                                    <Button
                                      size="small"
                                      startIcon={<AddIcon />}
                                      onClick={() => handleShowLinks(section)}
                                    >
                                      Manage Links
                                    </Button>
                                  </Box>
                                </CardContent>
                              </Collapse>
                            </Card>
                          </Paper>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {/* Add/Edit Section Dialog */}
          <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
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

                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormInputField
                          name="title"
                          control={methods.control}
                          label="Section Title"
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormInputField
                          name="order"
                          control={methods.control}
                          label="Display Order"
                          type="number"
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
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
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                      <Button
                        variant="outlined"
                        color="inherit"
                        onClick={handleDialogClose}
                      >
                        Cancel
                      </Button>
                      <AppButton
                        label="Save"
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

          {/* Manage Links Dialog */}
          {selectedSection && (
            <FooterLinksDialog
              open={openLinksDialog}
              onClose={handleLinksDialogClose}
              section={selectedSection}
              onSuccess={(message) => showSnackbar(message, "success")}
              onError={(message) => showSnackbar(message, "error")}
            />
          )}

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={handleCloseDeleteDialog}
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <DialogTitle id="delete-dialog-title">
              Confirm Deletion
            </DialogTitle>
            <DialogContent>
              {sectionToDelete && (
                <Typography variant="body1">
                  Are you sure you want to delete the section "{sectionToDelete.title}"?
                </Typography>
              )}
            </DialogContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
              <Button onClick={handleCloseDeleteDialog} color="primary" sx={{ mr: 1 }}>
                Cancel
              </Button>
              <Button 
                onClick={confirmDeleteSection} 
                color="error" 
                variant="contained"
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Delete"}
              </Button>
            </Box>
          </Dialog>
        </motion.div>
      </Container>
    </LocalizationProvider>
  );
}

