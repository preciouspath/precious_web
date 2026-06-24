import mongoose, { Schema, Document } from "mongoose";

export interface IOnboarding extends Document {
    title: string;
    description: string;
    imageUrl: string;
    order: number; // To ensure screens appear in the correct sequence
    isActive: boolean;
}

const onboardingSchema = new Schema<IOnboarding>(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        imageUrl: { type: String, required: true },
        order: { type: Number, required: true, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.models.Onboarding ||
    mongoose.model<IOnboarding>("Onboarding", onboardingSchema);