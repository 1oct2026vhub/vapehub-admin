'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Button,
    FormControlLabel,
    Switch,
    MenuItem,
    Grid,
    Paper,
    Typography,
    IconButton,
    Box,
    List,
    ListItem,
    ListItemText,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import {
    createDeal,
    updateDeal,
    DealFormData,
    Deal,
    ProductInDeal,
    removeProductsFromDeal
} from '@/services/apiDeals';
import FormTextField from '@/components/Shared/FormTextField';
import AppButton from '@/components/Shared/AppButton';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import ProductSelector from './ProductSelector';

const dealSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    deal_type: z.enum(['BUY_N_FOR_FIXED']),
    is_active: z.boolean(),
    valid_from: z.string().min(1, 'Valid from date is required'),
    valid_to: z.string().min(1, 'Valid to date is required'),
    required_qty: z.coerce.number().int({ message: "Quantity must be a whole number." }).min(1, { message: "Quantity is required." }),
    get_qty: z.coerce.number().optional().nullable(),
    fixed_price: z.coerce.number().positive({ message: "Price must be a positive number." }).min(1, { message:'Price is required.'}),
    discount_percent: z.coerce.number().optional().nullable(),
    tiered_qty_json: z.array(z.object({
        min: z.coerce.number().min(1, "Minimum quantity is required"),
        discount: z.coerce.number().min(1, "Discount is required"),
    })).optional().nullable(),
    bundle_product_ids_json: z.array(z.number()).optional().nullable(),
});

interface DealFormProps {
    deal?: Deal;
}

const DealForm: React.FC<DealFormProps> = ({ deal }) => {
    const router = useRouter();
    const { showSnackbar } = useSnackbar();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [associatedProducts, setAssociatedProducts] = useState<ProductInDeal[]>([]);
    const [productToRemove, setProductToRemove] = useState<ProductInDeal | null>(null);

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        watch,
        reset
    } = useForm<DealFormData>({
        resolver: zodResolver(dealSchema),
        mode: 'all',
        defaultValues: {
            name: '',
            deal_type: 'BUY_N_FOR_FIXED',
            is_active: true,
            valid_from: '',
            valid_to: '',
            required_qty: null,
            get_qty: null,
            fixed_price: null,
            discount_percent: null,
            tiered_qty_json: [],
            bundle_product_ids_json: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "tiered_qty_json",
    });

    const dealType = watch('deal_type');

    useEffect(() => {
        if (deal) {
            reset({
                ...deal,
                valid_from: deal.valid_from.split('T')[0],
                valid_to: deal.valid_to.split('T')[0],
                bundle_product_ids_json: deal.products.map(p => p.id),
            });
            setAssociatedProducts(deal.products);
        }
    }, [deal, reset]);


    const onSubmit = async (data: DealFormData) => {
        setIsSubmitting(true);
        try {
            if (deal) {
                const { bundle_product_ids_json, ...updateData } = data;
                await updateDeal(deal.id, updateData);
                showSnackbar('Deal updated successfully!', 'success');
            } else {
                await createDeal(data);
                showSnackbar('Deal created successfully!', 'success');
            }
            router.push('/apps/deals');
        } catch (error: any) {
            showSnackbar(error.message || 'An error occurred', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProductAdded = (product: ProductInDeal) => {
        if (!associatedProducts.some(p => p.id === product.id)) {
            setAssociatedProducts(prev => [...prev, { id: product.id, name: product.name, slug: product.slug }]);
        } else {
            showSnackbar('Product is already associated with this deal.', 'info');
        }
    };

    const handleRemoveProduct = (productId: number) => {
        const product = associatedProducts.find((p) => p.id === productId);
        if (product) {
            setProductToRemove(product);
        }
    };

    const handleConfirmRemove = async () => {
        if (!productToRemove || !deal) return;

        try {
            await removeProductsFromDeal(deal.id, [productToRemove.id]);
            setAssociatedProducts((prev) => prev.filter((p) => p.id !== productToRemove.id));
            showSnackbar('Product removed successfully', 'success');
        } catch (err: any) {
            showSnackbar(err.message || 'Failed to remove product', 'error');
        } finally {
            setProductToRemove(null);
        }
    };

    return (
        <>
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: { xs: 2, md: 4 }, backgroundColor: 'white', height: '100%' }}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <FormTextField name="name" control={control} label="Name" required />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormTextField name="deal_type" control={control} label="Deal Type" select required >
                                        <MenuItem value="BUY_N_FOR_FIXED">Buy N For Fixed Price</MenuItem>
                                    </FormTextField>
                                </Grid>

                                {dealType === 'BUY_N_FOR_FIXED' && (
                                    <>
                                        <Grid item xs={12} md={6}>
                                            <FormTextField name="required_qty" control={control} label="Required Quantity" type="number" required />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FormTextField name="fixed_price" control={control} label="Fixed Price" type="number" required />
                                        </Grid>
                                    </>
                                )}

                                <Grid item xs={12} md={6}>
                                    <FormTextField name="valid_from" control={control} label="Valid From" type="date" InputLabelProps={{ shrink: true }} required />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormTextField name="valid_to" control={control} label="Valid To" type="date" InputLabelProps={{ shrink: true }} required />
                                </Grid>
                                <Grid item xs={12}>
                                    <Controller
                                        name="is_active"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Active" />
                                        )}
                                    />
                                </Grid>
                            </Grid>

                            <div className="flex justify-end gap-2 mt-10">
                                <Button variant="outlined" onClick={() => router.push('/apps/deals')}>Cancel</Button>
                                <AppButton type="submit" label={deal ? "Save Changes" : "Create"} loading={isSubmitting} disabled={!isValid || isSubmitting} />
                            </div>
                        </form>
                    </Paper>
                </Grid>
                {deal && (
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: { xs: 2, md: 4 }, height: '100%' }}>
                            <Typography variant="h6" className="mb-4">Associated Products</Typography>
                            <ProductSelector dealId={deal.id} onProductAdded={handleProductAdded} />
                            <List sx={{ mt: 2, maxHeight: 200, overflowY: 'auto' }}>
                                {associatedProducts.map((product, index) => (
                                    <div key={product.id}>
                                        <ListItem
                                        secondaryAction={
                                        <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveProduct(product.id)}>
                                        <FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>
                                        </IconButton>
                                        }
                                        >
                                            <ListItemText primary={product.name} />
                                        </ListItem>
                                        {index < associatedProducts.length - 1 && <Divider />}
                                    </div>
                                ))}
                            </List>
                        </Paper>
                    </Grid>
                )}
            </Grid>
            <Dialog open={!!productToRemove} onClose={() => setProductToRemove(null)}>
                <DialogTitle>Confirm Removal</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to remove <strong>{productToRemove?.name}</strong> from this deal?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setProductToRemove(null)}>Cancel</Button>
                    <AppButton
                        label="Remove"
                        type="button"
                        onClick={handleConfirmRemove}
                    />
                </DialogActions>
            </Dialog>
        </>
    );
};

export default DealForm; 