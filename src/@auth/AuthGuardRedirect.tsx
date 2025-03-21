"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAuthToken } from "@/utils/auth";
import FuseLoading from "@fuse/core/FuseLoading";

type AuthGuardProps = {
  children: React.ReactNode;
};

const ignoredPaths = [
  "/",
  "/callback",
  "/sign-in",
  "/sign-out",
  "/logout",
  "/404",
  "/sign-up",
  "/forgot-password",
  "/email-verify",
  "/reset-password",
]; // Include sign-up if needed

function AuthGuardRedirect({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getAuthToken();

    // Allow public pages without authentication
    if (ignoredPaths.includes(pathname)) {
      // Redirect logged-in users away from sign-in and sign-up
      if (
        token &&
        ["/sign-in", "/sign-up", "/email-verify", "/reset-password"].includes(
          pathname,
        )
      ) {
        router.replace("/dashboards/project"); // Change this to your dashboard route
      }
      setIsAuthenticated(true);
      return;
    }
    // Redirect unauthenticated users to sign-in
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      router.replace("/sign-in");
    }
  }, [router, pathname]);

  if (isAuthenticated === null) {
    return <FuseLoading />;
  }

  return <>{children}</>;
}

export default AuthGuardRedirect;
