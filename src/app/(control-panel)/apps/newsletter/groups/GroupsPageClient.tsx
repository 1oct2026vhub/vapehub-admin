/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { getSubscribers, type Subscriber } from '@/services/apiSubscribers';
import TablePagination from '@/components/Shared/TablePagination';
import {
  NewsletterGroup,
  addUsersToNewsletterGroup,
  createNewsletterGroup,
  deleteNewsletterGroup,
  getNewsletterGroup,
  listNewsletterGroupUsers,
  listNewsletterGroups,
  removeUsersFromNewsletterGroup,
  updateNewsletterGroup,
} from '@/services/apiNewsletterTemplates';

type GroupFormState = {
  id?: string;
  name: string;
  userIds: string[];
};

const emptyForm: GroupFormState = { name: '', userIds: [] };

export default function GroupsPageClient() {
  const { showSnackbar } = useSnackbar();

  const [groups, setGroups] = useState<NewsletterGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuGroupId, setMenuGroupId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [form, setForm] = useState<GroupFormState>(emptyForm);
  const [isLoadingGroup, setIsLoadingGroup] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
  const [users, setUsers] = useState<Subscriber[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit, setUsersLimit] = useState(10);
  const [usersTotal, setUsersTotal] = useState(0);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [initialSelectedUserIds, setInitialSelectedUserIds] = useState<Set<string>>(new Set());
  const [editGroupUsers, setEditGroupUsers] = useState<Array<{ userId: string; email?: string }>>([]);
  const [isAddMode, setIsAddMode] = useState(false);
  const [addSelectedUserIds, setAddSelectedUserIds] = useState<Set<string>>(new Set());

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const groupsById = useMemo(() => {
    const map = new Map<string, NewsletterGroup>();
    groups.forEach((g) => g.id && map.set(g.id, g));
    return map;
  }, [groups]);

  const usersTotalPages = useMemo(() => Math.ceil(usersTotal / usersLimit) || 1, [usersTotal, usersLimit]);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const res = await listNewsletterGroups();
      if (!res.success) throw new Error(res.message || 'Failed to load groups');
      setGroups(res.data || []);
    } catch (e: any) {
      showSnackbar(e?.message || 'Failed to load groups', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce user search in group form
  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserSearch(userSearch), 350);
    return () => clearTimeout(t);
  }, [userSearch]);

  useEffect(() => {
    if (!formOpen) return;
    setUsersPage(1);
  }, [debouncedUserSearch, formOpen]);

  // Load users for picker while form is open
  useEffect(() => {
    if (!formOpen) return;
    if (formMode === 'edit' && !isAddMode) return; // edit mode lists only group users unless adding
    let cancelled = false;

    const loadUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const res = await getSubscribers({
          page: usersPage,
          limit: usersLimit,
          subscribed: true,
          ...(debouncedUserSearch.trim() ? { search: debouncedUserSearch.trim() } : {}),
        });
        if (cancelled) return;
        setUsers(res.data?.subscribers || []);
        setUsersTotal(res.data?.pagination?.total || 0);
      } catch (e) {
        if (!cancelled) {
          setUsers([]);
          setUsersTotal(0);
        }
      } finally {
        if (!cancelled) setIsLoadingUsers(false);
      }
    };

    void loadUsers();
    return () => {
      cancelled = true;
    };
  }, [formOpen, formMode, isAddMode, debouncedUserSearch, usersPage, usersLimit]);

  const openMenu = (e: React.MouseEvent<HTMLElement>, id: string) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
    setMenuGroupId(id);
  };
  const closeMenu = () => {
    setMenuAnchorEl(null);
    setMenuGroupId(null);
  };

  const openCreate = () => {
    setFormMode('create');
    setForm(emptyForm);
    setUserSearch('');
    setDebouncedUserSearch('');
    setUsers([]);
    setUsersTotal(0);
    setUsersPage(1);
    setSelectedUserIds(new Set());
    setInitialSelectedUserIds(new Set());
    setEditGroupUsers([]);
    setIsAddMode(false);
    setAddSelectedUserIds(new Set());
    setFormOpen(true);
  };

  const openEdit = async (id: string) => {
    setFormMode('edit');
    setFormOpen(true);
    setIsLoadingGroup(true);
    setUserSearch('');
    setDebouncedUserSearch('');
    setUsers([]);
    setUsersTotal(0);
    setUsersPage(1);
    setEditGroupUsers([]);
    setIsAddMode(false);
    setAddSelectedUserIds(new Set());
    try {
      const res = await getNewsletterGroup(id);
      if (!res.success) throw new Error(res.message || 'Failed to load group');
      const g = res.data;
      setForm({
        id: g.id,
        name: g.name || '',
        userIds: Array.isArray(g.userIds) ? g.userIds : [],
      });
      // Source of truth for default selection: group users API
      let initialIds: string[] = [];
      try {
        const usersRes = await listNewsletterGroupUsers(id);
        if (usersRes.success) {
          initialIds = Array.isArray(usersRes.data?.userIds) ? usersRes.data.userIds.map((x) => String(x)) : [];
        }
      } catch {
        // fallback below
      }
      if (!initialIds.length) {
        initialIds =
          Array.isArray(g.userIds) && g.userIds.length
            ? g.userIds.map((x: any) => String(x))
            : (Array.isArray((g as any).users) ? ((g as any).users as any[]) : [])
                .map((u) => u?.userId ?? u?.user_id ?? u?.id)
                .filter((v) => v !== undefined && v !== null)
                .map((v) => String(v));
      }

      const nextSelected = new Set(initialIds);
      setSelectedUserIds(nextSelected);
      setInitialSelectedUserIds(new Set(initialIds));
      // Keep form payload aligned with what user sees
      setForm((p) => ({ ...p, userIds: Array.from(nextSelected) }));

      // Build edit-mode list items: only group members
      const usersArr = Array.isArray((g as any).users) ? ((g as any).users as any[]) : [];
      const byIdEmail = new Map<string, string>();
      usersArr.forEach((u) => {
        const uid = u?.userId ?? u?.user_id ?? u?.id;
        const email = typeof u?.email === 'string' ? u.email.trim() : '';
        if (uid !== undefined && uid !== null && email) byIdEmail.set(String(uid), email);
      });
      setEditGroupUsers(initialIds.map((uid) => ({ userId: uid, email: byIdEmail.get(uid) })));
    } catch (e: any) {
      showSnackbar(e?.message || 'Failed to load group', 'error');
      setFormOpen(false);
    } finally {
      setIsLoadingGroup(false);
    }
  };

  const filteredEditGroupUsers = useMemo(() => {
    if (formMode !== 'edit') return [];
    const q = userSearch.trim().toLowerCase();
    const base = editGroupUsers;
    if (!q) return base;
    return base.filter((u) => {
      const email = (u.email || '').toLowerCase();
      return email.includes(q) || u.userId.includes(q);
    });
  }, [formMode, editGroupUsers, userSearch]);

  const handleAddUsersToGroup = async () => {
    if (formMode !== 'edit') return;
    if (!form.id) return;
    const idsToAdd = Array.from(addSelectedUserIds);
    if (!idsToAdd.length) return;

    setIsMutating(true);
    try {
      const res = await addUsersToNewsletterGroup(form.id, { userIds: idsToAdd });
      if (!res.success) throw new Error(res.message || 'Failed to add users');

      const nextSelected = new Set(selectedUserIds);
      idsToAdd.forEach((id) => nextSelected.add(String(id)));
      setSelectedUserIds(nextSelected);

      const nextInitial = new Set(initialSelectedUserIds);
      idsToAdd.forEach((id) => nextInitial.add(String(id)));
      setInitialSelectedUserIds(nextInitial);

      setForm((p) => ({ ...p, userIds: Array.from(nextSelected) }));

      const emailByUserId = new Map<string, string>();
      users.forEach((u) => {
        if (u.user_id !== null) emailByUserId.set(String(u.user_id), u.email || '');
      });
      setEditGroupUsers((prev) => {
        const byId = new Map(prev.map((x) => [x.userId, x]));
        idsToAdd.forEach((id) => {
          const uid = String(id);
          if (!byId.has(uid)) byId.set(uid, { userId: uid, email: emailByUserId.get(uid) });
        });
        return Array.from(byId.values());
      });

      // Exit add mode and show group users again
      setIsAddMode(false);
      setAddSelectedUserIds(new Set());
      setUserSearch('');
      setDebouncedUserSearch('');
      setUsers([]);
      setUsersTotal(0);
      setUsersPage(1);

      showSnackbar('User(s) added to group.', 'success');
    } catch (e: any) {
      showSnackbar(e?.message || 'Failed to add users', 'error');
    } finally {
      setIsMutating(false);
    }
  };

  const syncSelectedToForm = (next: Set<string>) => {
    setSelectedUserIds(next);
    setForm((p) => ({ ...p, userIds: Array.from(next) }));
  };

  const toggleUser = (id: string) => {
    const next = new Set(selectedUserIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    syncSelectedToForm(next);
  };

  const isAllOnPageSelected = useMemo(() => {
    const valid = users.filter((u) => u.user_id !== null);
    if (valid.length === 0) return false;
    return valid.every((u) => selectedUserIds.has(String(u.user_id)));
  }, [users, selectedUserIds]);

  const isSomeOnPageSelected = useMemo(() => {
    const valid = users.filter((u) => u.user_id !== null);
    if (valid.length === 0) return false;
    const some = valid.some((u) => selectedUserIds.has(String(u.user_id)));
    return some && !isAllOnPageSelected;
  }, [users, selectedUserIds, isAllOnPageSelected]);

  const toggleAllOnPage = (checked: boolean) => {
    const next = new Set(selectedUserIds);
    const valid = users.filter((u) => u.user_id !== null);
    if (checked) {
      valid.forEach((u) => next.add(String(u.user_id)));
    } else {
      valid.forEach((u) => next.delete(String(u.user_id)));
    }
    syncSelectedToForm(next);
  };

  const submitForm = async () => {
    const name = form.name.trim();
    if (!name) {
      showSnackbar('Group name is required.', 'error');
      return;
    }

    setIsMutating(true);
    try {
      if (formMode === 'create') {
        const res = await createNewsletterGroup({
          name,
          userIds: form.userIds.length ? form.userIds : undefined,
        });
        if (!res.success) throw new Error(res.message || 'Failed to create group');
        showSnackbar('Group created successfully.', 'success');
      } else {
        if (!form.id) throw new Error('Missing group id');
        // Update group name
        const res = await updateNewsletterGroup(form.id, { name });
        if (!res.success) throw new Error(res.message || 'Failed to update group');

        // Apply membership changes using bulk add/remove endpoints
        const current = new Set(form.userIds.map(String));
        const initial = initialSelectedUserIds;

        const toAdd = Array.from(current).filter((id) => !initial.has(id));
        const toRemove = Array.from(initial).filter((id) => !current.has(id));

        if (toAdd.length) {
          const addRes = await addUsersToNewsletterGroup(form.id, { userIds: toAdd });
          if (!addRes.success) throw new Error(addRes.message || 'Failed to add users to group');
        }
        if (toRemove.length) {
          const remRes = await removeUsersFromNewsletterGroup(form.id, { userIds: toRemove });
          if (!remRes.success) throw new Error(remRes.message || 'Failed to remove users from group');
        }

        showSnackbar('Group updated successfully.', 'success');
      }
      setFormOpen(false);
      setForm(emptyForm);
      await loadGroups();
    } catch (e: any) {
      showSnackbar(e?.message || 'Request failed', 'error');
    } finally {
      setIsMutating(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const performDelete = async () => {
    if (!deleteConfirmId) return;
    setIsMutating(true);
    try {
      const res = await deleteNewsletterGroup(deleteConfirmId);
      if (!res.success) throw new Error(res.message || 'Failed to delete group');
      setGroups((prev) => prev.filter((g) => g.id !== deleteConfirmId));
      showSnackbar('Group deleted successfully.', 'success');
      setDeleteConfirmId(null);
    } catch (e: any) {
      showSnackbar(e?.message || 'Failed to delete group', 'error');
    } finally {
      setIsMutating(false);
    }
  };

  const selectedGroupName = useMemo(() => {
    if (!deleteConfirmId) return '';
    return groupsById.get(deleteConfirmId)?.name || '';
  }, [deleteConfirmId, groupsById]);

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [groups]);

  return (
    <div className="p-6">
      <PageBreadcrumb />
      <Box className="mt-4 bg-white rounded-lg p-6">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="h5" className="font-semibold">
              Newsletter Groups
            </Typography>
            {/* <Typography variant="body2" color="text.secondary">
              Create groups to manage newsletter recipients. You can add user IDs now; user picker will be wired when user APIs are added.
            </Typography> */}
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Create Group
          </Button>
        </Stack>

        {isLoading ? (
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress size={32} />
          </Box>
        ) : sortedGroups.length === 0 ? (
          <Box
            sx={{
              border: '1px dashed rgba(0,0,0,0.2)',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              No groups yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Click “Create Group” to add your first newsletter group.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
              gap: 2,
              mt: 2,
            }}
          >
            {sortedGroups.map((g) => (
              <Box
                key={g.id}
                sx={{
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: 2,
                  p: 2,
                  position: 'relative',
                  background:
                    'linear-gradient(180deg, rgba(25,118,210,0.06) 0%, rgba(255,255,255,1) 55%)',
                }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => openMenu(e, g.id)}
                  sx={{ position: 'absolute', right: 8, top: 8 }}
                  aria-label="Group actions"
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>

                <Typography variant="subtitle1" fontWeight={700} pr={4}>
                  {g.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {typeof g.userCount === 'number'
                    ? `${g.userCount} user${g.userCount === 1 ? '' : 's'}`
                    : 'Users: —'}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            if (menuGroupId) void openEdit(menuGroupId);
            closeMenu();
          }}
        >
          <EditIcon fontSize="small" style={{ marginRight: 10 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuGroupId) confirmDelete(menuGroupId);
            closeMenu();
          }}
        >
          <DeleteIcon fontSize="small" style={{ marginRight: 10, color: '#d32f2f' }} />
          <span style={{ color: '#d32f2f' }}>Delete</span>
        </MenuItem>
      </Menu>

      <Dialog
        open={formOpen}
        onClose={() => (isMutating ? undefined : setFormOpen(false))}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {formMode === 'create' ? 'Create Group' : 'Edit Group'}
        </DialogTitle>
        <DialogContent>
          {isLoadingGroup ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Stack gap={2} mt={1}>
              <TextField
                label="Group Name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                fullWidth
                required
              />

              <Box>
                <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Users (optional)"
                    placeholder="Search by email"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    helperText={
                      formMode === 'edit'
                        ? isAddMode
                          ? 'Listing all users. Select and add to this group.'
                          : 'Showing only users already in this group.'
                        : 'Search and select users to add to this group.'
                    }
                  />
                  {formMode === 'edit' && (
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ mt: 0.25, whiteSpace: 'nowrap' }}
                      onClick={() => {
                        if (!isAddMode) {
                          setIsAddMode(true);
                          setAddSelectedUserIds(new Set());
                          setUsersPage(1);
                          setUsersLimit(10);
                          setUserSearch('');
                          setDebouncedUserSearch('');
                        } else {
                          setIsAddMode(false);
                          setAddSelectedUserIds(new Set());
                          // revert back to group-only list immediately
                          setUsers([]);
                          setUsersTotal(0);
                          setUsersPage(1);
                          setUserSearch('');
                          setDebouncedUserSearch('');
                        }
                      }}
                      disabled={isMutating}
                    >
                      {isAddMode ? 'Cancel add' : 'Add new user'}
                    </Button>
                  )}
                </Box>

                {formMode === 'edit' && isAddMode && (
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={handleAddUsersToGroup}
                      disabled={isMutating || addSelectedUserIds.size === 0}
                    >
                      {isMutating ? 'Adding…' : `Add (${addSelectedUserIds.size})`}
                    </Button>
                  </Box>
                )}

                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ mt: 1.5, maxHeight: 360 }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isAllOnPageSelected}
                            indeterminate={isSomeOnPageSelected}
                            onChange={(e) => toggleAllOnPage(e.target.checked)}
                            inputProps={{ 'aria-label': 'select all users on page' }}
                          />
                        </TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell width={120}>User ID</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formMode === 'edit' && !isAddMode ? (
                        filteredEditGroupUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                              <Typography variant="body2" color="text.secondary">
                                No users found in this group
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredEditGroupUsers
                            .slice((usersPage - 1) * usersLimit, usersPage * usersLimit)
                            .map((u) => {
                              const uid = u.userId;
                              const checked = selectedUserIds.has(uid);
                              return (
                                <TableRow
                                  key={uid}
                                  hover
                                  sx={{
                                    bgcolor: checked ? 'action.selected' : undefined,
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => toggleUser(uid)}
                                >
                                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      checked={checked}
                                      onChange={() => toggleUser(uid)}
                                    />
                                  </TableCell>
                                  <TableCell>{u.email || `User #${uid}`}</TableCell>
                                  <TableCell>{uid}</TableCell>
                                </TableRow>
                              );
                            })
                        )
                      ) : isLoadingUsers ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                            <CircularProgress size={24} />
                          </TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              No users found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((u) => {
                          const uid = u.user_id === null ? null : String(u.user_id);
                          const alreadyMember = !!(uid && formMode === 'edit' && isAddMode && selectedUserIds.has(uid));
                          const checked = uid
                            ? (formMode === 'edit' && isAddMode
                                ? alreadyMember || addSelectedUserIds.has(uid)
                                : selectedUserIds.has(uid))
                            : false;
                          const disabled = !uid || alreadyMember;
                          return (
                            <TableRow
                              key={u.id}
                              hover
                              sx={{
                                bgcolor: checked ? 'action.selected' : undefined,
                                cursor: disabled ? 'not-allowed' : 'pointer',
                              }}
                              onClick={() => {
                                if (!uid || disabled) return;
                                if (formMode === 'edit' && isAddMode) {
                                  setAddSelectedUserIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(uid)) next.delete(uid);
                                    else next.add(uid);
                                    return next;
                                  });
                                } else {
                                  toggleUser(uid);
                                }
                              }}
                            >
                              <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={checked}
                                  disabled={disabled}
                                  onChange={() => {
                                    if (!uid || disabled) return;
                                    if (formMode === 'edit' && isAddMode) {
                                      setAddSelectedUserIds((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(uid)) next.delete(uid);
                                        else next.add(uid);
                                        return next;
                                      });
                                    } else {
                                      toggleUser(uid);
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell>{u.email}</TableCell>
                              <TableCell>{uid ?? '—'}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  page={usersPage}
                  totalPages={
                    formMode === 'edit' && !isAddMode
                      ? Math.ceil(filteredEditGroupUsers.length / usersLimit) || 1
                      : usersTotalPages
                  }
                  limit={usersLimit}
                  totalRecords={
                    formMode === 'edit' && !isAddMode ? filteredEditGroupUsers.length : usersTotal
                  }
                  onPageChange={(p) => setUsersPage(p)}
                  onLimitChange={(l) => setUsersLimit(l)}
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setFormOpen(false)}
            disabled={isMutating}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitForm}
            disabled={isMutating || isLoadingGroup}
          >
            {isMutating ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteConfirmId)}
        onClose={() => (isMutating ? undefined : setDeleteConfirmId(null))}
        aria-labelledby="delete-group-dialog-title"
      >
        <DialogTitle id="delete-group-dialog-title">Delete group?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {selectedGroupName
              ? `This will permanently delete “${selectedGroupName}”.`
              : 'This will permanently delete the selected group.'}{' '}
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)} disabled={isMutating}>
            Cancel
          </Button>
          <Button color="error" onClick={performDelete} disabled={isMutating}>
            {isMutating ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

