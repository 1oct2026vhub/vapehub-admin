"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useProductForm } from '../ProductFormContext';
import { getDeals, Deal, removeProductsFromDeal, addProductsToDeal } from '@/services/apiDeals';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/utils/actions';
import DealForm from '../../../../deals/DealForm';

const DealsTab: React.FC = () => {
  const { formData } = useProductForm();
  const { showSnackbar } = useSnackbar();
  const router = useRouter();
  
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'add' | 'remove' | 'view'>('view');
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [addToDealDialogOpen, setAddToDealDialogOpen] = useState(false);
  const [createDealDialogOpen, setCreateDealDialogOpen] = useState(false);

  const fetchProductDeals = useCallback(async () => {
    if (!formData.productId || formData.productId === 0) return;
    
    setLoading(true);
    try {
      const response = await getDeals({ 
        page: 1, 
        limit: 100,
        search: formData.name || ''
      });
      
      // Filter deals that contain the current product
      const productDeals = response.data.deals.filter(deal => 
        deal.products.some(product => product.id === formData.productId)
      );
      
      setDeals(productDeals);
      setAllDeals(response.data.deals);
    } catch (error) {
      console.error('Error fetching deals:', error);
      showSnackbar('Failed to fetch deals', 'error');
    } finally {
      setLoading(false);
    }
  }, [formData.productId, formData.name, showSnackbar]);

  useEffect(() => {
    fetchProductDeals();
  }, [fetchProductDeals]);

  const handleAddToDeal = async (dealId: number) => {
    if (!formData.productId) return;
    
    try {
      // First, check if the product is already in another deal
      const existingDeal = deals.find(deal => 
        deal.products.some(product => product.id === formData.productId)
      );
      
      if (existingDeal) {
        // Remove from existing deal first
        await removeProductsFromDeal(existingDeal.id, [formData.productId]);
        showSnackbar(`Product removed from "${existingDeal.name}" and added to new deal successfully!`, 'success');
      }
      
      // Add to the new deal
      await addProductsToDeal(dealId, [formData.productId]);
      
      if (!existingDeal) {
        showSnackbar('Product added to deal successfully!', 'success');
      }
      
      fetchProductDeals();
      setAddToDealDialogOpen(false);
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to add product to deal', 'error');
    }
  };

  const handleRemoveFromDeal = async (dealId: number) => {
    if (!formData.productId) return;
    
    try {
      await removeProductsFromDeal(dealId, [formData.productId]);
      showSnackbar('Product removed from deal successfully!', 'success');
      fetchProductDeals();
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to remove product from deal', 'error');
    }
  };

  const handleViewDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setDialogType('view');
    setDialogOpen(true);
  };

  const handleEditDeal = (deal: Deal) => {
    router.push(`/apps/deals/${deal.id}`);
  };

  const handleDealCreated = () => {
    setCreateDealDialogOpen(false);
    fetchProductDeals();
    showSnackbar(deals.length === 0 ? 'Deal created and product added successfully!' : 'Deal created successfully!', 'success');
  };

  const getDealTypeLabel = (dealType: string) => {
    switch (dealType) {
      case 'BUY_MORE_SAVE_MORE':
        return 'Buy More Save More';
      case 'BUY_X_GET_Y_FREE':
        return 'Buy X Get Y Free';
      case 'BUY_N_FOR_FIXED':
        return 'Buy N For Fixed';
      default:
        return dealType;
    }
  };

  const getDealDescription = (deal: Deal) => {
    switch (deal.deal_type) {
      case 'BUY_MORE_SAVE_MORE':
        return `Buy ${deal.required_qty} or more for ${deal.discount_percent}% off`;
      case 'BUY_X_GET_Y_FREE':
        return `Buy ${deal.required_qty} get ${deal.get_qty} free`;
      case 'BUY_N_FOR_FIXED':
        return `Buy ${deal.required_qty} for $${deal.fixed_price}`;
      default:
        return '';
    }
  };

  const isDealActive = (deal: Deal) => {
    const now = new Date();
    const validFrom = new Date(deal.valid_from);
    const validTo = new Date(deal.valid_to);
    return deal.is_active && now >= validFrom && now <= validTo;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="space-y-6 w-[60%]">
      <div className="flex justify-between items-center">
        <Typography variant="h6" component="h2">
          Product Deals
        </Typography>
        <div className="flex gap-2">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDealDialogOpen(true)}
          >
            Create New Deal
          </Button>
        </div>
      </div>

      {createDealDialogOpen ? (
        // Show only the create deal form
        // <Paper elevation={2} sx={{ p: 3, backgroundColor: 'white' }}>
        <div className='w-full'>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight="bold" color="#2E9970">
              Create New Deal
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setCreateDealDialogOpen(false)}
            >
              Cancel
            </Button>
          </Box>
          <DealForm onDealCreated={handleDealCreated} hideButtons={true} />
        </div>
      ) : (
        // Show deal listings
        <div className="space-y-4">
          {deals.length > 0 && (
            <>
              {/* Current Deal Card */}
              <Paper elevation={2} sx={{ p: 3, border: '2px solid #2E9970' }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" color="#2E9970">
                      Current Deal
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="medium" mt={1}>
                      {deals[0].name}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Chip 
                      label={isDealActive(deals[0]) ? 'Active' : 'Inactive'} 
                      color={isDealActive(deals[0]) ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip 
                      label={getDealTypeLabel(deals[0].deal_type)} 
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {getDealDescription(deals[0])}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Valid: {formatDate(deals[0].valid_from)} - {formatDate(deals[0].valid_to)}
                </Typography>
                
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleRemoveFromDeal(deals[0].id)}
                    color="error"
                    startIcon={<DeleteIcon />}
                  >
                    Remove from Deal
                  </Button>
                </Box>
              </Paper>
            </>
          )}

          {/* Available Deals */}
          <div>
            <Typography variant="h6" component="h3" mb={2}>
              {deals.length === 0 ? 'Available Deals' : 'Other Available Deals'}
            </Typography>
            <Paper elevation={1}>
              <Box 
                sx={{ 
                  maxHeight: '400px', 
                  overflow: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#c1c1c1',
                    borderRadius: '4px',
                    '&:hover': {
                      background: '#a8a8a8',
                    },
                  },
                }}
              >
                <List>
                  {(deals.length === 0 
                    ? allDeals 
                    : allDeals.filter(deal => !deal.products.some(product => product.id === formData.productId))
                  ).map((deal, index, arr) => (
                    <React.Fragment key={deal.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {deal.name}
                              </Typography>
                              <Chip 
                                label={isDealActive(deal) ? 'Active' : 'Inactive'} 
                                color={isDealActive(deal) ? 'success' : 'default'}
                                size="small"
                              />
                              <Chip 
                                label={getDealTypeLabel(deal.deal_type)} 
                                variant="outlined"
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box mt={1}>
                              <Typography variant="body2" color="text.secondary">
                                {getDealDescription(deal)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Valid: {formatDate(deal.valid_from)} - {formatDate(deal.valid_to)}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleAddToDeal(deal.id)}
                            startIcon={<AddIcon />}
                          >
                            {deals.length === 0 ? 'Add to Deal' : 'Move to Deal'}
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < arr.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
                {(deals.length === 0 
                  ? allDeals 
                  : allDeals.filter(deal => !deal.products.some(product => product.id === formData.productId))
                ).length === 0 && (
                  <Box p={3} textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                      {deals.length === 0 
                        ? 'No deals available to add this product to.' 
                        : 'No other deals available to move this product to.'
                      }
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </div>
        </div>
      )}

      {/* Add to Deal Dialog */}
      <Dialog 
        open={addToDealDialogOpen} 
        onClose={() => setAddToDealDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {deals.length > 0 ? 'Move Product to Different Deal' : 'Add Product to Deal'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a deal to add this product to:
          </Typography>
          {deals.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              This product is currently in the "{deals[0].name}" deal. Adding it to a new deal will automatically remove it from the current deal.
            </Alert>
          )}
          <List>
            {allDeals
              .filter(deal => !deal.products.some(product => product.id === formData.productId))
              .map((deal) => (
                <ListItem key={deal.id}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {deal.name}
                        </Typography>
                        <Chip 
                          label={isDealActive(deal) ? 'Active' : 'Inactive'} 
                          color={isDealActive(deal) ? 'success' : 'default'}
                          size="small"
                        />
                        <Chip 
                          label={getDealTypeLabel(deal.deal_type)} 
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box mt={1}>
                        <Typography variant="body2" color="text.secondary">
                          {getDealDescription(deal)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Valid: {formatDate(deal.valid_from)} - {formatDate(deal.valid_to)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleAddToDeal(deal.id)}
                    >
                      {deals.length > 0 ? 'Move to Deal' : 'Add to Deal'}
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
          </List>
          {allDeals.filter(deal => !deal.products.some(product => product.id === formData.productId)).length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              This product is already added to all available deals.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddToDealDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Deal Details Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Deal Details: {selectedDeal?.name}
        </DialogTitle>
        <DialogContent>
          {selectedDeal && (
            <Box space-y={2}>
              <Typography variant="h6">Deal Information</Typography>
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                <Typography variant="body2">
                  <strong>Type:</strong> {getDealTypeLabel(selectedDeal.deal_type)}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {selectedDeal.is_active ? 'Active' : 'Inactive'}
                </Typography>
                <Typography variant="body2">
                  <strong>Valid From:</strong> {formatDate(selectedDeal.valid_from)}
                </Typography>
                <Typography variant="body2">
                  <strong>Valid To:</strong> {formatDate(selectedDeal.valid_to)}
                </Typography>
              </Box>
              
              <Typography variant="h6" sx={{ mt: 2 }}>Deal Terms</Typography>
              <Typography variant="body2">
                {getDealDescription(selectedDeal)}
              </Typography>
              
              <Typography variant="h6" sx={{ mt: 2 }}>Products in Deal</Typography>
              <List dense>
                {selectedDeal.products.map((product) => (
                  <ListItem key={product.id}>
                    <ListItemText
                      primary={product.name}
                      secondary={product.slug}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          {selectedDeal && (
            <Button 
              variant="contained" 
              onClick={() => {
                setDialogOpen(false);
                handleEditDeal(selectedDeal);
              }}
            >
              Edit Deal
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DealsTab; 