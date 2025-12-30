import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toast';
import { useAuthStore } from '@/stores/auth.store';

// Layouts
import AppLayout from '@/components/layout/AppLayout';
import AuthLayout from '@/components/layout/AuthLayout';

// Pages
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import NotFound from '@/pages/NotFound';

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

// Public Route (redirect if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}

function App() {
    return (
        <>
            <Routes>
                {/* Public Routes */}
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <AuthLayout>
                                <Login />
                            </AuthLayout>
                        </PublicRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <PublicRoute>
                            <AuthLayout>
                                <Register />
                            </AuthLayout>
                        </PublicRoute>
                    }
                />

                {/* Protected Routes */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    {/* More routes will be added here */}
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
            </Routes>

            <Toaster />
        </>
    );
}

export default App;
