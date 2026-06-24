import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getReportsApi } from "../../api/authApi";
import Loader from "../../components/common/Loader";
import ReportDetailModal from "../../components/ReportDetailModal";

interface Document {
  _id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedBy: string;
  createdAt: string;
  ocrText?: string;
  extractedData?: {
    patientDetails?: { name?: string; age?: string; address?: string };
    doctorDetails?: { name?: string; specialty?: string };
    medications?: string[];
    potentialDiagnosis?: string;
    generalAdvice?: string;
  };
}

const DoctorUpload: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ start?: string, end?: string }>({});
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Query Data
  const { data: reportsRes, isLoading } = useQuery({
    queryKey: ["reports", "doctor", searchQuery, sortBy, sortOrder, fileTypeFilter, dateRange],
    queryFn: () => getReportsApi({
      uploadedBy: "doctor",
      search: searchQuery,
      sortBy,
      sortOrder,
      fileType: fileTypeFilter,
      startDate: dateRange.start,
      endDate: dateRange.end
    })
  });

  const documents: Document[] = reportsRes?.data?.data || [];

  return (
    <section className="py-10 lg:py-18 bg-[var(--color-slate-50)]">
      <div className="container">
        <div className="bg-white rounded-[15px] min-h-[600px]">

          {/* Header & Controls */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex flex-col gap-6">

              {/* Title */}
              <div className="flex items-center justify-between">
                <h1 className="headings-web-h4-headline text-[var(--color-gray-700)]">Doctor Uploads</h1>
              </div>

              {/* Search & Filters */}
              <div className="flex text-black flex-col lg:flex-row gap-4 items-center bg-slate-50 p-4 rounded-xl">
                {/* Search */}
                <div className="relative w-full lg:flex-1">
                  <input
                    type="text"
                    placeholder="Search files or OCR text..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:border-purple-500 outline-none cursor-pointer"
                  >
                    <option value="createdAt">Date Added</option>
                    <option value="name">Name</option>
                    <option value="type">File Type</option>
                  </select>

                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:border-purple-500 outline-none cursor-pointer"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>

                  <select
                    value={fileTypeFilter}
                    onChange={(e) => setFileTypeFilter(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:border-purple-500 outline-none cursor-pointer"
                  >
                    <option value="all">All Types</option>
                    <option value="pdf">PDF</option>
                    <option value="image">Image</option>
                  </select>

                  {/* Date Range */}
                  <div className="flex gap-2 items-center">
                    <input
                      type="date"
                      value={dateRange.start || ''}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:border-purple-500 outline-none"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="date"
                      value={dateRange.end || ''}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="py-20 flex justify-center"><Loader text="Loading doctor reports..." /></div>
            ) : (
              <>
                {/* Files Grid */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    All Files ({documents.length})
                  </h3>

                  {documents.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-400">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-1">No doctor uploads found</h3>
                      <p className="text-slate-500 mb-4">You can find reports uploaded by your doctor here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {documents.map(doc => (
                        <div key={doc._id} className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow group flex flex-col justify-between">
                          <div
                            className="flex items-start gap-4 cursor-pointer mb-2"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShowDetailModal(true);
                            }}
                          >
                            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 flex-shrink-0">
                              {doc.fileName.toLowerCase().endsWith('.pdf') ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M10 13H8v5h2a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2z"></path><path d="M16 13h-2.5v5"></path><path d="M10 13v-2.5"></path></svg>
                              ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-900 truncate" title={doc.fileName}>{doc.fileName}</h4>
                              <p className="text-xs text-slate-500 mt-1">{new Date(doc.createdAt).toLocaleDateString()}</p>
                            </div>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setShowDetailModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-purple-600" title="View Details"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Report Detail Modal */}
      {showDetailModal && selectedDocument && (
        <ReportDetailModal
          report={selectedDocument}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </section>
  );
};

export default DoctorUpload;