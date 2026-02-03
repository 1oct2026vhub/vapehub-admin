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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getSubscribers, type Subscriber } from '@/services/apiSubscribers';
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
  onConfirm: (selectedEmails: string[], sendToAll: boolean) => void;
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
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
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
      setSelectedEmails(new Set(initialSelectedEmails));
      setSendToAll(initialSendToAll);
      setPage(1);
      setLimit(DEFAULT_LIMIT);
      setSearch('');
      setDebouncedSearch('');
    }
  }, [open, initialSelectedEmails, initialSendToAll]);

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

  // When user selects emails from table, uncheck "Send to all". When none selected, check it.
  useEffect(() => {
    if (selectedEmails.size > 0) setSendToAll(false);
    else setSendToAll(true);
  }, [selectedEmails.size]);

  const handleToggleEmail = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const handleSelectAllOnPage = (checked: boolean) => {
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
  };

  const isAllOnPageSelected =
    subscribers.length > 0 &&
    subscribers.every((s) => s.email && selectedEmails.has(s.email));
  const isSomeOnPageSelected =
    subscribers.some((s) => s.email && selectedEmails.has(s.email)) && !isAllOnPageSelected;

  const handleConfirm = () => {
    // Pass only one: either sendToAll true (no emails) or selectedEmails with sendToAll false
    const isSendToAll = sendToAll || selectedEmails.size === 0;
    onConfirm(isSendToAll ? [] : Array.from(selectedEmails), isSendToAll);
    onClose();
  };

  const canApply = true;

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="select-users-modal-title">
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
                onChange={(_, checked) => setSendToAll(checked)}
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

        {selectedEmails.size > 0 && !sendToAll && (
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
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                          <CircularProgress size={28} sx={{ color: '#2E9970' }} />
                        </TableCell>
                      </TableRow>
                    ) : subscribers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3 }} color="text.secondary">
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
                            bgcolor: sub.email && selectedEmails.has(sub.email) ? 'action.selected' : undefined,
                          }}
                        >
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={!!(sub.email && selectedEmails.has(sub.email))}
                              onChange={() => sub.email && handleToggleEmail(sub.email)}
                              sx={{ color: '#2E9970', '&.Mui-checked': { color: '#2E9970' } }}
                            />
                          </TableCell>
                          <TableCell>{sub.email || '—'}</TableCell>
                          <TableCell align="right">
                            {sub.subscribed !== false ? (
                              <Chip label="Subscribed" size="small" color="success" />
                            ) : (
                              <Chip label="Unsubscribed" size="small" />
                            )}
                          </TableCell>
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
    </Modal>
  );
}
