import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { fetchMe, loadStoredToken, persistToken, removeToken, setApiToken, User } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await loadStoredToken();
        if (token) {
          setApiToken(token);
          const me = await fetchMe();
          setUser(me);
        }
      } catch {
        await removeToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    void bootstrap();
  }, []);

  const login = async (token: string) => {
    await persistToken(token);
    setApiToken(token);
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      setUser(null);
    }
  };

  const logout = async () => {
    await removeToken();
    setApiToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
