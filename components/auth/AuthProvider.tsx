"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { verifyToken, isLoading, token, tokenExpiry, isAuthenticated } =
    useAuthStore();
  const [initialized, setInitialized] = useState(false);

  // Only run token verification once on initial render
  useEffect(() => {
    if (!initialized) {
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
  }, [initialized, token, tokenExpiry, isAuthenticated]); // Removed verifyToken from dependencies

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

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <>{children}</>;
}
