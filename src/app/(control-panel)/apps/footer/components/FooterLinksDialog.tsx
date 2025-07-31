"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControlLabel,
  Switch,
  IconButton,
  Paper,
  Divider,
  MenuItem,
  ListItemIcon,
  Alert,
  List,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AddIcon from "@mui/icons-material/Add";
import { MRT_ColumnDef } from "material-react-table";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import {
  FooterSection,
  FooterLink,
  createFooterLink,
  updateFooterLink,
  deleteFooterLink,
  reorderFooterLink,
} from "@/services/apiFooter";

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
import DraggableFooterLink from "./DraggableFooterLink";

// Define validation schema using Zod
const linkSchema = z.object({
  label: z.string()
    .min(1, "Label is required")
    .max(50, "Label must not exceed 50 characters"),
  
  url: z.string()
    .min(1, "URL is required")
    .max(200, "URL must not exceed 200 characters")
    .regex(/^\/[a-z0-9\-\/_]*$|^https?:\/\/.+$/i, "URL must start with a slash (/) for internal links or be a valid URL for external links"),
  
  order: z.coerce.number()
    .int("Order must be an integer")
    .min(0, "Order must be a positive number"),
  
  is_active: z.boolean().default(true)
});

// Define the form type
type LinkFormType = z.infer<typeof linkSchema>;

interface FooterLinksDialogProps {
  open: boolean;
  onClose: () => void;
  section: FooterSection;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function FooterLinksDialog({
  open,
  onClose,
  section,
  onSuccess,
  onError,
}: FooterLinksDialogProps) {
  const [links, setLinks] = useState<FooterLink[]>(section.links || []);
  const [editMode, setEditMode] = useState(false);
  const [currentLink, setCurrentLink] = useState<FooterLink | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<FooterLink | null>(null);
  
  // Define sensors for drag interactions
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Form state with react-hook-form and Zod validation
  const methods = useForm<LinkFormType>({
    mode: "all",
    defaultValues: {
      label: "",
      url: "",
      order: 0,
      is_active: true,
    },
    resolver: zodResolver(linkSchema)
  });

  const { isValid, errors } = methods.formState;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      // Add temporary ids if missing
      const linksWithIds = (section.links || []).map(link => ({
        ...link,
        id: link.id || Math.random() * -1000,
      }));
      // Sort by order
      linksWithIds.sort((a, b) => a.order - b.order);
      setLinks(linksWithIds);
      resetForm();
    }
  }, [open, section]);

  // Reset form
  const resetForm = () => {
    setEditMode(false);
    setCurrentLink(null);
    methods.reset({
      label: "",
      url: "",
      order: links.length + 1,
      is_active: true,
    });
  };

  // Handle form submit
  const handleSubmit = async (data: LinkFormType) => {
    try {
      setSubmitting(true);
      if (editMode && currentLink?.id) {
        // Update existing link
        await updateFooterLink(currentLink.id, {
          ...data,
          section_id: section.id,
        });
        onSuccess("Footer link updated successfully");
      } else {
        // Create new link
        await createFooterLink({
          ...data,
          section_id: section.id,
        } as { section_id: number; label: string; url: string; order: number; is_active: boolean });
        onSuccess("Footer link created successfully");
      }
      
      // Update local links array to reflect changes
      const updatedLinks = editMode
        ? links.map((link) =>
            link.id === currentLink?.id
              ? { ...link, ...data }
              : link
          )
        : [
            ...links,
            {
              ...data,
              section_id: section.id,
              id: Date.now(), // Temporary ID for UI purposes
            } as FooterLink,
          ];
      
      // Sort by order
      updatedLinks.sort((a, b) => a.order - b.order);
      setLinks(updatedLinks);
      resetForm();
    } catch (error: any) {
      console.error("Failed to save footer link:", error);
      
      // Display specific error messages if available
      if (error?.errors) {
        onError(error.errors[0]?.msg || "Failed to save footer link");
      } else {
        const errorMessage = error?.message || "Failed to save footer link";
        onError(errorMessage);
      }
      
      // Handle API validation errors
      if (error?.error && typeof error.error === "object") {
        Object.entries(error.error).forEach(([field, message]) => {
          if (typeof message === "string") {
            onError(message);
          }
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit link
  const handleEditLink = (link: FooterLink) => {
    setEditMode(true);
    setCurrentLink(link);
    methods.reset({
      label: link.label,
      url: link.url,
      order: link.order,
      is_active: link.is_active,
    });
  };

  // Handle delete link
  const handleDeleteLink = (link: FooterLink) => {
    setLinkToDelete(link);
    setDeleteDialogOpen(true);
  };

  // Confirm delete link
  const confirmDeleteLink = async () => {
    if (!linkToDelete) return;
    
    try {
      if (linkToDelete.id) {
        await deleteFooterLink(linkToDelete.id);
        onSuccess("Footer link deleted successfully");
      }
      
      // Update local links array
      setLinks(links.filter((l) => l.id !== linkToDelete.id));
    } catch (error: any) {
      console.error("Failed to delete footer link:", error);
      onError(error?.message || "Failed to delete footer link");
    } finally {
      setDeleteDialogOpen(false);
      setLinkToDelete(null);
    }
  };

  // Close delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setLinkToDelete(null);
  };

  // Handle drag end for links reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Return if no change
    if (!over || active.id === over.id) {
      return;
    }
    
    try {
      // Find indices
      const activeIndex = links.findIndex(link => link.id.toString() === active.id);
      const overIndex = links.findIndex(link => link.id.toString() === over.id);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        // Update UI immediately
        const newLinks = arrayMove(links, activeIndex, overIndex);
        
        // Update orders
        const updatedLinks = newLinks.map((link, index) => ({
          ...link,
          order: index + 1
        }));
        
        setLinks(updatedLinks);
        
        // Get the moved link
        const movedLink = links[activeIndex];
        const newOrder = overIndex + 1;
        
        // API call to update order
        await reorderFooterLink(movedLink.id, { new_order: newOrder });
        onSuccess(`Link "${movedLink.label}" reordered successfully`);
      }
    } catch (error: any) {
      console.error("Failed to reorder link:", error);
      onError(error?.message || "Failed to reorder link");
      
      // Reset to original order
      const originalLinks = [...links].sort((a, b) => a.order - b.order);
      setLinks(originalLinks);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    resetForm();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Manage Links for Section: <strong>{section.title}</strong>
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)}>
              <Box sx={{ mb: 4, mt: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {editMode ? "Edit Link" : "Add New Link"}
                </Typography>
                
                {errors?.root?.message && (
                  <Alert className="mb-4" severity="error">
                    {errors?.root?.message}
                  </Alert>
                )}
                
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 2,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <Box sx={{ width: { xs: "100%", md: "45%" } }}>
                    <FormInputField
                      name="label"
                      control={methods.control}
                      label="Label"
                      required
                    />
                  </Box>
                  <Box sx={{ width: { xs: "100%", md: "45%" } }}>
                    <FormInputField
                      name="url"
                      control={methods.control}
                      label="URL"
                      required
                    />
                  </Box>
                  <Box sx={{ width: { xs: "100%", md: "15%" } }}>
                    <FormInputField
                      name="order"
                      control={methods.control}
                      label="Order"
                      type="number"
                      required
                    />
                  </Box>
                  <Box sx={{ width: { xs: "100%", md: "20%" }, mt: { xs: 1, md: 2 } }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={methods.watch("is_active")}
                          onChange={(e) => methods.setValue("is_active", e.target.checked)}
                          color="primary"
                          size="small"
                        />
                      }
                      label="Active"
                    />
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, mt: { xs: 1, md: 2 }, ml: { xs: 0, md: "auto" } }}>
                    <AppButton
                      label={editMode ? "Update" : "Add"}
                      type="submit"
                      disabled={!isValid || submitting}
                      loading={submitting}
                    />
                    {editMode && (
                      <AppButton
                        label="Cancel"
                        onClick={handleCancel}
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </form>
          </FormProvider>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Section Links
          </Typography>
          
          {links.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                No links added to this section yet. Add your first link above.
              </Typography>
            </Paper>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={links.map(link => link.id.toString())}
                strategy={verticalListSortingStrategy}
              >
                <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
                  {links.map((link) => (
                    <DraggableFooterLink
                      key={link.id}
                      link={link}
                      onEdit={() => handleEditLink(link)}
                      onDelete={() => handleDeleteLink(link)}
                    />
                  ))}
                </List>
              </SortableContext>
            </DndContext>
          )}
        </DialogContent>
        <DialogActions>
          <AppButton
            label="Close"
            onClick={onClose}
            variant="outlined"
          />
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-link-dialog-title"
        aria-describedby="delete-link-dialog-description"
      >
        <DialogTitle id="delete-link-dialog-title">
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          {linkToDelete && (
            <Typography variant="body1">
              Are you sure you want to delete the link "{linkToDelete.label}"?
            </Typography>
          )}
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
          <Button onClick={handleCloseDeleteDialog} color="primary" sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteLink} 
            color="error" 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? "Deleting..." : "Delete"}
          </Button>
        </Box>
      </Dialog>
    </LocalizationProvider>
  );
} 