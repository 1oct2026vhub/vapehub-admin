'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
  initialSendToAll = false,
}: SelectUsersModalProps) {
  const { showSnackbar } = useSnackbar();

  // Subscriber selection state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set(initialSelectedEmails));
  const [sendToAll, setSendToAll] = useState(initialSendToAll);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Group selection state
  const [groups, setGroups] = useState<NewsletterGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<NewsletterGroup | null>(null);

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
    [showSnackbar],
  );

  const fetchGroups = useCallback(async () => {
    setIsLoadingGroups(true);
    try {
      const res = await listNewsletterGroups();
      if (res.success) setGroups(res.data || []);
    } catch {
      // silently fail — groups section will just be empty
    } finally {
      setIsLoadingGroups(false);
    }
  }, []);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedEmails(new Set(initialSelectedEmails));
      setSendToAll(initialSendToAll);
      setPage(1);
      setLimit(DEFAULT_LIMIT);
      setSearch('');
      setDebouncedSearch('');
      setSelectedGroup(null);
      void fetchGroups();
    }
  }, [open, initialSelectedEmails, initialSendToAll, fetchGroups]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch !== undefined) setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (open) void fetchPage(page, limit, debouncedSearch);
  }, [open, page, limit, debouncedSearch, fetchPage]);

  // When user selects any email from table, uncheck "Send to all" and deselect group
  useEffect(() => {
    if (selectedEmails.size > 0) {
      setSendToAll(false);
      setSelectedGroup(null);
    }
  }, [selectedEmails.size]);

  const handleToggleEmail = (email: string) => {
    setSelectedGroup(null);
    if (sendToAll) {
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
    setSelectedGroup(null);
    if (sendToAll) {
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

  const isAllOnPageSelected =
    sendToAll ||
    (subscribers.length > 0 &&
      subscribers.every((s) => s.email && selectedEmails.has(s.email)));
  const isSomeOnPageSelected =
    !sendToAll &&
    subscribers.some((s) => s.email && selectedEmails.has(s.email)) &&
    !subscribers.every((s) => s.email && selectedEmails.has(s.email));

  const handleConfirm = () => {
    if (selectedGroup) {
      onConfirm([], false, selectedGroup.id);
    } else {
      const isSendToAll = sendToAll || selectedEmails.size === 0;
      onConfirm(isSendToAll ? [] : Array.from(selectedEmails), isSendToAll, null);
    }
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const applyLabel = selectedGroup
    ? `Apply (Group: ${selectedGroup.name})`
    : sendToAll
      ? 'Apply (Send to all)'
      : `Apply (${selectedEmails.size} selected)`;

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="select-users-modal-title">
      <Box sx={modalStyle}>
        {/* Header */}
        <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography id="select-users-modal-title" variant="h6" component="h2" fontWeight={600}>
            Select recipients
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Send to all subscribers, a specific group, or select individual recipients.
          </Typography>
        </Box>

        {/* Send to all */}
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={sendToAll}
                onChange={(_, checked) => {
                  setSendToAll(checked);
                  if (checked) {
                    setSelectedEmails(new Set());
                    setSelectedGroup(null);
                  }
                }}
                sx={{ color: '#2E9970', '&.Mui-checked': { color: '#2E9970' } }}
              />
            }
            label={
              <Typography variant="body2" fontWeight={500}>
                Send to all subscribers
              </Typography>
            }
          />
        </Box>

        {/* Send to group */}
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
                if (val) {
                  setSendToAll(false);
                  setSelectedEmails(new Set());
                }
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
                        {isLoadingGroups ? <CircularProgress color="inherit" size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: '#2E9970' },
                      '&.Mui-focused fieldset': { borderColor: '#2E9970' },
                    },
                  }}
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

        {/* Individual selection — hidden when group is selected */}
        {!sendToAll && !selectedGroup && (
          <>
            <Divider />

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
                            bgcolor:
                              sendToAll || (sub.email && selectedEmails.has(sub.email))
                                ? 'action.selected'
                                : undefined,
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

        {/* Footer */}
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5,
          }}
        >
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <AppButton
            variant="contained"
            label={applyLabel}
            onClick={handleConfirm}
          />
        </Box>
      </Box>
    </Modal>
  );
}
