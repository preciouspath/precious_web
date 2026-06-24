"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Bell,
  Star,
  LogOut,
  ChevronDown,
  Layers,
  LifeBuoy,
  Ticket,
  QrCode
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import logo from "../../assets/logo.jpeg";
import icon from "../../assets/icon.png";
import { useUserStore } from "../../store/userStore";
import { motion, AnimatePresence } from "framer-motion";


export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [openAds, setOpenAds] = useState(false);
  const { logout } = useUserStore();
  const { pathname } = useLocation();

  const menuGroups = [
    {
      label: "Platform",
      items: [
        { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { name: "Patients", icon: Users, path: "/patients" },
        { name: "Business Owners", icon: Briefcase, path: "/business" },
      ]
    },
    {
      label: "Growth & Tools",
      items: [
        {
          name: "Ad Campaigns",
          icon: Star,
          subItems: [
            { name: "Active Ads", path: "/ads/active" },
            { name: "Pending Ads", path: "/ads/pending" },
            { name: "Ad History", path: "/ads/history" },
          ],
        },
        // { name: "Revenue", icon: DollarSign, path: "/finance" },
        { name: "Coupons", icon: Ticket, path: "/coupons" },
        { name: "QR & OCR", icon: QrCode, path: "/qr-ocr" },
      ]
    },
    {
      label: "System",
      items: [
        { name: "Plans", icon: Layers, path: "/subscriptions" },
        { name: "Notification Center", icon: Bell, path: "/notifications" },
        { name: "System Settings", icon: Layers, path: "/settings/system" },
        {
          name: "Help & Support",
          icon: LifeBuoy,
          subItems: [
            { name: "Ticket Management", path: "/support" },
            { name: "FAQ Management", path: "/support/faq" },
            { name: "Public Inquiries", path: "/support/inquiries" },
            { name: "Support Center", path: "/support/contact" },
          ]
        },
      ]
    }
  ];

  return (
    <>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=aeonik@400,500,700&display=swap');
        .font-aeonik { font-family: 'Aeonik', sans-serif; }
        .sidebar-scroll::-webkit-scrollbar { width: 0px; }
      `}</style>

      {/* BACKGROUND DECORATION FOR THE WHOLE APP */}
      {/* Add this div in your main layout.tsx or App.tsx wrapper */}
      <div className="fixed inset-0 -z-10 bg-[#FBFBFE]">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-purple-100/40 blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] rounded-full bg-blue-100/30 blur-[100px]" />
      </div>

      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 280 : 90 }}
        className="bg-white/80 backdrop-blur-xl flex flex-col h-screen gap-1 sticky top-0 border-r border-gray-200/50 font-aeonik shadow-[10px_0_40px_rgba(0,0,0,0.03)]"
      >
        {/* Toggle Button */}
        <div className="flex justify-center items-center ">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-1 top-12 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm z-50 text-gray-400 hover:text-[#734A97]"
          >
            <ChevronDown size={14} className={isOpen ? "rotate-90" : "-rotate-90"} />
          </button>

          {/* Logo Section */}
          <div className="h-28 flex items-center justify-center px-6 ">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.img
                  key="logo"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  src={logo}
                  alt="Logo"
                  className=" h-19"
                />
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-28 h-12 rounded-2xl  flex items-center justify-center"
                >
                  <motion.img
                    key="icon"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    src={icon}
                    alt="icon"
                    className="h-10"
                  />
                  {/* <Layers size={22} className="text-white" /> */}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto sidebar-scroll px-4 pb-6">
          {menuGroups.map((group, gIdx) => (
            <div key={group.label} className={`${gIdx !== 0 ? "mt-10" : "mt-2"}`}>
              {isOpen && (
                <p className="px-5 mb-4 text-[10px] font-bold text-gray-400 uppercase tracking-[2px] opacity-70">
                  {group.label}
                </p>
              )}

              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isSubActive = item.subItems && item.subItems.some(sub => pathname.startsWith(sub.path));
                  const active = pathname === item.path || isSubActive;

                  return (
                    <div key={item.name}>
                      <Link
                        to={item.subItems ? "#" : item.path}
                        onClick={(e) => {
                          if (item.subItems) {
                            e.preventDefault();
                            setOpenAds(!openAds);
                          }
                        }}
                        className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all relative group ${active
                          ? "bg-white shadow-[0_10px_25px_rgba(115,74,151,0.1)] border border-purple-100"
                          : "hover:bg-purple-50/50"
                          }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`p-2 rounded-xl transition-all ${active ? "bg-[#734A97] text-white" : "bg-gray-50 text-gray-400 group-hover:text-[#734A97]"}`}>
                            <Icon size={18} />
                          </div>
                          {isOpen && (
                            <span className={`text-[14px] ${active ? "font-bold text-gray-900" : "font-medium text-gray-500"}`}>
                              {item.name}
                            </span>
                          )}
                        </div>
                        {item.subItems && isOpen && (
                          <ChevronDown size={14} className={`text-gray-400 transition-transform ${openAds ? "rotate-180" : ""}`} />
                        )}
                      </Link>

                      {/* Sub-menu styling */}
                      <AnimatePresence>
                        {item.subItems && openAds && isOpen && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mt-2 ml-10 space-y-1 border-l-2 border-purple-50"
                          >
                            {item.subItems.map(sub => {
                              const isSubActive = pathname === sub.path;
                              return (
                                <Link
                                  key={sub.name}
                                  to={sub.path}
                                  className={`block py-2 px-4 text-xs font-bold transition-all ${isSubActive ? "text-[#734A97]" : "text-gray-400 hover:text-gray-700"}`}
                                >
                                  {sub.name}
                                </Link>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card - Elevated Style */}
        <div className="p-4 mt-auto">
          <div className="bg-[#734A97] from-gray-50 to-white border border-gray-100 rounded-[24px] p-2 shadow-sm">
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-white-500 hover:text-rose-500 hover:bg-rose-50/50 transition-all group"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-rose-100">
                <LogOut size={18} />
              </div>
              {isOpen && <span className="font-bold text-[13px]  text-white">Logout</span>}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}