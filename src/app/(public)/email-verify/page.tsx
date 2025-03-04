'use client';
import AuthGuardRedirect from '@auth/AuthGuardRedirect';
import EmailVerify from './EmailVerify';

function Page() {
	return (
		<AuthGuardRedirect>
			<EmailVerify />
		</AuthGuardRedirect>
	);
}

export default Page;
