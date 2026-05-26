import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { AuthPageLayout } from "./AuthPageLayout";
import { Icon } from "../../components/sage/Icon";

const heading = (text: string) => (
  <h1
    style={{
      margin: "0 0 18px",
      fontFamily: "var(--font-display)",
      fontWeight: 400,
      fontSize: 36,
      letterSpacing: "-0.015em",
      textAlign: "center",
      color: "var(--ink)",
    }}
  >
    {text}
  </h1>
);

export default function Register() {
  const { t } = useTranslation();
  const { signUp, confirmSignUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signUp(email, password, displayName);
      setNeedsConfirmation(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await confirmSignUp(email, confirmationCode);
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (needsConfirmation) {
    return (
      <AuthPageLayout>
        {heading(t("auth.confirm"))}
        {error && <div className="fp-alert fp-alert-error">{error}</div>}
        <form className="fp-form" onSubmit={handleConfirm}>
          <div className="fp-field">
            <label className="fp-field-label" style={{ fontSize: 16 }}>
              {t("auth.confirmCode")}
            </label>
            <input
              className="fp-input"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="fp-btn fp-btn-primary"
            disabled={isSubmitting}
            style={{ justifyContent: "center" }}
          >
            <Icon.Check />
            {t("auth.confirm")}
          </button>
        </form>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>
      {heading(t("auth.register"))}
      {error && <div className="fp-alert fp-alert-error">{error}</div>}
      <form className="fp-form" onSubmit={handleSignUp}>
        <div className="fp-field">
          <label className="fp-field-label" style={{ fontSize: 16 }}>
            {t("auth.displayName")}
          </label>
          <input
            className="fp-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="fp-field">
          <label className="fp-field-label" style={{ fontSize: 16 }}>
            {t("auth.email")}
          </label>
          <input
            className="fp-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="fp-field">
          <label className="fp-field-label" style={{ fontSize: 16 }}>
            {t("auth.password")}
          </label>
          <input
            className="fp-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          className="fp-btn fp-btn-primary"
          disabled={isSubmitting}
          style={{ justifyContent: "center" }}
        >
          <Icon.Check />
          {t("auth.register")}
        </button>
      </form>
      <div style={{ height: 1, background: "var(--hairline)", margin: "20px 0" }} />
      <p
        style={{
          textAlign: "center",
          fontSize: 13,
          color: "var(--muted)",
          margin: 0,
        }}
      >
        {t("auth.hasAccount")}{" "}
        <RouterLink
          to="/login"
          style={{ color: "var(--sage-800)", fontWeight: 600, textDecoration: "none" }}
        >
          {t("auth.login")}
        </RouterLink>
      </p>
    </AuthPageLayout>
  );
}
