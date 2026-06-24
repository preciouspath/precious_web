"use client";

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTicketById, respondToTicket, updateTicketStatus } from "../../api/supportApi";
import {
    Send,
    ArrowLeft,
    Clock,
    User,
    Tag,
    AlertCircle,
    CheckCircle2,
    AlertTriangle,
    MessageSquare,
    Shield
} from "lucide-react";
import { toast } from "react-toastify";
import moment from "moment";



export default function SupportDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [message, setMessage] = useState("");

    const { data: ticket, isLoading, error } = useQuery({
        queryKey: ["ticket", id],
        queryFn: () => getTicketById(id!),
        enabled: !!id,
    });

    const responseMutation = useMutation({
        mutationFn: (data: { message: string, status?: string }) => respondToTicket(id!, data),
        onSuccess: () => {
            toast.success("Response sent");
            setMessage("");
            queryClient.invalidateQueries({ queryKey: ["ticket", id] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to send response");
        }
    });

    const statusMutation = useMutation({
        mutationFn: (status: string) => updateTicketStatus(id!, status),
        onSuccess: () => {
            toast.success("Status updated");
            queryClient.invalidateQueries({ queryKey: ["ticket", id] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to update status");
        }
    });

    const handleSendResponse = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        responseMutation.mutate({ message });
    };

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error || !ticket) return (
        <div className="p-8 text-center text-gray-500">
            <AlertTriangle className="mx-auto w-12 h-12 mb-4 text-rose-500" />
            <h2 className="text-xl font-bold">Ticket not found</h2>
            <button onClick={() => navigate("/support")} className="mt-4 text-purple-600 font-bold underline">Go back to list</button>
        </div>
    );

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "open": return <AlertCircle size={16} />;
            case "in-progress": return <Clock size={16} />;
            case "resolved": return <CheckCircle2 size={16} />;
            case "closed": return <Shield size={16} />;
            default: return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "open": return "bg-blue-50 text-blue-600 border-blue-100";
            case "in-progress": return "bg-amber-50 text-amber-600 border-amber-100";
            case "resolved": return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case "closed": return "bg-gray-100 text-gray-600 border-gray-200";
            default: return "bg-gray-50 text-gray-500 border-gray-100";
        }
    };

    return (
        <div className="p-8 bg-white min-h-screen font-aeonik">
            <button
                onClick={() => navigate("/support")}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-8 group"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold text-sm">Back to Tickets</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Conversation */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 tracking-tight break-all">{ticket.subject}</h1>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">#{ticket.ticketId}</span>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${getStatusColor(ticket.status)} flex items-center gap-1.5`}>
                                        {getStatusIcon(ticket.status)}
                                        {ticket.status.replace('-', ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100/50">
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-all">{ticket.description}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-2">Conversation History</h3>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {ticket.messages.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50/30 rounded-3xl border border-dashed border-gray-100">
                                    <MessageSquare className="mx-auto w-8 h-8 text-gray-300 mb-2" />
                                    <p className="text-sm text-gray-400">No messages yet. Start the conversation below.</p>
                                </div>
                            ) : (
                                ticket.messages.map((msg: any, idx: number) => {
                                    const isAdmin = msg.senderRole === "admin";
                                    return (
                                        <div key={idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${isAdmin
                                                ? 'bg-[#734A97] text-white rounded-tr-none'
                                                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                                }`}>
                                                {!isAdmin && (
                                                    <p className="text-[10px] font-bold opacity-70 mb-1 uppercase tracking-wider">
                                                        {msg.sender?.fullName || msg.sender?.ownerName || 'User'}
                                                    </p>
                                                )}
                                                <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                                                <p className={`text-[9px] mt-2 opacity-60 font-medium ${isAdmin ? 'text-right' : 'text-left'}`}>
                                                    {moment(msg.createdAt).format('MMM D, h:mm A')}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Response Editor */}
                    <form onSubmit={handleSendResponse} className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 relative">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your response here..."
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-purple-100 outline-none transition-all min-h-[120px] resize-none"
                        />
                        <div className="flex justify-between items-center mt-4">
                            <p className="text-[10px] text-gray-400 font-medium">Character limit: 1000</p>
                            <button
                                type="submit"
                                disabled={!message.trim() || responseMutation.isPending}
                                className="bg-[#734A97] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-purple-100"
                            >
                                {responseMutation.isPending ? "Sending..." : (
                                    <>
                                        <span>Send Response</span>
                                        <Send size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Column: Sidebar info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 text-purple-50 -z-0 opacity-50">
                            <Tag size={120} />
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-sm font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Tag size={16} className="text-[#734A97]" />
                                Ticket Information
                            </h3>

                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Requested By</p>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-[#734A97]">
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{ticket.userName}</p>
                                            <p className="text-xs text-gray-400">{ticket.user?.email}</p>
                                        </div>
                                    </div>
                                    <div className={`mt-2 text-[10px] font-bold px-2.5 py-1 rounded inline-block uppercase tracking-wider ${ticket.userRole === 'business' ? 'text-amber-600 bg-amber-50' : 'text-purple-600 bg-purple-50'}`}>
                                        {ticket.userRole}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority LEVEL</p>
                                    <div className="flex items-center gap-2">
                                        <AlertCircle size={14} className={
                                            ticket.priority === 'high' ? 'text-rose-500' :
                                                ticket.priority === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                                        } />
                                        <span className={`text-sm font-bold capitalize ${ticket.priority === 'high' ? 'text-rose-600' :
                                            ticket.priority === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                                            }`}>
                                            {ticket.priority} Priority
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TIMESTAMPS</p>
                                    <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                        <Clock size={12} />
                                        Created: {moment(ticket.createdAt).format('MMM D, YYYY')}
                                    </p>
                                    <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                        <Clock size={12} />
                                        Updated: {moment(ticket.lastUpdated).format('MMM D, YYYY')}
                                    </p>
                                </div>

                                <div className="pt-6 border-t border-gray-50">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">SET STATUS</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {["open", "in-progress", "resolved", "closed"].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => statusMutation.mutate(status)}
                                                disabled={statusMutation.isPending || ticket.status === status}
                                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all border ${ticket.status === status
                                                    ? 'bg-purple-100 border-[#734A97] text-[#734A97]'
                                                    : 'bg-white border-gray-100 text-gray-400 hover:border-purple-200 hover:text-purple-400'
                                                    }`}
                                            >
                                                <span className="capitalize">{status.replace('-', ' ')}</span>
                                                {ticket.status === status && <CheckCircle2 size={12} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#734A97] to-[#A07CC3] rounded-3xl p-6 text-white shadow-xl shadow-purple-100">
                        <AlertTriangle className="mb-4 opacity-80" />
                        <h4 className="font-bold text-sm mb-2">HIPAA Notice</h4>
                        <p className="text-[11px] opacity-90 leading-relaxed font-medium">
                            Avoid discussing PHI (Protected Health Information) in open text fields unless necessary for resolution. All actions on this ticket are logged for audit purposes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
