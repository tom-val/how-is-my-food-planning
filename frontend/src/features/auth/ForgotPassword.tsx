import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  CognitoUser,
} from "amazon-cognito-identity-js";
import { getCognitoUserPool } from "../../providers/AuthProvider";

type Stage = "requestCode" | "resetPassword" | "done";

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
      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" align="center" gutterBottom>
            {t("auth.passwordReset")}
          </Typography>
          <Typography align="center" sx={{ mb: 2 }}>
            {t("auth.passwordResetSuccess")}
          </Typography>
          <Button
            fullWidth
            variant="contained"
            component={RouterLink}
            to="/login"
          >
            {t("auth.login")}
          </Button>
        </Paper>
      </Container>
    );
  }

  if (stage === "resetPassword") {
    return (
      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" align="center" gutterBottom>
            {t("auth.newPassword")}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleResetPassword}>
            <TextField
              fullWidth
              label={t("auth.confirmCode")}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={t("auth.newPassword")}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="new-password"
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{ mt: 2 }}
            >
              {t("auth.resetPassword")}
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>
          {t("auth.forgotPassword")}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleRequestCode}>
          <TextField
            fullWidth
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            autoComplete="email"
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            sx={{ mt: 2 }}
          >
            {t("auth.sendCode")}
          </Button>
        </Box>
        <Typography align="center" sx={{ mt: 2 }}>
          <Link component={RouterLink} to="/login">
            {t("auth.backToLogin")}
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
}
