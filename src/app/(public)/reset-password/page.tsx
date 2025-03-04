'use client';

import authRoles from '@auth/authRoles';
import AuthGuardRedirect from '@auth/AuthGuardRedirect';
import ResetPassword from './ResetPassword';

function Page() {
	return (
		<AuthGuardRedirect>
			<ResetPassword />
		</AuthGuardRedirect>
	);
}

export default Page;
