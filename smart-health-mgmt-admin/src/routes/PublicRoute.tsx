import { Navigate, Outlet } from "react-router-dom";
import { useUserStore } from "../store/userStore";

const PublicRoute = () => {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  return isAuthenticated ? <Navigate to="/dashboard" /> : <Outlet />;
};

export default PublicRoute;
