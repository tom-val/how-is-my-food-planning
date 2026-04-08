import { Container, Box, Typography, Avatar, alpha } from "@mui/material";
import { Restaurant } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../../components/shared/LanguageSwitcher";

export function AuthPageLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <LanguageSwitcher />
      </Box>

      <Container
        maxWidth="xs"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Avatar
            sx={{
              mx: "auto",
              mb: 1.5,
              width: 56,
              height: 56,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
              color: "primary.main",
            }}
          >
            <Restaurant fontSize="large" />
          </Avatar>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            {t("app.title")}
          </Typography>
        </Box>
        {children}
      </Container>
    </Box>
  );
}
