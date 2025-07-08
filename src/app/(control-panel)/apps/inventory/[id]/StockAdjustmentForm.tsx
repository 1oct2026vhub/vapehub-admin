'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addStock, removeStock, adjustStock } from '@/services/apiInventory';
import FormTextField from '@/components/Shared/FormTextField';
import FormTextArea from '@/components/Shared/FormTextArea';
import AppButton from '@/components/Shared/AppButton';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useEffect, useState, useMemo } from 'react';
import { Paper, Box, Button } from '@mui/material';

interface StockAdjustmentFormProps {
    variantId: number;
    onSuccess: () => void;
    currentStock: number;
}

const StockAdjustmentForm: React.FC<StockAdjustmentFormProps> = ({
    variantId,
    onSuccess,
    currentStock,
}) => {
    const { showSnackbar } = useSnackbar();
    const [submittingAction, setSubmittingAction] = useState<'add' | 'remove' | 'adjust' | null>(null);

    const schema = useMemo(() => z.object({
            quantity: z.coerce.number({invalid_type_error: "Quantity is required."}).min(1, "Quantity is required"),
            reference: z.string().optional(),
            action: z.enum(['add', 'remove', 'adjust']),
        }).refine((data) => {
            if (data.action === 'remove') {
                return data.quantity <= currentStock;
            }
            return true;
        }, {
            message: `Cannot remove more than available stock (${currentStock})`,
            path: ['quantity'],
        }), [currentStock]);

    type FormData = z.infer<typeof schema>;

    const { control, handleSubmit, reset, setValue } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            quantity: undefined,
            reference: '',
            action: 'add',
        },
    });

    const onSubmit = async (data: FormData) => {
        setSubmittingAction(data.action);
        try {
            let response;
            const { action, ...payloadData } = data;

            if (action === 'add') {
                response = await addStock({ variant_id: variantId, ...(payloadData as { quantity: number; reference?: string }) });
            } else if (action === 'remove') {
                response = await removeStock({ variant_id: variantId, ...(payloadData as { quantity: number; reference?: string }) });
            } else {
                response = await adjustStock({ variant_id: variantId, new_quantity: payloadData.quantity, reference: payloadData.reference });
            }

            showSnackbar(response.message || 'Action completed successfully!', 'success');
            reset();
            onSuccess();
        } catch (error: any) {
            showSnackbar(error.message || 'An error occurred', 'error');
        } finally {
            setSubmittingAction(null);
        }
    };

    return (
        <Paper sx={{ p: { xs: 2, md: 2 }, backgroundColor: 'white' }}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormTextField
                    name="quantity"
                    control={control}
                    label="Quantity"
                    type="number"
                    required
                    fullWidth
                    margin="normal"
                />
                <FormTextArea
                    name="reference"
                    control={control}
                    label="Reference"
                    fullWidth
                    margin="normal"
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            backgroundColor: "white",
                        },
                    }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
                     <AppButton
                        label={submittingAction === 'add' ? "Adding..." : "Add"}
                        onClick={() => setValue('action', 'add')}
                        type="submit"
                        variant="contained"
                        disabled={!!submittingAction}
                        loading={submittingAction === 'add'}
                    />
                     <AppButton
                        label={submittingAction === 'remove' ? "Removing..." : "Remove"}
                        onClick={() => setValue('action', 'remove')}
                        type="submit"
                        variant="contained"
                        disabled={!!submittingAction}
                        loading={submittingAction === 'remove'}
                    />
                     <AppButton
                        label={submittingAction === 'adjust' ? "Adjusting..." : "Adjust"}
                        onClick={() => setValue('action', 'adjust')}
                        type="submit"
                        variant="contained"
                        disabled={!!submittingAction}
                        loading={submittingAction === 'adjust'}
                    />
                </Box>
            </form>
        </Paper>
    );
};

export default StockAdjustmentForm; 