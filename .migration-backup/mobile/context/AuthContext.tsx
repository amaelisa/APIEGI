import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  User,
  fetchMe,
  loadStoredToken,
  persistToken,
  removeToken,
  setApiToken,
} from "@/lib/api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await loadStoredToken();
        if (token) {
          setApiToken(token);
          const me = await fetchMe();
          setUser(me);
        }
      } catch {
        await removeToken();
        setApiToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (token: string) => {
    await persistToken(token);
    setApiToken(token);
    const me = await fetchMe();
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    await removeToken();
    setApiToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
