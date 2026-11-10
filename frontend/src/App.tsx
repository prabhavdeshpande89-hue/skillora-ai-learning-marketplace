
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import MarketplacePage from "./pages/MarketplacePage";
import CategoriesPage from "./pages/CategoriesPage";
import AssistantPage from "./pages/AssistantPage";
import CartPage from "./pages/CartPage";
import DashboardPage from "./pages/DashboardPage";
import AIRecommendationsPage from "./pages/AIRecommendationsPage";
import PaymentTest from "./PaymentTest";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AboutUsPage from "./pages/AboutUsPage";
import ProfilePage from "./pages/ProfilePage";

import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminResourcesPage from "./pages/admin/AdminResourcesPage";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";

import { useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import type { ReactNode } from "react";

function AuthPage({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        Checking your session...
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={user?.role === "admin" ? "/admin/dashboard" : "/marketplace"}
        replace
      />
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/ai-assistant" element={<AssistantPage />} />
          <Route path="/about" element={<AboutUsPage />} />

          {/* User authentication */}
          <Route
            path="/login"
            element={
              <AuthPage>
                <LoginPage />
              </AuthPage>
            }
          />

          <Route
            path="/register"
            element={
              <AuthPage>
                <RegisterPage />
              </AuthPage>
            }
          />

          {/* Admin login */}
          <Route
            path="/admin/login"
            element={
              <AuthPage>
                <AdminLoginPage />
              </AuthPage>
            }
          />

          {/* Admin pages */}
          <Route element={<AdminProtectedRoute />}>
            <Route
              path="/admin/dashboard"
              element={<AdminDashboardPage />}
            />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route
              path="/admin/resources"
              element={<AdminResourcesPage />}
            />
            <Route
              path="/admin/payments"
              element={<AdminPaymentsPage />}
            />
          </Route>

          {/* User pages */}
          <Route element={<ProtectedRoute />}>
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route
              path="/ai-recommendations"
              element={<AIRecommendationsPage />}
            />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* PayPal return pages */}
          <Route
            path="/payment-success"
            element={<PaymentSuccessPage />}
          />
          <Route
            path="/payment-cancel"
            element={<PaymentCancelPage />}
          />

          {/* Development testing */}
          <Route path="/payment-test" element={<PaymentTest />} />

          {/* Unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
