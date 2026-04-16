"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import AppButton from "@/components/Shared/AppButton";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  addUsersToNewsletterGroup,
  createNewsletterGroup,
  deleteNewsletterGroup,
  listNewsletterGroupUsers,
  listNewsletterGroups,
  removeUsersFromNewsletterGroup,
  updateNewsletterGroup,
  type NewsletterGroup,
} from "@/services/apiNewsletterTemplates";
import SelectUsersModal, {
  type GroupMemberItem,
} from "../promotional/_components/SelectUsersModal";

export default function GroupsPageClient() {
  const { showSnackbar } = useSnackbar();

  // ─── Groups list ────────────────────────────────────────────────────────────
  const [groups, setGroups] = useState<NewsletterGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // ─── Card three-dot menu ────────────────────────────────────────────────────
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuGroup, setMenuGroup] = useState<NewsletterGroup | null>(null);

  // ─── Shared SelectUsersModal state ──────────────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"create" | "edit">("create");

  // ─── Create state ───────────────────────────────────────────────────────────
  const [createName, setCreateName] = useState("");
  const [isSavingCreate, setIsSavingCreate] = useState(false);
  const [createNameError, setCreateNameError] = useState(false);

  // ─── Edit state ─────────────────────────────────────────────────────────────
  const [editingGroup, setEditingGroup] = useState<NewsletterGroup | null>(null);
  const [editName, setEditName] = useState("");
  const [editNameError, setEditNameError] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  // Current group members (pre-fetched for the members view)
  const [groupMembersData, setGroupMembersData] = useState<GroupMemberItem[]>([]);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  // Original member IDs for diff on save
  const [originalMemberIds, setOriginalMemberIds] = useState<Set<string>>(new Set());

  // ─── Delete dialog ──────────────────────────────────────────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Load groups ────────────────────────────────────────────────────────────
  const loadGroups = useCallback(async () => {
    setIsLoadingGroups(true);
    try {
      const res = await listNewsletterGroups();
      if (res.success) setGroups(Array.isArray(res.data) ? res.data : []);
    } catch {
      showSnackbar("Failed to load groups", "error");
    } finally {
      setIsLoadingGroups(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  // ─── Open CREATE picker ─────────────────────────────────────────────────────
  const openCreatePicker = () => {
    setCreateName("");
    setCreateNameError(false);
    setPickerMode("create");
    setPickerOpen(true);
  };

  // ─── Open EDIT picker ───────────────────────────────────────────────────────
  const openEdit = async (group: NewsletterGroup) => {
    setMenuAnchorEl(null);
    setMenuGroup(null);
    setEditingGroup(group);
    setEditName(group.name);
    setEditNameError(false);
    setGroupMembersData([]);
    setOriginalMemberIds(new Set());
    setIsFetchingMembers(true);
    setPickerMode("edit");

    try {
      const res = await listNewsletterGroupUsers(group.id, { pageSize: 500 });
      const members = Array.isArray(res.data) ? res.data : [];
      const items: GroupMemberItem[] = members
        .filter((m) => m.email)
        .map((m) => ({ id: String(m.id), email: m.email }));
      setGroupMembersData(items);
      setOriginalMemberIds(new Set(items.map((m) => m.id)));
    } catch {
      setGroupMembersData([]);
    } finally {
      setIsFetchingMembers(false);
      setPickerOpen(true);
    }
  };

  // ─── Confirm callback from SelectUsersModal ──────────────────────────────────
  const handlePickerConfirmIds = async (ids: string[], _emails: string[]) => {
    if (pickerMode === "create") {
      const name = createName.trim();
      if (!name) {
        setCreateNameError(true);
        showSnackbar("Group name is required.", "error");
        return;
      }
      setIsSavingCreate(true);
      try {
        const res = await createNewsletterGroup({ name });
        if (!res.success) {
          showSnackbar(res.message || "Failed to create group.", "error");
          return;
        }
        const newGroupId = res.data?.id;
        if (newGroupId && ids.length > 0) {
          await addUsersToNewsletterGroup(newGroupId, { userIds: ids });
        }
        showSnackbar("Group created.", "success");
        void loadGroups();
      } catch {
        showSnackbar("An error occurred.", "error");
      } finally {
        setIsSavingCreate(false);
      }
    } else if (editingGroup) {
      const name = editName.trim();
      if (!name) {
        setEditNameError(true);
        showSnackbar("Group name is required.", "error");
        return;
      }
      setIsSavingEdit(true);
      try {
        const updateRes = await updateNewsletterGroup(editingGroup.id, { name });
        if (!updateRes.success) {
          showSnackbar(updateRes.message || "Failed to update group.", "error");
          return;
        }
        // Compute diff: add new, remove unchecked
        const selectedIdSet = new Set(ids);
        const toAdd = ids.filter((id) => !originalMemberIds.has(id));
        const toRemove = [...originalMemberIds].filter((id) => !selectedIdSet.has(id));
        await Promise.all([
          toAdd.length > 0
            ? addUsersToNewsletterGroup(editingGroup.id, { userIds: toAdd })
            : Promise.resolve(),
          toRemove.length > 0
            ? removeUsersFromNewsletterGroup(editingGroup.id, { userIds: toRemove })
            : Promise.resolve(),
        ]);
        showSnackbar("Group updated.", "success");
        void loadGroups();
      } catch {
        showSnackbar("An error occurred.", "error");
      } finally {
        setIsSavingEdit(false);
      }
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const openDelete = (id: string) => {
    setMenuAnchorEl(null);
    setMenuGroup(null);
    setDeletingGroupId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingGroupId) return;
    setIsDeleting(true);
    try {
      const res = await deleteNewsletterGroup(deletingGroupId);
      if (res.success) {
        showSnackbar("Group deleted.", "success");
        setDeleteDialogOpen(false);
        setDeletingGroupId(null);
        void loadGroups();
      } else {
        showSnackbar(res.message || "Failed to delete group.", "error");
      }
    } catch {
      showSnackbar("An error occurred.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box className="p-6">
      <PageBreadcrumb />

      {/* Page header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Typography className="text-3xl font-extrabold leading-none tracking-tight">
          Newsletter Groups
        </Typography>
        <AppButton
          type="button"
          variant="contained"
          label="Create Group"
          startIcon={<AddIcon />}
          onClick={openCreatePicker}
        />
      </Box>

      {/* Groups card grid */}
      {isLoadingGroups ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : groups.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: "center", borderRadius: 2 }}>
          <Typography color="text.secondary">
            No groups yet.{" "}
            <Button size="small" onClick={openCreatePicker}>
              Create one
            </Button>
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {groups.map((group) => (
            <Paper
              key={group.id}
              variant="outlined"
              sx={{ p: 2, borderRadius: 2, display: "flex", flexDirection: "column", gap: 0.5 }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Typography fontWeight={600} variant="body1">
                  {group.name}
                </Typography>
                <IconButton
                  size="small"
                  sx={{ mt: -0.5, mr: -0.5 }}
                  onClick={(e) => { setMenuAnchorEl(e.currentTarget); setMenuGroup(group); }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {group.userCount ?? 0} users
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Three-dot menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => { setMenuAnchorEl(null); setMenuGroup(null); }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={() => { if (menuGroup) void openEdit(menuGroup); }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem
          onClick={() => { if (menuGroup) openDelete(menuGroup.id); }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>

      {/* Loading spinner while fetching members for edit */}
      {isFetchingMembers && (
        <Box
          sx={{
            position: "fixed", inset: 0, zIndex: 1400,
            display: "flex", alignItems: "center", justifyContent: "center",
            bgcolor: "rgba(0,0,0,0.25)",
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* ── Shared SelectUsersModal (Create + Edit) ──────────────────────── */}
      <SelectUsersModal
        open={pickerOpen && !isFetchingMembers}
        onClose={() => setPickerOpen(false)}
        hideRecipientOptions
        title={pickerMode === "create" ? "Create Group" : "Edit Group"}
        description={
          pickerMode === "create"
            ? "Enter a group name and select users to add."
            : "Edit the group name. Check or uncheck users to add or remove them."
        }
        initialSelectedEmails={
          pickerMode === "edit"
            ? groupMembersData.map((m) => m.email)
            : []
        }
        groupMembersData={pickerMode === "edit" ? groupMembersData : undefined}
        onConfirmSubscriberIds={handlePickerConfirmIds}
        extraContent={
          pickerMode === "create" ? (
            <TextField
              label="Group Name *"
              value={createName}
              onChange={(e) => { setCreateName(e.target.value); setCreateNameError(false); }}
              fullWidth
              size="small"
              required
              autoFocus
              error={createNameError}
              helperText={createNameError ? "Group name is required" : undefined}
            />
          ) : (
            <TextField
              label="Group Name *"
              value={editName}
              onChange={(e) => { setEditName(e.target.value); setEditNameError(false); }}
              fullWidth
              size="small"
              required
              autoFocus
              error={editNameError}
              helperText={editNameError ? "Group name is required" : undefined}
            />
          )
        }
      />

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !isDeleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Group</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this group? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={isDeleting}
            onClick={handleDelete}
            startIcon={isDeleting ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
