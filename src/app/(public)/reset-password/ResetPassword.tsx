import CardContent from '@mui/material/CardContent';
import AuthJsForm from '@auth/forms/AuthJsForm';


function ResetPage() {
	return (
		<div className="flex min-w-0 flex-1 flex-col items-center justify-center">
			<CardContent className="mx-auto w-full max-w-80 sm:mx-0 sm:w-80">
				<AuthJsForm formType="reset" />
			</CardContent>
		</div>
	);
}

export default ResetPage;
