import React, { useState, useEffect } from "react";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "../api/notificationApi";
import { toast } from "react-toastify";
import { Bell, Check, AlertCircle, Info, Megaphone, Tag } from "lucide-react";

const timeAgo = (date: string | Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
};

const NotificationList: React.FC = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await getNotifications();
            if (res.data.success) {
                setNotifications(res.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const res = await getUnreadCount();
            if (res.data.success) {
                setUnreadCount(res.data.data?.unreadCount || 0);
            }
        } catch (error) {
            console.error("Error fetching unread count:", error);
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
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'health_alert': return <AlertCircle className="text-rose-500" size={20} />;
            case 'advertisement': return <Tag className="text-amber-500" size={20} />;
            case 'system': return <Info className="text-blue-500" size={20} />;
            case 'ad_approval': return <Check className="text-emerald-500" size={20} />;
            default: return <Megaphone className="text-[#9146C1]" size={20} />;
        }
    };

    // Group notifications by date (Today, Yesterday, Earlier)
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
        <div className="max-w-[1200px] mx-auto font-['AeonikRegular']">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="headings-web-h4-headline text-slate-900">Notifications</h1>
                    <p className="body-text-body-2 text-slate-500 mt-1">Stay updated with your business activities</p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="text-sm font-['AeonikBold'] text-[#9146C1] hover:underline bg-transparent border-none cursor-pointer"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="space-y-10">
                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center text-slate-400">
                        Loading your notifications...
                    </div>
                ) : notifications?.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Bell className="text-slate-200" size={40} />
                        </div>
                        <h3 className="headings-web-h6-headline text-slate-900 mb-2">No notifications yet</h3>
                        <p className="text-slate-500">We'll notify you when something important happens.</p>
                    </div>
                ) : (
                    <>
                        {['Today', 'Yesterday', 'Earlier'].map((key) => (
                            grouped[key].length > 0 && (
                                <div key={key}>
                                    <h2 className="text-xs font-['AeonikBold'] text-slate-400 uppercase tracking-widest mb-4 px-2">{key}</h2>
                                    <div className="grid grid-cols-1 gap-4">
                                        {grouped[key].map((item: any) => (
                                            <div
                                                key={item._id}
                                                onClick={() => !item.read && handleMarkOneRead(item._id)}
                                                className={`flex items-start justify-between gap-4 p-5 rounded-2xl border transition-all cursor-pointer group
                                                    ${!item.read
                                                        ? "border-purple-100 bg-purple-50/30 shadow-sm shadow-purple-500/5 hover:bg-purple-50/50"
                                                        : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-12 h-12 flex items-center justify-center rounded-xl shrink-0 transition-transform group-hover:scale-105 ${item.type === 'ad_approval' ? 'bg-emerald-50' :
                                                        item.type === 'advertisement' ? 'bg-amber-50' :
                                                            item.type === 'health_alert' ? 'bg-rose-50' : 'bg-purple-50'
                                                        }`}>
                                                        {getIcon(item.type)}
                                                    </div>
                                                    <div>
                                                        <p className={`text-base ${!item.read ? 'font-["AeonikBold"] text-slate-900' : 'font-["AeonikMedium"] text-slate-600'}`}>
                                                            {item.title}
                                                        </p>
                                                        <p className="text-sm text-slate-500 mt-1 leading-relaxed max-w-2xl">
                                                            {item.message}
                                                        </p>
                                                        <p className="text-[11px] font-['AeonikBold'] text-slate-400 mt-4 uppercase tracking-tighter">
                                                            {timeAgo(item.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                                {!item.read && (
                                                    <div className="w-2.5 h-2.5 bg-[#9146C1] rounded-full mt-2 shrink-0 shadow-lg shadow-purple-500/50"></div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

export default NotificationList;
