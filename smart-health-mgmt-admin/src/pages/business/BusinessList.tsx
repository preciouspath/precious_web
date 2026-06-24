"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, UserPlus, Trash2, Edit, Search, Upload } from "lucide-react";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useFormik, type FormikProps } from "formik";
import * as Yup from "yup";
import {
  getBusinessOwners,
  createBusinessOwner,
  updateBusinessOwner,
  deleteBusinessOwner,
} from "../../api/authApi";
import { useNavigate } from "react-router-dom";
import { formatUploadUrl } from "../../utils/urlHelper";

const BRAND_PURPLE_MAIN = "#734A97";

const businessValidationSchema = Yup.object({
  ownerName: Yup.string().min(2, "Owner name must be at least 2 characters").required("Owner name is required"),
  businessName: Yup.string().min(2, "Business name must be at least 2 characters").required("Business name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  mobile: Yup.string().matches(/^[0-9]{10}$/, "Mobile must be 10 digits").required("Mobile is required"),
  businessAddress: Yup.string().required("Business address is required"),
  businessLicense: Yup.string().required("Business license is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/\d/, "Password must contain at least one number")
    .when("$isEdit", {
      is: false,
      then: (schema) => schema.required("Password is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
});

interface FormikInputProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  formik: FormikProps<any>;
  isSelect?: boolean;
  children?: React.ReactNode;
}

const FormikInput = ({ label, name, type = "text", placeholder, formik, isSelect = false, children }: FormikInputProps) => {
  const error = (formik.touched[name as any] || formik.submitCount > 0) && formik.errors[name as any];
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-gray-700 font-bold text-xs uppercase tracking-wider">{label}</label>
      {isSelect ? (
        <select
          name={name}
          value={formik.values[name as any] as string | number | string[]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={formik.isSubmitting}
          className={`bg-gray-50 border p-3 rounded-xl focus:bg-white focus:ring-2 transition-all outline-none ${error ? "border-red-500 focus:ring-red-100" : "border-gray-100 focus:ring-purple-100 focus:border-[#734A97]"
            }`}
        >
          {children}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={formik.values[name as any] as string | number | string[]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={formik.isSubmitting}
          className={`bg-gray-50 border p-3 rounded-xl focus:bg-white focus:ring-2 transition-all outline-none ${error ? "border-red-500 focus:ring-red-100" : "border-gray-100 focus:ring-purple-100 focus:border-[#734A97]"
            }`}
        />
      )}
      {error && typeof error === 'string' && <p className="text-red-500 text-[10px] font-medium mt-0.5">{error}</p>}
    </div>
  );
};

const BusinessThumbnail = ({ license, name }: { license?: string, name: string }) => {
  const [error, setError] = useState(false);

  return (
    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#734A97] overflow-hidden border border-gray-100 shadow-sm">
      {license && !error ? (
        <img
          src={formatUploadUrl(license)}
          alt="License"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={() => setError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-purple-50">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F3E8FF&color=734A97&bold=true&size=100`}
            alt="Default"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
};

const FormikImageUpload = ({ label, name, formik }: { label: string, name: string, formik: FormikProps<any> }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentValue = formik.values[name as any];
  const error = (formik.touched[name as any] || formik.submitCount > 0) && formik.errors[name as any];

  useEffect(() => {
    if (typeof currentValue === "string" && currentValue.startsWith("/")) {
      setPreview(formatUploadUrl(currentValue));
    } else if (!currentValue) {
      setPreview(null);
    }
  }, [currentValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      formik.setFieldValue(name, file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 h-full">
      <label className="text-gray-700 font-bold text-xs uppercase tracking-wider">{label}</label>
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all min-h-[140px] flex-1 ${error ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 hover:border-[#734A97] hover:bg-purple-50/30"
          }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        {preview ? (
          <div className="relative w-full h-full min-h-[100px] flex items-center justify-center">
            <img src={preview} alt="Preview" className="max-h-32 w-full object-contain rounded-lg" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <Upload className="text-white w-6 h-6" />
              <span className="text-white text-xs font-bold ml-2">Change Image</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <Upload className="text-gray-400 w-8 h-8 mb-2 group-hover:text-[#734A97]" />
            <p className="text-[10px] text-gray-500 font-medium px-2">Click to upload license image</p>
          </div>
        )}
      </div>
      {error && typeof error === 'string' && <p className="text-red-500 text-[10px] font-medium mt-0.5">{error}</p>}
    </div>
  );
};

export default function BusinessList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBusinessId, setEditingBusinessId] = useState<string | null>(null);
  const [modalError, setModalError] = useState("");

  const { data: businessesData, isLoading } = useQuery<any>({
    queryKey: ["businesses", page, search],
    queryFn: () => getBusinessOwners({ page, limit: 10, search }),
    placeholderData: keepPreviousData,
  });

  // Mutations
  const addBusinessMutation = useMutation({
    mutationFn: createBusinessOwner,
    onSuccess: () => {
      toast.success("Business added!");
      setOpenForm(false);
      formik.resetForm();
      setModalError("");
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
    },
    onError: (err: any) => {
      setModalError(err?.response?.data?.message || "Failed to add business");
    },
  });

  const updateBusinessMutation = useMutation({
    mutationFn: ({ businessId, data }: { businessId: string; data: any }) => updateBusinessOwner(businessId, data),
    onSuccess: () => {
      toast.success("Business updated!");
      setOpenForm(false);
      formik.resetForm();
      setIsEditMode(false);
      setEditingBusinessId(null);
      setModalError("");
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
    },
    onError: (err: any) => {
      setModalError(err?.response?.data?.message || "Failed to update business");
    },
  });

  const deleteBusinessMutation = useMutation({
    mutationFn: (id: string) => deleteBusinessOwner(id),
    onSuccess: () => {
      toast.success("Business deleted!");
      setOpenDelete(false);
      setBusinessToDelete(null);
      setModalError("");
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
    },
    onError: (err: any) => {
      setModalError(err?.response?.data?.message || "Failed to delete business");
    },
  });

  // Formik
  const formik = useFormik({
    initialValues: { ownerName: "", businessName: "", email: "", mobile: "", businessAddress: "", businessLicense: "", password: "" },
    validationSchema: businessValidationSchema,
    onSubmit: (values) => {
      setModalError("");
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          formData.append(key, value as any);
        }
      });

      if (isEditMode && editingBusinessId) {
        updateBusinessMutation.mutate({ businessId: editingBusinessId, data: formData });
      } else {
        addBusinessMutation.mutate(formData);
      }
    },
  });

  const businesses = businessesData?.data || [];
  const totalPages = businessesData?.meta?.totalPages || 1;

  return (
    <div className="p-8 bg-white min-h-screen font-aeonik">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Business Owners</h1>
          <p className="text-sm text-gray-500">Manage and oversee business partner records</p>
        </div>
        <button
          onClick={() => { setIsEditMode(false); formik.resetForm(); setModalError(""); setOpenForm(true); }}
          className="flex items-center text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-100 hover:opacity-90 transition-all"
          style={{ backgroundColor: BRAND_PURPLE_MAIN }}
        >
          <UserPlus className="w-4 h-4 mr-2" /> Add Business
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by owner, business or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="bg-gray-50 border-none rounded-xl pl-11 pr-4 py-3 w-full text-sm focus:ring-2 focus:ring-purple-100 outline-none transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Business Details</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Owner Info</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Contact</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center p-20 text-gray-400 font-medium animate-pulse">Loading businesses...</td></tr>
              ) : businesses?.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-20 text-gray-400 font-medium">No business owners found.</td></tr>
              ) : (
                businesses?.map((b: any) => (
                  <tr key={b._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-5 flex items-center gap-3">
                      <BusinessThumbnail license={b.businessLicense} name={b.businessName} />
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{b.businessName}</p>
                        {/* <p className="text-xs text-gray-400 flex items-center gap-1">Lic: {b.businessLicense}</p> */}
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="font-bold text-gray-700 text-sm">{b.ownerName}</p>
                      <p className="text-xs text-gray-400">{b.email}</p>
                    </td>
                    <td className="p-5 text-sm text-gray-600 font-medium">{b.mobile}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${b.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                        {b.status || "Pending"}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center items-center gap-1">
                        <button onClick={() => navigate(`/business/${b._id}`)} className="p-2 text-gray-400 hover:text-[#734A97] hover:bg-purple-50 rounded-lg transition-all"><Eye size={18} /></button>
                        <button onClick={() => { setIsEditMode(true); setEditingBusinessId(b._id); formik.setValues({ ...b, password: "" }); setModalError(""); setOpenForm(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit size={18} /></button>
                        <button onClick={() => { setBusinessToDelete(b); setOpenDelete(true); setModalError(""); }} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Modal open={openForm} onClose={() => { setOpenForm(false); setModalError(""); }} title={isEditMode ? "Edit Business" : "Add Business"}>
        <form onSubmit={formik.handleSubmit} className="p-2 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormikInput label="Owner Name" name="ownerName" placeholder="e.g. John Doe" formik={formik} />
            <FormikInput label="Business Name" name="businessName" placeholder="e.g. HealthCare Inc." formik={formik} />
            <FormikInput label="Email Address" name="email" type="email" placeholder="owner@business.com" formik={formik} />
            <FormikInput label="Mobile Number" name="mobile" placeholder="10-digit number" formik={formik} />
            <FormikInput label="Password" name="password" type="password" placeholder={isEditMode ? "••••••••" : "Min. 8 chars"} formik={formik} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormikInput label="Business Address" name="businessAddress" placeholder="Full physical address" formik={formik} />
            <FormikImageUpload label="Business License" name="businessLicense" formik={formik} />
          </div>

          {modalError && <p className="text-red-500 text-sm font-medium mt-2">{modalError}</p>}

          <button
            type="submit"
            disabled={formik.isSubmitting || addBusinessMutation.isPending || updateBusinessMutation.isPending}
            className="w-full bg-[#734A97] text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-100 transition-all mt-4 disabled:opacity-50"
          >
            {isEditMode ? "Update Business Details" : "Register Business Owner"}
          </button>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={openDelete} onClose={() => { setOpenDelete(false); setModalError(""); }}>
        <div className="p-8 text-center font-aeonik">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Business?</h3>
          <p className="text-gray-500 text-sm mb-2">
            This will permanently remove <span className="font-bold text-gray-800">{(businessToDelete as any)?.businessName}</span> and all associated access.
          </p>
          {modalError && <p className="text-red-500 text-sm font-medium mb-2">{modalError}</p>}
          <div className="flex gap-3">
            <button onClick={() => setOpenDelete(false)} className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
            <button onClick={() => deleteBusinessMutation.mutate((businessToDelete as any)?._id)} className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-all">Yes, Delete</button>
          </div>
        </div>
      </Modal>

      <div className="mt-8">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
