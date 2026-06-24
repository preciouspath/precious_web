import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Loader from '../components/common/Loader';
import {
    Upload,
    Camera,
    FileText,
    CheckCircle,
    AlertCircle,
    Mic,
    Square,
    Image as ImageIcon,
    AudioLines,
    Trash2,
    Save,
    PencilLine,
    Sparkles,
    Loader2
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

type HealthProfile = {
    height?: number;
    weight?: number;
    bloodGroup?: string;
    healthConditions?: string;
};

type Patient = {
    fullName?: string;
    dateOfBirth?: string;
    healthProfile?: HealthProfile;
};

const DoctorUpload: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [patientData, setPatientData] = useState<Patient | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioFileName, setAudioFileName] = useState<string>('');
    const [transcriptText, setTranscriptText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [aiQuestions, setAiQuestions] = useState<string[]>([]);
    const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        const validatePatient = async () => {
            try {
                const res = await axiosClient.get(`/user/${patientId}`);
                if (res.data?.success && res.data?.data) {
                    setIsValid(true);
                    setPatientData(res.data.data);
                } else {
                    setIsValid(false);
                }
            } catch (_e) {
                setIsValid(false);
            }
        };

        if (patientId) {
            validatePatient();
        } else {
            setIsValid(false);
        }
    }, [patientId]);

    useEffect(() => {
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, [audioUrl]);

    const patientAge = useMemo(() => {
        if (!patientData?.dateOfBirth) return 'N/A';
        return new Date().getFullYear() - new Date(patientData.dateOfBirth).getFullYear();
    }, [patientData?.dateOfBirth]);

    const resetSelection = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setAudioBlob(null);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setAudioFileName('');
        setTranscriptText('');
        setIsTranscribing(false);
        setAiQuestions([]);
        setIsGeneratingQuestions(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreviewUrl(null);
        }
    };

    const transcribeAudioWithAi = async (blob: Blob, fileName: string) => {
        setIsTranscribing(true);
        try {
            const formData = new FormData();
            formData.append('audio', blob, fileName || 'voice-note.webm');

            const res = await axiosClient.post('/transcribe-audio', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const transcript = res.data?.data?.transcriptText || '';
            setTranscriptText(transcript);
            if (transcript) {
                toast.success('AI transcript generated');
            } else {
                toast.error('AI transcript came back empty');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'AI transcription failed');
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleGetQuestions = async () => {
        if (!transcriptText.trim()) {
            toast.error('Transcript is empty. Cannot generate questions.');
            return;
        }

        setIsGeneratingQuestions(true);
        try {
            const res = await axiosClient.post('/generate-questions', { transcript: transcriptText });
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

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        setIsRecording(false);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const mimeTypes = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'];
            const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
            
            const mediaRecorder = new MediaRecorder(stream, { mimeType: supportedMimeType });

            streamRef.current = stream;
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const mimeType = mediaRecorder.mimeType || 'audio/webm';
                const blob = new Blob(chunksRef.current, { type: mimeType });
                const nextAudioUrl = URL.createObjectURL(blob);
                const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('mpeg') ? 'mp3' : mimeType.includes('webm') ? 'webm' : 'mp4'; // Default to mp4 for professional look

                if (audioUrl) {
                    URL.revokeObjectURL(audioUrl);
                }

                setAudioBlob(blob);
                setAudioUrl(nextAudioUrl);
                const nextFileName = `voice-note-${Date.now()}.${extension}`;
                setAudioFileName(nextFileName);
                transcribeAudioWithAi(blob, nextFileName);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (_error) {
            toast.error('Microphone permission denied or unavailable.');
        }
    };

    const handleUpload = async () => {
        if (!patientId) return;
        if (!selectedFile && !audioBlob) {
            toast.error('Please add an image/document or record a voice note.');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('patientId', patientId);
            formData.append('uploadedBy', 'doctor');

            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            if (audioBlob) {
                formData.append('audio', audioBlob, audioFileName || 'voice-note.webm');
            }

            if (transcriptText.trim()) {
                formData.append('transcriptText', transcriptText.trim());
            }

            const res = await axiosClient.post('/upload-document', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (res.data?.success) {
                setUploadSuccess(true);
                toast.success('Upload saved successfully!');
            } else {
                toast.error(res.data?.message || 'Upload failed');
            }
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    if (isValid === null) {
        return (
            <section className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader text="Validating QR Code..." />
            </section>
        );
    }

    if (isValid === false) {
        return (
            <section className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
                    <div className="flex justify-center mb-4 text-red-500">
                        <AlertCircle size={64} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid QR Code</h1>
                    <p className="text-gray-600">
                        This QR code is invalid or has expired. Please request a new code from the patient.
                    </p>
                </div>
            </section>
        );
    }

    if (uploadSuccess) {
        return (
            <section className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
                    <div className="flex justify-center mb-4 text-green-500">
                        <CheckCircle size={64} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Upload Successful!</h1>
                    <p className="text-gray-600 mb-4">
                        The file and voice notes have been securely saved to {patientData?.fullName}'s account.
                    </p>
                    <button
                        onClick={() => {
                            setUploadSuccess(false);
                            resetSelection();
                        }}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Add Another Entry
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-purple-600 p-6 text-white text-center">
                        <h1 className="text-xl font-bold mb-1">Secure Document Upload</h1>
                        <p className="text-purple-200 text-sm">Patient: <strong>{patientData?.fullName}</strong></p>
                    </div>

                    <div className="p-6 md:p-7">
                        <div className="mb-8 bg-purple-50 rounded-xl p-5 border border-purple-100">
                            <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wider mb-4 border-b border-purple-200 pb-2">Patient Health Details</h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                <div>
                                    <p className="text-xs text-purple-500 font-medium">Age</p>
                                    <p className="text-[15px] text-gray-800 font-bold">{patientAge} Years</p>
                                </div>
                                <div>
                                    <p className="text-xs text-purple-500 font-medium">Blood Group</p>
                                    <p className="text-[15px] text-gray-800 font-bold">{patientData?.healthProfile?.bloodGroup || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-purple-500 font-medium">Height</p>
                                    <p className="text-[15px] text-gray-800 font-bold">{patientData?.healthProfile?.height || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-purple-500 font-medium">Weight</p>
                                    <p className="text-[15px] text-gray-800 font-bold">{patientData?.healthProfile?.weight || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-purple-500 font-medium">Health Conditions</p>
                                    <p className="text-[15px] text-gray-800 font-bold leading-tight">{patientData?.healthProfile?.healthConditions || 'None'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 p-5 bg-white">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                                        <ImageIcon size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Image or Document</h3>
                                        <p className="text-xs text-slate-500">Capture photo or upload prescription/report file.</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                                        <Camera size={22} className="text-gray-500" />
                                        <span className="text-gray-700 font-medium">Capture Photo</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>

                                    <label className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                                        <FileText size={22} className="text-gray-500" />
                                        <span className="text-gray-700 font-medium">Upload Image or PDF</span>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>

                                {selectedFile && (
                                    <div className="mt-4 space-y-3">
                                        {previewUrl && (
                                            <div className="border rounded-xl overflow-hidden bg-slate-50">
                                                <img src={previewUrl} alt="Preview" className="w-full max-h-52 object-contain" />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <FileText size={18} className="text-gray-500" />
                                            <span className="text-sm text-gray-700 truncate flex-1">{selectedFile.name}</span>
                                            <button
                                                onClick={() => {
                                                    setSelectedFile(null);
                                                    setPreviewUrl(null);
                                                }}
                                                className="text-red-500 hover:text-red-600"
                                                type="button"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border border-slate-200 p-5 bg-white">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <AudioLines size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Voice Recorder</h3>
                                        <p className="text-xs text-slate-500">Record notes, convert speech to text, then edit before saving.</p>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        {!isRecording ? (
                                            <button
                                                type="button"
                                                onClick={startRecording}
                                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                                            >
                                                <Mic size={16} />
                                                Record my visit
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={stopRecording}
                                                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                                            >
                                                <Square size={16} />
                                                Stop Recording
                                            </button>
                                        )}

                                        {audioBlob && !isRecording && (
                                            <button
                                                type="button"
                                                onClick={() => transcribeAudioWithAi(audioBlob, audioFileName || 'voice-note.webm')}
                                                disabled={isTranscribing}
                                                className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                                            >
                                                <Sparkles size={16} />
                                                {isTranscribing ? 'Generating...' : 'Generate AI Transcript'}
                                            </button>
                                        )}
                                    </div>

                                    {isRecording && (
                                        <div className="mt-3 text-sm text-rose-600 font-medium">
                                            Recording in progress...
                                        </div>
                                    )}

                                    {isTranscribing && (
                                        <div className="mt-3 text-sm text-purple-700 font-medium">
                                            Gemini is transcribing the voice note...
                                        </div>
                                    )}

                                    {audioUrl && (
                                        <div className="mt-4 space-y-3">
                                            <div className="rounded-xl bg-white border border-slate-200 p-3">
                                                <audio controls className="w-full">
                                                    <source src={audioUrl} />
                                                </audio>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-600 bg-white rounded-xl border border-slate-200 p-3">
                                                <Save size={16} className="text-emerald-600" />
                                                <span className="truncate flex-1">{audioFileName || 'voice-note.webm'}</span>
                                                <a
                                                    href={audioUrl}
                                                    download={audioFileName || 'voice-note.webm'}
                                                    className="text-emerald-700 font-medium hover:underline"
                                                >
                                                    Save audio
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <PencilLine size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Editable Transcript</h3>
                                    <p className="text-xs text-slate-500">Speech text appears here. You can correct and save it.</p>
                                </div>
                            </div>

                            <textarea
                                value={transcriptText}
                                onChange={(e) => setTranscriptText(e.target.value)}
                                placeholder="Recorded speech transcript will appear here. You can also type notes manually."
                                className="w-full min-h-[170px] rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-y mb-4"
                            />

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleGetQuestions}
                                    disabled={!transcriptText.trim() || isGeneratingQuestions || isTranscribing}
                                    className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                                >
                                    <Sparkles size={16} />
                                    {isGeneratingQuestions ? 'Generating...' : 'Get questions'}
                                </button>
                            </div>

                            {aiQuestions.length > 0 && (
                                <div className="mt-4 p-4 rounded-xl bg-purple-50 border border-purple-100">
                                    <h4 className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2">
                                        <Sparkles size={16} />
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

                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleUpload}
                                disabled={uploading || isTranscribing}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Saving to Record...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={20} />
                                        Save to Patient Record
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={resetSelection}
                                className="px-5 py-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                                Clear All
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 mt-4 text-center">
                            You can upload an image or PDF, record voice notes, edit the transcript, and save everything in one step.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DoctorUpload;
