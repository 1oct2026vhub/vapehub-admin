import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getFaqs,
  deleteFaq,
  restoreFaq,
  type FaqItem,
  type FetchFaqsParams,
} from '@/services/apiFaq';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  CircularProgress,
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Pagination,
  Grid,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import AddFaqDialog from './AddFaqDialog';
import EditFaqDialog from './EditFaqDialog';
import ConfirmActionDialog from './ConfirmActionDialog';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { debounce } from 'lodash';
import { SelectChangeEvent } from '@mui/material';
import AppButton from '@/components/Shared/AppButton';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';

interface FaqAccordionProps {
  entityId: number | null | undefined;
  entityType: string;
}

const defaultSortBy: FetchFaqsParams['sortBy'] = 'createdAt';
const defaultSortOrder: FetchFaqsParams['order'] = 'DESC';
const defaultLimit = 10;
const defaultShowDeleted = false;

const FaqAccordion: React.FC<FaqAccordionProps> = ({ entityId, entityType }) => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [expandedPanel, setExpandedPanel] = useState<string | false>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(defaultLimit);
  const [inputValue, setInputValue] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<FetchFaqsParams['sortBy']>(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<FetchFaqsParams['order']>(defaultSortOrder);
  const [showDeleted, setShowDeleted] = useState<boolean>(defaultShowDeleted);
  const [totalFaqs, setTotalFaqs] = useState<number>(0);

  const [isAddFaqDialogOpen, setIsAddFaqDialogOpen] = useState<boolean>(false);
  const [isEditFaqDialogOpen, setIsEditFaqDialogOpen] = useState<boolean>(false);
  const [faqToEdit, setFaqToEdit] = useState<FaqItem | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState<boolean>(false);
  const [faqToDelete, setFaqToDelete] = useState<FaqItem | null>(null);
  const [isConfirmRestoreDialogOpen, setIsConfirmRestoreDialogOpen] = useState<boolean>(false);
  const [faqToRestore, setFaqToRestore] = useState<FaqItem | null>(null);

  const fetchProductFaqs = useCallback(async () => {
    if (typeof entityId !== 'number' || entityId <= 0) {
      setFaqs([]);
      setTotalFaqs(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params: FetchFaqsParams = {
        entity_id: entityId,
        entity_type: entityType,
        page,
        limit,
        sortBy,
        order: sortOrder,
        deleted: showDeleted,
      };
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await getFaqs(params);
      setFaqs(response?.data?.results || []);
      setTotalFaqs(response?.data?.total || 0);
    } catch (err) {
      setError('Failed to fetch FAQs');
      console.error("Error fetching FAQs:", err);
      setFaqs([]);
      setTotalFaqs(0);
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, page, limit, searchTerm, sortBy, sortOrder, showDeleted]);

  useEffect(() => {
    fetchProductFaqs();
  }, [fetchProductFaqs]);

  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setPage(1);
      setSearchTerm(value);
    }, 500),
    []
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(event.target.value);
  };

  const handleSortByChange = (event: SelectChangeEvent<FetchFaqsParams['sortBy']>) => {
    setPage(1);
    setSortBy(event.target.value as FetchFaqsParams['sortBy']);
  };

  const handleSortOrderChange = (event: SelectChangeEvent<FetchFaqsParams['order']>) => {
    setPage(1);
    setSortOrder(event.target.value as FetchFaqsParams['order']);
  };

  const handleShowDeletedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPage(1);
    setShowDeleted(event.target.checked);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleLimitChange = (event: SelectChangeEvent<number>) => {
    setPage(1);
    setLimit(event.target.value as number);
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const handleOpenAddFaqDialog = () => setIsAddFaqDialogOpen(true);
  const handleCloseAddFaqDialog = () => setIsAddFaqDialogOpen(false);

  const handleOpenEditDialog = (faq: FaqItem) => {
    setFaqToEdit(faq);
    setIsEditFaqDialogOpen(true);
  };
  const handleCloseEditDialog = () => {
    setIsEditFaqDialogOpen(false);
    setFaqToEdit(null);
  };

  const handleOpenConfirmDeleteDialog = (faq: FaqItem) => {
    setFaqToDelete(faq);
    setIsConfirmDeleteDialogOpen(true);
  };
  const handleCloseConfirmDeleteDialog = () => {
    setIsConfirmDeleteDialogOpen(false);
    setFaqToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!faqToDelete) return;
    try {
      await deleteFaq(faqToDelete.id);
      showSnackbar('FAQ deleted successfully!', 'success');
      fetchProductFaqs();
      setExpandedPanel(false);
    } catch (err: any) {
      console.error("Error deleting FAQ:", err);
      showSnackbar(err?.response?.data?.message || err.message || 'Failed to delete FAQ', 'error');
    }
    handleCloseConfirmDeleteDialog();
  };

  const handleOpenRestoreDialog = (faq: FaqItem) => {
    setFaqToRestore(faq);
    setIsConfirmRestoreDialogOpen(true);
  };

  const handleCloseRestoreDialog = () => {
    setIsConfirmRestoreDialogOpen(false);
    setFaqToRestore(null);
  };

  const handleConfirmRestore = async () => {
    if (!faqToRestore) return;
    try {
      await restoreFaq(faqToRestore.id);
      showSnackbar('FAQ restored successfully!', 'success');
      fetchProductFaqs();
      setExpandedPanel(false);
    } catch (err: any) {
      console.error("Error restoring FAQ:", err);
      showSnackbar(err?.response?.data?.message || err.message || 'Failed to restore FAQ', 'error');
    }
    handleCloseRestoreDialog();
  };

  const areFiltersApplied = useMemo(() => {
    return (
      inputValue !== '' ||
      sortBy !== defaultSortBy ||
      sortOrder !== defaultSortOrder ||
      limit !== defaultLimit ||
      showDeleted !== defaultShowDeleted ||
      page !== 1
    );
  }, [inputValue, sortBy, sortOrder, limit, showDeleted, page]);

  const handleClearFilters = () => {
    setPage(1);
    setInputValue('');
    setSearchTerm('');
    setSortBy(defaultSortBy);
    setSortOrder(defaultSortOrder);
    setLimit(defaultLimit);
    setShowDeleted(defaultShowDeleted);
  };

  if (typeof entityId !== 'number' || entityId <= 0) {
    return (
      <Box sx={{ width: '100%', maxWidth: '800px', margin: '20px auto', textAlign: 'center', padding: 3 }}>
        <Typography variant="h6" gutterBottom>
          Manage FAQs
        </Typography>
        <Typography color="textSecondary">
          Please save the {entityType} first to add and manage FAQs.
        </Typography>
      </Box>
    );
  }

  const totalPages = Math.ceil(totalFaqs / limit);

  return (
    <Box sx={{ width: '100%', maxWidth: '800px', }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          Frequently Asked Questions
        </Typography>
        <AppButton
          label="Add FAQ"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddFaqDialog}
        />
      </Box>
      
      <Grid container spacing={1} mb={3} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search..."
            value={inputValue}
            onChange={handleSearchChange}
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} label="Sort By" onChange={handleSortByChange}>
              <MenuItem value="createdAt">Created At</MenuItem>
              <MenuItem value="updatedAt">Updated At</MenuItem>
              <MenuItem value="question">Question</MenuItem>
              <MenuItem value="id">ID</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Order</InputLabel>
            <Select value={sortOrder} label="Order" onChange={handleSortOrderChange}>
              <MenuItem value="ASC">Ascending</MenuItem>
              <MenuItem value="DESC">Descending</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Per Page</InputLabel>
            <Select value={limit} label="Per Page" onChange={handleLimitChange}>
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={4} md={2} container justifyContent="flex-start">
          <FormControlLabel
            control={<Switch checked={showDeleted} onChange={handleShowDeletedChange} />}
            label="Deleted"
            sx={{ mr: 0 }}
          />
        </Grid>
        {areFiltersApplied && (
          <Grid item xs={12} sm={2} md={1} sx={{ display: 'flex', alignItems: 'center' }}>
            <ClearFiltersButton onClick={handleClearFilters} />
          </Grid>
        )}
      </Grid>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" p={10}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" align="center" p={5}>
          {error}
        </Typography>
      ) : faqs?.length === 0 ? (
        <Typography align="center" p={5}>
          No FAQs found matching your criteria. Click "Add FAQ" to create one.
        </Typography>
      ) : (
        faqs?.map((faq) => (
          <Accordion
            key={faq.id}
            expanded={expandedPanel === `panel${faq.id}`}
            onChange={handleAccordionChange(`panel${faq.id}`)}
            elevation={1}
            sx={{ 
              mb: 1.5, 
              '&:before': { display: 'none' },
              '&.Mui-expanded': {
                margin: 'auto',
                marginBottom: '12px'
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel${faq.id}-content`}
              id={`panel${faq.id}-header`}
              sx={{
                minHeight: '56px',
                '&.Mui-expanded': {
                  minHeight: '56px',
                  borderBottom: '1px solid rgba(0, 0, 0, .125)'
                },
                '& .MuiAccordionSummary-content': {
                  margin: '12px 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%'
                },
                '& .MuiAccordionSummary-content.Mui-expanded': { margin: '12px 0' }
              }}
            >
              <Typography sx={{ fontWeight: 500, flexGrow: 1 }}>{faq.question}</Typography>
              <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
                {faq.deletedAt ? (
                  <Tooltip title="Restore FAQ">
                    <IconButton size="small" onClick={() => handleOpenRestoreDialog(faq)}>
                      <RestoreFromTrashIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <>
                    <Tooltip title="Edit FAQ">
                      <IconButton size="small" onClick={() => handleOpenEditDialog(faq)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete FAQ">
                      <IconButton size="small" onClick={() => handleOpenConfirmDeleteDialog(faq)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
              <Typography sx={{ whiteSpace: 'pre-line' }}>{faq.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {totalPages > 1 && !loading && !error && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {entityType && (
        <AddFaqDialog
          open={isAddFaqDialogOpen}
          onClose={handleCloseAddFaqDialog}
          productId={entityId}
          entityType={entityType}
          onFaqAdded={fetchProductFaqs}
        />
      )}

      {faqToEdit && entityType && (
        <EditFaqDialog
          open={isEditFaqDialogOpen}
          onClose={handleCloseEditDialog}
          faqToEdit={faqToEdit}
          onFaqUpdated={fetchProductFaqs}
        />
      )}

      {faqToDelete && (
        <ConfirmActionDialog
          open={isConfirmDeleteDialogOpen}
          onClose={handleCloseConfirmDeleteDialog}
          onConfirm={handleConfirmDelete}
          title={`Confirm ${entityType} FAQ Deletion`}
          itemName={faqToDelete.question}
          actionButtonText="Delete"
          actionButtonColorClass="!bg-red-600"
        />
      )}

      {faqToRestore && (
        <ConfirmActionDialog
          open={isConfirmRestoreDialogOpen}
          onClose={handleCloseRestoreDialog}
          onConfirm={handleConfirmRestore}
          title={`Confirm ${entityType} FAQ Restoration`}
          itemName={faqToRestore.question}
          actionButtonText="Restore"
          actionButtonColorClass="!bg-green-600"
        />
      )}
    </Box>
  );
};

export default FaqAccordion; 