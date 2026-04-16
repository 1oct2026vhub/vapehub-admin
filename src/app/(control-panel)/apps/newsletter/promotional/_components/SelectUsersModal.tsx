'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Autocomplete,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { getSubscribers, type Subscriber } from '@/services/apiSubscribers';
import {
  listNewsletterGroups,
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
  overflow: 'hidden',
};

const DEFAULT_LIMIT = 10;

export interface GroupMemberItem {
  id: string;
  email: string;
}

interface SelectUsersModalProps {
  open: boolean;
  onClose: () => void;
  /** Standard callback for the send-newsletter use-case. */
  onConfirm?: (selectedEmails: string[], sendToAll: boolean, groupId?: string | null) => void;
  initialSelectedEmails?: string[];
  initialSendToAll?: boolean;

  // ── Group-management mode ─────────────────────────────────────────────────
  /** Hides "Send to all" + "Send to group" sections; shows only the subscriber table. */
  hideRecipientOptions?: boolean;
  /** Override modal title. */
  title?: string;
  /** Override modal subtitle/description. */
  description?: string;
  /** Extra content rendered at the very top (e.g. a Group Name text field). */
  extraContent?: React.ReactNode;
  /**
   * When provided, the modal starts in "members view" showing these items
   * with all rows pre-checked. An "Add new user" button switches to the
   * full all-subscribers view.
   */
  groupMembersData?: GroupMemberItem[];
  /**
   * Alternative confirm callback used in group-management mode.
   * Returns subscriber IDs (String(sub.id)) and the corresponding emails.
   */
  onConfirmSubscriberIds?: (
    ids: string[],
    emails: string[],
  ) => boolean | Promise<boolean>;
}

export default function SelectUsersModal({
  open,
  onClose,
  onConfirm,
  initialSelectedEmails = [],
  initialSendToAll = false,
  hideRecipientOptions = false,
  title,
  description,
  extraContent,
  groupMembersData,
  onConfirmSubscriberIds,
}: SelectUsersModalProps) {
  const { showSnackbar } = useSnackbar();

  // 'members' = show pre-fetched group members (edit mode)
  // 'all'     = show all subscribers (create mode or after "Add new user")
  const hasMembersView = !!groupMembersData;
  const [viewMode, setViewMode] = useState<'members' | 'all'>(
    hasMembersView ? 'members' : 'all',
  );

  // ── Subscriber list (all view) ─────────────────────────────────────────────
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [isLoading, setIsLoading] = useState(false);

  // ── Selected emails ────────────────────────────────────────────────────────
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(
    new Set(initialSelectedEmails),
  );
  const [sendToAll, setSendToAll] = useState(initialSendToAll);

  // ── Search ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // email → subscriber id map (populated as pages load)
  const emailToSubIdRef = useRef<Map<string, string>>(new Map());
  // email → userId map (used for group membership APIs)
  const emailToUserIdRef = useRef<Map<string, string>>(new Map());

  // ── Group picker (newsletter send mode only) ───────────────────────────────
  const [groups, setGroups] = useState<NewsletterGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<NewsletterGroup | null>(null);

  const totalPages = Math.ceil(total / limit) || 1;

  // ── Fetch all subscribers ──────────────────────────────────────────────────
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
        const subs = res.data?.subscribers;
        const safeSubs = Array.isArray(subs) ? subs : [];
        safeSubs.forEach((s) => {
          if (s.email) emailToSubIdRef.current.set(s.email, String(s.id));
          if (s.email && s.user_id != null) {
            emailToUserIdRef.current.set(s.email, String(s.user_id));
          }
        });
        setSubscribers(safeSubs);
        setTotal(res.data?.pagination?.total || 0);
      } catch {
        showSnackbar('Failed to load subscribers', 'error');
        setSubscribers([]);
      } finally {
        setIsLoading(false);
      }
    },
    [showSnackbar],
  );

  const fetchGroups = useCallback(async () => {
    if (hideRecipientOptions) return;
    setIsLoadingGroups(true);
    try {
      const res = await listNewsletterGroups();
      if (res.success) setGroups(Array.isArray(res.data) ? res.data : []);
    } catch { /* ignore */ } finally {
      setIsLoadingGroups(false);
    }
  }, [hideRecipientOptions]);

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      const initEmails = initialSelectedEmails ?? [];
      setSelectedEmails(new Set(initEmails));
      setSendToAll(initialSendToAll);
      setPage(1);
      setLimit(DEFAULT_LIMIT);
      setSearch('');
      setDebouncedSearch('');
      setSelectedGroup(null);
      emailToSubIdRef.current = new Map();
      setViewMode(hasMembersView ? 'members' : 'all');
      // Seed the id map with groupMembersData when available
      if (groupMembersData) {
        groupMembersData.forEach((m) => {
          if (m.email) emailToSubIdRef.current.set(m.email, m.id);
          if (m.email) emailToUserIdRef.current.set(m.email, m.id);
        });
      }
      if (!hideRecipientOptions) void fetchGroups();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch !== undefined) setPage(1);
  }, [debouncedSearch]);

  // Only fetch all-subscribers when in 'all' view
  useEffect(() => {
    if (open && viewMode === 'all') void fetchPage(page, limit, debouncedSearch);
  }, [open, viewMode, page, limit, debouncedSearch, fetchPage]);

  useEffect(() => {
    if (selectedEmails.size > 0 && !hideRecipientOptions) {
      setSendToAll(false);
      setSelectedGroup(null);
    }
  }, [selectedEmails.size, hideRecipientOptions]);

  // ── Filtered members for members view (client-side search) ────────────────
  const filteredMembers = useMemo(() => {
    if (!groupMembersData) return [];
    const q = debouncedSearch.toLowerCase().trim();
    return q
      ? groupMembersData.filter((m) => m.email.toLowerCase().includes(q))
      : groupMembersData;
  }, [groupMembersData, debouncedSearch]);

  // Paginate filtered members client-side
  const membersPage = page;
  const membersTotalPages = Math.ceil(filteredMembers.length / limit) || 1;
  const pagedMembers = filteredMembers.slice((membersPage - 1) * limit, membersPage * limit);

  // ── Toggle helpers ─────────────────────────────────────────────────────────
  const toggleEmail = (email: string) => {
    if (!hideRecipientOptions) setSelectedGroup(null);
    if (sendToAll && !hideRecipientOptions) {
      setSendToAll(false);
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails((prev) => {
        const next = new Set(prev);
        next.has(email) ? next.delete(email) : next.add(email);
        return next;
      });
    }
  };

  const currentRows = viewMode === 'members' ? pagedMembers : subscribers;
  const safeRows = Array.isArray(currentRows) ? currentRows : [];

  const isAllOnPage =
    sendToAll ||
    (safeRows.length > 0 && safeRows.every((r) => r.email && selectedEmails.has(r.email)));
  const isSomeOnPage =
    !sendToAll &&
    safeRows.some((r) => r.email && selectedEmails.has(r.email)) &&
    !safeRows.every((r) => r.email && selectedEmails.has(r.email));

  const handleSelectAllOnPage = (checked: boolean) => {
    if (!hideRecipientOptions) setSelectedGroup(null);
    if (sendToAll && !hideRecipientOptions) {
      if (!checked) { setSendToAll(false); setSelectedEmails(new Set()); }
      return;
    }
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      safeRows.forEach((r) => r.email && (checked ? next.add(r.email) : next.delete(r.email)));
      return next;
    });
  };

  // ── Confirm ────────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (onConfirmSubscriberIds) {
      const emails = Array.from(selectedEmails);

      // Ensure we have userId mapping for every selected email.
      const missingEmails = emails.filter((em) => !emailToUserIdRef.current.get(em));
      if (missingEmails.length > 0) {
        try {
          // Fetch by search term; then keep only exact matches to avoid wrong mappings.
          await Promise.all(
            missingEmails.map(async (em) => {
              const res = await getSubscribers({
                page: 1,
                limit: 25,
                subscribed: true,
                search: em,
              });
              const subs = Array.isArray(res.data?.subscribers)
                ? res.data.subscribers
                : [];
              subs
                .filter((s) => s.email === em)
                .forEach((s) => {
                  const userId = s.user_id ?? (s as unknown as { userId?: number }).userId ?? (s as unknown as { userID?: number }).userID;
                  if (s.email && userId != null) {
                    emailToUserIdRef.current.set(s.email, String(userId));
                    emailToSubIdRef.current.set(s.email, String(s.id));
                  }
                });
            }),
          );
        } catch {
          // ignore and fall back to remaining mapping check below
        }
      }

      const ids: string[] = [];
      emails.forEach((em) => {
        const userId = emailToUserIdRef.current.get(em);
        if (userId != null) ids.push(userId);
      });

      if (ids.length !== emails.length) {
        showSnackbar(
          "Some recipients could not be mapped to userId. Please re-select users.",
          "warning",
        );
        return;
      }

      const result = onConfirmSubscriberIds(ids, emails);
      const shouldClose = typeof result === "boolean" ? result : await result;
      if (shouldClose) onClose();
      return;
    }

    // Standard send-newsletter modal mode
    if (onConfirm) {
      if (selectedGroup) {
        onConfirm([], false, selectedGroup.id);
      } else {
        const isSendToAll = sendToAll || selectedEmails.size === 0;
        onConfirm(isSendToAll ? [] : Array.from(selectedEmails), isSendToAll, null);
      }
    }
    onClose();
  };

  // ── Labels ─────────────────────────────────────────────────────────────────
  const modalTitle = title ?? 'Select recipients';
  const modalDescription = description ?? (
    hideRecipientOptions
      ? 'Search and select users to add to this group.'
      : 'Send to all subscribers, a specific group, or select individual recipients.'
  );
  const hintText = viewMode === 'members'
    ? 'Showing only users already in this group.'
    : 'Search and select users to add to this group.';
  const applyLabel = onConfirmSubscriberIds
    ? `Apply (${selectedEmails.size} selected)`
    : selectedGroup
      ? `Apply (Group: ${selectedGroup.name})`
      : sendToAll
        ? 'Apply (Send to all)'
        : `Apply (${selectedEmails.size} selected)`;

  // ── Show subscriber table? ─────────────────────────────────────────────────
  const showTable = hideRecipientOptions || (!sendToAll && !selectedGroup);

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="select-users-modal-title">
      <Box sx={modalStyle}>

        {/* Header */}
        <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography id="select-users-modal-title" variant="h6" component="h2" fontWeight={600}>
            {modalTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {modalDescription}
          </Typography>
        </Box>

        {/* Extra content (e.g. Group Name field) */}
        {extraContent && (
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            {extraContent}
          </Box>
        )}

        {/* Send-newsletter sections (hidden in group mode) */}
        {!hideRecipientOptions && (
          <>
            <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={sendToAll}
                    onChange={(_, checked) => {
                      setSendToAll(checked);
                      if (checked) { setSelectedEmails(new Set()); setSelectedGroup(null); }
                    }}
                    sx={{ color: '#2E9970', '&.Mui-checked': { color: '#2E9970' } }}
                  />
                }
                label={<Typography variant="body2" fontWeight={500}>Send to all subscribers</Typography>}
              />
            </Box>

            {!sendToAll && (
              <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <GroupIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  <Typography variant="body2" fontWeight={500} color="text.secondary">
                    Send to a group
                  </Typography>
                </Box>
                <Autocomplete
                  options={groups}
                  getOptionLabel={(opt) => opt.name}
                  value={selectedGroup}
                  onChange={(_, val) => {
                    setSelectedGroup(val);
                    if (val) { setSendToAll(false); setSelectedEmails(new Set()); }
                  }}
                  loading={isLoadingGroups}
                  size="small"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select group"
                      placeholder="Choose a group…"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLoadingGroups && <CircularProgress color="inherit" size={16} />}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#2E9970' }, '&.Mui-focused fieldset': { borderColor: '#2E9970' } } }}
                    />
                  )}
                  noOptionsText={isLoadingGroups ? 'Loading groups…' : 'No groups found'}
                />
                {selectedGroup && (
                  <Chip
                    size="small"
                    label={`Group selected: ${selectedGroup.name}${selectedGroup.userCount != null ? ` (${selectedGroup.userCount} users)` : ''}`}
                    onDelete={() => setSelectedGroup(null)}
                    sx={{ mt: 1, bgcolor: '#2E9970', color: 'white', '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)' } }}
                  />
                )}
              </Box>
            )}
          </>
        )}

        {/* Subscriber / members table */}
        {showTable && (
          <>
            {!hideRecipientOptions && <Divider />}

            {selectedEmails.size > 0 && (
              <Box sx={{ px: 2.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Chip
                  size="small"
                  label={`${selectedEmails.size} selected`}
                  sx={{ bgcolor: '#2E9970', color: 'white' }}
                />
              </Box>
            )}

            {/* Search row */}
            <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by email"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'action.active' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#2E9970' }, '&.Mui-focused fieldset': { borderColor: '#2E9970' } } }}
                />
                {/* "Add new user" — only shown in members view */}
                {viewMode === 'members' && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PersonAddIcon />}
                    onClick={() => { setViewMode('all'); setSearch(''); setPage(1); }}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Add new user
                  </Button>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {hintText}
              </Typography>
            </Box>

            {/* Table */}
            <Box sx={{ flex: 1, overflow: 'auto', minHeight: 200 }}>
              <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isAllOnPage}
                          indeterminate={isSomeOnPage}
                          onChange={(_, c) => handleSelectAllOnPage(c)}
                          sx={{ color: '#2E9970', '&.Mui-checked': { color: '#2E9970' }, '&.MuiCheckbox-indeterminate': { color: '#2E9970' } }}
                        />
                      </TableCell>
                      <TableCell>Email</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading && viewMode === 'all' ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                          <CircularProgress size={28} sx={{ color: '#2E9970' }} />
                        </TableCell>
                      </TableRow>
                    ) : safeRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          {viewMode === 'members' ? 'No members in this group.' : 'No subscribers found.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      safeRows.map((row) => (
                        <TableRow
                          key={row.email}
                          hover
                          onClick={() => row.email && toggleEmail(row.email)}
                          sx={{
                            cursor: 'pointer',
                            bgcolor: sendToAll || (row.email && selectedEmails.has(row.email))
                              ? 'action.selected'
                              : undefined,
                          }}
                        >
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={sendToAll || !!(row.email && selectedEmails.has(row.email))}
                              onChange={() => row.email && toggleEmail(row.email)}
                              sx={{ color: '#2E9970', '&.Mui-checked': { color: '#2E9970' } }}
                            />
                          </TableCell>
                          <TableCell>{row.email || '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {viewMode === 'all' && !isLoading && subscribers.length > 0 && (
                <TablePagination
                  page={page}
                  totalPages={totalPages}
                  limit={limit}
                  totalRecords={total}
                  onPageChange={setPage}
                  onLimitChange={setLimit}
                />
              )}
              {viewMode === 'members' && filteredMembers.length > limit && (
                <TablePagination
                  page={membersPage}
                  totalPages={membersTotalPages}
                  limit={limit}
                  totalRecords={filteredMembers.length}
                  onPageChange={setPage}
                  onLimitChange={setLimit}
                />
              )}
            </Box>
          </>
        )}

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <AppButton
            variant="contained"
            label={applyLabel}
            onClick={() => {
              void handleConfirm();
            }}
          />
        </Box>
      </Box>
    </Modal>
  );
}
