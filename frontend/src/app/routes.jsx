import { Navigate, createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import ReportPage from "../pages/ReportPage";
import VisitDetail from "../pages/VisitDetail";
import { hasToken } from "../services/auth";

function RequireAuth() {
  if (!hasToken()) {
    return <Navigate to="/login" replace />;
  }
  return <MainLayout />;
}

function PublicOnly() {
  if (hasToken()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Login />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: hasToken() ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
  },
  {
    path: "/login",
    element: <PublicOnly />
  },
  {
    path: "/",
    element: <RequireAuth />,
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "visits/:visitId", element: <VisitDetail /> },
      { path: "visits/:visitId/report", element: <ReportPage /> }
    ]
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);
