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
  DialogActions,
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

// dnd-kit imports
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import DraggableFooterSection from "./components/DraggableFooterSection";

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
  const [reorderingInProgress, setReorderingInProgress] = useState(false);

  // Define sensors for drag interactions
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Return if no change
    if (!over || active.id === over.id) {
      return;
    }
    
    // Set reordering in progress
    setReorderingInProgress(true);
    
    try {
      // Find the indices
      const activeIndex = sections.findIndex(
        (section) => section.id.toString() === active.id
      );
      const overIndex = sections.findIndex(
        (section) => section.id.toString() === over.id
      );
      
      if (activeIndex !== -1 && overIndex !== -1) {
        // Update UI immediately
        const newSections = arrayMove(sections, activeIndex, overIndex);
        
        // Update orders to match new positions
        const updatedSections = newSections.map((section, index) => ({
        ...section,
          order: index + 1,
      }));
      
        // Update state
      setSections(updatedSections);
      
        // Call API to persist changes
        const movedSection = sections[activeIndex];
        await reorderFooterSection(movedSection.id, { new_order: overIndex + 1 });
        
        // Success message
        showSnackbar(`Section "${movedSection.title}" reordered successfully`, "success");
      }
      } catch (error) {
        console.error("Failed to reorder section:", error);
        showSnackbar("Failed to reorder section", "error");
      // Reset to original order
      fetchFooterSections();
    } finally {
      setReorderingInProgress(false);
    }
  };

  // Handle link reordering within a section
  const handleReorderLinks = async (sectionId: number, updatedLinks: FooterLink[]) => {
    try {
      // Update local state immediately for better UX
      setSections(prevSections => 
        prevSections.map(section => 
          section.id === sectionId 
            ? { ...section, links: updatedLinks } 
            : section
        )
      );

      // Find the section with the updated links
      const section = sections.find(s => s.id === sectionId);
      
      if (section) {
        // Get the moved link
        const movedLink = updatedLinks.find(link => 
          link.order !== section.links?.find(l => l.id === link.id)?.order
        );

        if (movedLink) {
          // API call to update order
          await reorderFooterLink(movedLink.id, { new_order: movedLink.order });
        showSnackbar(`Link "${movedLink.label}" reordered successfully`, "success");
        }
      }
      } catch (error) {
        console.error("Failed to reorder link:", error);
        showSnackbar("Failed to reorder link", "error");
      // Reset to original order
      fetchFooterSections();
    }
  };

  if (loading) return <FuseLoading />;

  return (
        <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 0.1 } }}
      className="w-full"
    >
      <Container maxWidth={false} sx={{ pl: 3, pr: 3 }}>
        <Box className="sm:py-12 py-8">
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            mb={3}
            gap={2}
          >
            <Typography variant="h4" component="h1" fontWeight={600}>
              Footer Sections
            </Typography>

            <Box
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              gap={2}
            >
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
              />
            </Box>
          </Box>
          <div
                                          style={{
              maxWidth: '50%',
              width: '100%'
            }}
          >
{/* <Paper
            className="flex flex-col flex-auto p-6 shadow-none rounded"
            elevation={0}
          ></Paper> */}

            {sections.length === 0 ? (
              <Alert severity="info">
                No footer sections available. Click the &quot;Add Section&quot;
                button to create your first section.
              </Alert>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sections.map(section => section.id.toString())}
                  strategy={verticalListSortingStrategy}
                >
                  <Box className="grid grid-cols-1 gap-4">
                    {sections.map((section) => (
                      <DraggableFooterSection
                        key={section.id}
                        section={section}
                        isExpanded={expandedSections[section.id] || false}
                        onToggleExpand={() => handleToggleExpand(section.id)}
                        onEdit={() => handleEditSection(section)}
                        onDelete={() => handleDeleteSection(section)}
                        onManageLinks={() => handleShowLinks(section)}
                        onReorderLinks={handleReorderLinks}
                        onSuccess={(message) => showSnackbar(message, "success")}
                        onError={(message) => showSnackbar(message, "error")}
                      />
                    ))}
                  </Box>
                </SortableContext>
              </DndContext>
            )}
                  </div>
        </Box>
      </Container>

      {/* Section dialog */}
          <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
            <DialogTitle>
          {currentSection ? "Edit Section" : "Add New Section"}
            </DialogTitle>
            <DialogContent>
          <Box py={1}>
              <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(handleSubmit)}>
                <Box display="grid" gridTemplateColumns="1fr" gap={2}>
                        <FormInputField
                          name="title"
                          control={methods.control}
                          label="Section Title"
                          required
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
                            />
                          }
                          label="Active"
                        />
                </Box>

                <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                  <Button onClick={handleDialogClose}>Cancel</Button>
                      <AppButton
                        type="submit"
                    loading={submitting}
                        disabled={!isValid || submitting}
                    label={currentSection ? "Update" : "Create"}
                      />
                  </Box>
                </form>
              </FormProvider>
          </Box>
            </DialogContent>
          </Dialog>

      {/* Links dialog */}
          {selectedSection && (
            <FooterLinksDialog
              open={openLinksDialog}
              onClose={handleLinksDialogClose}
              section={selectedSection}
              onSuccess={(message) => showSnackbar(message, "success")}
              onError={(message) => showSnackbar(message, "error")}
            />
          )}

      {/* Delete confirmation dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
          >
        <DialogTitle>Delete Section</DialogTitle>
            <DialogContent>
          <Typography>
            Are you sure you want to delete section &quot;
            {sectionToDelete?.title || ""}&quot;? This will also delete all links
            within this section.
                </Typography>
            </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
                Cancel
              </Button>
              <Button 
                onClick={confirmDeleteSection} 
                color="error" 
                variant="contained"
              >
            Delete
              </Button>
        </DialogActions>
          </Dialog>
        </motion.div>
  );
}

