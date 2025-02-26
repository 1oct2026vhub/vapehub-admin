import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { z } from 'zod';
import _ from 'lodash';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@fuse/core/Link';
import { signIn } from 'next-auth/react';
import { Alert } from '@mui/material';
import signinErrors from './signinErrors';
import AppButton from '@/components/Shared/AppButton';
import FormInputField from '@/components/Shared/FormInputField';

const schema = z.object({
	email: z.string().email('You must enter a valid email').nonempty('You must enter an email'),
	password: z
		.string()
		.min(4, 'Password is too short - must be at least 4 chars.')
		.nonempty('Please enter your password.')
});

type FormType = {
	email: string;
	password: string;
	remember?: boolean;
};

const defaultValues = {
	email: '',
	password: '',
	remember: true
};

function AuthJsCredentialsSignInForm() {
	const { control, formState, handleSubmit, setValue, setError } = useForm<FormType>({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema)
	});

	const { isValid, dirtyFields, errors } = formState;

	useEffect(() => {
		setValue('email', 'admin@fusetheme.com', {
			shouldDirty: true,
			shouldValidate: true
		});
		setValue('password', '5;4+0IOx:\\Dy', {
			shouldDirty: true,
			shouldValidate: true
		});
	}, [setValue]);

	async function onSubmit(formData: FormType) {
		const { email, password } = formData;

		const result = await signIn('credentials', {
			email,
			password,
			formType: 'signin',
			redirect: false
		});

		if (result?.error) {
			setError('root', { type: 'manual', message: signinErrors[result.error] });
			return false;
		}

		return true;
	}

	return (
		<form
			name="loginForm"
			noValidate
			className="mt-8 flex w-full flex-col justify-center"
			onSubmit={handleSubmit(onSubmit)}
		>
			{errors?.root?.message && (
				<Alert
					className="mb-8"
					severity="error"
					sx={(theme) => ({
						backgroundColor: theme.palette.error.light,
						color: theme.palette.error.dark
					})}
				>
					{errors?.root?.message}
				</Alert>
			)}

			<FormInputField
				name="email"
				control={control}
				label="Email"
				type="email"
				autoFocus
				required
			/>
			<FormInputField
				name="password"
				control={control}
				label="Password"
				type="password"
				required
			/>
			<div className="flex flex-col items-center justify-center sm:flex-row sm:justify-between">
				<Controller
					name="remember"
					control={control}
					render={({ field }) => (
						<FormControl>
							<FormControlLabel
								label="Remember me"
								control={
									<Checkbox
										size="small"
										{...field}
									/>
								}
							/>
						</FormControl>
					)}
				/>

				<Link
					className="text-md font-medium"
					to="/#"
				>
					Forgot password?
				</Link>
			</div>

			<AppButton
				label="Sign in"
				type="submit"
				color="secondary"
				fullWidth
				size="large"
				disabled={_.isEmpty(dirtyFields) || !isValid}
				className="mt-4 w-full"
			/>
		</form>
	);
}

export default AuthJsCredentialsSignInForm;



