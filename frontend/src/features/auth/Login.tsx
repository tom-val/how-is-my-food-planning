import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  Divider,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { AuthPageLayout } from "./AuthPageLayout";

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
      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h5" align="center" gutterBottom fontWeight={600}>
            {t("auth.login")}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit}>
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
            <TextField
              fullWidth
              label={t("auth.password")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{ mt: 2 }}
            >
              {t("auth.login")}
            </Button>
          </Box>
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Link component={RouterLink} to="/forgot-password" variant="body2">
              {t("auth.forgotPassword")}
            </Link>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography align="center" variant="body2" color="text.secondary">
            {t("auth.noAccount")}{" "}
            <Link component={RouterLink} to="/register" fontWeight={600}>
              {t("auth.register")}
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </AuthPageLayout>
  );
}
