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
import { storeAuthToken } from "@/utils/auth";
import { useRouter } from "next/navigation";


function EmailVerifyConfirmationForm() {
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const { showSnackbar } = useSnackbar(); //Use Snackbar
	const router = useRouter(); // Initialize router



	const { data, error, isLoading } = useFetch(
		token ? ["verifyEmail", { token }] : null,
		verifyEmail,
		{ token }
	);

	// Trigger snackbar only once when data.success is true
	useEffect(() => {
		if (data?.success) {
			showSnackbar(data?.message, "success");
			storeAuthToken(data?.data?.accessToken);
			setTimeout(() => {
				router.push("/dashboards/project");
			}, 1000); // Redirect after 1 seconds
		} else {
			showSnackbar('Invalid link or link expired',"error");
		}
	}, [data]);


	return (
		<div className="flex min-w-0 flex-auto flex-col items-center sm:justify-center">
			<Paper className="min-h-full w-full rounded-none px-4 py-8 sm:min-h-auto sm:w-auto sm:rounded-xl sm:p-12 sm:shadow-sm">
				<div className="mx-auto w-full max-w-80 sm:mx-0 sm:w-80">
					<a href="https://vapehub.devateam.com/" target="_blank" rel="noopener noreferrer">
						<img
							className="w-36"
							src="/assets/images/logo/logo.svg"
							alt="logo"
						/>
					</a>

					<Typography className="mt-8 text-4xl font-extrabold leading-[1.25] tracking-tight">
						Email  Verification Required
					</Typography>
					<Typography className="mt-4">
						User email verified successfully! Access granted to the admin dashboard.
						Start managing and optimizing the platform now.
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
