import { Suspense } from "react";
import { Route, Routes, Navigate, useRoutes } from "react-router-dom";


import Dashboard from "./components/pages/dashboard";
import Success from "./components/pages/success";
import LoginForm from "./components/auth/LoginForm";
import SignUpForm from "./components/auth/SignUpForm";
import SplashScreen from "./components/pages/SplashScreen";

import { useAuth } from "../supabase/auth";
import { Toaster } from "./components/ui/toaster";
import { LoadingScreen } from "./components/ui/loading-spinner";

// Protected Route
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen text="Loading dashboard..." fullScreen />;
    if (!user) return <Navigate to="/login" replace />;

    return <>{children}</>;
}

// Public Route
function PublicRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen text="Loading..." fullScreen />;
    if (user) return <Navigate to="/dashboard" replace />;

    return <>{children}</>;
}

export default function App() {
    return (
        <Suspense fallback={<LoadingScreen text="Loading application..." />}>
            <Routes>

                {/* Splash FIRST */}
                <Route path="/" element={<SplashScreen />} />

                {/* Auth Routes */}
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

                {/* Protected */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route path="/success" element={<Success />} />

                {/* Dev routes */}
                {import.meta.env.DEV && (
                    <Route path="/tempobook/*" />
                )}
            </Routes>

    

            <Toaster />
        </Suspense>
    );
}