import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { FooterLink } from '@/services/apiFooter';

export const getFooterLinkSortableId = (link: FooterLink) => `footer-link-${link.id}`;

interface DraggableFooterLinkProps {
  link: FooterLink;
  sortableId: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function DraggableFooterLink({
  link,
  sortableId,
  onEdit,
  onDelete,
}: DraggableFooterLinkProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 9999 : 'auto',
    backgroundColor: isDragging ? '#e3f2fd' : undefined,
    boxShadow: isDragging ? '0 5px 10px rgba(0,0,0,0.2)' : undefined,
    borderRadius: '4px',
    marginBottom: '8px',
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        mb: 1,
        opacity: link.is_active ? 1 : 0.6,
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        },
      }}
    >
      <IconButton
        edge="start"
        size="small"
        sx={{ mr: 1, cursor: 'grab' }}
        {...attributes}
        {...listeners}
      >
        <DragIndicatorIcon />
      </IconButton>
      
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            {link.label}
            {!link.is_active && (
              <Chip
                label="Inactive"
                size="small"
                color="default"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Box>
        }
        secondary={link.url}
        primaryTypographyProps={{
          fontWeight: 500,
        }}
        secondaryTypographyProps={{
          sx: {
            fontSize: '0.85rem',
            color: 'text.secondary',
          },
        }}
      />
      
      <ListItemSecondaryAction>
        <Tooltip title="Edit Link">
          <IconButton edge="end" size="small" onClick={onEdit} sx={{ mr: 0.5 }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Delete Link">
          <IconButton edge="end" size="small" onClick={onDelete}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    </ListItem>
  );
} 