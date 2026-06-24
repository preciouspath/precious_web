import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/authApi";
import Loader from "../components/common/Loader";
import { toast } from "react-toastify";
import { Download, Share2 } from "lucide-react";
import useAuthStore from "../store/authStore";
import { formatUploadUrl } from "../utils/urlHelper";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user: storeUser, isAuthenticated } = useAuthStore();

  // Use getMe (token-based, no userId needed)
  const { data, isLoading, error } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const user = data?.data || storeUser;

  const handleDownloadQR = () => {
    if (!user?.qrCode) return;
    const link = document.createElement("a");
    link.href = user.qrCode;
    link.download = "my-health-qr-code.png";
    link.click();
    toast.success("QR Code downloaded!");
  };

  const handleShareQR = async () => {
    if (!user?.qrCode) return;

    const blob = await fetch(user.qrCode).then((r) => r.blob());
    const file = new File([blob], "health-qr-code.png", { type: "image/png" });

    const shareData: ShareData = {
      title: "My Health QR Code",
      text: `Scan this QR code to securely upload medical documents to ${user.fullName}'s account: ${user.qrUrl || ""}`,
      files: [file],
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          toast.error("Failed to share");
        }
      }
    } else {
      // Fallback for desktop: copy URL to clipboard
      if (user.qrUrl) {
        try {
          await navigator.clipboard.writeText(user.qrUrl);
          toast.success("QR Link copied to clipboard!");
        } catch {
          toast.info("Sharing not supported. Please download manually.");
        }
      } else {
        toast.info("Sharing not supported. Please download manually.");
      }
    }
  };

  if (isLoading) {
    return (
      <section className="py-10 lg:py-18 bg-[var(--color-slate-50)] min-h-screen flex items-center justify-center">
        <Loader text="Loading profile..." />
      </section>
    );
  }

  if (error || !user) {
    return (
      <section className="py-10 lg:py-18 bg-[var(--color-slate-50)] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="!text-red-500 mb-4">Failed to load profile.</p>
          <button onClick={() => navigate("/login")} className="btn">
            Go to Login
          </button>
        </div>
      </section>
    );
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString();
  };


  return (
    <section className="py-10 lg:py-18 bg-[var(--color-slate-50)] min-h-screen">
      <div className="container">
        <div className="bg-white rounded-[15px]">
          <div className="p-[15px] border-b border-[var(--color-slate-100)]">
            <h1 className="headings-web-h4-headline text-[var(--color-gray-700)]">
              My Profile
            </h1>
          </div>

          <div className="p-[15px] md:p-[20px]">
            <div className="grid grid-cols-1 lg:grid-cols-[285px_1fr] gap-6">
              {/* LEFT COLUMN */}
              <div className="space-y-6">
                <div className="bg-[var(--theme-color-primary-shade-50)] rounded-[10px] p-[15px] text-center">
                  <img
                    src={user.profileImage ? formatUploadUrl(user.profileImage) : "/images/Ellipses.png"}
                    className="w-[90px] h-[90px] rounded-full mx-auto mb-4 object-cover border-2 border-white shadow-sm"
                    alt="Profile"
                  />
                  <h3 className="headings-web-h4-headline text-[var(--black-white-black)] mb-[5px]">
                    {user.fullName || "User"}
                  </h3>
                  <p className="text-body-1 !text-[var(--color-slate-500)] mb-4">
                    {user.email}
                  </p>
                  <button onClick={() => navigate("/edit-profile")} className="btn min-w-[143px]">
                    Edit Profile
                  </button>
                </div>

                <div className="bg-white rounded-[10px] border border-[var(--color-gray-200)] p-5">
                  <h4 className="headings-web-h5-headline text-[var(--color-slate-800)] mb-4">
                    Your Profile QR Code
                  </h4>
                  {user.qrCode ? (
                    <img src={user.qrCode} className="w-[150px] h-[150px] mx-auto mb-4" alt="QR Code" />
                  ) : (
                    <div className="w-[150px] h-[150px] mx-auto mb-4 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                      No QR Code
                    </div>
                  )}
                  <button
                    onClick={handleShareQR}
                    disabled={!user.qrCode}
                    className="w-full btn mb-3 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Share2 size={18} /> Share
                  </button>
                  <button
                    onClick={handleDownloadQR}
                    disabled={!user.qrCode}
                    className="w-full btn btn-black flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Download size={18} /> Download
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-6">
                <InfoCard title="Personal Information">
                  <Info label="Full Name" value={user.fullName || "Not set"} />
                  <Info label="Email Address" value={user.email || "Not set"} />
                  <Info label="Mobile Number" value={user.mobileNumber || "Not set"} />
                  <Info label="Date of Birth" value={formatDate(user.dateOfBirth)} />
                  <Info label="Gender" value={user.gender || "Not set"} />
                </InfoCard>

                <InfoCard title="Health Details">
                  <Info label="Height" value={user.healthProfile?.height || "Not set"} />
                  <Info label="Weight" value={user.healthProfile?.weight || "Not set"} />
                  <Info label="Blood Pressure" value={user.healthProfile?.bloodPressure || "Not set"} />
                  <Info label="Blood Type" value={user.healthProfile?.bloodGroup || "Not set"} />
                  <Info
                    label="Chronic Conditions"
                    value={
                      user.healthProfile?.healthConditions?.trim()
                        ? user.healthProfile.healthConditions
                        : "None"
                    }
                  />
                </InfoCard>

                {user.healthProfile?.emergencyContact?.name && (
                  <InfoCard title="Emergency Contact">
                    <Info label="Contact Name" value={user.healthProfile.emergencyContact.name} />
                    <Info
                      label="Contact Number"
                      value={
                        user.healthProfile.emergencyContact.countryCode && user.healthProfile.emergencyContact.phone
                          ? `${user.healthProfile.emergencyContact.countryCode} ${user.healthProfile.emergencyContact.phone} (${user.healthProfile.emergencyContact.countryName || 'India'})`
                          : user.healthProfile.emergencyContact.phone || "Not set"
                      }
                    />
                    <Info label="Relation" value={user.healthProfile.emergencyContact.relation || "Not set"} />
                  </InfoCard>
                )}

                <div className="flex flex-col gap-[15px]">
                  <h3 className="text-[16px] bold text-[var(--black-white-black)]">Synced Device</h3>
                  <div className="p-[15px] flex flex-col gap-[15px] bg-[#F1F5F9] rounded-[15px] border border-[var(--color-gray-200)]">
                    {user.healthProfile?.smartwatch?.connected ? (
                      <div className="space-y-[15px]">
                        <div className="flex justify-between items-center gap-[15px]">
                          <p className="text-[14px] !text-[var(--color-gray-700)]">Device Name</p>
                          <p className="text-[14px] !text-[var(--color-gray-700)] bold">{user.healthProfile.smartwatch.type || "Smartwatch"}</p>
                        </div>
                        <div className="flex justify-between items-center gap-[15px]">
                          <p className="text-[14px] !text-[var(--color-gray-700)]">Status</p>
                          <span className="inline-block px-3 py-1 text-[12px] rounded-full bg-[var(--color-green-100)] text-[var(--color-green-700)]">Connected</span>
                        </div>
                        <div className="flex justify-between items-center gap-[15px]">
                          <p className="text-[14px] !text-[var(--color-gray-700)]">Last Synced</p>
                          <p className="text-[14px] !text-[var(--color-gray-700)] bold">
                            {user.healthProfile.smartwatch.lastSync ? new Date(user.healthProfile.smartwatch.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500 mb-2">No device connected</p>
                      </div>
                    )}
                    <button onClick={() => navigate("/smartwatch-management")} className="btn">
                      {user.healthProfile?.smartwatch?.connected ? "Manage Device" : "Connect Device"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;

const InfoCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-[15px]">
    <h3 className="text-[16px] bold text-[var(--black-white-black)]">{title}</h3>
    <div className="bg-white rounded-[10px] border border-[var(--color-gray-200)] p-[15px] grid grid-cols-1 gap-[15px]">
      {children}
    </div>
  </div>
);

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center gap-[5px] justify-between">
    <p className="text-[14px] !text-[var(--color-slate-500)]">{label}</p>
    <p className="text-[14px] medium !text-[var(--color-neutral-950)]">{value}</p>
  </div>
);
