import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatApp from "./pages/ChatApp";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-page">
        <p style={{ color: "var(--text-muted)" }}>Chargement…</p>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-page">
        <p style={{ color: "var(--text-muted)" }}>Chargement…</p>
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatApp />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
