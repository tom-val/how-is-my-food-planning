import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { CircularProgress, Box } from "@mui/material";
import { AppLayout } from "./components/layout/AppLayout";

const Login = lazy(() => import("./features/auth/Login"));
const Register = lazy(() => import("./features/auth/Register"));
const Home = lazy(() => import("./features/planner/PlannerPage"));
const RecipeList = lazy(() => import("./features/recipes/RecipeListPage"));
const ShoppingList = lazy(() => import("./features/shopping/ShoppingListPage"));
const FamilyPage = lazy(() => import("./features/family/FamilyPage"));

function PageSpinner() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="50vh"
    >
      <CircularProgress />
    </Box>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSpinner />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <SuspenseWrapper>
        <Login />
      </SuspenseWrapper>
    ),
  },
  {
    path: "/register",
    element: (
      <SuspenseWrapper>
        <Register />
      </SuspenseWrapper>
    ),
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/planner" replace /> },
      {
        path: "planner",
        element: (
          <SuspenseWrapper>
            <Home />
          </SuspenseWrapper>
        ),
      },
      {
        path: "recipes",
        element: (
          <SuspenseWrapper>
            <RecipeList />
          </SuspenseWrapper>
        ),
      },
      {
        path: "shopping",
        element: (
          <SuspenseWrapper>
            <ShoppingList />
          </SuspenseWrapper>
        ),
      },
      {
        path: "family",
        element: (
          <SuspenseWrapper>
            <FamilyPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
]);
