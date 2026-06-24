"use client";

import { Bell, User, Settings, ChevronRight } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useUserStore } from "../../store/userStore";


export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUserStore((state) => state.user);
  const VITE_IMAGE_URL = import.meta.env.VITE_IMAGE_URL;

  // Optimized for Breadcrumbs instead of a big Title
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const segments = path.split("/").filter(Boolean);
    return segments;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-6 sticky top-0 z-[40] font-aeonik">

      {/* LEFT: Breadcrumbs & Context */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 text-[13px] font-medium text-gray-400">
          <Link to="/dashboard" className="hover:text-[#734A97] transition-colors">Platform</Link>
          {breadcrumbs.map((seg, i) => (
            <div key={i} className="flex items-center gap-2">
              <ChevronRight size={14} className="opacity-50" />
              <span className={`capitalize ${i === breadcrumbs.length - 1 ? "text-gray-800 font-bold" : "hover:text-[#734A97]"}`}>
                {seg.replace("-", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* MIDDLE: Global Search (Fills the "Dull" space) */}
      {/* <div className="hidden md:flex flex-1 max-w-md mx-8"> */}
      {/* <div className="relative w-full group"> */}
      {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#734A97] transition-colors" size={18} /> */}
      {/* <input
            type="text"
            placeholder="Search patients, ads, or settings..."
            className="w-full bg-gray-50 border-none rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-purple-100 outline-none transition-all placeholder:text-gray-400"
          /> */}
      {/* </div> */}
      {/* </div> */}

      {/* RIGHT: Actions & Profile */}
      <div className="flex items-center gap-3">

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1 pr-4 border-r border-gray-100">
          <button
            onClick={() => navigate("/notifications")}
            className="p-2.5 text-gray-400 hover:text-[#734A97] hover:bg-purple-50 rounded-xl transition-all relative">
            <Bell size={20} />
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="p-2.5 text-gray-400 hover:text-[#734A97] hover:bg-purple-50 rounded-xl transition-all cursor-pointer">
            <Settings size={20} />
          </button>
        </div>

        {/* User Profile */}
        <div
          className="flex items-center gap-3 pl-2 group"
          onClick={() => navigate("/profile")}
        >
          <div className="text-right hidden sm:block">
            <p className="text-[13px] font-bold text-gray-800 group-hover:text-[#734A97] transition-colors leading-none">
              {user?.fullName || "Admin User"}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Super Admin</p>
          </div>

          <div className="relative">
            {user?.profileImage ? (
              <img
                src={`${VITE_IMAGE_URL}${user.profileImage}`}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-gray-50 group-hover:ring-[#734A97] transition-all shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center group-hover:border-[#734A97] transition-all shadow-sm">
                <User className="w-5 h-5 text-gray-400 group-hover:text-[#734A97]" />
              </div>
            )}
            {/* Online Status Dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
        </div>

      </div>
    </div>
  );
}