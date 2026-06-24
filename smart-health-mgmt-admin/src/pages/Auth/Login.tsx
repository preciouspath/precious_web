// import { useState } from "react";
// import { Lock, Mail } from "lucide-react";
// import { useMutation } from "@tanstack/react-query";
// import { login as loginApi } from "../../api/authApi";
// import { useUserStore } from "../../store/userStore";
// import logo from "../../assets/image.png";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";

// export default function Login() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const setUser = useUserStore((state) => state.setUser);
//   const navigate = useNavigate()

//   const mutation = useMutation({
//     mutationFn: loginApi,
//     onSuccess: (data) => {
//       toast.success("successfully login", { toastId: "unique" })
//       setUser(data.user, data.token);
//       navigate("/dashboard");
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.message, { toastId: "unique-error" })

//     },
//   });

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     mutation.mutate({ email, password });
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100 relative overflow-hidden">
//       {/* Background circles */}
//       <div className="absolute w-72 h-72 bg-purple-300 rounded-full blur-3xl opacity-20 top-10 left-10" />
//       <div className="absolute w-80 h-80 bg-pink-300 rounded-full blur-3xl opacity-20 bottom-10 right-10" />

//       {/* Login card */}
//       <div className="relative bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl p-10 w-full max-w-md border border-white/50 transition-transform hover:scale-[1.01]">
//         <div className="text-center mb-8">
//           <img src={logo} alt="Precious Path" className="mx-auto w-32 h-32 object-contain" />
//           <h1 className="text-3xl font-extrabold text-gray-800 mt-4 tracking-tight">
//             Admin Login
//           </h1>
//           <p className="text-gray-500 text-sm mt-1">Welcome back! Please sign in.</p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div className="relative">
//             <Mail className="absolute top-3.5 left-3 text-gray-400" />
//             <input
//               type="email"
//               placeholder="Email Address"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-gray-400"
//               required
//             />
//           </div>

//           <div className="relative">
//             <Lock className="absolute top-3.5 left-3 text-gray-400" />
//             <input
//               type="password"
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-gray-400"
//               required
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={mutation.isLoading}
//             className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-60"
//           >
//             {mutation.isLoading ? "Signing In..." : "Sign In"}
//           </button>

//           <div className="text-center mt-4">
//             <a
//               href="/forgot-password"
//               className="text-sm text-purple-600 font-medium hover:underline"
//             >
//               Forgot your password?
//             </a>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }



import { useState } from "react";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { login as loginApi } from "../../api/authApi";
import { useUserStore } from "../../store/userStore";
import logo from "../../assets/logo.jpeg";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const setUser = useUserStore((state) => state.setUser);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      toast.success("Successfully logged in", { toastId: "login-success" });
      setUser(data.users, data.token);
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Login failed",
        { toastId: "login-error" }
      );
    },
  });

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)) newErrors.email = "Invalid email address";
    else if (email.length > 50) newErrors.email = "Email cannot exceed 50 characters";

    if (!password.trim()) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    else if (password.length > 32)
      newErrors.password = "Password cannot exceed 32 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    mutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute w-72 h-72 bg-purple-300 rounded-full blur-3xl opacity-20 top-10 left-10" />
      <div className="absolute w-80 h-80 bg-pink-300 rounded-full blur-3xl opacity-20 bottom-10 right-10" />

      {/* Login Card */}
      <div className="relative bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl p-10 w-full max-w-md border border-white/50">

        {/* 🔄 Card Loader */}
        {mutation.isPending && (
          <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-sm rounded-3xl">
            <Loader text="Signing you in..." minHeight="100%" />
          </div>
        )}

        <div className={mutation.isPending ? "opacity-40 pointer-events-none" : ""}>
          <div className="text-center mb-8">
            <img src={logo} alt="Precious Path" className="mx-auto object-contain" />
            <h1 className="text-3xl font-extrabold text-gray-800 mt-4">
              Admin Login
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Welcome back! Please sign in.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Email */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Mail size={20} />
              </div>
              <input
                type="email"
                value={email}
                disabled={mutation.isPending}
                onChange={(e) => setEmail(e.target.value.trim())}
                maxLength={50}
                className={`w-full pl-10 p-3 border rounded-xl focus:ring-2 transition-all ${errors.email
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-200 focus:ring-purple-500"
                  }`}
                placeholder="Enter Email Address"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}

            {/* Password */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                disabled={mutation.isPending}
                onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))}
                maxLength={32}
                className={`w-full pl-10 pr-10 p-3 border rounded-xl focus:ring-2 transition-all ${errors.password
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-200 focus:ring-purple-500"
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-500 bg-transparent border-none cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
            >
              Sign In
            </button>

            <div className="text-center">
              <a
                href="/forgot-password"
                className="text-sm text-purple-600 font-medium hover:underline"
              >
                Forgot your password?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

