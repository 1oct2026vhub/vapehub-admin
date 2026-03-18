'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  InputAdornment,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getSubscribers, type Subscriber } from '@/services/apiSubscribers';
import {
  addUsersToNewsletterGroup,
  getNewsletterGroup,
  listNewsletterGroupUsers,
  listNewsletterGroups,
  removeUsersFromNewsletterGroup,
  type NewsletterGroup,
} from '@/services/apiNewsletterTemplates';
import { useSnackbar } from '@/contexts/SnackbarContext';
import AppButton from '@/components/Shared/AppButton';
import TablePagination from '@/components/Shared/TablePagination';

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 640,
  maxHeight: '85vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 2,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
};

const DEFAULT_LIMIT = 10;

interface SelectUsersModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedEmails: string[], sendToAll: boolean, groupId?: string | null) => void;
  initialSelectedEmails?: string[];
  initialSendToAll?: boolean;
}

export default function SelectUsersModal({
  open,
  onClose,
  onConfirm,
  initialSelectedEmails = [],
  initialSendToAll = true,
}: SelectUsersModalProps) {
  const { showSnackbar } = useSnackbar();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [groups, setGroups] = useState<NewsletterGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<NewsletterGroup | null>(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingGroupUsers, setIsLoadingGroupUsers] = useState(false);
  const [groupUsers, setGroupUsers] = useState<Array<{ userId: string; email: string }>>([]);
  const [groupUsersPage, setGroupUsersPage] = useState(1);
  const [groupUsersLimit, setGroupUsersLimit] = useState(10);
  const [isMutatingGroupUsers, setIsMutatingGroupUsers] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addUserSearch, setAddUserSearch] = useState('');
  const [addUserDebounced, setAddUserDebounced] = useState('');
  const [addUserPage, setAddUserPage] = useState(1);
  const [addUserLimit, setAddUserLimit] = useState(10);
  const [addUserTotal, setAddUserTotal] = useState(0);
  const [addUserOptions, setAddUserOptions] = useState<Subscriber[]>([]);
  const [isLoadingAddUsers, setIsLoadingAddUsers] = useState(false);
  const [addSelectedUserIds, setAddSelectedUserIds] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set(initialSelectedEmails));
  const [sendToAll, setSendToAll] = useState(initialSendToAll);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const totalPages = Math.ceil(total / limit) || 1;

  const fetchPage = useCallback(
    async (pageNum: number, pageLimit: number, searchQuery?: string) => {
      setIsLoading(true);
      try {
        const res = await getSubscribers({
          page: pageNum,
          limit: pageLimit,
          subscribed: true,
          ...(searchQuery?.trim() ? { search: searchQuery.trim() } : {}),
        });
        setSubscribers(res.data?.subscribers || []);
        setTotal(res.data?.pagination?.total || 0);
      } catch {
        showSnackbar('Failed to load subscribers', 'error');
        setSubscribers([]);
      } finally {
        setIsLoading(false);
      }
    },
    [showSnackbar]
  );

  useEffect(() => {
    if (open) {
      // Always start fresh in the modal
      setSelectedEmails(new Set());
      setSendToAll(true);
      setPage(1);
      setLimit(DEFAULT_LIMIT);
      setSearch('');
      setDebouncedSearch('');
      setSelectedGroup(null);
      setGroupUsers([]);
      setGroupUsersPage(1);
      setGroupUsersLimit(10);
      setAddUserOpen(false);
      setAddUserSearch('');
      setAddUserDebounced('');
      setAddUserPage(1);
      setAddUserLimit(10);
      setAddUserTotal(0);
      setAddUserOptions([]);
      setAddSelectedUserIds(new Set());
    }
  }, [open, initialSelectedEmails, initialSendToAll]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const loadGroups = async () => {
      setIsLoadingGroups(true);
      try {
        const res = await listNewsletterGroups();
        if (!res.success) throw new Error(res.message || 'Failed to load groups');
        if (!cancelled) setGroups(res.data || []);
      } catch (e: any) {
        if (!cancelled) {
          setGroups([]);
          showSnackbar(e?.message || 'Failed to load groups', 'error');
        }
      } finally {
        if (!cancelled) setIsLoadingGroups(false);
      }
    };
    void loadGroups();
    return () => {
      cancelled = true;
    };
  }, [open, showSnackbar]);

  const loadGroupUsers = async (groupId: string) => {
    try {
      setIsLoadingGroupUsers(true);

      const res = await listNewsletterGroupUsers(groupId);
      if (!res.success) throw new Error(res.message || 'Failed to list group users');

      let members: { userId: string; email: string }[] = [];

      if (Array.isArray(res.data?.users) && res.data.users.length) {
        members = res.data.users
          .map((u: any) => {
            const uid = u?.userId ?? u?.user_id ?? u?.id;
            const email = typeof u?.email === 'string' ? u.email.trim() : '';
            return uid !== undefined && uid !== null
              ? { userId: String(uid), email }
              : null;
          })
          .filter((m): m is { userId: string; email: string } => m !== null);
      } else if (Array.isArray(res.data?.userIds)) {
        members = res.data.userIds
          .map((id) => String(id))
          .filter(Boolean)
          .map((id) => ({ userId: id, email: '' }));
      }

      setGroupUsers(members);
      setGroupUsersPage(1);

      // Only pre-select recipients if we have real emails
      const emails = members
        .map((m) => m.email?.trim())
        .filter((e) => e && !e.startsWith('User #')) as string[];
      if (emails.length) {
        setSendToAll(false);
        setSelectedEmails(new Set(emails));
      } else {
        setSelectedEmails(new Set());
      }
    } catch (e: any) {
      showSnackbar(e?.message || 'Failed to load group users', 'error');
      setGroupUsers([]);
    } finally {
      setIsLoadingGroupUsers(false);
    }
  };

  const removeUsersFromGroup = async (userIds: string[]) => {
    if (!selectedGroup?.id) return;
    if (!userIds.length) return;
    setIsMutatingGroupUsers(true);
    try {
      const res = await removeUsersFromNewsletterGroup(selectedGroup.id, { userIds });
      if (!res.success) throw new Error(res.message || 'Failed to remove users from group');
      showSnackbar('Removed user(s) from group.', 'success');
      await loadGroupUsers(selectedGroup.id);
    } catch (e: any) {
      showSnackbar(e?.message || 'Failed to remove users from group', 'error');
    } finally {
      setIsMutatingGroupUsers(false);
    }
  };

  // Add-user dialog search debounce
  useEffect(() => {
    const t = setTimeout(() => setAddUserDebounced(addUserSearch), 300);
    return () => clearTimeout(t);
  }, [addUserSearch]);

  useEffect(() => {
    if (!addUserOpen) return;
    setAddUserPage(1);
  }, [addUserDebounced, addUserOpen]);

  useEffect(() => {
    if (!addUserOpen) return;
    let cancelled = false;
    const load = async () => {
      setIsLoadingAddUsers(true);
      try {
        const res = await getSubscribers({
          page: addUserPage,
          limit: addUserLimit,
          subscribed: true,
          ...(addUserDebounced.trim() ? { search: addUserDebounced.trim() } : {}),
        });
        if (cancelled) return;
        setAddUserOptions(res.data?.subscribers || []);
        setAddUserTotal(res.data?.pagination?.total || 0);
      } catch {
        if (!cancelled) {
          setAddUserOptions([]);
          setAddUserTotal(0);
        }
      } finally {
        if (!cancelled) setIsLoadingAddUsers(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [addUserOpen, addUserPage, addUserLimit, addUserDebounced]);

  const addUsersToGroup = async () => {
    if (!selectedGroup?.id) return;
    const ids = Array.from(addSelectedUserIds);
    if (!ids.length) return;
    setIsMutatingGroupUsers(true);
    try {
      const res = await addUsersToNewsletterGroup(selectedGroup.id, { userIds: ids });
      if (!res.success) throw new Error(res.message || 'Failed to add users to group');
      showSnackbar('Added user(s) to group.', 'success');
      setAddUserOpen(false);
      setAddSelectedUserIds(new Set());
      await loadGroupUsers(selectedGroup.id);
    } catch (e: any) {
      showSnackbar(e?.message || 'Failed to add users to group', 'error');
    } finally {
      setIsMutatingGroupUsers(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch !== undefined) setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (open) fetchPage(page, limit, debouncedSearch);
  }, [open, page, limit, debouncedSearch]);

  // When user selects any email from table, uncheck "Send to all"
  useEffect(() => {
    if (selectedEmails.size > 0) setSendToAll(false);
  }, [selectedEmails.size]);

  const handleToggleEmail = (email: string) => {
    if (sendToAll) {
      // Was "send to all" (all shown checked); uncheck = turn off sendToAll and clear selection
      setSendToAll(false);
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails((prev) => {
        const next = new Set(prev);
        if (next.has(email)) next.delete(email);
        else next.add(email);
        return next;
      });
    }
  };

  const handleSelectAllOnPage = (checked: boolean) => {
    if (sendToAll) {
      // Was "send to all"; unchecking header = turn off sendToAll and uncheck all users
      if (!checked) {
        setSendToAll(false);
        setSelectedEmails(new Set());
      }
    } else {
      if (checked) {
        setSelectedEmails((prev) => {
          const next = new Set(prev);
          subscribers.forEach((s) => s.email && next.add(s.email));
          return next;
        });
      } else {
        setSelectedEmails((prev) => {
          const next = new Set(prev);
          subscribers.forEach((s) => s.email && next.delete(s.email));
          return next;
        });
      }
    }
  };

  // When sendToAll is true, show all rows as checked; otherwise use selectedEmails
  const isAllOnPageSelected =
    sendToAll ||
    (subscribers.length > 0 &&
      subscribers.every((s) => s.email && selectedEmails.has(s.email)));
  const isSomeOnPageSelected =
    !sendToAll &&
    subscribers.some((s) => s.email && selectedEmails.has(s.email)) &&
    !subscribers.every((s) => s.email && selectedEmails.has(s.email));

  const handleConfirm = () => {
    // Pass only one: either sendToAll true (no emails) or selectedEmails with sendToAll false
    const isSendToAll = sendToAll || selectedEmails.size === 0;
    onConfirm(isSendToAll ? [] : Array.from(selectedEmails), isSendToAll, selectedGroup?.id ?? null);
    onClose();
  };

  const canApply = true;

  const handleClose = () => {
    // Clear transient selections when closing without applying
    setSelectedGroup(null);
    setGroupUsers([]);
    setSelectedEmails(new Set());
    setSendToAll(true);
    onClose();
  };

  return (
    <>
      <Modal open={open} onClose={handleClose} aria-labelledby="select-users-modal-title">
        {(
          <Box sx={modalStyle}>
        <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography id="select-users-modal-title" variant="h6" component="h2" fontWeight={600}>
            Select recipients
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Select specific recipients from the list below.
          </Typography>
        </Box>

        <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={sendToAll}
                onChange={(_, checked) => {
                  setSendToAll(checked);
                  // When switching to "specific recipients", clear prior selections
                  if (!checked) {
                    setSelectedEmails(new Set());
                    setSelectedGroup(null);
                    setGroupUsers([]);
                    setPage(1);
                    setLimit(DEFAULT_LIMIT);
                    setSearch('');
                    setDebouncedSearch('');
                  }
                }}
                sx={{ color: '#2E9970', '&.Mui-checked': { color: '#2E9970' } }}
              />
            }
            label={
              <Typography variant="body2" fontWeight={500}>
                Select all users
              </Typography>
            }
          />
        </Box>

        {/* Everything below is shown only after unchecking "Select all users" */}
        {!sendToAll && (
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Autocomplete
              size="small"
              options={groups}
              loading={isLoadingGroups}
              value={selectedGroup}
              onChange={(_, value) => {
                setSelectedGroup(value);
                if (value?.id) {
                  void loadGroupUsers(value.id);
                } else {
                  // When group is cleared, also clear group members and selected emails
                  setGroupUsers([]);
                  setSelectedEmails(new Set());
                }
              }}
              getOptionLabel={(option) => option?.name || ''}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select group (optional)"
                  placeholder="Choose a group to manage / pick recipients"
                />
              )}
            />
          </Box>
        )}

        {/* Group members management */}
        {!sendToAll && selectedGroup?.id && (
          <>
            <Box sx={{ px: 2.5, py: 1.25, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Group members
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setAddUserOpen(true)}
                disabled={isMutatingGroupUsers}
              >
                Add new user
              </Button>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', minHeight: 200 }}>
              <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked
                          disabled
                          sx={{ color: '#2E9970', '&.Mui-checked': { color: '#2E9970' } }}
                        />
                      </TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell width={120}>User ID</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoadingGroupUsers ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                          <CircularProgress size={28} sx={{ color: '#2E9970' }} />
                        </TableCell>
                      </TableRow>
                    ) : groupUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3 }} color="text.secondary">
                          No users in this group.
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupUsers
                        .slice((groupUsersPage - 1) * groupUsersLimit, groupUsersPage * groupUsersLimit)
                        .map((m) => (
                          <TableRow
                            key={m.userId}
                            hover
                            sx={{ cursor: isMutatingGroupUsers ? 'not-allowed' : 'pointer' }}
                            onClick={() => {
                              if (isMutatingGroupUsers) return;
                              void removeUsersFromGroup([m.userId]);
                            }}
                          >
                            <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked
                                disabled={isMutatingGroupUsers}
                                onChange={() => {
                                  if (isMutatingGroupUsers) return;
                                  void removeUsersFromGroup([m.userId]);
                                }}
                                sx={{ color: '#2E9970', '&.Mui-checked': { color: '#2E9970' } }}
                              />
                            </TableCell>
                            <TableCell>{m.email || '—'}</TableCell>
                            <TableCell>{m.userId}</TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {groupUsers.length > 0 && (
                <TablePagination
                  page={groupUsersPage}
                  totalPages={Math.ceil(groupUsers.length / groupUsersLimit) || 1}
                  limit={groupUsersLimit}
                  totalRecords={groupUsers.length}
                  onPageChange={setGroupUsersPage}
                  onLimitChange={setGroupUsersLimit}
                />
              )}
            </Box>
          </>
        )}

      {/* Subscriber selection (when not sending to all AND no group selected) */}
      {!sendToAll && !selectedGroup?.id && (
          <>
            {selectedEmails.size > 0 && (
              <Box sx={{ px: 2.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Chip
                  size="small"
                  label={`${selectedEmails.size} selected`}
                  sx={{ bgcolor: '#2E9970', color: 'white' }}
                />
              </Box>
            )}

            <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'action.active' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#2E9970' },
                    '&.Mui-focused fieldset': { borderColor: '#2E9970' },
                  },
                }}
              />
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', minHeight: 200 }}>
              <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isAllOnPageSelected}
                          indeterminate={isSomeOnPageSelected}
                          onChange={(_, c) => handleSelectAllOnPage(c)}
                          sx={{ color: '#2E9970', '&.Mui-checked': { color: '#2E9970' } }}
                        />
                      </TableCell>
                      <TableCell>Email</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                          <CircularProgress size={28} sx={{ color: '#2E9970' }} />
                        </TableCell>
                      </TableRow>
                    ) : subscribers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 3 }} color="text.secondary">
                          No subscribers found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscribers.map((sub) => (
                        <TableRow
                          key={sub.id}
                          hover
                          onClick={() => sub.email && handleToggleEmail(sub.email)}
                          sx={{
                            cursor: 'pointer',
                            bgcolor: sendToAll || (sub.email && selectedEmails.has(sub.email)) ? 'action.selected' : undefined,
                          }}
                        >
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={sendToAll || !!(sub.email && selectedEmails.has(sub.email))}
                              onChange={() => sub.email && handleToggleEmail(sub.email)}
                              sx={{ color: '#2E9970', '&.Mui-checked': { color: '#2E9970' } }}
                            />
                          </TableCell>
                          <TableCell>{sub.email || '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
          </TableContainer>
          {!isLoading && subscribers.length > 0 && (
            <TablePagination
              page={page}
              totalPages={totalPages}
              limit={limit}
              totalRecords={total}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          )}
            </Box>
          </>
        )}

          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button variant="outlined" onClick={handleClose}>
              Cancel
            </Button>
            <AppButton
              variant="contained"
              label={sendToAll ? 'Apply (Send to all)' : `Apply (${selectedEmails.size} selected)`}
              onClick={handleConfirm}
              disabled={!canApply}
            />
          </Box>
          </Box>
        )}
      </Modal>

      <Dialog
        open={addUserOpen}
        onClose={() => (isMutatingGroupUsers ? undefined : setAddUserOpen(false))}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add new user</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by email"
            value={addUserSearch}
            onChange={(e) => setAddUserSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'action.active' }} />
                </InputAdornment>
              ),
            }}
            sx={{ mt: 1 }}
          />

          <Box sx={{ mt: 1.5, maxHeight: 360, overflow: 'auto' }}>
            <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Email</TableCell>
                    <TableCell width={120}>User ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoadingAddUsers ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={24} sx={{ color: '#2E9970' }} />
                      </TableCell>
                    </TableRow>
                  ) : addUserOptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 3 }} color="text.secondary">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    addUserOptions.map((u) => {
                      const uid = u.user_id === null ? null : String(u.user_id);
                      const disabled = !uid || groupUsers.some((m) => m.userId === uid);
                      const checked = uid ? addSelectedUserIds.has(uid) : false;
                      return (
                        <TableRow
                          key={u.id}
                          hover
                          sx={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                          onClick={() => {
                            if (disabled || !uid) return;
                            setAddSelectedUserIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(uid)) next.delete(uid);
                              else next.add(uid);
                              return next;
                            });
                          }}
                        >
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              disabled={disabled}
                              checked={checked}
                              onChange={() => {
                                if (disabled || !uid) return;
                                setAddSelectedUserIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(uid)) next.delete(uid);
                                  else next.add(uid);
                                  return next;
                                });
                              }}
                              sx={{ color: '#2E9970', '&.Mui-checked': { color: '#2E9970' } }}
                            />
                          </TableCell>
                          <TableCell>{u.email || '—'}</TableCell>
                          <TableCell>{uid ?? '—'}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {!isLoadingAddUsers && addUserOptions.length > 0 && (
            <TablePagination
              page={addUserPage}
              totalPages={Math.ceil(addUserTotal / addUserLimit) || 1}
              limit={addUserLimit}
              totalRecords={addUserTotal}
              onPageChange={setAddUserPage}
              onLimitChange={setAddUserLimit}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setAddUserOpen(false)} disabled={isMutatingGroupUsers}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={addUsersToGroup}
            disabled={isMutatingGroupUsers || addSelectedUserIds.size === 0}
            sx={{ bgcolor: '#2E9970', '&:hover': { bgcolor: '#247C5C' } }}
          >
            {isMutatingGroupUsers ? 'Adding…' : `Add (${addSelectedUserIds.size})`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
