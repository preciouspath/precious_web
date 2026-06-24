"use client";

import { Users, Briefcase, Headphones, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  getDashboardTiles,
  getDashboardUserGraph,
} from "../../api/authApi";

export default function Dashboard() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  /* -------------------- API CALLS -------------------- */

  const { data: tiles, isLoading: tilesLoading } = useQuery({
    queryKey: ["dashboard-tiles"],
    queryFn: getDashboardTiles,
  });

  const { data: userGrowthData = [], isLoading: graphLoading } = useQuery({
    queryKey: ["dashboard-graph", currentYear],
    queryFn: () => getDashboardUserGraph(currentYear),
  });

  /* -------------------- TILE CONFIG -------------------- */
  const cards = [
    {
      title: "Patients",
      value: tiles?.totalPatients ?? 0,
      subLabel: "Active",
      subValue: tiles?.activePatients ?? 0,
      icon: Users,
      link: "/patients",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Business Owners",
      value: tiles?.totalBusiness ?? 0,
      subLabel: "Pending KYC",
      subValue: tiles?.pendingBusinessKYC ?? 0,
      icon: Briefcase,
      link: "/business?status=pending",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Support Tickets",
      value: tiles?.openTickets ?? 0,
      icon: Headphones,
      link: "/support",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Ads",
      value: tiles?.totalAds ?? 0,
      icon: Megaphone,
      link: "/ads/active",
      color: "text-pink-600",
      bg: "bg-pink-50",
    },

  ];


  /* -------------------- UI -------------------- */

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-8 font-aeonik">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Welcome back, here’s what’s happening today.
        </p>
      </div>

      {/* -------------------- TILES -------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(card.link)}
            className="bg-white rounded-[32px] p-6 cursor-pointer hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-5">
              <div
                className={`p-3.5 rounded-2xl ${card.bg} ${card.color}`}
              >
                <card.icon size={22} />
              </div>
            </div>

            <p className="text-gray-500 text-sm uppercase mb-1">
              {card.title}
            </p>

            <p className="text-3xl font-black text-gray-900">
              {tilesLoading ? "—" : card.value}
            </p>

            {card.subLabel && (
              <p className="text-sm text-gray-500 mt-1 flex justify-end">
                {card.subLabel}:{" "}
                <span className="font-semibold text-gray-800">
                  {tilesLoading ? "—" : card.subValue}
                </span>
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* -------------------- CHARTS -------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Revenue Chart (Static) */}
        <div className="lg:col-span-2 bg-white rounded-[32px] p-8">
          <h2 className="text-xl font-bold mb-6">Revenue Stream</h2>

          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={[
                { month: "Jan", revenue: 12000 },
                { month: "Feb", revenue: 15000 },
                { month: "Mar", revenue: 18000 },
                { month: "Apr", revenue: 22000 },
                { month: "May", revenue: 25000 },
                { month: "Jun", revenue: 28000 },
              ]}
            >
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#734A97" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#734A97" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                dataKey="revenue"
                stroke="#734A97"
                fill="url(#rev)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Chart (API) */}
        <div className="bg-white rounded-[32px] p-8">
          <h2 className="text-xl font-bold mb-2">
            User Acquisition
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Patients vs Business
          </p>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={userGrowthData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="patients"
                fill="#734A97"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="business"
                fill="#059669"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          {graphLoading && (
            <p className="text-sm text-gray-400 mt-4 text-center">
              Loading graph...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

