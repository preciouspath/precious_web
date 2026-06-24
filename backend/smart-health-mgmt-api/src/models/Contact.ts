import mongoose, { Schema, Document } from "mongoose";

export interface IContact extends Document {
    name: string;
    email: string;
    subject: string;
    message: string;
    user?: mongoose.Types.ObjectId;
    status: 'pending' | 'resolved';
    createdAt: Date;
    updatedAt: Date;
}

const contactSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        subject: { type: String, required: true },
        message: { type: String, required: true },
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        status: {
            type: String,
            enum: ['pending', 'resolved'],
            default: 'pending'
        }
    },
    { timestamps: true }
);

export default mongoose.models.Contact || mongoose.model<IContact>("Contact", contactSchema);
