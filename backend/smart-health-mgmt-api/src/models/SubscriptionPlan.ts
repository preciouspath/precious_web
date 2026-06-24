import { Schema, model } from "mongoose";

export interface ISubscriptionPlan {
    planId: string;
    name: string;
    price: number;
    currency: string;
    interval: "monthly" | "yearly";
    description: string;
    features: string[];
    isActive: boolean;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
    {
        planId: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        currency: { type: String, default: "USD" },
        interval: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
        description: { type: String },
        features: [{ type: String }],
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const SubscriptionPlan = model<ISubscriptionPlan>("SubscriptionPlan", subscriptionPlanSchema);
