"use client"
import { useSearchParams } from "next/navigation";
import Typography from "@mui/material/Typography";
import Link from "@fuse/core/Link";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { verifyEmail } from "@/services/apiService";
import { useFetch } from "@/hooks/useFetch";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useEffect } from "react";

function EmailVerifyConfirmationForm() {
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const { showSnackbar } = useSnackbar(); //Use Snackbar


	const { data, error, isLoading } = useFetch(
		token ? ["verifyEmail", { token }] : null,
		verifyEmail,
		{ token }
	);
	// Trigger snackbar only once when data.success is true
	useEffect(() => {
		if (data?.success) {
			showSnackbar(data?.message);
		}
		else {
			showSnackbar('Invalid link or link expired');
		}
	}, [data]);


	return (
		<div className="flex min-w-0 flex-auto flex-col items-center sm:justify-center">
			<Paper className="min-h-full w-full rounded-none px-4 py-8 sm:min-h-auto sm:w-auto sm:rounded-xl sm:p-12 sm:shadow-sm">
				<div className="mx-auto w-full max-w-80 sm:mx-0 sm:w-80">
					<img
						className="w-24"
						src="/assets/images/logo/logo.svg"
						alt="logo"
					/>

					<Typography className="mt-8 text-4xl font-extrabold leading-[1.25] tracking-tight">
						Confirmation required
					</Typography>
					<Typography className="mt-4">
						A confirmation mail with instructions has been sent to your email address. Follow those
						instructions to confirm your email address and activate your account.
					</Typography>

					<Typography
						className="mt-8 text-md font-medium"
						color="text.secondary"
					>
						<span>Return to</span>
						<Link
							className="text-[#2E9970] ml-1 hover:underline"
							to="/dashboards/project"
						>
							Dashboard
						</Link>
					</Typography>
				</div>
			</Paper>
		</div>
	);
}

export default EmailVerifyConfirmationForm;
