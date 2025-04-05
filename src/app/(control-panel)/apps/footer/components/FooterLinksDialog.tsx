"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  FormControlLabel,
  Switch,
  IconButton,
  Paper,
  Divider,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import { useForm, FormProvider } from "react-hook-form";
import AddIcon from "@mui/icons-material/Add";
import { MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
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
  
  // Form state with react-hook-form
  const methods = useForm({
    defaultValues: {
      label: "",
      url: "",
      order: 0,
      is_active: true,
    }
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      // Add temporary ids if missing
      const linksWithIds = (section.links || []).map(link => ({
        ...link,
        id: link.id || Math.random() * -1000,
      }));
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
  const handleSubmit = async (data: any) => {
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
        });
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
      
      setLinks(updatedLinks);
      resetForm();
    } catch (error) {
      console.error("Failed to save footer link:", error);
      onError("Failed to save footer link");
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
  const handleDeleteLink = async (link: FooterLink) => {
    if (!window.confirm(`Are you sure you want to delete the link "${link.label}"?`)) {
      return;
    }
    
    try {
      if (link.id) {
        await deleteFooterLink(link.id);
        onSuccess("Footer link deleted successfully");
      }
      
      // Update local links array
      setLinks(links.filter((l) => l.id !== link.id));
    } catch (error) {
      console.error("Failed to delete footer link:", error);
      onError("Failed to delete footer link");
    }
  };

  // Cancel edit
  const handleCancel = () => {
    resetForm();
  };

  // Table columns
  const columns = useMemo<MRT_ColumnDef<FooterLink>[]>(
    () => [
      {
        accessorKey: "label",
        header: "Label",
        size: 200,
      },
      {
        accessorKey: "url",
        header: "URL",
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
    ],
    []
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          Manage Links for Section: <strong>{section.title}</strong>
        </Typography>
      </DialogTitle>
      <DialogContent>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)}>
            <Box sx={{ mb: 4, mt: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {editMode ? "Edit Link" : "Add New Link"}
              </Typography>
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
                    disabled={!methods.watch("label") || !methods.watch("url")}
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
          <DataTable
            columns={columns}
            data={links}
            enableRowActions
            renderRowActionMenuItems={({ closeMenu, row }) => [
              <MenuItem
                key="edit"
                onClick={() => {
                  handleEditLink(row.original);
                  closeMenu();
                }}
              >
                <ListItemIcon>
                  <FuseSvgIcon>heroicons-outline:pencil</FuseSvgIcon>
                </ListItemIcon>
                Edit
              </MenuItem>,
              <MenuItem
                key="delete"
                onClick={() => {
                  handleDeleteLink(row.original);
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
  );
} 