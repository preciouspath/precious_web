import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import OTP from './pages/OTP';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import PendingAds from './pages/Ads/PendingAds';
import ActiveAds from './pages/Ads/ActiveAds';
import CreateAd from './pages/Ads/CreateCampaign/CampaignWizard';
import AdHistory from './pages/Ads/AdHistory';
import Profile from './pages/Profile';
import HelpSupport from './pages/HelpSupport';
import NotificationPreferences from './pages/NotificationPreferences';
import NotificationList from './pages/NotificationList';
import SecuritySettings from './pages/SecuritySettings';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import useAuthStore from './store/authStore';
import { useEffect } from 'react';

import './App.css';

function App() {
    const { initialize, isInitialized } = useAuthStore();

    useEffect(() => {
        initialize();
    }, [initialize]);

    if (!isInitialized) {
        return null; // Or a global loader
    }

    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/otp" element={<OTP />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Dashboard/Post-Login Routes */}
                <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/ads/pending" element={<PendingAds />} />
                    <Route path="/ads/create" element={<CreateAd />} />
                    <Route path="/ads/active" element={<ActiveAds />} />
                    <Route path="/ads/history" element={<AdHistory />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/notifications" element={<NotificationList />} />
                    <Route path="/notifications/settings" element={<NotificationPreferences />} />
                    <Route path="/security" element={<SecuritySettings />} />
                    <Route path="/help-support" element={<HelpSupport />} />
                </Route>

                {/* Fallback */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
