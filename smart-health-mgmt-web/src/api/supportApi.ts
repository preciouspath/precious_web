import axiosClient from "./axiosClient";

export const raiseTicket = (data: FormData) => {
    return axiosClient.post("/support/tickets", data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

export const getMyTickets = () => axiosClient.get("/support/tickets");

export const getTicketDetails = (id: string) => axiosClient.get(`/support/tickets/${id}`);

export const respondToTicket = (id: string, message: string) =>
    axiosClient.post(`/support/tickets/${id}/respond`, { message });

export const getFAQs = () => axiosClient.get("/support/faqs");

export const getSupportInfo = () => axiosClient.get("/support/contact-info");

export const submitContactInquiry = (data: any) => axiosClient.post("/support/contact", data);

export const getSystemSettings = (keys: string) => axiosClient.get(`/support/contact-info?keys=${keys}`); // Overloaded this for now
