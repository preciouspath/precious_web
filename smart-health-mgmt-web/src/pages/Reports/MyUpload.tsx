import React, { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getReportsApi } from "../../api/authApi";
import { getFoldersApi, createFolderApi, updateFolderApi, deleteFolderApi, type Folder } from "../../api/folderApi";
import Loader from "../../components/common/Loader";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import useAuthStore from "../../store/authStore";
import ReportDetailModal from "../../components/ReportDetailModal";

interface Document {
  _id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedBy: string;
  createdAt: string;
  folderId?: string;
  ocrText?: string;
  extractedData?: {
    patientDetails?: { name?: string; age?: string; address?: string };
    doctorDetails?: { name?: string; specialty?: string };
    medications?: string[];
    potentialDiagnosis?: string;
    generalAdvice?: string;
  };
  inputMode?: 'document' | 'voice' | 'mixed';
  audioUrl?: string;
}

const MyUpload: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Modal States
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // For Files
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Folder Modal States
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState("");

  // Navigation State
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  // const [sortBy, setSortBy] = useState("createdAt");
  // const [sortOrder, setSortOrder] = useState("desc");
  // const [fileTypeFilter, setFileTypeFilter] = useState("all");
  // const [uploadSource, setUploadSource] = useState("all");
  const [dateRange, setDateRange] = useState<{ start?: string, end?: string }>({});

  // Fetch Reports
  const { data: reportsRes, isLoading: loadingReports } = useQuery({
    queryKey: ["reports", "patient", currentFolder?._id, searchQuery, dateRange],
    queryFn: () => getReportsApi({
      uploadedBy: "patient",
      folderId: currentFolder ? currentFolder._id : "root", // Fetch root files if no folder selected
      search: searchQuery,
      // sortBy,
      // sortOrder,
      // fileType: fileTypeFilter,
      startDate: dateRange.start,
      endDate: dateRange.end,
      // uploadSource // Assuming API supports this if needed, otherwise client filter (but relying on backend as per plan)
    })
  });

  // Fetch Folders (Only needed at root level for display, but useful for 'Move' actions globally)
  const { data: foldersRes, isLoading: loadingFolders } = useQuery({
    queryKey: ["folders"],
    queryFn: getFoldersApi
  });

  const folders: Folder[] = (foldersRes as any)?.data?.data || [];
  const documents: Document[] = (reportsRes as any)?.data?.data || [];

  // Folder Mutations
  const createFolderMutation = useMutation({
    mutationFn: createFolderApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.success("Folder created successfully");
      setFolderName("");
      setShowCreateFolder(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create folder");
    }
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateFolderApi(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.success("Folder renamed successfully");
      setFolderName("");
      setShowRenameModal(false);
      setSelectedFolder(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update folder");
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: deleteFolderApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.success("Folder deleted successfully");
      setShowDeleteFolderModal(false);
      setSelectedFolder(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete folder");
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Voice Recording States
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSavingVoice, setIsSavingVoice] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [audioUrl]);

  const resetVoiceModal = () => {
    setIsRecording(false);
    setIsTranscribing(false);
    setIsSavingVoice(false);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioFileName('');
    setVoiceTranscript('');
    setAiQuestions([]);
    setIsGeneratingQuestions(false);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const transcribeAudio = async (blob: Blob, fileName: string) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, fileName);
      const res = await axiosClient.post('/transcribe-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const transcript = res.data?.data?.transcriptText || '';
      setVoiceTranscript(transcript);
      if (transcript) toast.success('AI transcript ready!');
      else toast.warn('Transcript came back empty. You can type notes manually.');
    } catch {
      toast.error('Transcription failed. You can type notes manually.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleGetQuestions = async () => {
    if (!voiceTranscript.trim()) {
      toast.error('Transcript is empty. Cannot generate questions.');
      return;
    }

    setIsGeneratingQuestions(true);
    try {
      const res = await axiosClient.post('/generate-questions', { transcript: voiceTranscript });
      if (res.data?.success && res.data?.questions) {
        setAiQuestions(res.data.questions);
        toast.success('AI generated questions successfully');
      } else {
        toast.error('Failed to generate questions');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate questions');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeTypes = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'];
      const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType: supportedMimeType });
      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('mpeg') ? 'mp3' : mimeType.includes('webm') ? 'webm' : 'mp4';
        const url = URL.createObjectURL(blob);
        const name = `voice-note-${Date.now()}.${ext}`;
        setAudioBlob(blob);
        setAudioUrl(url);
        setAudioFileName(name);
        transcribeAudio(blob, name);
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error('Microphone permission denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsRecording(false);
  };

  const handleSaveVoiceNote = async () => {
    if (!audioBlob) { toast.error('No recording to save.'); return; }
    setIsSavingVoice(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, audioFileName || 'voice-note.webm');
      formData.append('uploadedBy', 'patient');
      if (user?._id) formData.append('patientId', user._id);
      if (currentFolder?._id) formData.append('folderId', currentFolder._id);
      if (voiceTranscript.trim()) formData.append('transcriptText', voiceTranscript.trim());
      await axiosClient.post('/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Voice note saved successfully!');
      setShowVoiceModal(false);
      resetVoiceModal();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save voice note.');
    } finally {
      setIsSavingVoice(false);
    }
  };

  const handleOpenVoiceModal = () => {
    setShowAddDocumentModal(false);
    resetVoiceModal();
    setShowVoiceModal(true);
  };


  // Helpers
  const handleCreateFolder = () => {
    if (!folderName.trim()) return;
    createFolderMutation.mutate({ name: folderName });
  };

  const handleRename = (folder: Folder) => {
    setSelectedFolder(folder);
    setFolderName(folder.name);
    setShowRenameModal(true);
  };

  const handleRenameSubmit = () => {
    if (!folderName.trim() || !selectedFolder) return;
    updateFolderMutation.mutate({ id: selectedFolder._id, name: folderName });
  };

  const handleDeleteFolder = (folder: Folder) => {
    setSelectedFolder(folder);
    setShowDeleteFolderModal(true);
  };

  const handleDeleteFolderConfirm = () => {
    if (!selectedFolder) return;
    deleteFolderMutation.mutate(selectedFolder._id);
  };

  const handleUploadFile = () => {
    fileInputRef.current?.click();
    setShowAddDocumentModal(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploadedBy", "patient");
    if (user?._id) formData.append("patientId", user._id);
    if (currentFolder?._id) formData.append("folderId", currentFolder._id); // Add to current folder
    formData.append("uploadSource", "manual"); // Indicate manual upload

    toast.promise(
      axiosClient.post("/upload-document", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      }),
      {
        pending: "Uploading document...",
        success: {
          render() {
            queryClient.invalidateQueries({ queryKey: ["reports"] });
            return "Document uploaded successfully!";
          }
        },
        error: {
          render({ data }: any) {
            const errData = data?.response?.data;
            if (errData?.upgradeRequired) {
              // Show upgrade prompt instead of generic error
              setTimeout(() => {
                toast.info(
                  <span>
                    {errData.message}{" "}
                    <strong
                      className="underline cursor-pointer text-purple-700"
                      onClick={() => navigate('/subscription')}
                    >
                      Upgrade &rarr;
                    </strong>
                  </span>,
                  { autoClose: 8000 }
                );
              }, 300);
              return "OCR limit reached for this month.";
            }
            return errData?.message || "Upload failed";
          }
        }
      }
    );
  };

  const handleCapturePhoto = () => {
    cameraInputRef.current?.click();
    setShowAddDocumentModal(false);
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Real upload logic
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploadedBy", "patient");
    if (user?._id) formData.append("patientId", user._id);
    if (currentFolder?._id) formData.append("folderId", currentFolder._id);
    formData.append("uploadSource", "camera");

    toast.promise(
      axiosClient.post("/upload-document", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      }),
      {
        pending: "Uploading photo...",
        success: {
          render() {
            queryClient.invalidateQueries({ queryKey: ["reports"] });
            return "Photo uploaded successfully!";
          }
        },
        error: {
          render({ data }: any) {
            const errData = data?.response?.data;
            if (errData?.upgradeRequired) {
              setTimeout(() => {
                toast.info(
                  <span>
                    {errData.message}{" "}
                    <strong
                      className="underline cursor-pointer text-purple-700"
                      onClick={() => navigate('/subscription')}
                    >
                      Upgrade &rarr;
                    </strong>
                  </span>,
                  { autoClose: 8000 }
                );
              }, 300);
              return "OCR limit reached for this month.";
            }
            return errData?.message || "Upload failed";
          }
        }
      }
    );
  };

  const handleDeleteClick = (doc: Document) => {
    setSelectedDocument(doc);
    setShowDeleteModal(true);
  };

  const handleMoveClick = (doc: Document) => {
    setSelectedDocument(doc);
    setShowMoveModal(true);
  };

  const handleDetailClick = (doc: Document) => {
    setSelectedDocument(doc);
    setShowDetailModal(true);
  };

  const handleMoveConfirm = async (folderId: string | null) => {
    if (!selectedDocument) return;
    try {
      await axiosClient.put(`/report/${selectedDocument._id}/move`, { folderId });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Document moved successfully");
      setShowMoveModal(false);
      setSelectedDocument(null);
    } catch (error) {
      toast.error("Failed to move document");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDocument) return;
    try {
      await axiosClient.delete(`/report/${selectedDocument._id}`);
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Document deleted successfully");
    } catch (e) {
      toast.error("Failed to delete document");
    }
    setShowDeleteModal(false);
    setSelectedDocument(null);
  };

  return (
    <section className="py-10 lg:py-18 bg-[var(--color-slate-50)]">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />

      <div className="container">
        <div className="bg-white rounded-[15px]">

          {/* Header */}
          <div className="flex justify-between items-center mb-[15px] p-[15px] border-b border-[#F1F5F9]">
            <h1 className="headings-web-h4-headline bold text-[#374151]">My Upload</h1>
            <div className="flex gap-2">
              {!currentFolder && !searchQuery && (
                <button
                  onClick={() => { setFolderName(""); setShowCreateFolder(true); }}
                  className="btn btn-outline"
                >
                  Create Folder
                </button>
              )}
              <button
                onClick={() => setShowAddDocumentModal(true)}
                className="btn"
              >
                Add Document
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          {loadingReports || loadingFolders ? (
            <div className="flex justify-center py-20"><Loader text="Loading reports..." /></div>
          ) : documents.length === 0 && folders.length === 0 && !searchQuery && !currentFolder ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center min-h-[500px]">
              <div className="w-20 h-20 bg-[#F3E8FF] rounded-full flex items-center justify-center mb-6">
                <img src="/images/doc.svg" alt="doc" />
              </div>

              <h3 className="headings-h4-headline text-[#1E293B] font-['AeonikMedium'] mb-2">
                No report added
              </h3>
              <p className="headings-h4-headline text-[#1E293B] font-['AeonikMedium'] mb-8">
                yet.
              </p>

              <div className="flex gap-4">
                <button onClick={() => { setFolderName(""); setShowCreateFolder(true); }} className="btn btn-outline">
                  Create Folder
                </button>
                <button
                  onClick={() => setShowAddDocumentModal(true)}
                  className="btn"
                >
                  Add Document
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Filters */}
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4 px-4 pt-4">

                {/* Search */}
                <div className="relative flex-1 min-w-[280px] max-w-[320px]">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-control"
                  />
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* Date Range */}
                  <div className="relative text-black flex gap-2 items-center">
                    <input
                      type="date"
                      value={dateRange.start || ''}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="px-3 py-2.5  rounded-lg border border-slate-200 bg-white text-sm focus:border-purple-500 outline-none"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="date"
                      value={dateRange.end || ''}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:border-purple-500 outline-none"
                    />
                  </div>

                  {/* Upload Source Filter */}
                  {/* <div className="relative">
                    <select
                      value={uploadSource}
                      onChange={(e) => setUploadSource(e.target.value)}
                      className="form-control min-w-[160px]"
                    >
                      <option value="all">Upload Source</option>
                      <option value="manual">Manual Upload</option>
                      <option value="camera">Camera</option>
                    </select>
                  </div> */}
                </div>
              </div>

              {/* Folders & Files Container */}
              <div className="p-4">

                {/* Folders Grid - Show at root when no search */}
                {!currentFolder && folders.length > 0 && !searchQuery && (
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Folders</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {folders.map(folder => (
                        <div key={folder._id} className="group relative">
                          <div
                            onClick={() => setCurrentFolder(folder)}
                            className="bg-slate-50 hover:bg-purple-50 border border-slate-100 hover:border-purple-100 rounded-xl p-4 cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-purple-600 shadow-sm">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-slate-900 truncate">{folder.name}</h4>
                                <p className="text-xs text-slate-500">{new Date(folder.updatedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>

                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRename(folder); }}
                              className="p-1.5 bg-white rounded-md shadow-sm text-slate-500 hover:text-purple-600"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }}
                              className="p-1.5 bg-white rounded-md shadow-sm text-slate-500 hover:text-red-500"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files Grid */}
                <div>
                  {(currentFolder || searchQuery) && (
                    <div className="flex items-center gap-2 mb-4">
                      {currentFolder && (
                        <button
                          onClick={() => setCurrentFolder(null)}
                          className="text-sm text-slate-500 hover:text-purple-600 flex items-center gap-1"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
                          Back
                        </button>
                      )}
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                        {currentFolder ? currentFolder.name : 'Search Results'} ({documents.length})
                      </h3>
                    </div>
                  )}

                  {!currentFolder && !searchQuery && (
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                      All Files ({documents.length})
                    </h3>
                  )}

                  {documents.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-400">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-1">No files found</h3>
                      <p className="text-slate-500 mb-4">{searchQuery ? 'Try adjusting your search or filters' : 'Upload your first document here'}</p>
                      {!searchQuery && (
                        <button onClick={() => setShowAddDocumentModal(true)} className="btn btn-sm">
                          Upload File
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {documents.map(doc => (
                        <div key={doc._id} className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow group flex flex-col justify-between">
                          <div
                            className="flex items-start gap-4 cursor-pointer mb-2"
                            onClick={() => handleDetailClick(doc)}
                          >
                            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 flex-shrink-0">
                              {doc.inputMode === 'voice' ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                  <line x1="12" y1="19" x2="12" y2="23"/>
                                </svg>
                              ) : doc.fileName.toLowerCase().endsWith('.pdf') ? (
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
                                onClick={(e) => { e.stopPropagation(); handleDetailClick(doc); }}
                                className="p-1.5 text-slate-400 hover:text-purple-600" title="View Details"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMoveClick(doc); }}
                                className="p-1.5 text-slate-400 hover:text-blue-600" title="Move to folder"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(doc); }}
                                className="p-1.5 text-slate-400 hover:text-red-500" title="Delete"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Document Modal */}
      {
        showAddDocumentModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[2000] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[510px] rounded-[28px] shadow-2xl relative animate-in fade-in zoom-in duration-300">
              <button
                onClick={() => setShowAddDocumentModal(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-950 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </button>

              <div className="p-8">
                <h3 className="headings-h4-headline text-black font-['AeonikMedium'] mb-8">
                  Add Document
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  {/* Upload File */}
                  <button
                    onClick={handleUploadFile}
                    className="flex flex-col items-center justify-center text-center transition-colors cursor-pointer"
                  >
                    <div className="bg-[#F4ECFB] rounded-[10px] p-6 w-full flex flex-col items-center justify-center gap-3">
                      <div className="w-[50px] h-[50px] bg-[#9146C1] text-white rounded-full flex items-center justify-center">
                        <img src="/images/up.svg" alt="" />
                      </div>
                    </div>
                    <h4 className="headings-web-h6-headline text-[var(--color-gray-700)] mt-[10px] text-sm">
                      Upload File
                    </h4>
                  </button>

                  {/* Capture Photo */}
                  <button
                    onClick={handleCapturePhoto}
                    className="flex flex-col items-center justify-center text-center transition-colors cursor-pointer"
                  >
                    <div className="bg-[#F4ECFB] rounded-[10px] p-6 w-full flex flex-col items-center justify-center gap-3">
                      <div className="w-[50px] h-[50px] bg-[#9146C1] text-white rounded-full flex items-center justify-center">
                        <img src="/images/capt.svg" alt="" />
                      </div>
                    </div>
                    <h4 className="headings-web-h6-headline text-[var(--color-gray-700)] mt-[10px] text-sm">
                      Capture Photo
                    </h4>
                  </button>

                  {/* Voice Recording */}
                  <button
                    onClick={handleOpenVoiceModal}
                    className="flex flex-col items-center justify-center text-center transition-colors cursor-pointer"
                  >
                    <div className="bg-[#F4ECFB] rounded-[10px] p-6 w-full flex flex-col items-center justify-center gap-3">
                      <div className="w-[50px] h-[50px] bg-[#9146C1] text-white rounded-full flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                          <line x1="12" y1="19" x2="12" y2="23"/>
                          <line x1="8" y1="23" x2="16" y2="23"/>
                        </svg>
                      </div>
                    </div>
                    <h4 className="headings-web-h6-headline text-[var(--color-gray-700)] mt-[10px] text-sm">
                      Voice Note
                    </h4>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Voice Recording Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[2000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[520px] rounded-[28px] shadow-2xl relative animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Voice Note</h3>
                  <p className="text-xs text-slate-400">Record your symptoms or medical notes</p>
                </div>
              </div>
              <button
                onClick={() => { setShowVoiceModal(false); resetVoiceModal(); }}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Recording Button */}
              <div className="flex flex-col items-center gap-4">
                {!audioBlob ? (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing}
                    className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-2 text-white text-xs font-bold shadow-xl transition-all active:scale-95 ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                        Stop
                      </>
                    ) : (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                          <line x1="12" y1="19" x2="12" y2="23"/>
                        </svg>
                        Record my visit
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-full">
                    <audio controls className="w-full rounded-xl">
                      <source src={audioUrl || ''} />
                    </audio>
                    <button
                      onClick={() => { if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioBlob(null); setAudioUrl(null); setVoiceTranscript(''); }}
                      className="mt-2 text-xs text-red-400 hover:text-red-600 flex items-center gap-1 mx-auto"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      Re-record
                    </button>
                  </div>
                )}
                {isRecording && (
                  <p className="text-xs text-red-500 font-medium animate-pulse">🔴 Recording... Tap Stop when done</p>
                )}
              </div>

              {/* Transcript */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  {isTranscribing ? '⏳ Transcribing with AI...' : 'Editable Transcript'}
                </label>
                <textarea
                  value={voiceTranscript}
                  onChange={(e) => setVoiceTranscript(e.target.value)}
                  disabled={isTranscribing}
                  rows={4}
                  placeholder={isTranscribing ? 'AI is transcribing your recording...' : 'Transcript will appear here. You can also type notes manually.'}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none resize-none transition-all disabled:bg-slate-50 disabled:text-slate-400 mb-4"
                />
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleGetQuestions}
                        disabled={!voiceTranscript.trim() || isGeneratingQuestions || isTranscribing}
                        className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                        </svg>
                        {isGeneratingQuestions ? 'Generating...' : 'Get questions'}
                    </button>
                </div>

                {aiQuestions.length > 0 && (
                    <div className="mt-4 p-4 rounded-xl bg-purple-50 border border-purple-100 max-h-[200px] overflow-y-auto">
                        <h4 className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                            </svg>
                            AI Suggested Questions
                        </h4>
                        <ul className="space-y-2">
                            {aiQuestions.map((q, idx) => (
                                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                                    <span className="text-purple-500 font-bold mt-0.5">•</span>
                                    {q}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowVoiceModal(false); resetVoiceModal(); }}
                  className="flex-1 btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveVoiceNote}
                  disabled={!audioBlob || isSavingVoice || isTranscribing}
                  className="flex-1 btn disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSavingVoice ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Voice Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move Reports Modal */}
      {
        showMoveModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[2000] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[400px] rounded-[20px] shadow-2xl relative animate-in fade-in zoom-in duration-300">
              <button
                onClick={() => setShowMoveModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-950 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              </button>

              <div className="p-6">
                <h3 className="headings-h5-headline text-black mb-4">
                  Move to Folder
                </h3>

                <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2">
                  <button
                    onClick={() => handleMoveConfirm(null)}
                    className="p-3 text-left rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    </div>
                    <span className="font-medium text-slate-700">Root (No Folder)</span>
                  </button>

                  {folders.map(folder => (
                    <button
                      key={folder._id}
                      onClick={() => handleMoveConfirm(folder._id)}
                      className="p-3 text-left rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                      </div>
                      <span className="font-medium text-slate-700">{folder.name}</span>
                    </button>
                  ))}

                  {folders.length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-sm">
                      No folders to move to.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Document Modal */}
      {
        showDeleteModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[2000] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[452px] rounded-[15px] overflow-hidden animate-in fade-in zoom-in duration-300 relative text-center">
              <div className="p-[20px]">
                <div className="w-[77px] h-[77px] bg-[#F5E7FF] text-[#9146C1] rounded-full flex items-center justify-center mx-auto mb-6">
                  <img src="/images/delete.svg" alt="delete" />
                </div>
                <h3 className="headings-web-h4-headline text-center text-slate-800 mb-8 tracking-tight">Are you sure you want to <br />remove this document?</h3>
                <div className="flex gap-4">
                  <button onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedDocument(null);
                  }} className="flex-1 btn">No</button>
                  <button onClick={handleDeleteConfirm} className="btn btn-black flex-1">Yes</button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[2000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[400px] rounded-[20px] shadow-xl p-6 relative animate-in fade-in zoom-in duration-300">
            <h3 className="text-lg text-black font-semibold mb-4">Create New Folder</h3>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder Name"
              className="w-full text-black px-4 py-2 rounded-lg border border-slate-200 focus:border-purple-500 outline-none mb-6 placeholder:text-black"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateFolder(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="btn bg-purple-600 text-white hover:bg-purple-700"
                disabled={!folderName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[2000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[400px] rounded-[20px] shadow-xl p-6 relative animate-in fade-in zoom-in duration-300">
            <h3 className="text-lg text-black font-semibold mb-4">Rename Folder</h3>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder Name"
              className="w-full px-4 py-2 text-black rounded-lg border border-slate-200 focus:border-purple-500 outline-none mb-6"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRenameModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSubmit}
                className="btn bg-purple-600 text-white hover:bg-purple-700"
                disabled={!folderName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Modal */}
      {showDeleteFolderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[2000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[400px] rounded-[20px] shadow-xl p-6 relative animate-in fade-in zoom-in duration-300 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </div>
            <h3 className="text-lg text-black font-bold mb-2">Delete Folder?</h3>
            <p className="text-slate-500 mb-6">Are you sure you want to delete this folder? All files inside will be permanently deleted.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteFolderModal(false)}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFolderConfirm}
                className="btn bg-red-600 text-white hover:bg-red-700 flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {showDetailModal && selectedDocument && (
        <ReportDetailModal
          report={selectedDocument}
          onClose={() => {
            setShowDetailModal(false);
            // Only clear selectedDocument if delete/move modal isn't also open
            if (!showDeleteModal && !showMoveModal) {
              setSelectedDocument(null);
            }
          }}
        />
      )}

    </section>
  );
};

export default MyUpload;