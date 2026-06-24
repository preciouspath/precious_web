import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMe } from "../api/authApi";
import { updateSmartwatchStatus } from "../api/smartwatchApi";
import {
  getFitbitStatus,
  syncFitbitData,
  disconnectFitbit,
} from "../api/fitbitApi";
import { useAuthStore } from "../store/authStore";
import { toast } from "react-toastify";
import ConfirmationModal from "../components/ConfirmationModal";
import Loader from "../components/common/Loader";
import {
  Watch,
  Smartphone,
  Power,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Info,
  Wifi,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

// ─── Fitbit Status Query ─────────────────────────────────────────────────────

const SmartwatchManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);

  // ── Profile data ───────────────────────────────────────────────────────────
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  const user = profileData?.data;
  const smartwatch = user?.healthProfile?.smartwatch;
  const isFitbitConnected =
    smartwatch?.connected === true && smartwatch?.type === "Fitbit";

  // ── Fitbit live status (refreshes independently) ───────────────────────────
  const { data: fitbitStatusData } = useQuery({
    queryKey: ["fitbitStatus"],
    queryFn: async () => {
      const res = await getFitbitStatus();
      return res.data?.data;
    },
    enabled: isFitbitConnected, // Only query if we think Fitbit is connected
    refetchInterval: 60_000,    // Refresh every 60s to catch token expiry
    staleTime: 30_000,
  });

  const fitbitStatus = fitbitStatusData;

  // ── Mutation: disconnect non-Fitbit devices ────────────────────────────────
  const smartwatchMutation = useMutation({
    mutationFn: updateSmartwatchStatus,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      if (response.data?.data) setUser(response.data.data);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update device status");
    },
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  /** Trigger re-sync from Fitbit (calls backend → Fitbit API → DB) */
  const handleFitbitResync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncFitbitData();
      if (res.data?.success) {
        const data = res.data.data;
        queryClient.invalidateQueries({ queryKey: ["me"] });
        queryClient.invalidateQueries({ queryKey: ["fitbitStatus"] });
        toast.success(
          `Fitbit synced! Heart rate: ${data.heartRate} bpm, Steps: ${data.steps}`,
          { autoClose: 4000 }
        );
      } else {
        toast.info("Sync completed but no new data was returned.");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Fitbit sync failed";
      const requiresReconnect = error?.response?.data?.requiresReconnect;
      if (requiresReconnect) {
        toast.error("Fitbit session expired. Please reconnect via the mobile app.", {
          autoClose: 6000,
        });
        queryClient.invalidateQueries({ queryKey: ["me"] });
        queryClient.invalidateQueries({ queryKey: ["fitbitStatus"] });
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  /** Disconnect Fitbit — clears tokens from DB */
  const handleFitbitDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectFitbit();
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["fitbitStatus"] });
      toast.success("Fitbit disconnected successfully.");
      setShowDisconnectModal(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to disconnect Fitbit");
    } finally {
      setIsDisconnecting(false);
    }
  };

  /** Disconnect non-Fitbit devices (Apple / GoogleFit — managed via mobile app) */
  const handleGenericDisconnect = async () => {
    try {
      await smartwatchMutation.mutateAsync({
        connected: false,
        type: null,
        lastSync: null,
        data: null,
      });
      toast.success("Device disconnected successfully.");
      setShowDisconnectModal(false);
    } catch {
      // error handled in mutation
    }
  };

  const handleDisconnect = () => {
    if (isFitbitConnected) {
      handleFitbitDisconnect();
    } else {
      handleGenericDisconnect();
    }
  };

  /** Pair a device — Fitbit is OAuth-only (mobile-initiated), others are simulated */
  const handlePairDevice = async (brand: "Apple" | "Fitbit" | "GoogleFit") => {
    if (brand === "Fitbit") {
      setShowPairingModal(false);
      toast.info(
        "To connect Fitbit, please open the Smart Health mobile app and tap 'Connect Fitbit'. The connection will appear here automatically.",
        { autoClose: 8000 }
      );
      return;
    }
    // Apple / GoogleFit: simple status flag (data comes from mobile app)
    try {
      await smartwatchMutation.mutateAsync({
        connected: true,
        type: brand,
        lastSync: new Date(),
        data: null,
      });
      toast.success(`Your ${brand} account is now linked! Use the mobile app to sync data.`);
      setShowPairingModal(false);
    } catch {
      // error handled in mutation
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isProfileLoading) {
    return (
      <div className="p-20 flex justify-center">
        <Loader text="Loading device info..." />
      </div>
    );
  }

  const lastSyncDate = fitbitStatus?.lastSync || smartwatch?.lastSync;
  const tokenExpired = fitbitStatus?.tokenExpired;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="py-10 lg:py-18 bg-[var(--color-slate-50)] min-h-screen">
      <div className="container max-w-4xl space-y-6">

        {/* ── Main Card ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-[15px] shadow-sm border border-[var(--color-slate-100)] overflow-hidden">

          {/* Card Header */}
          <div className="p-[20px] md:p-[25px] border-b border-[var(--color-slate-100)] flex justify-between items-center">
            <h1 className="headings-web-h4-headline text-[var(--color-gray-700)]">
              Smartwatch Management
            </h1>
            {smartwatch?.connected && (
              <span className="flex items-center gap-1.5 text-emerald-600 font-['AeonikMedium'] text-sm bg-emerald-50 px-3 py-1 rounded-full">
                <CheckCircle2 size={16} /> Data Sync Active
              </span>
            )}
          </div>

          <div className="p-[20px] md:p-[30px]">
            {smartwatch?.connected ? (
              <div className="space-y-6">

                {/* ── Device Info Panel ─────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-[var(--theme-color-secondary-shade-50)] rounded-[20px]">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                    {isFitbitConnected ? (
                      <img
                        src="/images/fitbit_logo.svg"
                        className="w-10 h-10 object-contain"
                        alt="Fitbit"
                      />
                    ) : (
                      <Watch size={32} className="text-[#9146C1]" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[var(--color-slate-500)] font-['AeonikBold'] mb-1">
                          Device
                        </p>
                        <p className="text-base font-['AeonikMedium'] text-[var(--color-slate-900)]">
                          {smartwatch.type} Watch
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wider text-[var(--color-slate-500)] font-['AeonikBold'] mb-1">
                          Status
                        </p>
                        {tokenExpired ? (
                          <span className="inline-flex items-center gap-1 text-sm text-amber-600 font-['AeonikBold']">
                            <AlertCircle size={14} /> Token Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm text-emerald-700 font-['AeonikBold']">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Connected
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wider text-[var(--color-slate-500)] font-['AeonikBold'] mb-1">
                          Last Synced
                        </p>
                        <p className="text-base font-['AeonikMedium'] text-[var(--color-slate-900)]">
                          {lastSyncDate
                            ? new Date(lastSyncDate).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                            : "Never"}
                        </p>
                      </div>

                      {/* Fitbit-specific: show scopes */}
                      {isFitbitConnected && fitbitStatus?.scope && (
                        <div className="sm:col-span-3">
                          <p className="text-xs uppercase tracking-wider text-[var(--color-slate-500)] font-['AeonikBold'] mb-1">
                            Permissions Granted
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {fitbitStatus.scope.split(" ").map((s: string) => (
                              <span
                                key={s}
                                className="text-xs bg-purple-100 text-purple-700 font-['AeonikMedium'] px-2 py-0.5 rounded-full capitalize"
                              >
                                {s.replace("_", " ")}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Token Expired Warning ─────────────────────────── */}
                {isFitbitConnected && tokenExpired && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-['AeonikBold'] text-amber-800 text-sm">
                        Fitbit Session Expired
                      </p>
                      <p className="text-amber-700 text-sm mt-0.5">
                        Your Fitbit session has expired. Please open the Smart Health mobile app and reconnect your Fitbit account to continue syncing data.
                      </p>
                    </div>
                  </div>
                )}


                {/* ─ Action Buttons ─────────────────────────────────── */}
                <div className="flex flex-wrap gap-3">
                  {isFitbitConnected && (
                    <button
                      id="fitbit-sync-btn"
                      onClick={handleFitbitResync}
                      disabled={isSyncing}
                      className="btn min-w-[160px] flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
                      {isSyncing ? "Syncing..." : "Sync Now"}
                    </button>
                  )}

                  {!isFitbitConnected && (
                    <button
                      onClick={handleFitbitResync}
                      disabled={isSyncing}
                      className="btn min-w-[160px] flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
                      {isSyncing ? "Syncing..." : "Re-sync Now"}
                    </button>
                  )}

                  <button
                    id="fitbit-disconnect-btn"
                    onClick={() => setShowDisconnectModal(true)}
                    className="btn btn-black min-w-[160px] flex items-center justify-center gap-2"
                  >
                    <Power size={18} /> Disconnect Device
                  </button>
                </div>
              </div>
            ) : (
              /* ── No Device Connected ───────────────────────────────── */
              <div className="text-center py-12 space-y-6">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Smartphone size={40} />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h2 className="headings-web-h4-headline text-slate-800">
                    No Device Connected
                  </h2>
                  <p className="text-slate-500">
                    Link your smartwatch to enable real-time health monitoring and automated doctor alerts.
                  </p>
                </div>
                <button
                  id="connect-device-btn"
                  onClick={() => setShowPairingModal(true)}
                  className="btn px-8"
                >
                  Connect New Device
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Info Section ──────────────────────────────────────────────── */}
        <div className="bg-blue-50 border border-blue-100 rounded-[15px] p-5 flex gap-4">
          <Info className="text-blue-500 shrink-0" size={24} />
          <div className="space-y-1">
            <p className="font-['AeonikBold'] text-blue-900 text-sm">
              Why connect a device?
            </p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc pl-4">
              <li>Real-time heart rate and step monitoring</li>
              <li>Automated emergency alerts to your trusted doctors</li>
              <li>Personalized health insights based on your activity</li>
            </ul>
          </div>
        </div>

        {/* ── Fitbit Connection Guide (shown when connected or not) ──────── */}
        {isFitbitConnected && (
          <div className="bg-white rounded-[15px] shadow-sm border border-[var(--color-slate-100)] p-5 space-y-3">
            <p className="font-['AeonikBold'] text-[var(--color-gray-700)] text-sm flex items-center gap-2">
              <Wifi size={16} className="text-[#00B0B9]" /> Fitbit Sync Guide
            </p>
            <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
              <li>Open the <strong>Smart Health mobile app</strong> and tap <em>Sync Fitbit</em> to push the latest wearable data to this dashboard.</li>
              <li>Alternatively, tap <strong>Sync Now</strong> above — the backend will fetch your latest data directly from Fitbit.</li>
              <li>Health data includes: Heart Rate, Steps, Sleep duration, and Blood Oxygen (SpO₂).</li>
              <li>Fitbit access tokens refresh automatically every 8 hours.</li>
            </ul>
          </div>
        )}
      </div>

      {/* ── Pairing Modal ─────────────────────────────────────────────────── */}
      {showPairingModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowPairingModal(false)}
          />
          <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6 md:p-8 space-y-6">
              <div className="text-center">
                <h2 className="headings-web-h4-headline text-slate-900">
                  Choose Your Device
                </h2>
                <p className="text-slate-500 mt-1">
                  Select your smartwatch brand to get started
                </p>
              </div>

              {/* Fitbit — OAuth notice */}
              <div className="bg-[#00B0B9]/10 border border-[#00B0B9]/30 rounded-xl p-4">
                <p className="text-xs text-[#007a80] flex gap-2 items-start">
                  <ExternalLink size={14} className="shrink-0 mt-0.5" />
                  <span>
                    <strong>Fitbit:</strong> OAuth authorization is handled through the Smart Health mobile app. Connect from the app and this dashboard will automatically reflect your Fitbit data.
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <BrandCard
                  id="brand-apple"
                  name="Apple"
                  icon={
                    <img
                      src="https://www.vectorlogo.zone/logos/apple/apple-tile.svg"
                      className="w-8 h-8"
                      alt="Apple"
                    />
                  }
                  badge="Via Mobile App"
                  onClick={() => handlePairDevice("Apple")}
                />
                <BrandCard
                  id="brand-fitbit"
                  name="Fitbit"
                  icon={
                    <img
                      src="/images/fitbit_logo.svg"
                      className="w-8 h-8 object-contain"
                      alt="Fitbit"
                    />
                  }
                  badge="OAuth 2.0"
                  badgeColor="teal"
                  onClick={() => handlePairDevice("Fitbit")}
                />
                <BrandCard
                  id="brand-googlefit"
                  name="Google Fit"
                  icon={
                    <img
                      src="/images/google_fit_icon.svg"
                      className="w-8 h-8 object-contain"
                      alt="Google Fit"
                    />
                  }
                  badge="Via Mobile App"
                  onClick={() => handlePairDevice("GoogleFit")}
                />
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowPairingModal(false)}
                  className="text-slate-500 hover:text-slate-800 font-['AeonikMedium'] text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Disconnect Confirmation ────────────────────────────────────────── */}
      <ConfirmationModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onConfirm={handleDisconnect}
        title="Disconnect Device?"
        icon={<XCircle size={48} className="text-rose-500" />}
        confirmText={isDisconnecting ? "Disconnecting..." : "Yes, Disconnect"}
        cancelText="Keep Connected"
        confirmButtonClass="btn btn-primary"
        cancelButtonClass="btn btn-black"
        description="Are you sure you want to disconnect your smartwatch? Real-time health tracking and automated alerts will be disabled."
      />
    </section>
  );
};

// ─── Sub-Components ──────────────────────────────────────────────────────────



interface BrandCardProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: "default" | "teal";
  onClick: () => void;
}

const BrandCard: React.FC<BrandCardProps> = ({
  id,
  name,
  icon,
  badge,
  badgeColor = "default",
  onClick,
}) => (
  <button
    id={id}
    onClick={onClick}
    className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-slate-200 hover:border-[#9146C1] hover:bg-purple-50 transition-all group relative"
  >
    {badge && (
      <span
        className={`absolute top-2 right-2 text-[10px] font-['AeonikBold'] px-1.5 py-0.5 rounded-full ${badgeColor === "teal"
          ? "bg-teal-100 text-teal-700"
          : "bg-slate-100 text-slate-500"
          }`}
      >
        {badge}
      </span>
    )}
    <div className="w-12 h-12 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all">
      {icon}
    </div>
    <p className="text-sm font-['AeonikBold'] text-slate-700">{name}</p>
  </button>
);

export default SmartwatchManagement;
