import { createTheme, alpha } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2e7d32",
      light: "#4caf50",
      dark: "#1b5e20",
    },
    secondary: {
      main: "#ff6f00",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      fontSize: "1.75rem",
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.35rem",
    },
    h6: {
      fontWeight: 600,
      fontSize: "1.1rem",
    },
    subtitle2: {
      fontWeight: 600,
      textTransform: "uppercase" as const,
      fontSize: "0.7rem",
      letterSpacing: "0.08em",
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 10,
          padding: "8px 20px",
        },
        sizeLarge: {
          padding: "12px 24px",
          fontSize: "1rem",
        },
      },
    },
    MuiCard: {
      defaultProps: {
        variant: "elevation",
        elevation: 0,
      },
      styleOverrides: {
        root: ({ theme: t }) => ({
          border: `1px solid ${t.palette.divider}`,
          transition: "box-shadow 0.2s ease, transform 0.2s ease",
          "&:hover": {
            boxShadow: `0 4px 20px ${alpha(t.palette.common.black, 0.08)}`,
          },
        }),
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: ({ theme: t }) => ({
          border: `1px solid ${t.palette.divider}`,
        }),
        elevation0: {
          border: undefined,
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderBottom: `1px solid ${alpha(t.palette.common.white, 0.12)}`,
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme: t }) => ({
          border: "none",
          borderRight: `1px solid ${t.palette.divider}`,
          backgroundColor: t.palette.background.default,
        }),
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 10,
          marginInline: 8,
          marginBlock: 2,
          "&.Mui-selected": {
            backgroundColor: alpha(t.palette.primary.main, 0.1),
            color: t.palette.primary.main,
            "& .MuiListItemIcon-root": {
              color: t.palette.primary.main,
            },
            "&:hover": {
              backgroundColor: alpha(t.palette.primary.main, 0.15),
            },
          },
        }),
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "medium",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          boxShadow: `0 -2px 10px ${alpha(t.palette.common.black, 0.06)}`,
          borderTop: `1px solid ${t.palette.divider}`,
        }),
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          "&.Mui-selected": {
            color: t.palette.primary.main,
          },
        }),
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

export default theme;
