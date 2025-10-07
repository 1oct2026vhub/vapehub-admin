'use client';

import { useState } from 'react';
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
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { createReferralMethod, CreateReferralMethodData } from '@/services/apiReferralMethods';
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
			if (val === "" || val === null || val === undefined) return undefined;
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
		]).optional()
	),
	maximum_purchase: z.preprocess(
		(val) => {
			if (val === "" || val === null || val === undefined) return undefined;
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
		]).optional()
	),
});

const ReferralMethodForm = () => {
	const router = useRouter();
	const { showSnackbar } = useSnackbar();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		control,
		handleSubmit,
		formState: { errors, isValid },
	} = useForm<CreateReferralMethodData>({
		resolver: zodResolver(referralMethodSchema),
		mode: 'all',
		defaultValues: {
			referral_value_type: 'percentage',
			referral_value: '10',
			refer_type: 'referrer',
			status: 'active',
			primary: false,
		},
	});

	const onSubmit = async (data: CreateReferralMethodData) => {
		try {
			setIsSubmitting(true);
			await createReferralMethod(data);
			showSnackbar('Referral method created successfully!', 'success');
			router.push('/apps/referral-methods');
		} catch (error: any) {
			showSnackbar(error.message || 'Failed to create referral method.', 'error');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3, bgcolor: 'white' }}>
			<form
				onSubmit={handleSubmit(onSubmit)}
			>
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
					<Grid
						item
						xs={12}
						md={6}
					>
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
					<Grid
						item
						xs={12}
						md={6}
					>
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
					<Grid
						item
						xs={12}
						md={6}
					>
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
					<Grid
						item
						xs={12}
						md={6}
					>
						<FormTextField
							name="minimum_purchase"
							control={control}
							label="Minimum Purchase"
							type="number"
						/>
					</Grid>
					<Grid
						item
						xs={12}
						md={6}
					>
						<FormTextField
							name="maximum_purchase"
							control={control}
							label="Maximum Purchase"
							type="number"
						/>
					</Grid>
					{/* <Grid
						item
						xs={12}
					>
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
						onClick={() => router.push('/apps/referral-methods')}
					>
						Cancel
					</Button>
					<AppButton
						type="submit"
						label="Create"
						loading={isSubmitting}
						disabled={isSubmitting || !isValid}
					/>
				</div>
			</form>
		</Paper>
	);
};

export default ReferralMethodForm; 