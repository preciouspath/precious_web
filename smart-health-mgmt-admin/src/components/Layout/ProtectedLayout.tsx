import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import { useUserStore } from "../../store/userStore";
import { useEffect, useRef } from "react";
import { toast } from "react-toastify";

export default function ProtectedLayout() {
  const { logout } = useUserStore();
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

    const resetTimeout = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        toast.info("Session expired due to inactivity");
        logout();
      }, TIMEOUT_MS);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimeout));

    resetTimeout();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => window.removeEventListener(event, resetTimeout));
    };
  }, [logout]);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
