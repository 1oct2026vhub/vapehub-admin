"use client";

import AuthGuardRedirect from "@auth/AuthGuardRedirect";
import SignOutPage from "./SignOutPage";

function Page() {
  return (
    <AuthGuardRedirect>
      <SignOutPage />
    </AuthGuardRedirect>
  );
}

export default Page;
