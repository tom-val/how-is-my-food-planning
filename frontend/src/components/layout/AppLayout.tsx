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
} from "@mui/material";
import {
  CalendarMonth,
  MenuBook,
  ShoppingCart,
  People,
  Logout,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { LanguageSwitcher } from "../shared/LanguageSwitcher";

const DRAWER_WIDTH = 240;

const navItems = [
  { path: "/planner", labelKey: "nav.planner", icon: <CalendarMonth /> },
  { path: "/recipes", labelKey: "nav.recipes", icon: <MenuBook /> },
  { path: "/shopping", labelKey: "nav.shopping", icon: <ShoppingCart /> },
  { path: "/family", labelKey: "nav.family", icon: <People /> },
];

export function AppLayout() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
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
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {t("app.title")}
          </Typography>
          <LanguageSwitcher />
          <IconButton color="inherit" onClick={signOut} title={t("auth.signOut")}>
            <Logout />
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
            <List>
              {navItems.map((item) => (
                <ListItemButton
                  key={item.path}
                  selected={location.pathname.startsWith(item.path)}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={t(item.labelKey)} />
                </ListItemButton>
              ))}
            </List>
          </Drawer>
        )}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 2,
            pb: isMobile ? 10 : 2,
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
            borderTop: 1,
            borderColor: "divider",
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
