import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Loader from './common/Loader';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading, isInitialized, initialize } = useAuthStore();
    const location = useLocation();

    useEffect(() => {
        // Initialize auth state on first render (checks if user has valid session via /me)
        if (!isInitialized) {
            initialize();
        }
    }, [isInitialized, initialize]);

    // Show loader while initializing or checking auth
    if (!isInitialized || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader text="Checking authentication..." />
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Authenticated - render children
    return <>{children}</>;
};

export default ProtectedRoute;
