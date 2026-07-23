import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Spinner } from "./components/sage/Spinner";
import { AppLayout } from "./components/layout/AppLayout";
import { RequireAuth } from "./components/shared/RequireAuth";

const Login = lazy(() => import("./features/auth/Login"));
const Register = lazy(() => import("./features/auth/Register"));
const ForgotPassword = lazy(() => import("./features/auth/ForgotPassword"));
const PlannerPage = lazy(() => import("./features/planner/PlannerPage"));
const RecipeListPage = lazy(() => import("./features/recipes/RecipeListPage"));
const RecipeCreatePage = lazy(() => import("./features/recipes/RecipeCreatePage"));
const ImportRecipesPage = lazy(() => import("./features/recipes/ImportRecipesPage"));
const AiRecipePage = lazy(() => import("./features/recipes/AiRecipePage"));
const RecipeEditPage = lazy(() => import("./features/recipes/RecipeEditPage"));
const RecipeDetailPage = lazy(() => import("./features/recipes/RecipeDetailPage"));
const ShoppingListPage = lazy(
  () => import("./features/shopping/ShoppingListPage"),
);
const FamilyPage = lazy(() => import("./features/family/FamilyPage"));
const JoinByLinkPage = lazy(() => import("./features/family/JoinByLinkPage"));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Spinner />}>{children}</Suspense>;
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
    path: "/forgot-password",
    element: (
      <SuspenseWrapper>
        <ForgotPassword />
      </SuspenseWrapper>
    ),
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/planner" replace /> },
      {
        path: "planner",
        element: (
          <SuspenseWrapper>
            <PlannerPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "recipes",
        element: (
          <SuspenseWrapper>
            <RecipeListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "recipes/new",
        element: (
          <SuspenseWrapper>
            <RecipeCreatePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "recipes/ai",
        element: (
          <SuspenseWrapper>
            <AiRecipePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "recipes/import",
        element: (
          <SuspenseWrapper>
            <ImportRecipesPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "recipes/:id",
        element: (
          <SuspenseWrapper>
            <RecipeDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "recipes/:id/edit",
        element: (
          <SuspenseWrapper>
            <RecipeEditPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "shopping",
        element: (
          <SuspenseWrapper>
            <ShoppingListPage />
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
      {
        path: "join",
        element: (
          <SuspenseWrapper>
            <JoinByLinkPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
]);
