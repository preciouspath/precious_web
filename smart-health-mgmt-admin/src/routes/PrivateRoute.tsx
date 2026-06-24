// import { Navigate, Outlet } from "react-router-dom";
// import { useUserStore } from "../store/userStore";

// const PrivateRoute = () => {
//   const isAuthenticated = useUserStore((state) => state.isAuthenticated);

//   console.log(isAuthenticated, "isAuthenticated");

//   return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
// };

// export default PrivateRoute;


import { Navigate, Outlet } from "react-router-dom";
import { useUserStore } from "../store/userStore";

export default function PrivateRoute() {
  const { isAuthenticated } = useUserStore();

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
