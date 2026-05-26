import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { AuthPageLayout } from "./AuthPageLayout";
import { Icon } from "../../components/sage/Icon";

export default function Login() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      navigate("/planner");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageLayout>
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
        {t("auth.login")}
      </h1>
      {error && <div className="fp-alert fp-alert-error">{error}</div>}
      <form className="fp-form" onSubmit={handleSubmit}>
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
            autoFocus
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
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          className="fp-btn fp-btn-primary"
          disabled={isSubmitting}
          style={{ justifyContent: "center" }}
        >
          <Icon.Check />
          {t("auth.login")}
        </button>
      </form>
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <RouterLink
          to="/forgot-password"
          style={{ color: "var(--sage-800)", fontSize: 13, textDecoration: "none" }}
        >
          {t("auth.forgotPassword")}
        </RouterLink>
      </div>
      <div style={{ height: 1, background: "var(--hairline)", margin: "20px 0" }} />
      <p
        style={{
          textAlign: "center",
          fontSize: 13,
          color: "var(--muted)",
          margin: 0,
        }}
      >
        {t("auth.noAccount")}{" "}
        <RouterLink
          to="/register"
          style={{ color: "var(--sage-800)", fontWeight: 600, textDecoration: "none" }}
        >
          {t("auth.register")}
        </RouterLink>
      </p>
    </AuthPageLayout>
  );
}
