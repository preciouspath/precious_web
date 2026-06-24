"use client";

import { useState } from "react";
import { Search, Eye, UserPlus, Trash2, Edit } from "lucide-react";
import Modal from "../../components/common/Modal";
// import PatientReports from "./PatientReports";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
  togglePatientStatus,
} from "../../api/authApi";
import { useFormik, type FormikProps } from "formik";
import * as Yup from "yup";
import Pagination from "../../components/common/Pagination";
import { useNavigate } from "react-router-dom";

// Phone library imports
import PhoneInput, { parsePhoneNumber, isValidPhoneNumber } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en';
import 'react-phone-number-input/style.css';


const BRAND_PURPLE_MAIN = "#734A97";

// Helper to extract API error messages
const getApiError = (err: any) => {
  return err?.response?.data?.message || err?.message || "Something went wrong";
};

// Validation schema
const patientValidationSchema = Yup.object({
  fullName: Yup.string().min(2, "Full name must be at least 2 characters").required("Full name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").when("$isEdit", {
    is: false,
    then: (schema) => schema.required("Password is required"),
  }),
  mobileNumber: Yup.string()
    .required("Mobile number is required")
    .test("is-valid-phone", "Invalid mobile number", (value) => {
      if (!value) return false;
      return isValidPhoneNumber(value);
    }),
  dateOfBirth: Yup.date().max(new Date(), "Date cannot be in future").required("Date of Birth is required"),
  gender: Yup.string().oneOf(["male", "female", "other"]).required("Gender is required"),
  height: Yup.string().required("Height is required"),
  weight: Yup.string().required("Weight is required"),
  bloodPressure: Yup.string().matches(/^\d{2,3}\/\d{2,3}$/, "BP format should be like 120/80").required("Blood Pressure is required"),
  bloodGroup: Yup.string().oneOf(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", ""], "Invalid blood group").required("Blood group is required"),
  healthConditions: Yup.string().required("Health conditions are required"),
  syncSmartWatch: Yup.boolean(),
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
          className={`border p-3 rounded-xl focus:outline-none focus:ring-2 transition-all ${error ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-purple-100 focus:border-[#734A97]"
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
          className={`border p-3 rounded-xl focus:outline-none focus:ring-2 transition-all ${error ? "border-red-500 focus:ring-red-100" : "border-gray-200 focus:ring-purple-100 focus:border-[#734A97]"
            }`}
        />
      )}
      {error && typeof error === 'string' && <p className="text-red-500 text-[10px] mt-0.5 font-medium">{error}</p>}
    </div>
  );
};

const FormikPhoneInput = ({ label, name, formik }: { label: string, name: string, formik: FormikProps<any> }) => {
  const error = (formik.touched[name as any] || formik.submitCount > 0) && formik.errors[name as any];
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-gray-700 font-bold text-xs uppercase tracking-wider">{label}</label>
      <PhoneInput
        international
        defaultCountry="US"
        value={formik.values[name as any]}
        onChange={(val) => formik.setFieldValue(name, val)}
        onBlur={() => formik.setFieldTouched(name, true)}
        className={`border p-3 rounded-xl focus:outline-none focus-within:ring-2 transition-all ${error ? "border-red-500 focus-within:ring-red-100" : "border-gray-200 focus-within:ring-purple-100 focus-within:border-[#734A97]"
          }`}
        numberInputProps={{
          className: "bg-transparent border-none outline-none w-full !text-slate-900 placeholder:text-slate-400 focus:ring-0 h-full p-0 text-[14px]",
          placeholder: "Enter mobile number",
        }}
      />
      {error && typeof error === 'string' && <p className="text-red-500 text-[10px] mt-0.5 font-medium">{error}</p>}
    </div>
  );
};

export default function PatientList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  // const [selectedPatient, setSelectedPatient] = useState(null);
  // const [openReport, setOpenReport] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [statusModal, setStatusModal] = useState<{ open: boolean; patient: any; error?: string }>({ open: false, patient: null });
  const [modalError, setModalError] = useState(""); // store API errors for modals

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);

  // Fetch patients
  const { data: patientsData, isLoading } = useQuery<any>({
    queryKey: ["patients", page, search],
    queryFn: () => getPatients({ page, limit: 10, search }),
    placeholderData: keepPreviousData,
  });

  // Mutations
  const deletePatientMutation = useMutation({
    mutationFn: (id: string) => deletePatient(id),
    onSuccess: () => {
      toast.success("Patient deleted successfully");
      setOpenDelete(false);
      setPatientToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err: any) => {
      setModalError(getApiError(err));
    },
  });

  const addPatientMutation = useMutation({
    mutationFn: (data: any) => createPatient(data),
    onSuccess: () => {
      toast.success("Patient added!");
      setOpenForm(false);
      formik.resetForm();
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err: any) => {
      setModalError(getApiError(err));
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: ({ patientId, data }: { patientId: string; data: any }) => updatePatient(patientId, data),
    onSuccess: () => {
      toast.success("Patient updated!");
      setOpenForm(false);
      formik.resetForm();
      setIsEditMode(false);
      setEditingPatientId(null);
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err: any) => {
      setModalError(getApiError(err));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => togglePatientStatus(id),
    onSuccess: (res: any) => {
      toast.success(res?.message || "Status updated");
      setStatusModal({ open: false, patient: null });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err: any) => {
      setModalError(getApiError(err));
    },
  });

  // Formik
  const formik = useFormik({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
      mobileNumber: "",
      dateOfBirth: "",
      gender: "female",
      height: "",
      weight: "",
      bloodPressure: "",
      bloodGroup: "",
      healthConditions: "",
      syncSmartWatch: false,
    },
    validationSchema: patientValidationSchema,
    validateOnMount: true,
    onSubmit: (values, { setSubmitting }) => {
      if (!formik.isValid) {
        toast.error("Please fill all required fields correctly");
        setSubmitting(false);
        return;
      }

      // Process Phone Number
      let countryCode = "+1";
      let phoneOnly = values.mobileNumber;
      let countryName = "United States";

      if (values.mobileNumber) {
        const parsed = parsePhoneNumber(values.mobileNumber);
        if (parsed) {
          countryCode = `+${parsed.countryCallingCode}`;
          phoneOnly = parsed.nationalNumber;
          countryName = en[parsed.country as keyof typeof en] || "United States";
        }
      }

      const patientData = {
        fullName: values.fullName,
        email: values.email,
        ...(values.password && { password: values.password }),
        mobileNumber: phoneOnly,
        countryCode: countryCode,
        countryName: countryName,
        dateOfBirth: values.dateOfBirth,
        gender: values.gender,
        healthProfile: {
          height: values.height,
          weight: values.weight,
          bloodPressure: values.bloodPressure,
          bloodGroup: values.bloodGroup,
          healthConditions: values.healthConditions,
          syncSmartWatch: values.syncSmartWatch,
        },
      };

      isEditMode && editingPatientId
        ? updatePatientMutation.mutate({ patientId: editingPatientId, data: patientData })
        : addPatientMutation.mutate(patientData);
    },
  });

  return (
    <div className="p-8 bg-white min-h-screen font-aeonik">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
          <p className="text-sm text-gray-500">Manage patient records and information</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsEditMode(false);
              formik.resetForm();
              setOpenForm(true);
              setModalError("");
            }}
            className="flex items-center text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-100 hover:opacity-90 transition-all"
            style={{ backgroundColor: BRAND_PURPLE_MAIN }}
          >
            <UserPlus className="w-4 h-4 mr-2" /> Add Patient
          </button>
        </div>
      </div>

      <div className="relative max-w-md mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search by name, email or mobile..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="bg-gray-50 border-none rounded-xl pl-11 pr-4 py-3 w-full text-sm focus:ring-2 focus:ring-purple-100 outline-none transition-all"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Info</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Subscription</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center p-12 text-gray-400">
                    Loading records...
                  </td>
                </tr>
              ) : patientsData?.data?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-12 text-gray-400">
                    No patients found.
                  </td>
                </tr>
              ) : (
                patientsData?.data?.map((p: any) => (
                  <tr key={p._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-5">
                      <p className="font-bold text-gray-800 text-sm">{p.fullName}</p>
                      {/* <p className="text-xs text-gray-400">ID: {p._id.slice(-6).toUpperCase()}</p> */}
                    </td>
                    <td className="p-5 text-sm">
                      <p className="text-gray-600">{p.email}</p>
                      <p className="text-gray-400 text-xs">{p.mobileNumber || "-"}</p>
                    </td>
                    <td className="p-5">
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase">
                        {p.healthProfile?.subscription || "Basic"}
                      </span>
                    </td>
                    <td className="p-5">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all ${p.status === "active"
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                          }`}
                        onClick={() => setStatusModal({ open: true, patient: p, error: "" })}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center items-center gap-1">
                        <button onClick={() => navigate(`/patient/${p._id}`)} className="p-2 text-gray-400 hover:text-[#734A97] hover:bg-purple-50 rounded-lg transition-all">
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setIsEditMode(true);
                            setEditingPatientId(p._id);
                            formik.setValues({
                              fullName: p.fullName || "",
                              email: p.email || "",
                              password: "", // always empty
                              mobileNumber: p.countryCode && p.mobileNumber ? `${p.countryCode}${p.mobileNumber}` : p.mobileNumber || "",
                              dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "",
                              gender: p.gender || "female",
                              height: p.healthProfile?.height || "",
                              weight: p.healthProfile?.weight || "",
                              bloodPressure: p.healthProfile?.bloodPressure || "",
                              bloodGroup: p.healthProfile?.bloodGroup || "",
                              healthConditions: p.healthProfile?.healthConditions || "",
                              syncSmartWatch: p.healthProfile?.syncSmartWatch || false,
                            });
                            setOpenForm(true);
                            setModalError("");
                          }}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit size={18} />
                        </button>
                        {/* <button
                          disabled
                          onClick={() => {
                            setSelectedPatient(p);
                            setOpenReport(true);
                          }}
                          className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                        >
                          <FileText size={18} />
                        </button> */}
                        <button
                          onClick={() => {
                            setPatientToDelete(p);
                            setOpenDelete(true);
                            setModalError("");
                          }}
                          className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
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

      {/* Delete Modal */}
      <Modal open={openDelete} onClose={() => { setOpenDelete(false); setModalError(""); }}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Patient?</h3>
          <p className="text-gray-500 text-sm mb-8">
            Delete <span className="font-bold text-gray-800">{(patientToDelete as any)?.fullName}</span>?
          </p>
          {modalError && <p className="text-red-500 text-sm mb-2">{modalError}</p>}
          <div className="flex gap-3">
            <button onClick={() => { setOpenDelete(false); setModalError(""); }} className="flex-1 py-3 border border-gray-100 rounded-xl font-bold text-gray-500">
              Cancel
            </button>
            <button onClick={() => patientToDelete && deletePatientMutation.mutate((patientToDelete as any)._id)} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-100">
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal open={openForm} onClose={() => { setOpenForm(false); setModalError(""); }} title={isEditMode ? "Edit Patient" : "Add Patient"}>
        <form onSubmit={formik.handleSubmit} className="p-2 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormikInput label="Full Name" name="fullName" formik={formik} />
            <FormikInput label="Email" name="email" type="email" formik={formik} />
            {!isEditMode && <FormikInput label="Password" name="password" type="password" formik={formik} />}
            <FormikPhoneInput label="Mobile" name="mobileNumber" formik={formik} />
            <FormikInput label="DOB" name="dateOfBirth" type="date" formik={formik} />
            <FormikInput label="Gender" name="gender" isSelect formik={formik}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </FormikInput>
            <FormikInput label="Height" name="height" isSelect formik={formik}>
              <option value="">Select Height</option>
              {Array.from({ length: 60 }).map((_, i) => {
                const feet = Math.floor(i / 12) + 3;
                const inches = i % 12;
                const val = `${feet} feet ${inches} inches`;
                return <option key={val} value={val}>{val}</option>;
              })}
            </FormikInput>
            <FormikInput label="Weight" name="weight" isSelect formik={formik}>
              <option value="">Select Weight</option>
              {Array.from({ length: 335 }).map((_, i) => (
                <option key={i} value={`${66 + i} lbs`}>{66 + i} lbs</option>
              ))}
            </FormikInput>
            <FormikInput label="BP" name="bloodPressure" formik={formik} />
            <FormikInput label="Blood Group" name="bloodGroup" isSelect formik={formik}>
              <option value="">Select</option>
              <option value="A+">A+</option>
              <option value="B+">B+</option>
              <option value="O+">O+</option>
              <option value="AB+">AB+</option>
              <option value="A-">A-</option>
              <option value="B-">B-</option>
              <option value="O-">O-</option>
              <option value="AB-">AB-</option>
            </FormikInput>
          </div>

          <FormikInput label="Health Conditions" name="healthConditions" formik={formik} />
          {modalError && <p className="text-red-500 text-sm mt-2">{modalError}</p>}

          <button
            type="submit"
            className="w-full bg-[#734A97] text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-100 transition-all mt-4 disabled:opacity-50"
          >
            {isEditMode ? "Update Patient Profile" : "Create Patient Record"}
          </button>
        </form>
      </Modal>

      {/* Status Modal */}
      <Modal open={statusModal.open} onClose={() => { setStatusModal({ open: false, patient: null }); setModalError(""); }}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Edit size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Change Status</h3>
          <p className="text-gray-500 text-sm mb-2">
            Are you sure you want to toggle status for <span className="font-bold text-gray-800">{statusModal.patient?.fullName}</span>?
          </p>
          {modalError && <p className="text-red-500 text-sm mb-2">{modalError}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => { setStatusModal({ open: false, patient: null }); setModalError(""); }}
              className="flex-1 py-3 border border-gray-100 rounded-xl font-bold text-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={() => toggleStatusMutation.mutate(statusModal.patient._id)}
              className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-100"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>

      {/* {selectedPatient && <Modal open={openReport} onClose={() => setOpenReport(false)} title={`Reports - ${(selectedPatient as any)?.fullName}`}>{(<PatientReports {...({ patient: selectedPatient } as any)} />)}</Modal>} */}

      <div className="mt-8">
        <Pagination page={page} totalPages={patientsData?.meta?.totalPages || 1} onPageChange={setPage} />
      </div>
    </div>
  );
}
