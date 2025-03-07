'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import Typography from '@mui/material/Typography';
import _ from 'lodash';
import Paper from '@mui/material/Paper';
import Link from '@fuse/core/Link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@mui/material';
import { usePost } from '@/hooks/useFetch';
import { resetPassword } from '@/services/apiService';
import AppButton from '@/components/Shared/AppButton';
import { useSnackbar } from '@/contexts/SnackbarContext';
import FormInputField from '@/components/Shared/FormInputField';
import { storeAuthToken } from '@/utils/auth';
import { useRouter } from "next/navigation";


/**
 * Form Validation Schema
 */
const schema = z.object({
	password: z
	  .string()
	  .min(1, 'Password is required') // Ensures the field is required
	  .min(8, 'Password must be at least 8 characters long') // Minimum length validation
	  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
	  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
	  .regex(/[0-9]/, 'Password must contain at least one number')
	  .regex(/[@$!%*?&]/, 'Password must contain at least one special character'),
  });

const defaultValues = {
    password: '',
};

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token'); // Extract token from URL
    const { showSnackbar } = useSnackbar();
    const router = useRouter(); // Initialize router

    const [successMessage, setSuccessMessage] = useState('');
    const { control, formState, handleSubmit, reset, setError } = useForm({
        mode: 'onChange',
        defaultValues,
        resolver: zodResolver(schema),
    });

    const { isValid, dirtyFields, errors } = formState;
    const { trigger: triggerResetPassword, isMutating } = usePost('reset-password', resetPassword);

    async function onSubmit(data) {
        if (!token) {
            setError('root', { type: 'manual', message: 'Invalid or missing token.' });
            return;
        }
        try {
            const response = await triggerResetPassword({ token, password: data.password });
            showSnackbar(response?.data?.message, 'success');

            console.log("res",response);
            
            if (response?.success) {
                // Store encrypted token in cookies
                storeAuthToken(response?.data?.accessToken);
                router.push("/dashboards/project");
            }

            // if (response?.error) {
            //     setError('root', { type: 'manual', message: response.error });
            //     setSuccessMessage('');
            //     return;
            // }
            // setSuccessMessage('Password reset successfully! You can now sign in.');
            reset(defaultValues);
        } catch (error) {
            showSnackbar(error, 'error');
            setSuccessMessage('');
        }
    }

    return (
        <div className="flex min-w-0 flex-auto flex-col items-center sm:justify-center">
            <Paper className="min-h-full w-full rounded-none px-4 py-8 sm:min-h-auto sm:w-auto sm:rounded-xl sm:p-12 sm:shadow-sm">
                <div className="mx-auto w-full max-w-80 sm:mx-0 sm:w-80">
                    <img className="w-36" src="/assets/images/logo/logo.svg" alt="logo" />

                    <Typography className="mt-8 text-4xl font-extrabold leading-[1.25] tracking-tight">
                        Reset your password
                    </Typography>
                    <Typography className="font-medium">Create a new password for your account</Typography>

                    {errors?.root?.message && (
                        <Alert className="mb-4" severity="error">
                            {errors.root.message}
                        </Alert>
                    )}

                    {successMessage && (
                        <Alert className="mb-4" severity="success">
                            {successMessage}
                        </Alert>
                    )}

                    <form name="resetPasswordForm" noValidate className="mt-8 flex w-full flex-col justify-center" onSubmit={handleSubmit(onSubmit)}>
                        <FormInputField name="password" control={control} label="Password" type="password" required />

                        <AppButton
                            label={isMutating ? 'Resetting...' : 'Reset your password'}
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={_.isEmpty(dirtyFields) || !isValid || isMutating}
                            className="mt-1 w-full"
                            aria-label="Reset Password"
                        />

                        <Typography className="mt-8 text-md font-medium" color="text.secondary">
                            <span>Return to</span>
                            <Link className="ml-1 text-[#2E9970]" to="/dashboards/project">
                               Dashboard
                            </Link>
                        </Typography>
                    </form>
                </div>
            </Paper>
        </div>
    );
}

export default ResetPasswordForm;
