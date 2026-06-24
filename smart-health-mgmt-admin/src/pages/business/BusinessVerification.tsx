import { useState } from "react";
import { Check, X, FileText, Building2, User, Calendar, MapPin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBusinessOwners, updateBusinessOwner } from "../../api/authApi";
import { toast } from "react-toastify";
import Modal from "../../components/common/Modal";

export default function BusinessVerification() {
  const [openReject, setOpenReject] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const { data: businessesData, isLoading } = useQuery({
    queryKey: ["business-verification"],
    queryFn: () => getBusinessOwners({ page: 1, limit: 100, kycStatus: "Pending" } as any),
  });

  const businesses = businessesData?.data || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      updateBusinessOwner(id, { kycStatus: status, kycRejectionReason: reason } as any),
    onSuccess: () => {
      toast.success("Business status updated successfully");
      setOpenReject(false);
      setReason("");
      setSelectedBusiness(null);
      queryClient.invalidateQueries({ queryKey: ["business-verification"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update status");
    },
  });

  const handleReject = () => {
    if (!selectedBusiness) return;
    updateStatusMutation.mutate({ id: selectedBusiness._id, status: "Rejected", reason });
  };

  const handleApprove = (business: any) => {
    if (confirm(`Approve ${business.businessName}?`)) {
      updateStatusMutation.mutate({ id: business._id, status: "Approved" });
    }
  };

  const openRejectModal = (business: any) => {
    setSelectedBusiness(business);
    setOpenReject(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 ">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Business Verifications</h2>
          <p className="text-gray-600">Review and approve pending business applications</p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center p-10">Loading...</td></tr>
                ) : businesses.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-10">No pending verifications found</td></tr>
                ) : (
                  businesses.map((business: any) => (
                    <tr key={business._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 size={20} className="text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{business.businessName}</p>
                            {/* <p className="text-sm text-gray-500">{business.businessType}</p> */}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{business.ownerName}</p>
                          <p className="text-sm text-gray-500">{business.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700">{business.businessAddress}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700">{new Date(business.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <a href={business.businessLicense} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                          <FileText size={16} />
                          <span>View License</span>
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(business)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                          >
                            <Check size={16} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => openRejectModal(business)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                          >
                            <X size={16} />
                            <span>Reject</span>
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

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {businesses.map((business: any) => (
            <div key={business._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 size={24} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1">{business.businessName}</h3>
                  <p className="text-sm text-gray-500">{business.businessAddress}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User size={16} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{business.ownerName}</p>
                    <p className="text-gray-500">{business.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                  <p className="text-gray-700">{business.businessAddress}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                  <p className="text-gray-700">Submitted: {new Date(business.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Document Link */}
              <a href={business.businessLicense} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors">
                <FileText size={16} />
                <span>View License Document</span>
              </a>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleApprove(business)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                >
                  <Check size={16} />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => openRejectModal(business)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                >
                  <X size={16} />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reject Modal */}
      <Modal open={openReject} onClose={() => setOpenReject(false)} title="Reject Business Verification">
        <div className="space-y-4">
          {selectedBusiness && (
            <p className="text-sm text-gray-500 mt-1">Rejecting: <span className="font-bold">{selectedBusiness.businessName}</span></p>
          )}
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Rejection <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="Please provide a detailed reason for rejecting this business verification..."
            className="w-full border border-gray-300 rounded-lg p-3 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <p className="text-sm text-gray-500 mt-2">
            This reason will be sent to the business owner via email.
          </p>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setOpenReject(false);
                setReason("");
                setSelectedBusiness(null);
              }}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={!reason.trim() || updateStatusMutation.isPending}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateStatusMutation.isPending ? "Rejecting..." : "Reject & Send Notice"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}