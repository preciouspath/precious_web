import { useQuery } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient";
import { Mail, User, Calendar, MessageSquare } from "lucide-react";

export default function ContactInquiries() {
  const { data: inquiries, isLoading } = useQuery({
    queryKey: ["contact-inquiries"],
    queryFn: async () => {
      const response = await axiosClient.get("/settings/contact-inquiries");
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto font-aeonik">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Public Contact Inquiries</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and respond to inquiries from the public website</p>
          </div>
          <div className="px-4 py-2 bg-purple-50 text-[#7C3AED] rounded-xl text-sm font-bold border border-purple-100 italic">
            {inquiries?.length || 0} Total Inquiries
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {inquiries && inquiries.length > 0 ? (
            inquiries.map((inquiry: any) => (
              <div key={inquiry._id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="bg-purple-50 p-3 rounded-2xl text-[#7C3AED]">
                    <MessageSquare size={24} />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{inquiry.subject}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <User size={14} />
                            <span>{inquiry.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Mail size={14} />
                            <a href={`mailto:${inquiry.email}`} className="hover:text-[#7C3AED]">{inquiry.email}</a>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-[#734A97] font-medium">
                            <Calendar size={14} />
                            <span>{new Date(inquiry.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-50 text-sm text-gray-600 leading-relaxed italic">
                      "{inquiry.message}"
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No contact inquiries found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
