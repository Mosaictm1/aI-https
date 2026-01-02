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
import Instances from '@/pages/Instances';
import Workflows from '@/pages/Workflows';
import WorkflowDetails from '@/pages/WorkflowDetails';
import Settings from '@/pages/Settings';

import ApiKeys from '@/pages/ApiKeys';
import AIFixer from '@/pages/AIFixer';
import History from '@/pages/History';

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuthStore();

    // Wait for auth state to be loaded from localStorage
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-deep-teal-200">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent-yellow border-t-transparent"></div>
            </div>
        );
    }

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
                    <Route path="instances" element={<Instances />} />
                    <Route path="workflows" element={<Workflows />} />
                    <Route path="workflows/:id" element={<WorkflowDetails />} />

                    <Route path="ai-fixer" element={<AIFixer />} />
                    <Route path="ai-analysis" element={<AIFixer />} />
                    <Route path="history" element={<History />} />

                    <Route path="api-keys" element={<ApiKeys />} />
                    <Route path="settings" element={<Settings />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
            </Routes>

            <Toaster />
        </>
    );
}

export default App;

