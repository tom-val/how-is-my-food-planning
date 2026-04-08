import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Container, Paper, Typography, CircularProgress, Alert, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { joinFamily } from "../../api/familyApi";

export default function JoinByLinkPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const [attempted, setAttempted] = useState(false);

  const joinMutation = useMutation({
    mutationFn: () => joinFamily(code, user!.displayName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
      navigate("/family");
    },
  });

  useEffect(() => {
    if (code && user && !attempted) {
      setAttempted(true);
      joinMutation.mutate();
    }
  }, [code, user, attempted]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!code) {
    return (
      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            {t("family.invalidLink")}
          </Typography>
          <Button variant="contained" onClick={() => navigate("/family")} sx={{ mt: 2 }}>
            {t("family.goToFamily")}
          </Button>
        </Paper>
      </Container>
    );
  }

  if (joinMutation.isPending) {
    return (
      <Container maxWidth="xs" sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>{t("family.joining")}</Typography>
      </Container>
    );
  }

  if (joinMutation.isError) {
    return (
      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {joinMutation.error.message}
          </Alert>
          <Button variant="contained" fullWidth onClick={() => navigate("/family")}>
            {t("family.goToFamily")}
          </Button>
        </Paper>
      </Container>
    );
  }

  return null;
}
