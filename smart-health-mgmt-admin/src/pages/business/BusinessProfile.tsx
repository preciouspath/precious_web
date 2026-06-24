import { useState } from "react";
import { Edit, Trash2, Eye, Download } from "lucide-react";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBusinessOwnerById, updateBusinessOwner, deleteBusinessOwner, toggleBusinessStatus } from "../../api/authApi";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import { formatUploadUrl } from "../../utils/urlHelper";

const businessValidationSchema = Yup.object({
  ownerName: Yup.string().min(2, "Owner name must be at least 2 characters").required("Owner name is required"),
  businessName: Yup.string().min(2, "Business name must be at least 2 characters").required("Business name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  mobile: Yup.string().matches(/^[0-9]{10}$/, "Mobile must be 10 digits").required("Mobile is required"),
  businessAddress: Yup.string().required("Business address is required"),
});

export default function BusinessProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  // Fetch Business Data
  const { data: business, isLoading, error } = useQuery({
    queryKey: ["business", id],
    queryFn: () => getBusinessOwnerById(id as string),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateBusinessOwner(id as string, data),
    onSuccess: () => {
      toast.success("Profile updated successfully");
      setOpenEdit(false);
      queryClient.invalidateQueries({ queryKey: ["business", id] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBusinessOwner(id as string),
    onSuccess: () => {
      toast.success("Business deleted successfully");
      navigate("/business");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete business");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: () => toggleBusinessStatus(id as string),
    onSuccess: () => {
      toast.success("Business status updated");
      queryClient.invalidateQueries({ queryKey: ["business", id] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  });

  const formik = useFormik({
    initialValues: {
      ownerName: business?.ownerName || "",
      businessName: business?.businessName || "",
      email: business?.email || "",
      mobile: business?.mobile || "",
      businessAddress: business?.businessAddress || "",
    },
    enableReinitialize: true,
    validationSchema: businessValidationSchema,
    onSubmit: (values) => {
      updateMutation.mutate(values);
    },
  });

  if (isLoading) return <div className="text-center p-10">Loading profile...</div>;
  if (error || !business) return <div className="text-center p-10 text-red-500">Failed to load business profile.</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Business Profile</h2>
        <StatusBadge status={business.status || "Pending"} />
      </div>

      {/* Business Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <p className="text-sm text-gray-500">Business Name</p>
          <p className="font-medium text-gray-800">{business.businessName}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Owner Name</p>
          <p className="font-medium text-gray-800">{business.ownerName}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Email</p>
          <p className="font-medium text-gray-800">{business.email}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Contact Number</p>
          <p className="font-medium text-gray-800">{business.mobile}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">KYC Status</p>
          <span className={`px-2 py-1 rounded text-xs font-bold ${business.kycStatus === 'Approved' ? 'bg-green-100 text-green-700' : business.kycStatus === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {business.kycStatus || "Pending"}
          </span>
        </div>
        <div>
          {/* <p className="text-sm text-gray-500">Account Type</p>
          <p className="font-medium text-gray-800">{business.accountType || "Standard"}</p> */}
        </div>
        <div className="md:col-span-2">
          <p className="text-sm text-gray-500">Address</p>
          <p className="font-medium text-gray-800">{business.businessAddress}</p>
        </div>
      </div>

      {/* License Section */}
      <div className="mb-8">
        <div className="border border-gray-100 rounded-3xl p-4 bg-gray-50/30 flex items-center gap-6 group hover:border-purple-200 transition-all">
          <div className="w-24 h-32 bg-white rounded-2xl border border-gray-100 flex-shrink-0 overflow-hidden shadow-sm flex items-center justify-center group-hover:shadow-md transition-all">
            {business.businessLicense?.toLowerCase().endsWith('.pdf') ? (
              <div className="flex flex-col items-center gap-1">
                {/* <FileText size={32} className="text-[#734A97]" /> */}
                <span className="text-[10px] font-black text-[#734A97]">PDF</span>
              </div>
            ) : (
              <img
                src={formatUploadUrl(business.businessLicense)}
                alt="License"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/100x130?text=Doc";
                }}
              />
            )}
          </div>

          <div className="flex-1">
            <h5 className="font-black text-gray-800 text-sm tracking-tight mb-1">Business License Document</h5>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Verification Artifact</p>

            <div className="flex items-center gap-3">
              <a
                href={formatUploadUrl(business.businessLicense)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#734A97] hover:bg-purple-50 hover:border-purple-200 transition-all flex items-center gap-2"
              >
                <Eye size={14} /> View
              </a>
              <a
                href={formatUploadUrl(business.businessLicense)}
                download
                className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <Download size={14} /> Download
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setOpenEdit(true)}
          className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-xl hover:bg-blue-200"
        >
          <Edit size={16} /> Edit Profile
        </button>

        {/* <button
          className="flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl hover:bg-yellow-200"
        >
          <Lock size={16} /> Reset Password
        </button> */}

        <button
          onClick={() => toggleStatusMutation.mutate()}
          className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200"
        >
          {business.status === 'active' ? "Disable Account" : "Enable Account"}
        </button>

        <button
          onClick={() => setOpenDelete(true)}
          className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-xl hover:bg-red-200"
        >
          <Trash2 size={16} /> Delete Account
        </button>
      </div>

      {/* Edit Modal */}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Edit Business Profile">
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Business Name</label>
            <input
              type="text"
              name="businessName"
              value={formik.values.businessName}
              onChange={formik.handleChange}
              className="w-full border rounded-xl p-3"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Owner Name</label>
            <input
              type="text"
              name="ownerName"
              value={formik.values.ownerName}
              onChange={formik.handleChange}
              className="w-full border rounded-xl p-3"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
            <input
              type="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              className="w-full border rounded-xl p-3"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Mobile</label>
            <input
              type="text"
              name="mobile"
              value={formik.values.mobile}
              onChange={formik.handleChange}
              className="w-full border rounded-xl p-3"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
            <textarea
              name="businessAddress"
              value={formik.values.businessAddress}
              onChange={formik.handleChange}
              className="w-full border rounded-xl p-3 h-24 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-700 transition"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={openDelete} onClose={() => setOpenDelete(false)} title="Confirm Delete">
        <p className="text-gray-600 mb-4">
          Are you sure you want to permanently delete this business and all associated data?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setOpenDelete(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
