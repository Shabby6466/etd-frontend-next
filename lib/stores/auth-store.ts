import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "../api/auth";
import { cookieUtils } from "../utils/cookies";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "MINISTRY" | "AGENCY" | "MISSION_OPERATOR";
  state?: string;
  agency?: string;
  locationId?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  tokenExpiry: number | null; // Unix timestamp in ms
  isAuthenticated: boolean;
  isLoading: boolean;
  isVerifying: boolean;
  // region?: string;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  verifyToken: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string, expiryMs?: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      tokenExpiry: null,
      isAuthenticated: false,
      isLoading: true,
      isVerifying: false,
      login: async (email: string, password: string) => {
        try {
          const data = await authAPI.login({ email, password });
          // Set expiry to 24h from now
          const expiry = Date.now() + 24 * 60 * 60 * 1000;
          // Store token in both localStorage (via Zustand persist) and cookie (for server-side) with 24h expiry
          cookieUtils.set("auth-token", data.token, {
            persistent: true,
            expires: new Date(expiry),
          });
          set({
            user: data.user,
            token: data.token,
            tokenExpiry: expiry,
            isAuthenticated: true,
            isLoading: false,
          });
          // Set up auto-logout timer
          setAutoLogout(expiry);
          return { success: true };
        } catch (err: unknown) {
          const message =
            (
              err as {
                response?: { data?: { message?: string; error?: string } };
                message?: string;
              }
            )?.response?.data?.message ||
            (
              err as {
                response?: { data?: { error?: string } };
                message?: string;
              }
            )?.response?.data?.error ||
            (err as { message?: string }).message ||
            "Login failed";
          return { success: false, error: message };
        }
      },
      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          // Clear both localStorage and cookie
          cookieUtils.remove("auth-token");
          set({
            user: null,
            token: null,
            tokenExpiry: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
      verifyToken: async () => {
        const { token, isVerifying, tokenExpiry } = get();
        console.log('=== TOKEN VERIFICATION START ===')
        console.log('Current token:', token ? 'exists' : 'missing')
        console.log('Token expiry:', tokenExpiry)
        console.log('Current time:', Date.now())
        
        // Check expiry before verifying
        if (tokenExpiry && Date.now() > tokenExpiry) {
          console.log("Token expired, logging out");
          await get().logout();
          return;
        }
        console.log(
          "verifyToken called - token exists:",
          !!token,
          "isVerifying:",
          isVerifying
        );
        // Prevent multiple simultaneous verification calls
        if (isVerifying) {
          console.log("Verification already in progress, skipping");
          return;
        }
        if (!token) {
          console.log("No token found, stopping verification");
          set({ isLoading: false, isVerifying: false });
          return;
        }

        console.log("Starting token verification");
        set({ isLoading: true, isVerifying: true });

        try {
          // Add timeout to the API call to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
              () => reject(new Error("Token verification timeout")),
              5000
            );
          });

          const data = (await Promise.race([
            authAPI.verify(),
            timeoutPromise,
          ])) as { user: User };

          console.log("Token verification successful");
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            isVerifying: false,
          });
        } catch (error) {
          console.error("Token verification failed:", error);
          // Clear both localStorage and cookie when verification fails
          cookieUtils.remove("auth-token");
          set({
            user: null,
            token: null,
            tokenExpiry: null,
            isAuthenticated: false,
            isLoading: false,
            isVerifying: false,
          });
        }
      },
      setUser: (user: User) => {
        set({ user });
      },
      setToken: (token: string, expiryMs?: number) => {
        // Store token in both localStorage (via Zustand persist) and cookie (for server-side)
        const expiry = expiryMs || Date.now() + 24 * 60 * 60 * 1000;
        cookieUtils.set("auth-token", token, {
          persistent: true,
          expires: new Date(expiry),
        });
        set({ token, tokenExpiry: expiry, isAuthenticated: true, isLoading: false });
        setAutoLogout(expiry);
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) =>
        ({
          user: state.user,
          token: state.token,
          tokenExpiry: state.tokenExpiry,
          isAuthenticated: state.isAuthenticated,
        } as Partial<AuthState>),
      onRehydrateStorage: () => {
        return (rehydratedState) => {
          try {
            console.log(
              "Auth rehydration - starting with state:",
              rehydratedState ? "exists" : "null"
            );

            // Use setTimeout to avoid calling during initialization
            setTimeout(() => {
              // Always set isLoading to false first to prevent loading screen
              useAuthStore.setState({ isLoading: false });
            }, 0);

            // If we got a proper state with a token, use it
            if (rehydratedState?.token) {
              const { token, tokenExpiry, user } = rehydratedState;
              console.log(
                "Auth rehydration - persisted state with token found, expiry:",
                tokenExpiry
              );

              // Check expiry
              if (tokenExpiry && Date.now() > tokenExpiry) {
                console.log("Auth rehydration - token expired, clearing state");
                cookieUtils.remove("auth-token");
                // Clear state using setTimeout to avoid circular dependency
                setTimeout(() => {
                  useAuthStore.setState({
                    user: null,
                    token: null,
                    tokenExpiry: null,
                    isAuthenticated: false,
                    isLoading: false,
                  });
                }, 0);
              } else {
                // Valid token in state, initialize with it
                console.log("Auth rehydration - valid token from state");
                // Make sure cookie is set (with same expiry)
                cookieUtils.set("auth-token", token, {
                  persistent: true,
                  expires: tokenExpiry ? new Date(tokenExpiry) : undefined,
                });

                // Set initial state using setTimeout to avoid circular dependency
                setTimeout(() => {
                  useAuthStore.setState({
                    user: user as User,
                    token,
                    tokenExpiry: tokenExpiry || null,
                    isAuthenticated: true,
                    isLoading: false
                  });
                }, 0);
              }
              return;
            }

            // Fallback to cookie if no state or no token in state
            console.log(
              "Auth rehydration - no valid state token, checking cookie"
            );
            const cookieToken = cookieUtils.get("auth-token");

            if (cookieToken) {
              console.log("Auth rehydration - cookie token found");
              // Set expiry to 24h from now
              const expiry = Date.now() + 24 * 60 * 60 * 1000;

              // Initialize with token from cookie using setTimeout
              setTimeout(() => {
                useAuthStore.setState({
                  token: cookieToken,
                  tokenExpiry: expiry,
                  isAuthenticated: true,
                  isLoading: false
                });
              }, 0);
            } else {
              console.log(
                "Auth rehydration - no token found anywhere, clearing state"
              );
              // No token found anywhere, clear state using setTimeout
              setTimeout(() => {
                useAuthStore.setState({
                  isLoading: false,
                  isAuthenticated: false,
                  user: null,
                  token: null,
                  tokenExpiry: null,
                });
              }, 0);
            }
          } catch (error) {
            console.error("Error during auth rehydration:", error);
            // Ensure we don't get stuck in loading state if there's an error
            setTimeout(() => {
              useAuthStore.setState({
                isLoading: false,
                isAuthenticated: false,
                user: null,
                token: null,
                tokenExpiry: null,
              });
            }, 0);
          }
        };
      },
    }
  )
);

// Helper: set up auto-logout timer
let logoutTimer: ReturnType<typeof setTimeout> | null = null;
function setAutoLogout(expiry: number | null) {
  if (logoutTimer) clearTimeout(logoutTimer);
  if (!expiry) return;
  const ms = expiry - Date.now();
  if (ms <= 0) {
    // Use setTimeout to avoid calling during initialization
    setTimeout(() => {
      try {
        useAuthStore.getState().logout();
      } catch (error) {
        console.error("Error during auto logout:", error);
      }
    }, 0);
    return;
  }
  logoutTimer = setTimeout(() => {
    try {
      useAuthStore.getState().logout();
    } catch (error) {
      console.error("Error during auto logout:", error);
    }
  }, ms);
}
