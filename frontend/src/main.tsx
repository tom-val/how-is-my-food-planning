import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { QueryProvider } from "./providers/QueryProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import theme from "./theme";
import "./i18n";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <SnackbarProvider
          maxSnack={3}
          autoHideDuration={3000}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <QueryProvider>
            <AuthProvider>
              <RouterProvider router={router} />
            </AuthProvider>
          </QueryProvider>
        </SnackbarProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
);
