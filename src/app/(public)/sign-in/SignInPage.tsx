import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import CardContent from "@mui/material/CardContent";
import AuthJsForm from "@auth/forms/AuthJsForm";
import Link from "next/link";

/**
 * The sign in page.
 */
function SignInPage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center sm:flex-row sm:justify-center md:items-start md:justify-start">
      <Paper className="h-full w-full px-4 py-2 ltr:border-r-1 rtl:border-l-1 sm:h-auto sm:w-auto sm:rounded-xl sm:p-12 sm:shadow-sm md:flex md:h-full md:w-1/2 md:items-center md:justify-end md:rounded-none md:p-16 md:shadow-none">
        <CardContent className="mx-auto w-full max-w-80 sm:mx-0 sm:w-80">
          <div className="w-32 mb-3">
            {/* <a
              href="#"
              // target="_blank"
              // rel="noopener noreferrer"
            > */}
              <img src="/assets/images/logo/logo.svg" alt="logo" />
            {/* </a> */}
          </div>
          <Typography className="text-4xl font-extrabold leading-[1.25] tracking-tight mb-5">
            Sign in
          </Typography>
          <AuthJsForm formType="signin" />
        </CardContent>
      </Paper>
      {/* background: 'linear-gradient(to bottom, #2E9970, #005434)', */}
      <Box
        className="relative hidden h-full flex-auto items-center justify-center overflow-hidden p-16 md:flex lg:px-28"
        sx={{ background: "linear-gradient(to bottom, #2E9970, #005434)" }}
      >
        <div className="relative z-10 w-full max-w-4xl">
          <div className="text-7xl font-bold leading-none text-gray-100 text-center">
            <div>Welcome to VapeHub</div>
          </div>
        </div>
      </Box>
    </div>
  );
}

export default SignInPage;
