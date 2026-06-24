import { X, FileText, User, Activity, ClipboardList, Info, Pill, Download, Mic } from 'lucide-react';
import { formatUploadUrl } from '../utils/urlHelper';
import { jsPDF } from 'jspdf';

interface ReportDetailModalProps {
    report: any;
    onClose: () => void;
}

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ report, onClose }) => {
    if (!report) return null;

    const cleanText = (text: string | undefined | null) => {
        if (!text) return '';
        // Remove markdown, backticks, and extra quotes/slashes
        return text
            .replace(/\*\*/g, '')
            .replace(/`/g, '')
            .replace(/^["'\\/]+|["'\\/]+$/g, '')
            .trim();
    };

    const extractedData = report.extractedData || {};
    const patientDetails = extractedData.patientDetails || {};
    const doctorDetails = extractedData.doctorDetails || {};
    const medications = extractedData.medications || [];
    const voiceTranscript = cleanText(report.transcriptText);
    // const rawDocumentText = cleanText(report.ocrText);
    const primaryFileUrl = formatUploadUrl(report.fileUrl);
    const audioFileUrl = formatUploadUrl(report.audioUrl || (report.fileType?.includes('audio') ? report.fileUrl : ''));
    const hasAudio = Boolean(audioFileUrl);
    const hasDocumentPreview = Boolean(report.fileUrl) && !report.fileType?.includes('audio');
    const isPdf = report.fileType?.includes('pdf');

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 20;

        doc.setFontSize(22);
        doc.setTextColor(145, 70, 193);
        doc.text("Smart Health Analysis", pageWidth / 2, y, { align: "center" });
        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Report for: ${report.fileName}`, pageWidth / 2, y, { align: "center" });
        y += 15;

        doc.setDrawColor(240);
        doc.line(20, y, pageWidth - 20, y);
        y += 15;

        const addSection = (title: string, data: any) => {
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setFontSize(14);
            doc.setTextColor(50);
            doc.setFont("helvetica", "bold");
            doc.text(title, 20, y);
            y += 8;
            doc.setFontSize(11);
            doc.setTextColor(80);
            doc.setFont("helvetica", "normal");

            if (Array.isArray(data)) {
                data.forEach(item => {
                    const lines = doc.splitTextToSize(`• ${cleanText(item)}`, pageWidth - 40);
                    doc.text(lines, 25, y);
                    y += (lines.length * 6);
                });
            } else if (typeof data === 'object') {
                Object.entries(data).forEach(([key, val]) => {
                    const label = key.charAt(0).toUpperCase() + key.slice(1) + ": ";
                    const value = cleanText(val as string) || "Not specified";
                    doc.setFont("helvetica", "bold");
                    doc.text(label, 25, y);
                    const labelWidth = doc.getTextWidth(label);
                    doc.setFont("helvetica", "normal");
                    doc.text(value, 25 + labelWidth, y);
                    y += 7;
                });
            } else {
                const lines = doc.splitTextToSize(cleanText(data), pageWidth - 40);
                doc.text(lines, 25, y);
                y += (lines.length * 6);
            }
            y += 10;
        };

        addSection("Patient Details", patientDetails);
        addSection("Doctor Details", doctorDetails);

        if (medications.length > 0) {
            addSection("Prescribed Medicines", medications);
        }

        if (voiceTranscript) {
            addSection("Voice Transcript", voiceTranscript);
        }

        if (extractedData.potentialDiagnosis) {
            addSection("Potential Diagnosis", extractedData.potentialDiagnosis);
        }

        if (extractedData.generalAdvice) {
            addSection("General Advice", extractedData.generalAdvice);
        }

        doc.setFontSize(8);
        doc.setTextColor(150);
        const disclaimer = "Note: The diagnosis is an AI-generated suggestion and is provided for informational purposes only. Please consult your doctor for medical advice.";
        const footerLines = doc.splitTextToSize(disclaimer, pageWidth - 40);
        doc.text(footerLines, 20, 280);

        doc.save(`${report.fileName}_analysis.pdf`);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[2500] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-7xl h-[92vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500 border border-white/20">
                {/* Header with Glassmorphism Effect */}
                <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{report.fileName}</h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                    <Activity size={12} className="text-purple-400" />
                                    AI-Powered Analysis
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                <span className="text-xs text-slate-400 tracking-wide uppercase font-semibold">
                                    {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2.5 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 group"
                        >
                            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                            <span>Export PDF</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-red-50 hover:text-red-500 rounded-2xl text-slate-400 transition-all group active:scale-90"
                        >
                            <X size={24} className="group-rotate-90 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Left Side: Extracted AI Content */}
                    <div className="w-full lg:w-[55%] overflow-y-auto p-8 lg:p-10 bg-white scrollbar-hide">
                        <div className="max-w-3xl mx-auto space-y-12">
                            {/* Patient & Doctor Details Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 hover:border-purple-100 transition-colors">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm border border-slate-100">
                                            <User size={16} />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Patient Card</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-400 font-medium">Name</span>
                                            <span className="text-slate-900 font-bold">{cleanText(patientDetails.name) || 'Unknown'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-400 font-medium">Age</span>
                                            <span className="text-slate-900 font-bold">{cleanText(patientDetails.age) || 'N/A'}</span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100 mt-2">
                                            <span className="text-xs text-slate-400 font-medium block mb-1">Residential Address</span>
                                            <span className="text-sm text-slate-600 leading-relaxed block">{cleanText(patientDetails.address) || 'No address specified'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 hover:border-purple-100 transition-colors">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm border border-slate-100">
                                            <ClipboardList size={16} />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase">Prescribing Dr.</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium mb-1">Doctor Name</p>
                                            <p className="text-sm text-slate-900 font-bold">{cleanText(doctorDetails.name) || 'Not visible'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium mb-1">Medical Specialty</p>
                                            <div className="inline-flex px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold border border-purple-100/50">
                                                {cleanText(doctorDetails.specialty) || 'General Practitioner'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Medicines Section with Modern List */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100">
                                            <Pill size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Prescribed Medication</h3>
                                            <p className="text-xs text-slate-400">Extracted and verified by AI analysis</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                        {medications.length} items
                                    </span>
                                </div>
                                <div className="grid gap-4">
                                    {medications && medications.length > 0 ? (
                                        medications.map((med: string, idx: number) => {
                                            const [name, ...desc] = med.split(':');
                                            return (
                                                <div key={idx} className="flex gap-5 p-5 bg-white rounded-3xl border border-slate-100 hover:shadow-xl hover:shadow-slate-100/50 hover:border-purple-100 transition-all group">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-sm font-black text-slate-300 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-inner">
                                                        {String(idx + 1).padStart(2, '0')}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-md font-bold text-slate-800 mb-1 group-hover:text-purple-600 transition-colors uppercase tracking-tight">{cleanText(name)}</h4>
                                                        {desc.length > 0 && <p className="text-sm text-slate-500 leading-relaxed">{cleanText(desc.join(':'))}</p>}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="p-10 rounded-[2.5rem] bg-slate-50/50 border border-dashed border-slate-200 flex flex-col items-center text-center">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                                                <Info size={32} />
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium">No medications could be clearly identified from this document.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Professional Diagnosis Section */}
                            <div className="p-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2.5rem] text-white shadow-2xl shadow-purple-200 relative overflow-hidden group">
                                <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                    <Activity size={200} />
                                </div>
                                <div className="flex items-center gap-3 mb-6 relative z-10">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                        <Activity size={20} />
                                    </div>
                                    <h3 className="text-md font-bold tracking-tight uppercase">AI Health Insights</h3>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-lg font-medium leading-relaxed opacity-95 mb-6">
                                        {cleanText(extractedData.potentialDiagnosis) || "Processing analysis insights..."}
                                    </p>
                                    <div className="flex items-start gap-3 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-xs leading-relaxed">
                                        <Info size={16} className="text-white flex-shrink-0" />
                                        <p className="opacity-80">
                                            Important: This diagnosis is an AI-generated synthesis based solely on the medications and text provided. It is not a professional medical diagnosis.
                                            <span className="block mt-1 font-bold">Please verify all information with your certified medical practitioner.</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* General Advice with Icon Grid */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 text-slate-800 rounded-2xl flex items-center justify-center border border-slate-100">
                                        <Info size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 tracking-tight tracking-tight">Clinical Guidance</h3>
                                </div>
                                <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
                                    <p className="text-md text-slate-600 leading-relaxed font-medium">
                                        {cleanText(extractedData.generalAdvice) || 'Follow the specific instructions provided on your prescription packaging and consult your pharmacist for any clarification.'}
                                    </p>
                                </div>
                            </div>

                            {/* Voice Transcript */}
                            {hasAudio && voiceTranscript && (
                                <div className="pt-10 border-t border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                        Voice Transcript
                                    </h3>
                                    <div className="bg-emerald-50/60 rounded-3xl p-6 select-all border border-emerald-100">
                                        <pre className="text-[11px] text-slate-600 whitespace-pre-wrap font-mono leading-loose">
                                            {voiceTranscript}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {/* OCR Text Fallback Layer */}
                            {/* {!medications.length && rawDocumentText && (
                                <div className="pt-10 border-t border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                        Raw Document Content
                                    </h3>
                                    <div className="bg-slate-50/50 rounded-3xl p-6 select-all">
                                        <pre className="text-[10px] text-slate-500 whitespace-pre-wrap font-mono leading-loose">
                                            {rawDocumentText}
                                        </pre>
                                    </div>
                                </div>
                            )} */}
                        </div>
                    </div>

                    {/* Right Side: High Fidelity Document Preview */}
                    <div className="w-full lg:w-[45%] h-full bg-slate-100/50 p-6 lg:p-10 relative">
                        <div className="w-full h-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col border border-white relative group">
                            {/* Toolbar */}
                            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
                                <div className="px-4 py-2 bg-slate-900/10 backdrop-blur-xl border border-white/20 rounded-2xl text-[10px] uppercase font-black text-slate-900 tracking-[0.2em]">
                                    Prescription Feed
                                </div>
                                <div className="flex gap-2">
                                    {primaryFileUrl && (
                                        <>
                                            <a
                                                href={primaryFileUrl}
                                                download
                                                className="p-3 bg-white text-slate-800 rounded-2xl shadow-lg border border-slate-100 hover:bg-purple-600 hover:text-white transition-all transform hover:scale-105 active:scale-95"
                                                title="Download Original"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                            </a>
                                            <a
                                                href={primaryFileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-3 bg-white text-slate-800 rounded-2xl shadow-lg border border-slate-100 hover:bg-purple-600 hover:text-white transition-all transform hover:scale-105 active:scale-95"
                                                title="Open in New Tab"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6"></path><path d="M10 14L21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                                            </a>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 w-full flex items-center justify-center p-12 bg-pattern overflow-auto scrollbar-hide">
                                {hasAudio && !hasDocumentPreview ? (
                                    <div className="w-full max-w-md space-y-6">
                                        <div className="flex flex-col items-center justify-center text-slate-400 gap-4">
                                            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-xl border border-slate-100 text-purple-600">
                                                <Mic size={48} />
                                            </div>
                                            <p className="font-bold text-slate-500">Voice Note Recording</p>
                                        </div>
                                        <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5 shadow-sm">
                                            <audio controls className="w-full">
                                                <source src={audioFileUrl} type={report.audioMimeType || report.fileType || 'audio/webm'} />
                                            </audio>
                                            <div className="mt-4 flex justify-center">
                                                <a
                                                    href={audioFileUrl}
                                                    download={report.audioFileName || report.fileName}
                                                    className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all"
                                                >
                                                    Download Audio
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ) : isPdf ? (
                                    <div className="flex flex-col items-center justify-center text-slate-300 gap-6">
                                        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-xl border border-slate-100 animate-pulse text-purple-600">
                                            <FileText size={48} />
                                        </div>
                                        <p className="font-bold text-slate-400">PDF Documentation</p>
                                        <a
                                            href={primaryFileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                                        >
                                            In-Browser Preview
                                        </a>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                                        {hasDocumentPreview && (
                                            <img
                                                src={primaryFileUrl}
                                                alt="Prescription Scan"
                                                className="max-w-full max-h-[65%] object-contain shadow-2xl rounded-lg animate-in fade-in zoom-in duration-700"
                                            />
                                        )}
                                        {hasAudio && (
                                            <div className="w-full max-w-md rounded-[1.75rem] border border-slate-100 bg-white/90 backdrop-blur p-4 shadow-xl">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Attached Voice Note</p>
                                                <audio controls className="w-full">
                                                    <source src={audioFileUrl} type={report.audioMimeType || 'audio/webm'} />
                                                </audio>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportDetailModal;
