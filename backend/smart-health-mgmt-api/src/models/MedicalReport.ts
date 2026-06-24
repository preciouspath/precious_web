import mongoose, { Schema, Document } from "mongoose";

export interface IMedicalReport extends Document {
    patientId: mongoose.Types.ObjectId;
    folderId?: mongoose.Types.ObjectId;
    fileUrl: string;
    fileName: string;
    fileType: string;
    inputMode?: "document" | "voice" | "mixed";
    audioUrl?: string;
    audioFileName?: string;
    audioMimeType?: string;
    transcriptText?: string;
    uploadedBy: "doctor" | "patient";
    uploadedAt: Date;
    ocrText?: string;
    ocrStatus?: "pending" | "completed" | "failed";
    isFlagged?: boolean;
        extractedData?: {
            patientDetails?: {
                name?: string;
                age?: string;
                address?: string;
        };
            doctorDetails?: {
                name?: string;
                specialty?: string;
            };
            medications?: string[];
            potentialDiagnosis?: string;
            generalAdvice?: string;
            labResults?: string;
            extractedAt?: Date;
        };
}

const medicalReportSchema = new Schema<IMedicalReport>(
    {
        patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        folderId: { type: Schema.Types.ObjectId, ref: "Folder" }, // Optional reference to a Folder
        fileUrl: { type: String },
        fileName: { type: String },
        fileType: { type: String },
        inputMode: { type: String, enum: ["document", "voice", "mixed"], default: "document" },
        audioUrl: { type: String },
        audioFileName: { type: String },
        audioMimeType: { type: String },
        transcriptText: { type: String },
        uploadedBy: { type: String, enum: ["doctor", "patient"], default: "doctor" },
        uploadedAt: { type: Date, default: Date.now },
        ocrText: { type: String },
        ocrStatus: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
        isFlagged: { type: Boolean, default: false },
        extractedData: {
            patientDetails: {
                name: String,
                age: String,
                address: String
            },
            doctorDetails: {
                name: String,
                specialty: String
            },
            medications: [String],
            potentialDiagnosis: String,
            generalAdvice: String,
            labResults: String,
            extractedAt: { type: Date, default: Date.now }
        }
    },
    { timestamps: true }
);

export default mongoose.models.MedicalReport || mongoose.model<IMedicalReport>("MedicalReport", medicalReportSchema);
