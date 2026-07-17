import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Collapse,
  IconButton,
  Typography,
  Tooltip,
  MenuItem,
  ListItemIcon,
  List,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import { FooterSection, FooterLink, deleteFooterLink } from '@/services/apiFooter';

// dnd-kit imports
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import DraggableFooterLink, { getFooterLinkSortableId } from './DraggableFooterLink';
import EditLinkDialog from './EditLinkDialog';

interface DraggableFooterSectionProps {
  section: FooterSection;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onManageLinks: () => void;
  onReorderLinks?: (sectionId: number, links: FooterLink[]) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export default function DraggableFooterSection({
  section,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onManageLinks,
  onReorderLinks,
  onSuccess,
  onError,
}: DraggableFooterSectionProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<FooterLink | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [linkToEdit, setLinkToEdit] = useState<FooterLink | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 9999 : 'auto',
  };

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

  // Handle drag end for links reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Return if no change
    if (!over || active.id === over.id || !section.links || !onReorderLinks) {
      return;
    }
    
    try {
      // Find indices
      const activeIndex = section.links.findIndex(link => getFooterLinkSortableId(link) === active.id);
      const overIndex = section.links.findIndex(link => getFooterLinkSortableId(link) === over.id);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        // Update UI immediately
        const newLinks = arrayMove(section.links, activeIndex, overIndex);
        
        // Update orders
        const updatedLinks = newLinks.map((link, index) => ({
          ...link,
          order: index + 1
        }));
        
        // Call the parent handler to update the links
        onReorderLinks(section.id, updatedLinks);
      }
    } catch (error) {
      console.error("Failed to reorder link:", error);
      onError?.("Failed to reorder link");
    }
  };

  // Handle edit link
  const handleEditLink = (link: FooterLink) => {
    setLinkToEdit(link);
    setEditDialogOpen(true);
  };

  // Handle link update
  const handleLinkUpdate = (updatedLink: FooterLink) => {
    if (onReorderLinks && section.links) {
      const updatedLinks = section.links.map(link => 
        link.id === updatedLink.id ? updatedLink : link
      );
      onReorderLinks(section.id, updatedLinks);
    }
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
      setSubmitting(true);
      await deleteFooterLink(linkToDelete.id);
      onSuccess?.("Footer link deleted successfully");
      
      // Update local state through parent's reorder handler
      if (onReorderLinks && section.links) {
        const updatedLinks = section.links.filter(l => l.id !== linkToDelete.id)
          .map((link, index) => ({
            ...link,
            order: index + 1
          }));
        onReorderLinks(section.id, updatedLinks);
      }
    } catch (error) {
      console.error("Failed to delete footer link:", error);
      onError?.("Failed to delete footer link");
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
      setLinkToDelete(null);
    }
  };

  // Close delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setLinkToDelete(null);
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        sx={{
          mb: 2,
          boxShadow: isDragging 
            ? '0 8px 16px rgba(0,0,0,0.3)' 
            : '0 1px 3px rgba(0,0,0,0.1)',
          border: isDragging ? '1px solid #2196f3' : 'none',
          transition: 'box-shadow 0.2s, border 0.2s',
        }}
      >
        <CardHeader
          title={
            <Box 
              display="flex" 
              alignItems="center" 
              sx={{ 
                width: '100%',
                cursor: 'pointer'
              }}
              onClick={onToggleExpand}
            >
              <IconButton
                {...attributes}
                {...listeners}
                size="small"
                onClick={(e) => e.stopPropagation()} // Prevent expand when clicking drag handle
                sx={{
                  mr: 1,
                  cursor: 'grab',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                }}
              >
                <DragIndicatorIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {section.title}
              </Typography>
            </Box>
          }
          action={
            <Box onClick={(e) => e.stopPropagation()}> {/* Prevent expand when clicking action buttons */}
              <Tooltip title="Manage Links">
                <IconButton onClick={onManageLinks}>
                  <LinkIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit Section">
                <IconButton onClick={onEdit}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Section">
                <IconButton onClick={onDelete}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={isExpanded ? "Collapse" : "Expand"}>
                <IconButton onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}>
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          }
          sx={{
            backgroundColor: section.is_active ? 'inherit' : 'rgba(0, 0, 0, 0.05)',
            opacity: section.is_active ? 1 : 0.7,
          }}
        />
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <CardContent>
            {/* <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Order:</strong> {section.order}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Status:</strong> {section.is_active ? 'Active' : 'Inactive'}
            </Typography> */}
            <Box mt={2}>
              {section.links && section.links.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={section.links.map(link => getFooterLinkSortableId(link))}
                    strategy={verticalListSortingStrategy}
                  >
                    <List sx={{ pl: 2, maxHeight: '300px', overflow: 'auto' }}>
                      {section.links.map((link) => (
                        <DraggableFooterLink
                          key={link.id}
                          link={link}
                          sortableId={getFooterLinkSortableId(link)}
                          onEdit={() => handleEditLink(link)}
                          onDelete={() => handleDeleteLink(link)}
                        />
                      ))}
                    </List>
                  </SortableContext>
                </DndContext>
              ) : (
                <Box 
                  sx={{ 
                    pl: 2, 
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderLeft: '1px solid #e0e0e0',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No links found in this section
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Collapse>
      </Card>

      {/* Delete Link Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Link</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the link &quot;{linkToDelete?.label || ""}&quot;?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
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
        </DialogActions>
      </Dialog>

      {/* Edit Link Dialog */}
      {linkToEdit && (
        <EditLinkDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setLinkToEdit(null);
          }}
          link={linkToEdit}
          sectionTitle={section.title}
          onSuccess={onSuccess}
          onError={onError}
          onUpdate={handleLinkUpdate}
        />
      )}
    </>
  );
} 