import { useState } from "react";
import { Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import logo from "../../assets/logo.jpeg";
import { resetPassword } from "../../api/authApi";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState({ password: false, confirm: false });
  const [errors, setErrors] = useState<{ password?: string; confirmPass?: string }>({});

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    toast.error("Invalid reset link");
  }

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast.success("Password successfully reset");
      navigate("/login");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Something went wrong");
    },
  });

  const validateForm = () => {
    const newErrors: { password?: string; confirmPass?: string } = {};

    if (!password.trim()) newErrors.password = "Password is required";
    else if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    else if (password.length > 32)
      newErrors.password = "Password cannot exceed 32 characters";
    else if (!/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/.test(password))
      newErrors.password = "Use letters, numbers & special characters";

    if (!confirmPass.trim()) newErrors.confirmPass = "Confirm password is required";
    else if (password !== confirmPass) newErrors.confirmPass = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    mutation.mutate({ token, password });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md relative">
        {/* Loader Overlay */}
        {mutation.isPending && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl z-20">
            <p className="text-gray-600 font-medium">Updating password...</p>
          </div>
        )}

        <div className={mutation.isPending ? "opacity-50 pointer-events-none" : ""}>
          <div className="text-center mb-8">
            <img src={logo} alt="Precious Path" className="mx-auto object-contain w-24" />
            <h1 className="text-3xl font-extrabold text-gray-800 mt-4 tracking-tight">
              Reset Password
            </h1>
            <p className="text-gray-500 text-sm mt-2">Enter your new password below.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* New Password */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Lock size={20} />
              </div>
              <input
                type={showPassword.password ? "text" : "password"}
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))}
                maxLength={32}
                className={`w-full pl-10 pr-10 p-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${errors.password ? "border-red-500 focus:ring-red-400" : "border-gray-200 focus:ring-purple-500"
                  }`}
                disabled={mutation.isPending}
              />
              <button
                type="button"
                className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-500 bg-transparent border-none cursor-pointer"
                onClick={() => setShowPassword((prev) => ({ ...prev, password: !prev.password }))}
              >
                {showPassword.password ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}

            {/* Confirm Password */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Lock size={20} />
              </div>
              <input
                type={showPassword.confirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value.replace(/\s/g, ''))}
                maxLength={32}
                className={`w-full pl-10 pr-10 p-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${errors.confirmPass ? "border-red-500 focus:ring-red-400" : "border-gray-200 focus:ring-purple-500"
                  }`}
                disabled={mutation.isPending}
              />
              <button
                type="button"
                className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-500 bg-transparent border-none cursor-pointer"
                onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
              >
                {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPass && <p className="text-red-500 text-sm mt-1">{errors.confirmPass}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-purple-600 text-white p-3 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-60"
            >
              {mutation.isPending ? "Updating..." : "Reset Password"}
            </button>

            {/* Back */}
            <div
              className="flex items-center justify-center text-purple-600 hover:underline cursor-pointer"
              onClick={() => navigate("/login")}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
