import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Routes
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";

// Pages
import Login from "./pages/Auth/Login";
import Profile from "./pages/Auth/Profile";
import Dashboard from "./pages/Dashboard/Dashboard";

import PatientList from "./pages/Patients/PatientList";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ProtectedLayout from "./components/Layout/ProtectedLayout";
import BusinessList from "./pages/business/BusinessList";
import BusinessVerification from "./pages/business/BusinessVerification";
import PendingAds from "./pages/ads/PendingAds";
import ActiveAdsMonitoring from "./pages/ads/ActiveAdsMonitoring";
import AdHistory from "./pages/ads/AdHistory";
import Subscriptions from "./pages/Subscriptions/Subscriptions";
import Coupons from "./pages/Coupons/Coupons";
import QrOcrMonitoring from "./pages/qr/QrOcrMonitoring";
import { ToastContainer } from "react-toastify";
import ResetPassword from "./pages/Auth/ResetPassword";
import ViewBusiness from "./pages/business/ViewBusiness";
import PatientProfile from "./pages/Patients/PatientProfile";
import SupportList from "./pages/Support/SupportList";
import SupportDetails from "./pages/Support/SupportDetails";
import FAQManagement from "./pages/Support/FAQManagement";
import ContactSupport from "./pages/Support/ContactSupport";
import ContactInquiries from "./pages/Support/ContactInquiries";
import Notifications from "./pages/Notifications/Notifications";
import SystemSettings from "./pages/Settings/SystemSettings";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ---------- Public Routes ---------- */}
          <Route element={<PublicRoute />}>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* ---------- Private Routes ---------- */}
          <Route element={<PrivateRoute />}>
            <Route element={<ProtectedLayout />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/patients" element={<PatientList />} />
              <Route path="/patient/:id" element={<PatientProfile />} />
              <Route path="/business" element={<BusinessList />} />
              <Route path="/business/verification" element={<BusinessVerification />} />
              <Route path="/business/:id" element={<ViewBusiness />} />

              {/* Ads */}
              <Route path="/ads/pending" element={<PendingAds />} />
              <Route path="/ads/active" element={<ActiveAdsMonitoring />} />
              <Route path="/ads/history" element={<AdHistory />} />

              {/* Subscriptions */}
              <Route path="/subscriptions" element={<Subscriptions />} />

              {/* Coupons */}
              <Route path="/coupons" element={<Coupons />} />

              {/* QR / OCR */}
              <Route path="/qr-ocr" element={<QrOcrMonitoring />} />

              {/* Support */}
              <Route path="/support" element={<SupportList />} />
              <Route path="/support/:id" element={<SupportDetails />} />
              <Route path="/support/faq" element={<FAQManagement />} />
              <Route path="/support/contact" element={<ContactSupport />} />
              <Route path="/support/inquiries" element={<ContactInquiries />} />

              {/* Notifications */}
              <Route path="/notifications" element={<Notifications />} />

              {/* Settings */}
              <Route path="/settings/system" element={<SystemSettings />} />

              <Route path="/ads/:id" element={<div>Ad details (TBD)</div>} />
            </Route>
          </Route>

          {/* ---------- 404 Fallback ---------- */}
          <Route path="*" element={<NotFound />} />

        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
