import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicRoute from './components/PublicRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Layout from './components/Layout';
import DashboardLayout from './components/DashboardLayout';
import ForgotPassword from './pages/ForgotPassword';
import OTP from './pages/OTP';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Doctor from './pages/Doctor';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import FAQ from './pages/FAQ';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';


import './App.css';

import ChangePassword from './pages/ChangePassword';
import Subscription from './pages/Subscription';
import NotificationSettings from './pages/NotificationSettings';
import HelpSupport from './pages/HelpSupport';
import Insurance from './pages/Insurance';
import NotificationList from './pages/NotificationList';





import Setting from './pages/Setting';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import ReportsPage from './pages/Reports/ReportsPage';
import SmartwatchManagement from './pages/SmartwatchManagement';
import ProfileSetup from './pages/ProfileSetup';
import FitbitCallback from './pages/FitbitCallback';
import DoctorUpload from './pages/DoctorUpload';
import TermsAndConditionsApp from './pages/TermsAndConditionsApp';
import PrivacyPolicyApp from './pages/PrivacyPolicyApp';
import AboutUsApp from './pages/AboutUsApp';

import ScrollToTop from './components/common/ScrollToTop';
import PortalAccess from './pages/PortalAccess';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public/Auth Routes */}
        <Route path="/termsconditions" element={<TermsAndConditionsApp />} />
        <Route path="/privacypolicy-app" element={<PrivacyPolicyApp />} />
        <Route path="/aboutus-app" element={<AboutUsApp />} />

        <Route element={<Layout />}>
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />

          <Route path="/otp" element={<OTP />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/oauthredirect" element={<FitbitCallback />} />

          {/* Public Routes restricted for authenticated users */}
          <Route element={<PublicRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<PortalAccess />} />
            <Route path="/login/patient" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
        </Route>

        {/* Public Doctor Upload Route (no layout) */}
        <Route path="/upload/:patientId" element={<DoctorUpload />} />

        {/* Dashboard/Post-Login Routes */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/doctor" element={<Doctor />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/smartwatch-management" element={<SmartwatchManagement />} />
          <Route path="/settings" element={<Setting />} />
          {/* Add placeholders for these routes as needed */}
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/insurance" element={<Insurance />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/notifications" element={<NotificationSettings />} />
          <Route path="/notification-list" element={<NotificationList />} />
          <Route path="/help-support" element={<HelpSupport />} />

          {/* Footer pages - Show dashboard header when logged in */}
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
        </Route>

        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
