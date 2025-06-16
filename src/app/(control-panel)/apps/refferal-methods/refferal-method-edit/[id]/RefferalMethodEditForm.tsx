'use client';

import { useState, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { updateReferralMethod, CreateReferralMethodData, ReferralMethod } from '@/services/apiRefferalMethods';
import FormTextField from '@/components/Shared/FormTextField';
import AppButton from '@/components/Shared/AppButton';

const referralMethodSchema = z.object({
	referral_value_type: z.enum(['percentage', 'fixed_amount']),
	referral_value: z.string().min(1, 'Referral value is required'),
	refer_type: z.enum(['referrer', 'referred']),
	status: z.enum(['active', 'inactive']),
	primary: z.boolean(),
	minimum_purchase: z.coerce.number().optional(),
	maximum_purchase: z.coerce.number().optional(),
});

interface RefferalMethodEditFormProps {
	referralMethod: ReferralMethod;
}

const RefferalMethodEditForm: React.FC<RefferalMethodEditFormProps> = ({ referralMethod }) => {
	const router = useRouter();
	const { showSnackbar } = useSnackbar();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		control,
		handleSubmit,
		formState: { errors, isValid },
		reset,
	} = useForm<CreateReferralMethodData>({
		resolver: zodResolver(referralMethodSchema),
		mode: 'all',
	});

	useEffect(() => {
		if (referralMethod) {
			reset({
				referral_value_type: referralMethod.referral_value_type,
				referral_value: referralMethod.referral_value,
				refer_type: referralMethod.refer_type,
				status: referralMethod.status,
				primary: referralMethod.primary,
				minimum_purchase: referralMethod.minimum_purchase,
				maximum_purchase: referralMethod.maximum_purchase,
			});
		}
	}, [referralMethod, reset]);

	const onSubmit = async (data: CreateReferralMethodData) => {
		try {
			setIsSubmitting(true);
			await updateReferralMethod(referralMethod.id, data);
			showSnackbar('Referral method updated successfully!', 'success');
			router.push('/apps/refferal-methods');
		} catch (error: any) {
			showSnackbar(error.message || 'Failed to update referral method.', 'error');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div>
			<Typography variant="h4" className="mb-4">
				Edit Referral Method
			</Typography>
			<Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3, bgcolor: 'white' }}>
				<form onSubmit={handleSubmit(onSubmit)}>
					<Grid container spacing={3}>
						<Grid item xs={12} md={6}>
							<FormTextField
								name="referral_value"
								control={control}
								label="Referral Value"
								required
								error={!!errors.referral_value}
								helperText={errors.referral_value?.message}
							/>
						</Grid>
						<Grid item xs={12} md={6}>
							<FormTextField
								name="referral_value_type"
								control={control}
								label="Referral Value Type"
								select
								required
							>
								<MenuItem value="percentage">Percentage</MenuItem>
								<MenuItem value="fixed_amount">Fixed Amount</MenuItem>
							</FormTextField>
						</Grid>
						<Grid item xs={12} md={6}>
							<FormTextField
								name="refer_type"
								control={control}
								label="Refer Type"
								select
								required
							>
								<MenuItem value="referrer">Referrer</MenuItem>
								<MenuItem value="referred">Referred</MenuItem>
							</FormTextField>
						</Grid>
						<Grid item xs={12} md={6}>
							<FormTextField
								name="status"
								control={control}
								label="Status"
								select
								required
							>
								<MenuItem value="active">Active</MenuItem>
								<MenuItem value="inactive">Inactive</MenuItem>
							</FormTextField>
						</Grid>
						<Grid item xs={12} md={6}>
							<FormTextField
								name="minimum_purchase"
								control={control}
								label="Minimum Purchase"
								type="number"
							/>
						</Grid>
						<Grid item xs={12} md={6}>
							<FormTextField
								name="maximum_purchase"
								control={control}
								label="Maximum Purchase"
								type="number"
							/>
						</Grid>
						<Grid item xs={12}>
							<Controller
								name="primary"
								control={control}
								render={({ field }) => (
									<FormControlLabel
										control={
											<Switch
												{...field}
												checked={field.value}
											/>
										}
										label="Set as Primary"
									/>
								)}
							/>
						</Grid>
					</Grid>
					<div className="flex justify-end gap-2 mt-10">
						<Button
							variant="outlined"
							onClick={() => router.push('/apps/refferal-methods')}
						>
							Cancel
						</Button>
						<AppButton
							type="submit"
							label="Save Changes"
							loading={isSubmitting}
							disabled={isSubmitting || !isValid}
						/>
					</div>
				</form>
			</Paper>
		</div>
	);
};

export default RefferalMethodEditForm; 