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

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
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

  const login = async (email, mot_de_passe) => {
    const data = await loginUser({ email, mot_de_passe });
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await registerUser(payload);
    return {
      needsConfirmation: data.needs_confirmation !== false,
      email: data.email,
      message: data.message,
    };
  };

  const verifyEmailCodeFn = async (email, code, nom) => {
    const data = await verifyEmailCode({ email, code, nom });
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const resendConfirmationCodeFn = async (email) => {
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
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
