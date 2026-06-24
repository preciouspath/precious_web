"use client";

import { useState } from "react";
import { Search, Eye, Clock, AlertCircle } from "lucide-react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getAllTickets } from "../../api/supportApi";
import Pagination from "../../components/common/Pagination";
import { useNavigate } from "react-router-dom";
import moment from "moment";

export default function SupportList() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");

    // Fetch tickets
    const { data: ticketsData, isLoading } = useQuery({
        queryKey: ["tickets", page, search, statusFilter, priorityFilter],
        queryFn: () => getAllTickets({
            page,
            limit: 10,
            search,
            status: statusFilter,
            priority: priorityFilter
        }),
        placeholderData: keepPreviousData,
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "open": return "bg-blue-50 text-blue-600";
            case "in-progress": return "bg-amber-50 text-amber-600";
            case "resolved": return "bg-emerald-50 text-emerald-600";
            case "closed": return "bg-gray-100 text-gray-600";
            default: return "bg-gray-50 text-gray-500";
        }
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case "high": return "text-rose-600 font-bold";
            case "medium": return "text-amber-600 font-bold";
            case "low": return "text-emerald-600 font-bold";
            default: return "text-gray-500 font-bold";
        }
    };

    return (
        <div className="p-8 bg-white min-h-screen font-aeonik">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Help & Support</h1>
                    <p className="text-sm text-gray-500">Manage and respond to user support requests</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by ticket ID, subject..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="bg-gray-50 border-none rounded-xl pl-11 pr-4 py-3 w-full text-sm focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                    />
                </div>

                <div className="flex gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                    >
                        <option value="">All Status</option>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>

                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                    >
                        <option value="">All Priority</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ticket ID</th>
                                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User Info</th>
                                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subject</th>
                                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</th>
                                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-12 text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-sm font-medium">Loading tickets...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : ticketsData?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-12 text-gray-400">
                                        No tickets found.
                                    </td>
                                </tr>
                            ) : (
                                ticketsData?.data?.map((ticket: any) => (
                                    <tr key={ticket._id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-5">
                                            <p className="font-bold text-gray-800 text-sm tracking-tight">{ticket.ticketId}</p>
                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                                                <Clock size={10} />
                                                <span>{moment(ticket.createdAt).fromNow()}</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <p className="font-bold text-gray-800 text-sm whitespace-nowrap">{ticket.userName}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${ticket.userRole === 'business' ? 'text-amber-600 bg-amber-50' : 'text-purple-600 bg-purple-50'}`}>
                                                {ticket.userRole}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <p className="text-sm text-gray-700 font-medium line-clamp-1 break-all">{ticket.subject}</p>
                                            {/* <p className="text-xs text-gray-400 line-clamp-1 mt-0.5 break-all">{ticket.description}</p> */}
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-1.5">
                                                <AlertCircle size={12} className={getPriorityStyle(ticket.priority)} />
                                                <span className={`text-[11px] uppercase tracking-wider ${getPriorityStyle(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(ticket.status)}`}>
                                                {ticket.status.replace('-', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => navigate(`/support/${ticket._id}`)}
                                                    className="p-2.5 text-gray-400 hover:text-[#734A97] hover:bg-purple-50 rounded-xl transition-all group-hover:scale-110 active:scale-95"
                                                >
                                                    <Eye size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-8">
                <Pagination
                    page={page}
                    totalPages={ticketsData?.meta?.totalPages || 1}
                    onPageChange={setPage}
                />
            </div>
        </div>
    );
}
