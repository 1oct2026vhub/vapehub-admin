'use client';

import {  useForm } from 'react-hook-form';
import Typography from '@mui/material/Typography';
import _ from 'lodash';
import Paper from '@mui/material/Paper';
import Link from '@fuse/core/Link';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormInputField from '@/components/Shared/FormInputField';
import AppButton from '@/components/Shared/AppButton';
import { usePost } from '@/hooks/useFetch';
import { forgotPassword } from '@/services/apiService';
import { Alert } from '@mui/material';
import { useState } from 'react';
import { useSnackbar } from '@/contexts/SnackbarContext';

const schema = z.object({
	email: z
	  .string()
	  .min(1, 'Email is required') // Ensures the field is required
	  .email('Invalid email format'), // Validates email format
});

const defaultValues = {
	email: '',
};

/**
 * Forgot Password Page
 */
function ForgotPasswordForm() {
	const [successMessage, setSuccessMessage] = useState('');
	const { showSnackbar } = useSnackbar(); 
	
	const { control, formState, handleSubmit, reset, setError } = useForm({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema),
	});

	const { isValid, dirtyFields, errors } = formState;

	// Use the custom POST hook for forgot password API
	const { trigger: triggerForgotPassword, isMutating } = usePost('forgot-password', forgotPassword);

	async function onSubmit(data) {
		try {
			const response = await triggerForgotPassword({ email: data.email });

			if (response?.error) {
				setError('root', { type: 'manual', message: response.error });
				return;
			}
			showSnackbar('Reset link sent! Please check your email.')
			reset(defaultValues);
		} catch (error) {
			showSnackbar(error)
		}
	}

	return (
		<div className="flex min-w-0 flex-auto flex-col items-center sm:justify-center">
			<Paper className="min-h-full w-full rounded-none px-4 py-8 sm:min-h-auto sm:w-auto sm:rounded-xl sm:p-12 sm:shadow-sm">
				<div className="mx-auto w-full max-w-80 sm:mx-0 sm:w-80">
					<img className="w-32 max-h-32" src="/assets/images/logo/logo.svg" alt="logo" />

					<Typography className="mt-8 text-4xl font-extrabold leading-[1.25] tracking-tight">
						Forgot password?
					</Typography>
					<div className="mt-0.5 flex items-baseline font-medium">
						<Typography>Fill the form to reset your password</Typography>
					</div>

					{/* Show error message */}
					{errors?.root?.message && (
						<Alert className="mb-4" severity="error">
							{errors.root.message}
						</Alert>
					)}

					{/* Show success message */}
					{successMessage && (
						<Alert className="mb-4" severity="success">
							{successMessage}
						</Alert>
					)}

					<form
						name="forgotPasswordForm"
						noValidate
						className="mt-8 flex w-full flex-col justify-center"
						onSubmit={handleSubmit(onSubmit)}
					>
						<FormInputField name="email" control={control} label="Email" type="email" autoFocus required />

						<AppButton
							label={isMutating ? 'Sending...' : 'Send reset link'}
							type="submit"
							// color="secondary"
							fullWidth
							size="large"
							disabled={_.isEmpty(dirtyFields) || !isValid || isMutating}
							className="mt-1 w-full"
						/>
						<Typography className="mt-8 text-md font-medium" color="text.secondary">
							<span>Back to</span>
							<Link className="ml-1 text-[#2E9970]" to="/sign-in">
								Sign_in
							</Link>
						</Typography>
					</form>
				</div>
			</Paper>
		</div>
	);
}

export default ForgotPasswordForm;
