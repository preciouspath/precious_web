import mongoose, { Schema, Document } from "mongoose";

export interface IInsurance extends Document {
    userId: mongoose.Types.ObjectId;
    patientName: string;
    contactInfo: string;
    insuranceCompany: string;
    insuranceType: string;
    documentUrl: string;
    fileName: string;
    fileType: string;
    dateAdded: Date;
}

const insuranceSchema = new Schema<IInsurance>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        patientName: { type: String, required: true },
        contactInfo: { type: String, required: true },
        insuranceCompany: { type: String, required: true },
        insuranceType: { type: String, required: true },
        documentUrl: { type: String, required: true },
        fileName: { type: String, required: true },
        fileType: { type: String },
        dateAdded: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export default mongoose.models.Insurance || mongoose.model<IInsurance>("Insurance", insuranceSchema);
