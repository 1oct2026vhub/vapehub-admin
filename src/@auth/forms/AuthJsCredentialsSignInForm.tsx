import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { z } from 'zod';
import _ from 'lodash';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@fuse/core/Link';
import { Alert } from '@mui/material';
import signinErrors from './signinErrors';
import AppButton from '@/components/Shared/AppButton';
import FormInputField from '@/components/Shared/FormInputField';
import { usePost } from '@/hooks/useFetch';
import { login } from '@/services/apiService';
import { storeAuthToken } from '@/utils/auth';
import { useRouter } from "next/navigation";


/**
 * Validation Schema
 */
const schema = z.object({
	email: z.string().email('You must enter a valid email').nonempty('You must enter an email'),
	password: z.string().min(4, 'Password must be at least 4 characters long').nonempty('Please enter your password.'),
});

const defaultValues = {
	email: '',
	password: '',
	remember: true,
};

function AuthJsCredentialsSignInForm() {
	const { control, formState, handleSubmit, setValue, setError } = useForm({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema),
	});

	const { isValid, dirtyFields, errors } = formState;

	// Use the custom POST hook for login
	const { trigger: triggerLogin, isMutating } = usePost('login', login);
	const [data, setData] = useState('')
	const router = useRouter(); // Initialize router


	async function onSubmit(formData) {
		const { email, password } = formData;

		try {
			const result = await triggerLogin({ email, password, resendVerificationEmail: false });
			setData(result?.data?.accessToken)
			if (result?.error) {
				setError('root', { type: 'manual', message: signinErrors[result.error] });
				return false;
			}
			// Store encrypted token in cookies
			storeAuthToken(result?.data?.accessToken);
			router.push("/dashboards/project"); 
			return true;
		} catch (error) {
			setError('root', { type: 'manual', message: 'Login failed. Please try again.' });
			return false;
		}
	}
	return (
		<form
			name="loginForm"
			noValidate
			className="mt-8 flex w-full flex-col justify-center"
			onSubmit={handleSubmit(onSubmit)}
		>
			{errors?.root?.message && (
				<Alert className="mb-8" severity="error">
					{errors.root.message}
				</Alert>
			)}

			<FormInputField name="email" control={control} label="Email" type="email" autoFocus required />
			<FormInputField name="password" control={control} label="Password" type="password" required />

			<div className="flex flex-col items-center justify-center sm:flex-row sm:justify-between">
				<Controller
					name="remember"
					control={control}
					render={({ field }) => (
						<FormControl>
							<FormControlLabel label="Remember me" control={<Checkbox size="small" {...field} />} />
						</FormControl>
					)}
				/>
				<Link className="text-md font-medium text-[#2E9970]" to="/forgot-password">Forgot password?</Link>
			</div>
			<AppButton
				label={isMutating ? "Signing in..." : "Sign in"}
				type="submit"
				// color="secondary"
				fullWidth
				size="large"
				disabled={_.isEmpty(dirtyFields) || !isValid || isMutating}
				className="mt-4 w-full"
			/>
		</form>
	);
}

export default AuthJsCredentialsSignInForm;


