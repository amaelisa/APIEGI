import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import "../components/Auth.css";

export default function Register() {
  const { register, verifyEmailCode, resendConfirmationCode } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setLoading(true);
    try {
      const result = await register({ nom, email, mot_de_passe: password });
      if (result.needsConfirmation) {
        setStep("verify");
        setInfo(
          "Consultez votre email : cherchez un code à 8 chiffres (pas seulement le lien). " +
            "Saisissez-le ci-dessous sur cet écran — le lien du mail ne fonctionne pas sur téléphone."
        );
      } else {
        navigate("/chat", { replace: true });
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (code.trim().length < 6) {
      setError("Entrez le code à 8 chiffres reçu par email.");
      return;
    }
    setLoading(true);
    try {
      await verifyEmailCode(email, code, nom);
      navigate("/chat", { replace: true });
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    try {
      await resendConfirmationCode(email);
      setInfo(
        "Si un nouvel email est autorisé, il arrivera dans quelques minutes. " +
          "Limite gratuite : ~4 emails/heure — attendez 1 h si bloqué."
      );
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-wrap">
            <Logo size={48} />
          </div>
          <h1 className="gradient-text">Inscription</h1>
          <p>Compte étudiant GI — confirmation par email</p>
        </div>

        {step === "form" ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <p className="auth-error">{error}</p>}
            {info && <p className="auth-info">{info}</p>}
            <label>
              Nom complet
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                minLength={2}
                placeholder="Jean Dupont"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label>
              Mot de passe
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Envoi…" : "Créer mon compte"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleVerify}>
            {error && <p className="auth-error">{error}</p>}
            {info && <p className="auth-info">{info}</p>}
            <p className="auth-verify-hint">
              Code envoyé à <strong>{email}</strong>
            </p>
            <label>
              Code de confirmation (8 chiffres)
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                required
                minLength={6}
                maxLength={8}
                placeholder="12345678"
              />
            </label>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Vérification…" : "Confirmer mon compte"}
            </button>
            <button
              type="button"
              className="auth-link-btn"
              onClick={handleResend}
              disabled={loading}
            >
              Renvoyer le code (attendre 1 h si limite atteinte)
            </button>
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => setStep("form")}
            >
              Modifier mon email
            </button>
          </form>
        )}

        <p className="auth-footer">
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
