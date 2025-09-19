"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();
  const { verifyToken, isLoading, token, tokenExpiry, isAuthenticated } =
    useAuthStore();
  const [initialized, setInitialized] = useState(false);

  // Skip auth verification for login page - no need to verify tokens there
  const isLoginPage = pathname === '/login';

  // Only run token verification once on initial render
  useEffect(() => {
    if (!initialized) {
      // Skip verification on login page - just set as initialized
      if (isLoginPage) {
        console.log("Login page detected, skipping auth verification");
        useAuthStore.setState({ isLoading: false });
        setInitialized(true);
        return;
      }

      // Check if token is expired
      if (tokenExpiry && Date.now() > tokenExpiry) {
        console.log("Token expired during initialization");
        useAuthStore.getState().logout();
        setInitialized(true);
      } else if (token && !isAuthenticated) {
        console.log("Token exists but not authenticated, verifying");
        verifyToken().finally(() => {
          setInitialized(true);
        });
      } else {
        console.log(
          "Auth initialization complete, token:",
          !!token,
          "authenticated:",
          isAuthenticated
        );
        setInitialized(true);
      }
    }
  }, [initialized, token, tokenExpiry, isAuthenticated, isLoginPage]); // Added isLoginPage to dependencies

  // Add a safety timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log("Auth loading timeout - forcing stop");
        useAuthStore.setState({ isLoading: false });
      }
    }, 5000); // 5 second safety timeout

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  // Show loading state (but skip for login page)
  if (isLoading && !isLoginPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <>{children}</>;
}
