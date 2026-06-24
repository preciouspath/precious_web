import axiosClient from "./axiosClient";

export interface Ticket {
    _id: string;
    ticketId: string;
    user: {
        _id: string;
        fullName?: string;
        ownerName?: string;
        email: string;
    };
    userName: string;
    userRole: "business" | "patient";
    subject: string;
    description: string;
    priority: "low" | "medium" | "high";
    status: "open" | "in-progress" | "resolved" | "closed";
    attachments: string[];
    messages: {
        sender: {
            _id: string;
            fullName?: string;
            ownerName?: string;
            email: string;
        };
        senderRole: "admin" | "business" | "patient";
        message: string;
        createdAt: string;
    }[];
    lastUpdated: string;
    createdAt: string;
    updatedAt: string;
}

export interface SupportListParams {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    userRole?: string;
    search?: string;
}

export const getAllTickets = async (params: SupportListParams) => {
    const res = await axiosClient.get("/support", { params });
    return res.data;
};

export const createTicket = async (data: { subject: string, description: string, priority?: string, attachments?: string[] }) => {
    const res = await axiosClient.post("/support", data);
    return res.data;
};

export const getTicketById = async (id: string) => {
    const res = await axiosClient.get(`/support/${id}`);
    return res.data.data;
};

export const respondToTicket = async (id: string, data: { message: string, status?: string }) => {
    const res = await axiosClient.post(`/support/${id}/respond`, data);
    return res.data;
};

export const updateTicketStatus = async (id: string, status: string) => {
    const res = await axiosClient.put(`/support/${id}/status`, { status });
    return res.data;
};
