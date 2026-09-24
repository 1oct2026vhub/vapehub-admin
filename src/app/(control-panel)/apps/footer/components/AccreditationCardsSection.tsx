"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
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
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AppButton from "@/components/Shared/AppButton";
import {
  FooterBadge,
  deleteFooterBadge,
  getFooterBadges,
  reorderFooterBadge,
} from "@/services/apiFooter";
import AccreditationCardDialog from "./AccreditationCardDialog";

interface AccreditationCardsSectionProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function SortableBadgeCard({
  badge,
  onEdit,
  onDelete,
}: {
  badge: FooterBadge;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: badge.id.toString(),
  });

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      sx={{
        bgcolor: "#163c32",
        color: "#fff",
        borderRadius: 2,
        p: 1.5,
        width: 160,
        minHeight: 110,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        position: "relative",
        opacity: badge.is_active === false ? 0.55 : 1,
        border: "1px solid transparent",
        cursor: "grab",
        "&:hover": {
          borderColor: "#9fd4b3",
        },
      }}
    >
      <Box sx={{ position: "absolute", top: 2, right: 2 }} onPointerDown={(e) => e.stopPropagation()}>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={onEdit} sx={{ color: "#fff" }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={onDelete} sx={{ color: "#fff" }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      {badge.icon_url ? (
        <Box
          component="img"
          src={badge.icon_url}
          alt={badge.heading}
          sx={{ width: 22, height: 22, objectFit: "contain", mb: 1, mt: 1.5 }}
        />
      ) : (
        <Box
          sx={{
            width: 22,
            height: 22,
            border: "1px solid rgba(255,255,255,0.4)",
            borderRadius: 0.5,
            mb: 1,
            mt: 1.5,
          }}
        />
      )}
      <Typography
        fontWeight={700}
        sx={{ textTransform: "uppercase", letterSpacing: 0.3, fontSize: 12, lineHeight: 1.2 }}
      >
        {badge.heading}
      </Typography>
      <Typography
        variant="caption"
        sx={{ textTransform: "uppercase", opacity: 0.75, mt: 0.25, fontSize: 10 }}
      >
        {badge.subtitle}
      </Typography>
    </Box>
  );
}

export default function AccreditationCardsSection({
  onSuccess,
  onError,
}: AccreditationCardsSectionProps) {
  const [badges, setBadges] = useState<FooterBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<FooterBadge | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [badgeToDelete, setBadgeToDelete] = useState<FooterBadge | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchData = async () => {
    setLoading(true);

    try {
      const response = await getFooterBadges(
        showActiveOnly ? { is_active: true } : {}
      );
      setBadges(response);
    } catch (error) {
      console.error("Failed to load footer badges:", error);
      onError("Failed to load trust badges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [showActiveOnly]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeIndex = badges.findIndex((badge) => badge.id.toString() === active.id);
    const overIndex = badges.findIndex((badge) => badge.id.toString() === over.id);
    if (activeIndex === -1 || overIndex === -1) return;

    const moved = badges[activeIndex];
    const reordered = arrayMove(badges, activeIndex, overIndex).map((badge, index) => ({
      ...badge,
      order: index,
    }));
    setBadges(reordered);

    try {
      await reorderFooterBadge(moved.id, { new_order: overIndex });
      onSuccess(`Badge "${moved.heading}" reordered successfully`);
    } catch (error: any) {
      onError(error?.message || "Failed to reorder badge");
      fetchData();
    }
  };

  const confirmDeleteBadge = async () => {
    if (!badgeToDelete) return;

    try {
      await deleteFooterBadge(badgeToDelete.id);
      onSuccess("Trust badge deleted successfully");
      fetchData();
    } catch (error: any) {
      onError(error?.message || "Failed to delete trust badge");
    } finally {
      setDeleteDialogOpen(false);
      setBadgeToDelete(null);
    }
  };

  return (
    <Box mb={6}>
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        mb={3}
        gap={2}
      >
        <Box>
          <Typography variant="h4" component="h2" fontWeight={600}>
            Trust Badges
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            CMS cards for the storefront footer carousel. These are not footer links.
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <FormControlLabel
            control={
              <Switch
                checked={showActiveOnly}
                onChange={(event) => setShowActiveOnly(event.target.checked)}
                color="primary"
              />
            }
            label="Show active only"
          />
          <AppButton
            label="Add Badge"
            onClick={() => {
              setCurrentBadge(null);
              setDialogOpen(true);
            }}
          />
        </Box>
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading trust badges...</Typography>
      ) : badges.length === 0 ? (
        <Alert severity="info">
          No trust badges yet. Click &quot;Add Badge&quot; to create one.
        </Alert>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={badges.map((badge) => badge.id.toString())}
            strategy={horizontalListSortingStrategy}
          >
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              {badges.map((badge) => (
                <SortableBadgeCard
                  key={badge.id}
                  badge={badge}
                  onEdit={() => {
                    setCurrentBadge(badge);
                    setDialogOpen(true);
                  }}
                  onDelete={() => {
                    setBadgeToDelete(badge);
                    setDeleteDialogOpen(true);
                  }}
                />
              ))}
            </Box>
          </SortableContext>
        </DndContext>
      )}

      <AccreditationCardDialog
        open={dialogOpen}
        card={currentBadge}
        nextOrder={badges.length}
        onClose={() => {
          setDialogOpen(false);
          setCurrentBadge(null);
        }}
        onSaved={fetchData}
        onSuccess={onSuccess}
        onError={onError}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Trust Badge</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{badgeToDelete?.heading || ""}&quot;?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmDeleteBadge} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
