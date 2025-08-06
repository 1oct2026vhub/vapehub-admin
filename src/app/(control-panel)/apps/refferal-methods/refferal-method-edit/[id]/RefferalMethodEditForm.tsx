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
	referral_value_type: z.enum(['percentage', 'fixed']),
	referral_value: z.string()
		.min(1, 'Referral value is required')
		.refine((val) => /^\d+(\.\d{1,2})?$/.test(val), {
			message: 'Referral value must be a positive number with up to two decimal places.',
		}),
	refer_type: z.enum(['referrer', 'referral']),
	status: z.enum(['active', 'inactive']),
	primary: z.boolean(),
	minimum_purchase: z.preprocess(
		(val) => {
			if (val === "" || val === null || val === undefined) return null;
			const parsed = Number(val);
			return isNaN(parsed) ? "NaN" : parsed;
		},
		z.union([
			z.literal("NaN").refine(() => false, "Please enter a valid number for Minimum Purchase"),
			z.number()
				.positive("Minimum Purchase must be greater than zero")
        .max(9999999.99, "Minimum Purchase exceeds maximum limit")
				.refine(
					(val) => {
						const str = val.toString();
						return !str.includes(".") || str.split(".")[1].length <= 2;
					},
					{ message: "Minimum Purchase can have at most 2 decimal places" }
				),
		]).nullable()
	),
	maximum_purchase: z.preprocess(
		(val) => {
			if (val === "" || val === null || val === undefined) return null;
			const parsed = Number(val);
			return isNaN(parsed) ? "NaN" : parsed;
		},
		z.union([
			z.literal("NaN").refine(() => false, "Please enter a valid number for Maximum Purchase"),
			z.number()
				.positive("Maximum Purchase must be greater than zero")
        .max(9999999.99, "Maximum Purchase exceeds maximum limit")
				.refine(
					(val) => {
						const str = val.toString();
						return !str.includes(".") || str.split(".")[1].length <= 2;
					},
					{ message: "Maximum Purchase can have at most 2 decimal places" }
				),
		]).nullable()
	),
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
		formState: { errors, isValid, dirtyFields },
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
				minimum_purchase: Number(referralMethod.minimum_purchase) === 0 ? undefined : referralMethod.minimum_purchase,
				maximum_purchase: Number(referralMethod.maximum_purchase) === 0 ? undefined : referralMethod.maximum_purchase,
			});
		}
	}, [referralMethod, reset]);

	const onSubmit = async (data: CreateReferralMethodData) => {
		const payload: Partial<CreateReferralMethodData> = {};

		Object.keys(dirtyFields).forEach((key) => {
			(payload as any)[key] = (data as any)[key];
		});

		if (Object.keys(payload).length === 0) {
			showSnackbar('No changes made to save.', 'info');
			return;
		}

		try {
			setIsSubmitting(true);
			await updateReferralMethod(referralMethod.id, payload as any);
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
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
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
								<MenuItem value="fixed">Fixed Amount</MenuItem>
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
								<MenuItem value="referral">Referral</MenuItem>
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
						{/* <Grid item xs={12}>
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
						</Grid> */}
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