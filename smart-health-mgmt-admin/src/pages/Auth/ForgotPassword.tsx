import { Mail, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";

import logo from "../../assets/logo.jpeg";
import { forgotPassword } from "../../api/authApi";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      toast.success("Email sent successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Something went wrong");
    },
  });

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Please enter a valid email address")
        .max(50, "Email cannot exceed 50 characters")
        .required("Email is required"),
    }),
    onSubmit: (values) => {
      mutation.mutate({ email: values.email });
    },
  });

  // const handleResend = () => {
  //   if (!formik.values.email) {
  //     toast.error("Please enter your email before resending");
  //     return;
  //   }

  //   if (formik.errors.email) {
  //     toast.error(formik.errors.email);
  //     return;
  //   }

  //   mutation.mutate({ email: formik.values.email });
  // };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="Precious Path"
            className="mx-auto object-contain"
          />
          <h1 className="text-3xl font-extrabold text-gray-800 mt-4 tracking-tight">
            Forgot Password
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Enter your registered email.
          </p>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-6" noValidate>
          {/* Email Input */}
          <div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Mail size={20} />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                maxLength={50}
                className={`w-full pl-10 p-3 border rounded-xl focus:outline-none focus:ring-2 ${formik.touched.email && formik.errors.email
                  ? "border-red-500 focus:ring-red-400"
                  : "focus:ring-purple-500"
                  }`}
              />
            </div>

            {formik.touched.email && formik.errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {formik.errors.email}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-purple-600 text-white p-3 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-60"
          >
            {mutation.isPending ? "Sending..." : "Send Reset Link"}
          </button>

          {/* <button
            type="button"
            onClick={handleResend}
            className="w-full border border-purple-600 text-purple-600 p-3 rounded-xl font-semibold hover:bg-purple-100 transition"
          >
            Resend Email
          </button> */}

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
  );
}
