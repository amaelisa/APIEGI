import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearToken,
  fetchMe,
  getToken,
  loginUser,
  registerUser,
  resendConfirmationCode,
  setToken,
  verifyEmailCode,
} from "../api/client";

interface User {
  nom: string;
  email: string;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, mot_de_passe: string) => Promise<User>;
  register: (payload: { nom: string; email: string; mot_de_passe: string }) => Promise<{ needsConfirmation: boolean; email: string; message: string }>;
  verifyEmailCode: (email: string, code: string, nom: string) => Promise<User>;
  resendConfirmationCode: (email: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
    const onLogout = () => setUser(null);
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [loadSession]);

  const login = async (email: string, mot_de_passe: string) => {
    const data = await loginUser({ email, mot_de_passe });
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload: { nom: string; email: string; mot_de_passe: string }) => {
    const data = await registerUser(payload);
    return {
      needsConfirmation: data.needs_confirmation !== false,
      email: data.email,
      message: data.message,
    };
  };

  const verifyEmailCodeFn = async (email: string, code: string, nom: string) => {
    const data = await verifyEmailCode({ email, code, nom });
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const resendConfirmationCodeFn = async (email: string) => {
    await resendConfirmationCode(email);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      verifyEmailCode: verifyEmailCodeFn,
      resendConfirmationCode: resendConfirmationCodeFn,
      logout,
      isAuthenticated: !!user,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
