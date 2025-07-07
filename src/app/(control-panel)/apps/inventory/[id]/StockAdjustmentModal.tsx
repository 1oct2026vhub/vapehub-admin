'use client';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addStock, removeStock, adjustStock } from '@/services/apiInventory';
import FormTextField from '@/components/Shared/FormTextField';
import AppButton from '@/components/Shared/AppButton';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useEffect, useMemo } from 'react';

type ActionType = 'add' | 'remove' | 'adjust';

interface StockAdjustmentModalProps {
    open: boolean;
    onClose: () => void;
    actionType: ActionType;
    variantId: number;
    onSuccess: () => void;
    currentStock: number;
}

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
    open,
    onClose,
    actionType,
    variantId,
    onSuccess,
    currentStock
}) => {
    const { showSnackbar } = useSnackbar();

    const schema = useMemo(() => {
        const addSchema = z.object({
            quantity: z.coerce.number().min(1, "Quantity is required").positive("Quantity must be positive"),
            reference: z.string().optional(),
        });
        const removeSchema = z.object({
            quantity: z.coerce.number().min(1, "Quantity is required").positive("Quantity must be positive").max(currentStock, `Cannot remove more than available stock (${currentStock})`),
            reference: z.string().optional(),
        });
        const adjustSchema = z.object({
            new_quantity: z.coerce.number().min(1, "Quantity is required").positive("Quantity must be positive"),
            reference: z.string().optional(),
        });

        const schemas = {
            add: addSchema,
            remove: removeSchema,
            adjust: adjustSchema,
        };
        return schemas[actionType];
    }, [actionType, currentStock]);

    type FormData = z.infer<typeof schema>;

    const { control, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<any>({
        resolver: zodResolver(schema),
        defaultValues: {},
    });

    useEffect(() => {
        if(open) {
            if (actionType === 'adjust') {
                reset({ new_quantity: currentStock, reference: '' });
            } else if (actionType === 'remove') {
                reset({ quantity: currentStock, reference: '' });
            }
             else {
                reset({ quantity: 0, reference: '' });
            }
        }
    }, [open, actionType, reset, currentStock]);

    const onSubmit = async (data: any) => {
        try {
            let response;
            if (actionType === 'add') {
                response = await addStock({ variant_id: variantId, ...data });
            } else if (actionType === 'remove') {
                response = await removeStock({ variant_id: variantId, ...data });
            } else {
                response = await adjustStock({ variant_id: variantId, ...data });
            }
            showSnackbar(response.message || 'Action completed successfully!', 'success');
            onSuccess();
        } catch (error: any) {
            showSnackbar(error.message || 'An error occurred', 'error');
        }
    };
    
    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ sx: { backgroundColor: 'white' } }} fullWidth>
            <DialogTitle>{actionType.charAt(0).toUpperCase() + actionType.slice(1)} Stock</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    {actionType === 'adjust' ? (
                        <FormTextField
                            name="new_quantity"
                            control={control}
                            label="New Quantity"
                            type="number"
                            required
                            fullWidth
                            margin="normal"
                        />
                    ) : (
                        <FormTextField
                            name="quantity"
                            control={control}
                            label="Quantity"
                            type="number"
                            required
                            fullWidth
                            margin="normal"
                        />
                    )}
                    <FormTextField
                        name="reference"
                        control={control}
                        label="Reference"
                        fullWidth
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <AppButton
                        label={isSubmitting ? 'Submitting...' : 'Submit'}
                        type="submit"
                        loading={isSubmitting}
                        disabled={isSubmitting}
                    />
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default StockAdjustmentModal; 