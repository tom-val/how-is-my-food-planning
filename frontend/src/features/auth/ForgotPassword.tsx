import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CognitoUser } from "amazon-cognito-identity-js";
import { getCognitoUserPool } from "../../providers/AuthProvider";
import { AuthPageLayout } from "./AuthPageLayout";
import { Icon } from "../../components/sage/Icon";

type Stage = "requestCode" | "resetPassword" | "done";

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

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [stage, setStage] = useState<Stage>("requestCode");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const pool = getCognitoUserPool();
    if (!pool) {
      setError("Cognito is not configured.");
      setIsSubmitting(false);
      return;
    }

    const cognitoUser = new CognitoUser({ Username: email, Pool: pool });
    cognitoUser.forgotPassword({
      onSuccess: () => {
        setStage("resetPassword");
        setIsSubmitting(false);
      },
      onFailure: (err) => {
        setError(err.message);
        setIsSubmitting(false);
      },
      inputVerificationCode: () => {
        setStage("resetPassword");
        setIsSubmitting(false);
      },
    });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const pool = getCognitoUserPool();
    if (!pool) {
      setError("Cognito is not configured.");
      setIsSubmitting(false);
      return;
    }

    const cognitoUser = new CognitoUser({ Username: email, Pool: pool });
    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => {
        setStage("done");
        setIsSubmitting(false);
      },
      onFailure: (err) => {
        setError(err.message);
        setIsSubmitting(false);
      },
    });
  };

  if (stage === "done") {
    return (
      <AuthPageLayout>
        {heading(t("auth.passwordReset"))}
        <p
          style={{
            textAlign: "center",
            color: "var(--muted)",
            margin: "0 0 18px",
          }}
        >
          {t("auth.passwordResetSuccess")}
        </p>
        <RouterLink
          to="/login"
          className="fp-btn fp-btn-primary"
          style={{ justifyContent: "center", width: "100%" }}
        >
          {t("auth.login")}
        </RouterLink>
      </AuthPageLayout>
    );
  }

  if (stage === "resetPassword") {
    return (
      <AuthPageLayout>
        {heading(t("auth.newPassword"))}
        {error && <div className="fp-alert fp-alert-error">{error}</div>}
        <form className="fp-form" onSubmit={handleResetPassword}>
          <div className="fp-field">
            <label className="fp-field-label" style={{ fontSize: 16 }}>
              {t("auth.confirmCode")}
            </label>
            <input
              className="fp-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="fp-field">
            <label className="fp-field-label" style={{ fontSize: 16 }}>
              {t("auth.newPassword")}
            </label>
            <input
              className="fp-input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
            {t("auth.resetPassword")}
          </button>
        </form>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>
      {heading(t("auth.forgotPassword"))}
      {error && <div className="fp-alert fp-alert-error">{error}</div>}
      <form className="fp-form" onSubmit={handleRequestCode}>
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
        <button
          type="submit"
          className="fp-btn fp-btn-primary"
          disabled={isSubmitting}
          style={{ justifyContent: "center" }}
        >
          {t("auth.sendCode")}
        </button>
      </form>
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <RouterLink
          to="/login"
          style={{
            color: "var(--sage-800)",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          {t("auth.backToLogin")}
        </RouterLink>
      </div>
    </AuthPageLayout>
  );
}
