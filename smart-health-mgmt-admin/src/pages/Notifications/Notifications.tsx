"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, createNotification, getNotificationStats, deleteNotification, updateNotification } from "../../api/notificationApi";
import {
    Bell,
    Send,
    History,
    Calendar,
    Activity,
    Smartphone,
    Megaphone,
    CheckCircle,
    Clock,
    BarChart3,
    Filter,
    Users,
    Trash2,
    Edit2,

} from "lucide-react";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import Pagination from "../../components/common/Pagination";



const typeMap: any = {
    "Health Alert": "HEALTH_ALERT",
    "System Update": "SYSTEM_UPDATE",
    "Advertisement": "PROMOTION"
};

const audienceMap: any = {
    "All Users": "ALL",
    "Patients Only": "PATIENTS",
    "Business Owners Only": "BUSINESS",
    "Filtered Segment": "SEGMENT"
};

const reverseTypeMap: any = {
    "HEALTH_ALERT": "Health Alert",
    "SYSTEM_UPDATE": "System Update",
    "PROMOTION": "Advertisement"
};

const reverseAudienceMap: any = {
    "ALL": "All Users",
    "PATIENTS": "Patients Only",
    "BUSINESS": "Business Owners Only",
    "SEGMENT": "Filtered Segment"
};

export default function Notifications() {
    const [activeTab, setActiveTab] = useState<"create" | "history">("create");
    const [page, setPage] = useState(1);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const queryClient = useQueryClient();
    console.log(deleteId)
    // Fetch Notifications
    const { data: notificationsData, isLoading } = useQuery({
        queryKey: ["notifications", page],
        queryFn: () => getNotifications({ page, limit: 10 }),
        enabled: activeTab === "history"
    });

    // Fetch Stats
    const { data: statsData } = useQuery({
        queryKey: ["notification-stats"],
        queryFn: getNotificationStats,
        refetchInterval: 30000, // Poll every 30 seconds
    });

    const notifications = notificationsData?.data || [];
    const meta = notificationsData?.meta || { totalPages: 1 };
    const stats = statsData?.data || { totalSent: 0, deliveryRate: 0, openRate: 0, scheduledCount: 0 };


    const createMutation = useMutation({
        mutationFn: createNotification,
        onSuccess: () => {
            toast.success("Notification created successfully!");
            formik.resetForm();
            setActiveTab("history");
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to create notification");
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateNotification,
        onSuccess: () => {
            toast.success("Notification updated successfully!");
            formik.resetForm();
            setEditingId(null);
            setActiveTab("history");
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to update notification");
        }
    });



    const deleteMutation = useMutation({
        mutationFn: deleteNotification,
        onSuccess: () => {
            toast.success("Notification deleted");
            setDeleteId(null);
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to delete");
        }
    });

    const formik = useFormik({
        initialValues: {
            title: "",
            message: "",
            type: "Health Alert",
            targetAudience: "All Users",
            scheduledFor: "",
            filters: {
                location: "",
            }
        },
        validationSchema: Yup.object({
            title: Yup.string()
                .trim()
                .required("Title is required")
                .max(50, "Title must be 50 characters or less"),
            message: Yup.string()
                .trim()
                .required("Message is required")
                .max(500, "Message must be 500 characters or less"),
            type: Yup.string().required("Type is required"),
            targetAudience: Yup.string().required("Audience is required"),
            scheduledFor: Yup.date()
                .nullable()
                .min(new Date(), "Schedule time must be in the future")
        }),
        onSubmit: (values) => {
            const payload = {
                ...values,
                type: typeMap[values.type],
                targetAudience: audienceMap[values.targetAudience]
            };

            if (!payload.scheduledFor) {
                (payload as any).scheduledFor = null;
            }

            if (editingId) {
                updateMutation.mutate({ id: editingId, data: payload });
            } else {
                createMutation.mutate(payload);
            }
        }
    });

    const handleEdit = (notification: any) => {
        setEditingId(notification._id);
        const scheduledTime = notification.scheduledFor ? new Date(notification.scheduledFor).toISOString().slice(0, 16) : "";

        formik.setValues({
            title: notification.title,
            message: notification.message,
            type: reverseTypeMap[notification.type] || "Health Alert",
            targetAudience: reverseAudienceMap[notification.targetAudience] || "All Users",
            scheduledFor: scheduledTime,
            filters: notification.filters || { location: "" }
        });
        setActiveTab("create");
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this notification history?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        formik.resetForm();
    };

    return (
        <div className="p-8 font-poppins min-h-screen bg-[#FBFBFE]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Notification Center</h1>
                    <p className="text-gray-500 mt-2">Manage communications, alerts, and system updates.</p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-3">
                    <span className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 text-sm font-medium text-gray-600">
                        <Bell size={16} className="text-[#5B3172]" />
                        System Status: <span className="text-emerald-500 font-bold">Live</span>
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab("create")}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "create" ? "bg-white text-[#5B3172] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <Send size={16} /> {editingId ? "Edit Notification" : "Compose"}
                </button>
                <button
                    onClick={() => setActiveTab("history")}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "history" ? "bg-white text-[#5B3172] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <History size={16} /> History & Analytics
                </button>
            </div>

            {/* Content */}
            {activeTab === "create" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Preview Card */}
                    <div className="lg:col-span-1 order-2 lg:order-2">
                        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sticky top-24">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Smartphone size={18} className="text-gray-400" /> Preview
                                </h3>
                                {editingId && (
                                    <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-bold">Editing Mode</span>
                                )}
                            </div>
                            <div className="bg-gray-100 rounded-[2rem] p-4 min-h-[400px] relative border-4 border-white shadow-inner">
                                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-5 h-5 bg-[#5B3172] rounded-md flex items-center justify-center">
                                            <Bell size={10} className="text-white" />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">Smart Health • Now</span>
                                    </div>
                                    <p className="font-bold text-sm text-gray-900">{formik.values.title || "Notification Title"}</p>
                                    <p className="text-xs text-gray-600 mt-1">{formik.values.message || "Your notification message will appear here."}</p>
                                </div>

                                {/* Placeholder for Lock Screen look */}
                                <div className="absolute bottom-4 left-0 w-full text-center">
                                    <p className="text-[10px] text-gray-400">Preview Mode</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="lg:col-span-2 order-1 lg:order-1">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <form onSubmit={formik.handleSubmit} className="space-y-8">

                                {/* Section 1: Visual Type */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">1. Select Notification Type</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {["Health Alert", "System Update", "Advertisement"].map((t) => (
                                            <div
                                                key={t}
                                                onClick={() => formik.setFieldValue("type", t)}
                                                className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center gap-2 ${formik.values.type === t ? "bg-[#F2EBF5] border-[#5B3172] text-[#5B3172]" : "bg-white border-gray-100 hover:border-gray-200 text-gray-500"}`}
                                            >
                                                <div className={`p-3 rounded-full ${formik.values.type === t ? "bg-white" : "bg-gray-50"}`}>
                                                    {t === "Health Alert" && <Activity size={20} />}
                                                    {t === "System Update" && <Smartphone size={20} />}
                                                    {t === "Advertisement" && <Megaphone size={20} />}
                                                </div>
                                                <span className="font-bold text-sm">{t}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Section 2: Audience */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">2. Target Audience</label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                            <select
                                                name="targetAudience"
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                value={formik.values.targetAudience}
                                                className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 outline-none appearance-none font-medium text-gray-700 ${formik.touched.targetAudience && formik.errors.targetAudience ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-[#5B3172]"}`}
                                            >
                                                <option value="All Users">All Users</option>
                                                <option value="Patients Only">Patients Only</option>
                                                <option value="Business Owners Only">Business Owners Only</option>
                                                <option value="Filtered Segment">Filtered Segment</option>
                                            </select>
                                            {formik.touched.targetAudience && formik.errors.targetAudience && (
                                                <p className="text-xs text-red-500 font-bold mt-1 ml-1">{formik.errors.targetAudience}</p>
                                            )}
                                        </div>
                                    </div>
                                    {formik.values.targetAudience === "Filtered Segment" && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Segment Filter</label>
                                            <div className="relative">
                                                <Filter className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    name="filters.location"
                                                    onChange={formik.handleChange}
                                                    value={formik.values.filters?.location || ""}
                                                    placeholder="e.g. Location (New York)"
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#5B3172] outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section 3: Content */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">3. Content Details</label>
                                    <div className="space-y-4">
                                        <div>
                                            <input
                                                type="text"
                                                name="title"
                                                placeholder="Notification Title (Keep it catchy)"
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                value={formik.values.title}
                                                className={`w-full border rounded-xl p-4 focus:ring-2 outline-none font-medium ${formik.touched.title && formik.errors.title ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-[#5B3172]"}`}
                                            />
                                            {formik.touched.title && formik.errors.title && (
                                                <p className="text-xs text-red-500 font-bold mt-1 ml-1">{formik.errors.title}</p>
                                            )}
                                        </div>
                                        <div>
                                            <textarea
                                                name="message"
                                                placeholder="Message Body..."
                                                rows={4}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                value={formik.values.message}
                                                className={`w-full border rounded-xl p-4 focus:ring-2 outline-none resize-none ${formik.touched.message && formik.errors.message ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-[#5B3172]"}`}
                                            />
                                            {formik.touched.message && formik.errors.message && (
                                                <p className="text-xs text-red-500 font-bold mt-1 ml-1">{formik.errors.message}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Schedule */}
                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Schedule Delivery</label>
                                            <p className="text-xs text-gray-500">Optional. Leave empty to send immediately.</p>
                                        </div>
                                        <input
                                            type="datetime-local"
                                            name="scheduledFor"
                                            min={new Date().toISOString().slice(0, 16)}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            value={formik.values.scheduledFor}
                                            className={`border rounded-xl p-3 bg-white focus:ring-2 outline-none text-sm ${formik.touched.scheduledFor && formik.errors.scheduledFor ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-[#5B3172]"}`}
                                        />
                                    </div>
                                    {formik.touched.scheduledFor && formik.errors.scheduledFor && (
                                        <p className="text-xs text-red-500 font-bold mt-1 text-right">{formik.errors.scheduledFor as string}</p>
                                    )}
                                </div>

                                <div className="flex justify-between pt-4">
                                    {editingId ? (
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="text-gray-500 hover:text-gray-800 font-bold px-4 transition-colors"
                                        >
                                            Cancel Editing
                                        </button>
                                    ) : (
                                        <span></span>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className="bg-[#5B3172] text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-purple-200 hover:opacity-90 transition-all flex items-center gap-2"
                                    >
                                        {(createMutation.isPending || updateMutation.isPending) ? "Processing..." : editingId ? "Update Notification" : "Confirm & Send"} <Send size={18} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-xl text-[#5B3172]"><Send size={24} /></div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">Total Sent</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.totalSent}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><CheckCircle size={24} /></div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">Delivered</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.deliveryRate}%</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><BarChart3 size={24} /></div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">Open Rate</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.openRate}%</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-3 bg-orange-50 rounded-xl text-orange-600"><Clock size={24} /></div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">Scheduled</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.scheduledCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Recent Activity</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#F9FAFB]">
                                    <tr>
                                        <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign Details</th>
                                        <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Audience</th>
                                        <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Timeline</th>
                                        <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {isLoading && <tr><td colSpan={5} className="p-10 text-center text-gray-400">Loading history...</td></tr>}
                                    {!isLoading && notifications.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-gray-400">No notifications found</td></tr>}
                                    {notifications.map((n: any) => (
                                        <tr key={n._id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-5">
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-1 p-2 rounded-lg ${n.type === "HEALTH_ALERT" ? "bg-red-50 text-red-500" : n.type === "PROMOTION" ? "bg-purple-50 text-purple-500" : "bg-blue-50 text-blue-500"}`}>
                                                        {n.type === "HEALTH_ALERT" && <Activity size={16} />}
                                                        {n.type === "SYSTEM_UPDATE" && <Smartphone size={16} />}
                                                        {n.type === "PROMOTION" && <Megaphone size={16} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-900">{n.title}</p>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[200px]">{n.message}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className="bg-gray-100 px-2.5 py-1 rounded-md text-xs font-bold text-gray-600">
                                                    {reverseAudienceMap[n.targetAudience] || n.targetAudience}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                                                        <Calendar size={12} className="text-gray-400" />
                                                        {n.scheduledFor ? new Date(n.scheduledFor).toLocaleDateString() : new Date(n.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 pl-4">
                                                        {n.scheduledFor ? new Date(n.scheduledFor).toLocaleTimeString() : new Date(n.createdAt).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${n.status === "Sent" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                    n.status === "Scheduled" ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-gray-100 text-gray-500 border-gray-200"
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${n.status === "Sent" ? "bg-emerald-500" : n.status === "Scheduled" ? "bg-orange-500" : "bg-gray-500"}`}></span>
                                                    {n.status}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {n.status === "Scheduled" && (
                                                        <button
                                                            onClick={() => handleEdit(n)}
                                                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all"
                                                            title="Edit Notification"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(n._id)}
                                                        className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                                                        title="Delete History"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 border-t border-gray-100">
                            <Pagination
                                page={page}
                                totalPages={meta.totalPages}
                                onPageChange={setPage}
                            />
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
