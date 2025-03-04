'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import _ from 'lodash';
import Paper from '@mui/material/Paper';
import Link from '@fuse/core/Link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, TextField } from '@mui/material';
import { usePost } from '@/hooks/useFetch';
import { resetPassword } from '@/services/apiService';

/**
 * Form Validation Schema
 */
const schema = z
  .object({
    password: z.string().nonempty('Please enter your password.').min(8, 'Password must be at least 8 characters.'),
    // passwordConfirm: z.string().nonempty('Password confirmation is required'),
  })
//   .refine((data) => data.password === data.passwordConfirm, {
//     message: 'Passwords must match',
//     path: ['passwordConfirm'],
//   });

const defaultValues = {
  password: '',
//   passwordConfirm: '',
};

/**
 * Reset Password Page
 */
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token'); // Extract token from URL

  const [successMessage, setSuccessMessage] = useState('');
  const { control, formState, handleSubmit, reset, setError } = useForm({
    mode: 'onChange',
    defaultValues,
    resolver: zodResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;

  // Use the custom POST hook for API integration
  const { trigger: triggerResetPassword, isMutating } = usePost('reset-password', resetPassword);

  async function onSubmit(data) {
    if (!token) {
      setError('root', { type: 'manual', message: 'Invalid or missing token.' });
      return;
    }

    try {
      const response = await triggerResetPassword({ token, password: data.password });

      if (response?.error) {
        setError('root', { type: 'manual', message: response.error });
        setSuccessMessage('');
        return;
      }

      setSuccessMessage('Password reset successfully! You can now sign in.');
      reset(defaultValues);
    } catch (error) {
      setError('root', { type: 'manual', message: 'Failed to reset password. Please try again.' });
      setSuccessMessage('');
    }
  }

  return (
    <div className="flex min-w-0 flex-auto flex-col items-center sm:justify-center">
      <Paper className="min-h-full w-full rounded-none px-4 py-8 sm:min-h-auto sm:w-auto sm:rounded-xl sm:p-12 sm:shadow-sm">
        <div className="mx-auto w-full max-w-80 sm:mx-0 sm:w-80">
          <img className="w-24" src="/assets/images/logo/logo.svg" alt="logo" />

          <Typography className="mt-8 text-4xl font-extrabold leading-[1.25] tracking-tight">
            Reset your password
          </Typography>
          <Typography className="font-medium">Create a new password for your account</Typography>

          {/* Show API error message */}
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

          <form name="resetPasswordForm" noValidate className="mt-8 flex w-full flex-col justify-center" onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  className="mb-6"
                  label="Password"
                  type="password"
                  error={!!errors.password}
                  helperText={errors?.password?.message}
                  variant="outlined"
                  required
                  fullWidth
                />
              )}
            />

            {/* <Controller
              name="passwordConfirm"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  className="mb-6"
                  label="Password (Confirm)"
                  type="password"
                  error={!!errors.passwordConfirm}
                  helperText={errors?.passwordConfirm?.message}
                  variant="outlined"
                  required
                  fullWidth
                />
              )}
            /> */}

            <Button
              variant="contained"
              color="secondary"
              className="mt-1 w-full"
              aria-label="Reset Password"
              disabled={_.isEmpty(dirtyFields) || !isValid || isMutating}
              type="submit"
              size="large"
            >
              {isMutating ? 'Resetting...' : 'Reset your password'}
            </Button>

            <Typography className="mt-8 text-md font-medium" color="text.secondary">
              <span>Return to</span>
              <Link className="ml-1" to="/sign-in">
                sign in
              </Link>
            </Typography>
          </form>
        </div>
      </Paper>
    </div>
  );
}

export default ResetPasswordForm;

