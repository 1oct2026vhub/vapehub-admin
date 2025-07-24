import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Box, Typography, Button } from '@mui/material';
import { ProductVariant, listProductVariants } from '@/services/apiProductVariant';
import { bulkUpdateByQuantity } from '@/services/apiInventory';
import AppButton from '@/components/Shared/AppButton';
import FormTextField from '@/components/Shared/FormTextField';
import FormMultiTextField from '@/components/Shared/FormMultiTextField';
import { useDebounce } from '@/hooks/useDebounce';
import { useFetch } from '@/hooks/useFetch';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface BulkUpdateStockModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

const style = {
	position: 'absolute' as 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 600,
	bgcolor: 'background.paper',
	boxShadow: 24,
	p: 4,
};

const schema = z.object({
	selectedVariants: z.array(z.string()).min(1, 'Please select at least one variant.'),
	quantity: z.coerce
		.number({ invalid_type_error: 'Quantity is required.' })
		.int('Quantity must be a whole number.')
		.min(1, 'Quantity must be a positive number.'),
	reference: z.string().optional(),
});

type IFormInput = z.infer<typeof schema>;

const BulkUpdateStockModal: React.FC<BulkUpdateStockModalProps> = ({ open, onClose, onSuccess }) => {
	const { showSnackbar } = useSnackbar();
	const [inputValue, setInputValue] = useState('');
	const debouncedInputValue = useDebounce(inputValue, 500);

	const { data: response, isLoading: loading } = useFetch(
		['product-variants', debouncedInputValue],
		() => listProductVariants({ keyword: debouncedInputValue, limit: 50 }),
		{
			enabled: debouncedInputValue.length >= 1,
		},
	);
	const variants = response?.data?.variants || [];

	const {
		control,
		handleSubmit,
		watch,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<IFormInput>({
		resolver: zodResolver(schema),
		mode: 'onChange',
		defaultValues: {
			selectedVariants: [],
			quantity: undefined,
			reference: '',
		},
	});

	React.useEffect(() => {
		if (open) {
			reset({
				selectedVariants: [],
				quantity: undefined,
				reference: '',
			});
			setInputValue('');
		}
	}, [open, reset]);

	const selectedVariants = watch('selectedVariants');
	const quantity = watch('quantity');

	// Validate that selected variants exist in the current variants list
	const validSelectedVariants = selectedVariants?.filter(slug => 
		variants.some(variant => variant.slug === slug)
	) || [];

	const onSubmit = async (data: IFormInput) => {
		try {
			// Map variant slugs to IDs
			const variantIds = data.selectedVariants
				.map(slug => {
					const variant = variants.find(v => v.slug === slug);
					return variant?.id;
				})
				.filter(id => id !== undefined) as number[];

			if (variantIds.length === 0) {
				showSnackbar('No valid variants found', 'error');
				return;
			}

			const response = await bulkUpdateByQuantity({
				variant_ids: variantIds,
				quantity: Number(data.quantity),
				reference: data.reference,
			});
			onSuccess();
			showSnackbar(response.message, 'success');
			onClose();
		} catch (error: any) {
			showSnackbar(error.message, 'error');
			console.error('Bulk update failed', error);
		}
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
		>
			<Box sx={style}>
				<Typography
					variant="h6"
					component="h2"
					className="mb-4"
				>
					Bulk Update Stock
				</Typography>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="space-y-4"
					noValidate
				>
					<FormMultiTextField
						name="selectedVariants"
						control={control}
						label="Select Variants"
						placeholder="Type variant slugs..."
						suggestions={variants.map((variant: ProductVariant) => variant.slug)}
						required
						error={!!errors.selectedVariants}
						errorMessage={errors.selectedVariants?.message}
						helperText="Type or select variant slugs from the suggestions"
					/>

					<FormTextField
						name="quantity"
						label="Quantity"
						control={control}
						type="number"
						required
						error={!!errors.quantity}
						inputProps={{
							min: 1,
							step: 1,
						}}
					/>
					<FormTextField
						name="reference"
						label="Reference"
						control={control}
						error={!!errors.reference}
					/>
					<Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
						<Button
							onClick={onClose}
							sx={{ mr: 1 }}
						>
							Cancel
						</Button>
						<AppButton
							label="Update Stock"
							type="submit"
							loading={isSubmitting}
							disabled={isSubmitting}
						/>
					</Box>
				</form>
			</Box>
		</Modal>
	);
};

export default BulkUpdateStockModal;