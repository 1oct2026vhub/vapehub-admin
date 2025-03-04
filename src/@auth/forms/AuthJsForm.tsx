import { Alert } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import AuthJsCredentialsSignInForm from './AuthJsCredentialsSignInForm';
import AuthJsCredentialsSignUpForm from './AuthJsCredentialsSignUpForm';
import signinErrors from './signinErrors';
import ForgotPasswordForm from './ForgotPasswordForm';
import EmailVerifyConfirmationForm from './EmailVerifyConfirmationForm';
import ResetPasswordForm from './ResetPasswordForm';

type AuthJsFormProps = { formType: 'signin' | 'signup' | 'forgot' | 'reset' | 'verify'};

function AuthJsForm(props: AuthJsFormProps) {
	const { formType = 'signin' } = props;

	const searchParams = useSearchParams();

	const errorType = searchParams.get('error');

	const error = errorType && (signinErrors[errorType] ?? signinErrors.default);

	return (
		<div className="flex flex-col space-y-8">
			{error && (
				<Alert
					className="mt-4"
					severity="error"
					sx={(theme) => ({
						backgroundColor: theme.palette.error.light,
						color: theme.palette.error.dark
					})}
				>
					{error}
				</Alert>
			)}
			{formType === 'signin' && <AuthJsCredentialsSignInForm />}
			{formType === 'signup' && <AuthJsCredentialsSignUpForm />}
			{formType === 'forgot' && <ForgotPasswordForm />}
			{formType === 'reset' && <ResetPasswordForm/>}
			{formType === 'verify' && <EmailVerifyConfirmationForm />}
		</div>
	);
}

export default AuthJsForm;
