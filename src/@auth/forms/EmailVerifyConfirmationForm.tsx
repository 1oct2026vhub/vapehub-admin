"use client";
import { useSearchParams } from "next/navigation";
import Typography from "@mui/material/Typography";
import Link from "@fuse/core/Link";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { verifyEmail } from "@/services/apiService";
import { useFetch } from "@/hooks/useFetch";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useEffect, useMemo } from "react";
import { getAuthToken, storeAuthToken } from "@/utils/auth";
import { useRouter } from "next/navigation";

function EmailVerifyConfirmationForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { showSnackbar } = useSnackbar();
  const router = useRouter();

  const accessToken = getAuthToken();

  // Ensure useFetch is always called, but prevent the API call when token is missing
  const { data, error, isLoading } = useFetch(
    ["verifyEmail", { token }], // Key to trigger fetch
    verifyEmail,
    { token },
    { skip: !!accessToken }
  );

  useEffect(() => {
    if (!token) return; // Prevent invalid execution when token is missing

    if (data?.success) {
      // showSnackbar(data?.message, "success");
      storeAuthToken(data?.data?.accessToken);
      setTimeout(() => router.push("/dashboards/admin"), 3000);
      // setTimeout(() => router.push("/dashboards/project"), 3000);
    } else if (error || !data?.success) {
      // showSnackbar("Invalid link or link expired", "error");
    }
  }, [data, error, token]);

  // Show loading state while fetching
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CircularProgress />
      </div>
    );
  }

  // If response is failed OR token is missing, show error message
  if (!token || error || !data?.success) {
    return (
      <div className="flex min-w-0 flex-auto flex-col items-center sm:justify-center">
        <Paper className="min-h-full w-full rounded-none px-4 py-8 sm:min-h-auto sm:w-auto sm:rounded-xl sm:p-12 sm:shadow-sm">
          <div className="mx-auto w-full max-w-80 sm:mx-0 sm:w-80">
            <Typography className="mt-8 text-4xl font-extrabold leading-[1.25] tracking-tight">
              Email Verification Failed
            </Typography>
            <Alert severity="error" className="mt-4">
              Invalid link or link expired. Please try again.
            </Alert>
            <Typography className="mt-4">
              <span>Return to</span>
              <Link
                className="text-[#2E9970] ml-1 hover:underline"
                to="/dashboards/admin"
                // to="/dashboards/project"
              >
                Sign_in
              </Link>
            </Typography>
          </div>
        </Paper>
      </div>
    );
  }

  // If verification is successful, show success message
  return (
    <div className="flex min-w-0 flex-auto flex-col items-center sm:justify-center">
      <Paper className="min-h-full w-full rounded-none px-4 py-8 sm:min-h-auto sm:w-auto sm:rounded-xl sm:p-12 sm:shadow-sm">
        <div className="mx-auto w-full max-w-80 sm:mx-0 sm:w-80">
          {/* <a
            href="#"
            // target="_blank"
            // rel="noopener noreferrer"
          > */}
            <img
              className="w-36"
              src="/assets/images/logo/logo.svg"
              alt="logo"
            />
          {/* </a> */}

          <Typography className="mt-8 text-4xl font-extrabold leading-[1.25] tracking-tight">
            Email Verification Success
          </Typography>
          <Typography className="mt-4">
            User email verified successfully! Access granted to the admin
            dashboard. Start managing and optimizing the platform now.
          </Typography>

          <Typography
            className="mt-8 text-md font-medium"
            color="text.secondary"
          >
            <span>Return to</span>
            <Link
              className="text-[#2E9970] ml-1 hover:underline"
              to="/dashboards/admin"
              // to="/dashboards/project"
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
