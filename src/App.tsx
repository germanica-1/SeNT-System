import { Suspense } from "react";
import { Route, Routes, useRoutes, Navigate } from "react-router-dom";
import routes from "tempo-routes";
import Dashboard from "./components/pages/dashboard";
import Success from "./components/pages/success";
import LoginForm from "./components/auth/LoginForm";
import SignUpForm from "./components/auth/SignUpForm";
import { useAuth } from "../supabase/auth";
import { Toaster } from "./components/ui/toaster";
import { LoadingScreen } from "./components/ui/loading-spinner";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  console.log("ProtectedRoute - user:", !!user, "loading:", loading);

  // Still resolving session
  if (loading) {
    return <LoadingScreen text="Loading dashboard..." fullScreen />;
  }

  // If no user AFTER loading finished → redirect to login
  if (!loading && !user) {
    console.log("No user found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirects to dashboard if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  console.log("PublicRoute - user:", !!user, "loading:", loading);

  if (loading) {
    return <LoadingScreen text="Loading..." fullScreen />;
  }

  if (user) {
    console.log("User found, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Suspense fallback={<LoadingScreen text="Loading application..." />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginForm />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignUpForm />
            </PublicRoute>
          }
        />
        <Route path="/success" element={<Success />} />
        {/* Add tempo routes fallback */}
        {process.env.NODE_ENV === "development" && (
          <Route path="/tempobook/*" />
        )}
      </Routes>
      {/* Tempo routes */}
      {process.env.NODE_ENV === "development" && useRoutes(routes)}
      <Toaster />
    </Suspense>
  );
}

export default App;
