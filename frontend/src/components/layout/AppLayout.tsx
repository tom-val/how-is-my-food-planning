import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  IconButton,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  alpha,
} from "@mui/material";
import {
  CalendarMonth,
  MenuBook,
  ShoppingCart,
  People,
  Logout,
  Restaurant,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { LanguageSwitcher } from "../shared/LanguageSwitcher";

const DRAWER_WIDTH = 260;

const navItems = [
  { path: "/planner", labelKey: "nav.planner", icon: <CalendarMonth /> },
  { path: "/recipes", labelKey: "nav.recipes", icon: <MenuBook /> },
  { path: "/shopping", labelKey: "nav.shopping", icon: <ShoppingCart /> },
  { path: "/family", labelKey: "nav.family", icon: <People /> },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AppLayout() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const currentNavIndex = navItems.findIndex((item) =>
    location.pathname.startsWith(item.path),
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
      >
        <Toolbar>
          {isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexGrow: 1 }}>
              <Restaurant />
              <Typography variant="h6" noWrap fontWeight={700}>
                {t("app.title")}
              </Typography>
            </Box>
          )}
          {!isMobile && <Box sx={{ flexGrow: 1 }} />}

          {user && (
            <Chip
              avatar={
                <Avatar sx={{ bgcolor: "primary.dark", width: 28, height: 28, fontSize: "0.75rem" }}>
                  {getInitials(user.displayName)}
                </Avatar>
              }
              label={user.displayName}
              variant="outlined"
              size="small"
              sx={{
                mr: 1,
                color: "inherit",
                borderColor: (t) => alpha(t.palette.common.white, 0.3),
                "& .MuiChip-avatar": { color: "white" },
              }}
            />
          )}
          <LanguageSwitcher />
          <IconButton color="inherit" onClick={signOut} title={t("auth.signOut")} size="small">
            <Logout fontSize="small" />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Toolbar />

      <Box sx={{ display: "flex", flexGrow: 1 }}>
        {!isMobile && (
          <Drawer
            variant="permanent"
            sx={{
              width: DRAWER_WIDTH,
              flexShrink: 0,
              "& .MuiDrawer-paper": {
                width: DRAWER_WIDTH,
                boxSizing: "border-box",
              },
            }}
          >
            <Toolbar />
            <Box sx={{ px: 2, pt: 2, pb: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                }}
              >
                <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
                  <Restaurant fontSize="small" />
                </Avatar>
                <Typography variant="h6" fontWeight={700} color="primary.dark">
                  {t("app.title")}
                </Typography>
              </Box>
            </Box>
            <List sx={{ px: 1, pt: 1 }}>
              {navItems.map((item) => (
                <ListItemButton
                  key={item.path}
                  selected={location.pathname.startsWith(item.path)}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={t(item.labelKey)}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Drawer>
        )}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3 },
            pb: isMobile ? 10 : 3,
            maxWidth: 900,
            mx: "auto",
            width: "100%",
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {isMobile && (
        <BottomNavigation
          value={currentNavIndex}
          onChange={(_, newValue) => navigate(navItems[newValue].path)}
          showLabels
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
          }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={t(item.labelKey)}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
}
