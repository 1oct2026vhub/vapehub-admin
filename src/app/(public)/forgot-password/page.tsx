"use client";

import authRoles from "@auth/authRoles";
import AuthGuardRedirect from "@auth/AuthGuardRedirect";
import ForgotPassword from "./ForgotPassword";

function Page() {
  return (
    <AuthGuardRedirect>
      <ForgotPassword />
    </AuthGuardRedirect>
  );
}

export default Page;
