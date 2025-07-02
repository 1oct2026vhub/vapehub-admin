'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getMenus, type MenuItem, deleteMenu, reorderMenus, type ReorderMenuItemPayload } from '@/services/apiMenu';
import {
  Box, Typography, CircularProgress, Alert, Stack, Card, CardContent, CardActions, IconButton, Collapse, Chip, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

// For drag-and-drop (UI only, not persisted)
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MenuDialog from './MenuDialog';
import { useSnackbar } from '@/contexts/SnackbarContext';
import DeleteConfirmationDialog from './DeleteDialog';
import AppButton from '@/components/Shared/AppButton';

// Draggable card for menu group or item
const DraggableMenuCard = ({ id, children, style, ...props }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <Box
      ref={setNodeRef}
      style={{
        ...style,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
        zIndex: isDragging ? 10 : 'auto',
      }}
      {...attributes}
      {...props}
    >
      {children(listeners, isDragging)}
    </Box>
  );
};

const MenuList: React.FC = () => {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<{ [id: number]: boolean }>({});
  const [isReordering, setIsReordering] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [parentMenuId, setParentMenuId] = useState<number | null>(null);
  const { showSnackbar } = useSnackbar();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Create a flat list of all draggable IDs for dnd-kit
  const allItemIds = useMemo(() => {
    const getItemIds = (items: MenuItem[]): (string | number)[] => {
      let ids: (string | number)[] = [];
      for (const item of items) {
        ids.push(item.id);
        if (item.children && item.children.length > 0) {
          ids = [...ids, ...getItemIds(item.children)];
        }
      }
      return ids;
    };
    return getItemIds(menus);
  }, [menus]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    getMenus()
      .then((response: any) => {
        // Assuming the actual data is in response.data
        const menuData = response.data || response;
        setMenus(Array.isArray(menuData) ? menuData : []);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch menus');
        setMenus([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDialog = (menu?: MenuItem, parentId?: number) => {
    setEditingMenu(menu || null);
    setParentMenuId(parentId || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMenu(null);
    setParentMenuId(null);
  };

  const handleSave = () => {
    handleCloseDialog();
    fetchData();
  };

  const handleDeleteClick = (id: number) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteMenu(itemToDelete);
      showSnackbar('Menu item deleted successfully!', 'success');
      fetchData();
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to delete menu item.', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Toggle expand/collapse for group
  const handleToggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;

    if (!active || !over || active.id === over.id) {
      return;
    }

    setMenus((items) => {
      const newItems = JSON.parse(JSON.stringify(items));
      const activeId = Number(active.id);
      const overId = Number(over.id);

      // Find the location of items before any mutations to get correct indices
      let activeLocation: { container: MenuItem[]; index: number } | null = null;
      let overLocation: { container: MenuItem[]; index: number; item: MenuItem } | null = null;

      const findLocation = ( container: MenuItem[], id: number ): { container: MenuItem[]; index: number; item: MenuItem } | null => {
        for (let i = 0; i < container.length; i++) {
          if (container[i].id === id) {
            return { container, index: i, item: container[i] };
          }
          if (container[i].children) {
            const found = findLocation(container[i].children, id);
            if (found) return found;
          }
        }
        return null;
      };

      activeLocation = findLocation(newItems, activeId);
      overLocation = findLocation(newItems, overId);

      if (!activeLocation || !overLocation) {
        return items; // One of the items wasn't found, abort
      }

      const isNesting = delta.x > 25;
      const overItem = overLocation.item;

      // First, remove the active item from its original position
      const [draggedItem] = activeLocation.container.splice( activeLocation.index, 1 );

      if (isNesting) {
        // Nesting action: Place the dragged item inside the 'over' item
        if (!overItem.children) {
          overItem.children = [];
        }
        overItem.children.unshift(draggedItem);
        setExpanded((prev) => ({ ...prev, [overItem.id]: true }));
      } else {
        // Reordering action
        const draggingDown = overLocation.index > activeLocation.index;
        const newOverLocation = findLocation(newItems, overId);

        if (newOverLocation) {
          const { container: targetContainer } = newOverLocation;
          let { index: targetIndex } = newOverLocation;

          // If in the same list and dragging down, insert *after* the target item
          if (activeLocation.container === targetContainer && draggingDown) {
            targetIndex += 1;
          }
          
          targetContainer.splice(targetIndex, 0, draggedItem);
        } else {
            // Fallback for cases like un-nesting to the root
            newItems.push(draggedItem);
        }
      }

      // 4. Persist changes
      const payload: ReorderMenuItemPayload[] = [];
      const buildPayload = (itemsToBuild: MenuItem[], parentId: number | null) => {
        itemsToBuild.forEach((item, index) => {
          payload.push({ id: item.id, order: index, menu_parent: parentId });
          if (item.children) {
            buildPayload(item.children, item.id);
          }
        });
      };
      buildPayload(newItems, null);
      
      setIsReordering(true);
      reorderMenus(payload)
        .then(() => {
          showSnackbar('Menu reordered successfully!', 'success');
          // We return newItems to optimistically update the UI
        })
        .catch((err) => {
          showSnackbar(err.message || 'Failed to reorder menu.', 'error');
          // Revert to original items on failure
          return items; 
        })
        .finally(() => {
          setIsReordering(false);
          fetchData(); // Refetch to ensure sync with server
        });

      return newItems; // Optimistic UI update
    });
  };

  // Unified recursive render function
  const renderItems = (items: MenuItem[], isTopLevel = false) => (
    <Stack spacing={isTopLevel ? 0.8 : 0.25} sx={!isTopLevel ? { mt: 0.5, pl: 2 } : {maxWidth: '700px'}}>
      {items.map((item) => (
        <DraggableMenuCard key={item.id} id={item.id}>
          {(listeners, isDragging) => (
            <Card
              sx={{
                borderRadius: isTopLevel ? 3 : 2,
                boxShadow: isTopLevel ? 1 : 0,
                border: isTopLevel ? 'none' : '1px solid rgba(0,0,0,0.12)',
                opacity: isDragging ? 0.7 : 1,
                overflow: 'visible',
              }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', py: isTopLevel ? 1 : 0.5, '&:last-child': { pb: isTopLevel ? 1 : 0.5 }, px: 2 }}>
                <Box {...listeners} sx={{ cursor: 'grab', mr: 2, color: 'text.secondary' }}>
                  <DragIndicatorIcon fontSize={isTopLevel ? 'medium' : 'small'} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant={isTopLevel ? 'h6' : 'subtitle1'} fontWeight={isTopLevel ? 600 : 500}>
                    {item.label}
                  </Typography>
                  {/* {item.original && (
                    <Typography variant="body2" color="text.secondary">
                      {item.original}
                    </Typography>
                  )} */}
                </Box>
                {/* {!isTopLevel && (
                  <Chip
                    label={item.status === 'active' ? 'Active' : 'Inactive'}
                    color={item.status === 'active' ? 'success' : 'default'}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                )} */}
                <Tooltip title="Add Item">
                  <IconButton size="small" onClick={() => handleOpenDialog(undefined, item.id)}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleOpenDialog(item)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => handleDeleteClick(item.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {item.children && item.children.length > 0 && (
                  <IconButton size="small" onClick={() => handleToggleExpand(item.id)}>
                    {expanded[item.id] !== false ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                )}
              </CardContent>
              {item.children && item.children.length > 0 && (
                <Collapse in={expanded[item.id] !== false} timeout="auto" unmountOnExit>
                  <Box sx={{ px: isTopLevel ? 2 : 0, pb: isTopLevel ? 2 : 1 }}>
                    {renderItems(item.children, false)}
                  </Box>
                </Collapse>
              )}
            </Card>
          )}
        </DraggableMenuCard>
      ))}
    </Stack>
  );

  if (loading || isReordering) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  // if (!menus?.length) {
  //   return <Typography>No menus found.</Typography>;
  // }
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>Menu List</Typography>
        <AppButton label="Create Menu" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} />
      </Box>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={allItemIds} strategy={verticalListSortingStrategy}>
          {renderItems(menus, true)}
        </SortableContext>
      </DndContext>
      <MenuDialog 
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        menuItem={editingMenu}
        parentId={parentMenuId}
      />
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        description="Are you sure you want to delete this menu item? This action cannot be undone."
      />
    </Box>
  );
};

export default MenuList; 