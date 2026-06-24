import React, { useState, useEffect } from "react";
import { getNotifications, markAsRead, markAllAsRead } from "../api/notificationApi";
import { toast } from "react-toastify";
import useAuthStore from "../store/authStore";

const NotificationList: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { unreadCount, setUnreadCount, refreshUnreadCount } = useAuthStore();
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalDocs: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    type: "all",
    read: "all", // "all", "true" (read), "false" (unread)
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchNotifications();
    refreshUnreadCount();
  }, [page, filters]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        type: filters.type,
        read: filters.read === "all" ? undefined : filters.read,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };
      const res = await getNotifications(params);
      if (res.data.success) {
        setNotifications(res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllAsRead();
      if (res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      const res = await markAsRead(id);
      if (res.data.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        // Only decrement if the notification was previously unread
        const notif = notifications.find(n => n._id === id);
        if (notif && !notif.read) {
          setUnreadCount(Math.max(0, unreadCount - 1));
        }
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  };

  const grouped = (notifications || []).reduce((acc: any, n) => {
    const date = new Date(n.createdAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let key = "Earlier";
    if (date.toDateString() === today.toDateString()) key = "Today";
    else if (date.toDateString() === yesterday.toDateString()) key = "Yesterday";

    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, { Today: [], Yesterday: [], Earlier: [] });

  return (
    <section className="py-10 bg-[#F8FAFC]">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-[16px] shadow-sm overflow-hidden border border-[#F1F5F9]">
          <div className="px-6 py-5 border-b border-[#F1F5F9] flex flex-col md:flex-row justify-between items-center bg-white gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
              <h1 className="headings-web-h4-headline bold text-[#1E293B]">
                Notifications {unreadCount > 0 && <span className="text-[#9146C1] text-lg ml-1">({unreadCount})</span>}
              </h1>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm font-bold text-[#9146C1] hover:underline md:hidden"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-[#9146C1] bg-white"
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="health_alert">Health Alert</option>
                <option value="doctor_update">Doctor Update</option>
                <option value="system">System</option>
                <option value="advertisement">Promotions</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-[#9146C1] bg-white"
                value={filters.read}
                onChange={(e) => handleFilterChange("read", e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>

              {/* <input
                type="date"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-[#9146C1] bg-white"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                placeholder="Start Date"
              /> */}

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="hidden md:block text-sm font-bold text-[#9146C1] hover:underline ml-2"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="p-6 space-y-8 min-h-[400px]">
            {loading ? (
              <div className="text-center py-20 text-[#64748B]">Loading your notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-[#F3E8FF] rounded-full flex items-center justify-center mx-auto mb-4">
                  <img src={"/images/bell.png"} alt="" className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-[#64748B] font-medium">No notifications found.</p>
              </div>
            ) : (
              <>
                {grouped.Today.length > 0 && (
                  <NotificationSection
                    title="Today"
                    items={grouped.Today}
                    onMarkRead={handleMarkOneRead}
                  />
                )}
                {grouped.Yesterday.length > 0 && (
                  <NotificationSection
                    title="Yesterday"
                    items={grouped.Yesterday}
                    onMarkRead={handleMarkOneRead}
                  />
                )}
                {grouped.Earlier.length > 0 && (
                  <NotificationSection
                    title="Earlier"
                    items={grouped.Earlier}
                    onMarkRead={handleMarkOneRead}
                  />
                )}
              </>
            )}
          </div>

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[#F1F5F9] flex justify-between items-center bg-[#F8FAFC]">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${page === 1
                  ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                  : "text-[#9146C1] bg-white hover:bg-[#F3E8FF] border border-gray-200"
                  }`}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 font-medium">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.totalPages}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${page === pagination.totalPages
                  ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                  : "text-[#9146C1] bg-white hover:bg-[#F3E8FF] border border-gray-200"
                  }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NotificationList;

const NotificationSection = ({
  title,
  items,
  onMarkRead,
}: {
  title: string;
  items: any[];
  onMarkRead: (id: string) => void;
}) => (
  <div>
    <h2 className="text-sm font-bold text-[#64748B]  tracking-wider mb-4 px-2">{title}</h2>
    <div className="space-y-3">
      {items.map((item) => (
        <NotificationCard
          key={item._id}
          {...item}
          onClick={() => !item.read && onMarkRead(item._id)}
        />
      ))}
    </div>
  </div>
);

const NotificationCard = ({
  title,
  message,
  createdAt,
  read,
  onClick
}: {
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className={`flex items-start w-full justify-between gap-4 p-4 rounded-[12px] border transition cursor-pointer
      ${!read
        ? "border-[#E9D5FF] bg-[#FAF5FF] shadow-sm shadow-purple-500/5"
        : "border-[#F1F5F9] bg-white hover:bg-[#F8FAFC]"
      }`}
  >
    <div className="flex items-start gap-4">
      <div className={`w-[42px] h-[42px] flex items-center justify-center rounded-xl shrink-0 ${!read ? 'bg-white shadow-sm' : 'bg-[#F3E8FF]'}`}>
        <img src={"/images/bell.png"} alt="" className="w-5 h-5" />
      </div>
      <div>
        <p className={`text-[15px] ${!read ? 'font-bold text-[#1E293B]' : 'font-medium text-[#475569]'}`}>
          {title}
        </p>
        <p className="text-[14px] text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
          {message}
        </p>
        <p className="text-[11px] font-bold text-[#94A3B8] mt-3 uppercase tracking-tighter">
          {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
    {!read && (
      <div className="w-2.5 h-2.5 bg-[#9146C1] rounded-full mt-2 shrink-0 shadow-lg shadow-purple-500/50"></div>
    )}
  </div>
);
