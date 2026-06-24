import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { connectFitbit } from "../api/fitbitApi";
import { toast } from "react-toastify";
import Loader from "../components/common/Loader";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";

const FitbitCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
      setStatus("error");
      setErrorMessage("No authorization code received from Fitbit.");
      return;
    }

    const completeConnection = async () => {
      try {
        // We must pass the same redirect URI used to get the auth URL
        const redirectUri = window.location.origin + "/oauthredirect";
        
        await connectFitbit(code, state || "", redirectUri);
        setStatus("success");
        toast.success("Fitbit connected successfully!");
        
        // Short delay to show success state before redirecting back to profile setup
        setTimeout(() => {
          navigate("/profile-setup?step=2");
        }, 2000);
      } catch (error: any) {
        console.error("Fitbit connection error:", error);
        setStatus("error");
        setErrorMessage(
          error.response?.data?.message || "Failed to complete Fitbit connection."
        );
        toast.error("Fitbit connection failed.");
      }
    };

    completeConnection();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[var(--color-slate-50)] flex items-center justify-center p-6">
      <div className="bg-white rounded-[30px] shadow-sm border border-[var(--color-slate-100)] p-8 md:p-12 max-w-md w-full text-center space-y-6">
        
        {status === "loading" && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto text-purple-600">
              <RefreshCw size={40} className="animate-spin" />
            </div>
            <h1 className="headings-web-h4-headline text-slate-800">
              Completing Connection
            </h1>
            <p className="text-slate-500">
              Please wait while we link your Fitbit account and sync your health data...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
              <CheckCircle2 size={40} />
            </div>
            <h1 className="headings-web-h4-headline text-slate-800">
              Successfully Linked!
            </h1>
            <p className="text-slate-500">
              Your Fitbit account is now connected. Redirecting you back to complete your profile...
            </p>
            <Loader text="Redirecting..." />
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
              <XCircle size={40} />
            </div>
            <h1 className="headings-web-h4-headline text-slate-800">
              Connection Failed
            </h1>
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
              <p className="text-sm text-rose-700 italic">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => navigate("/profile-setup")}
              className="btn btn-primary w-full"
            >
              Back to Profile Setup
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default FitbitCallback;
