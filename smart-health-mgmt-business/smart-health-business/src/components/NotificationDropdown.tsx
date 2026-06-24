import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, AlertCircle, Info, Megaphone, Tag } from 'lucide-react';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../api/notificationApi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';

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

const NotificationDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await getNotifications();
            if (res.data.success) {
                setNotifications(res.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
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
            console.error('Error fetching unread count:', error);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        // Poll for new notifications every minute
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            const res = await markAsRead(id);
            if (res.data.success) {
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const res = await markAllAsRead();
            if (res.data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
                toast.success('All marked as read');
            }
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'health_alert': return <AlertCircle className="text-rose-500" size={16} />;
            case 'advertisement': return <Tag className="text-amber-500" size={16} />;
            case 'system': return <Info className="text-blue-500" size={16} />;
            case 'ad_approval': return <Check className="text-emerald-500" size={16} />;
            default: return <Megaphone className="text-[#9146C1]" size={16} />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 text-slate-400 hover:text-[#9146C1] hover:bg-purple-50 rounded-xl transition-all relative border-none bg-transparent cursor-pointer"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 min-w-[16px] h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl shadow-purple-900/10 border border-slate-100 z-50 overflow-hidden animate-slide-in">
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="font-['AeonikBold'] text-slate-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-[#9146C1] font-['AeonikBold'] hover:underline border-none bg-transparent cursor-pointer"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {loading && notifications?.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
                        ) : notifications?.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                    <Bell className="text-slate-200" size={24} />
                                </div>
                                <p className="text-slate-400 text-sm font-['AeonikMedium']">No notifications yet</p>
                                <button
                                    onClick={() => { navigate('/notifications/settings'); setIsOpen(false); }}
                                    className="mt-4 text-xs text-[#9146C1] font-['AeonikBold'] flex items-center gap-1 mx-auto hover:underline border-none bg-transparent cursor-pointer"
                                >
                                    <Settings size={14} /> Configure Alerts
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {notifications?.map((notif: any) => (
                                    <div
                                        key={notif._id}
                                        onClick={() => !notif.read && handleMarkAsRead(notif._id)}
                                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative ${!notif.read ? 'bg-purple-50/30' : ''}`}
                                    >
                                        {!notif.read && (
                                            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#9146C1] rounded-full"></div>
                                        )}
                                        <div className="flex gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${notif.type === 'ad_approval' ? 'bg-emerald-50' :
                                                notif.type === 'advertisement' ? 'bg-amber-50' :
                                                    notif.type === 'health_alert' ? 'bg-rose-50' : 'bg-purple-50'
                                                }`}>
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${!notif.read ? 'font-["AeonikBold"] text-slate-900' : 'font-["AeonikMedium"] text-slate-600'}`}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-2 font-['AeonikMedium'] uppercase tracking-wider">
                                                    {timeAgo(notif.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between px-4">
                        <button
                            onClick={() => { navigate('/notifications/settings'); setIsOpen(false); }}
                            className="text-xs text-slate-400 hover:text-[#9146C1] font-['AeonikBold'] border-none bg-transparent cursor-pointer flex items-center gap-1"
                        >
                            <Settings size={14} /> Settings
                        </button>
                        <button
                            onClick={() => { navigate('/notifications'); setIsOpen(false); }}
                            className="text-xs text-slate-600 hover:text-[#9146C1] font-['AeonikBold'] border-none bg-transparent cursor-pointer"
                        >
                            View All
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
