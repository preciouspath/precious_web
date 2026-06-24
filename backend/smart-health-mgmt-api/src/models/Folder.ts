import mongoose, { Schema, Document } from "mongoose";

export interface IFolder extends Document {
    name: string;
    userId: mongoose.Types.ObjectId;
    type: string;
    createdAt: Date;
    updatedAt: Date;
}

const folderSchema = new Schema<IFolder>(
    {
        name: { type: String, required: true, trim: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, default: "folder" }, // "folder", "pdf", "image" - for icon display
    },
    { timestamps: true }
);

// Compound index to prevent duplicate folder names for the same user
folderSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.models.Folder || mongoose.model<IFolder>("Folder", folderSchema);
