import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  loginUser,
} from "../api/authApi";

import type {
  AuthUser,
} from "../types/auth";


interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (
    username: string,
    password: string
  ) => Promise<AuthUser>;

  logout: () => void;
}


const AuthContext = createContext<
  AuthContextValue | undefined
>(undefined);


interface AuthProviderProps {
  children: ReactNode;
}


export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);


  useEffect(() => {
    async function restoreSession() {
      const accessToken =
        localStorage.getItem("access_token");

      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser =
          await getCurrentUser(accessToken);

        setUser(currentUser);
      } catch {
        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "refresh_token"
        );

        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

/*1 */
  async function login(
    username: string,
    password: string
  ): Promise<AuthUser> {
    const tokens = await loginUser(
      username,
      password
    );

    localStorage.setItem(
      "access_token",
      tokens.access
    );

    localStorage.setItem(
      "refresh_token",
      tokens.refresh
    );

    try {
      const currentUser =
        await getCurrentUser(tokens.access);

      setUser(currentUser);

      return currentUser;
    } catch (error) {
      localStorage.removeItem(
        "access_token"
      );

      localStorage.removeItem(
        "refresh_token"
      );

      setUser(null);

      throw error;
    }
  }


  function logout() {
    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "refresh_token"
    );

    setUser(null);
  }

/*2 */
  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider."
    );
  }

  return context;
}