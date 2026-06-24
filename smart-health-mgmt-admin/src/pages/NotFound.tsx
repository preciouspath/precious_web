import { useNavigate } from "react-router-dom";
import { ArrowLeftCircle } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
      <h1 className="text-9xl font-extrabold text-purple-700">404</h1>
      <h2 className="text-3xl font-semibold mt-4 text-gray-700">Page Not Found</h2>
      <p className="text-gray-500 mt-2 max-w-md">
        The page you are looking for doesn’t exist or has been moved.
      </p>

      <button
        onClick={() => navigate("/dashboard")}
        className="mt-8 flex items-center bg-purple-600 text-white px-5 py-2 rounded-xl hover:bg-purple-700 transition"
      >
        <ArrowLeftCircle className="w-5 h-5 mr-2" />
        Go Back to Dashboard
      </button>
    </div>
  );
}
