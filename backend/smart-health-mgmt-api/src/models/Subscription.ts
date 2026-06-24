import { Schema, model, Types } from "mongoose";

export enum PlanType {
    FREE = "Free",
    PREMIUM = "Premium",
}

export enum SubscriptionStatus {
    ACTIVE = "Active",
    CANCELLED = "Cancelled",
    EXPIRED = "Expired",
    PENDING = "Pending",
    FAILED = "Failed",
}

export interface ISubscription {
    userId: Types.ObjectId;
    userModel: "User" | "BusinessOwner";
    planType: PlanType;
    status: SubscriptionStatus;
    startDate: Date;
    expiryDate?: Date;
    autoRenew: boolean;
    amount: number;
    currency: string;
    transactionId?: string;
    paymentStatus: "Paid" | "Pending" | "Failed";
}

const subscriptionSchema = new Schema<ISubscription>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: "userModel",
        },
        userModel: {
            type: String,
            required: true,
            enum: ["User", "BusinessOwner"],
        },
        planType: {
            type: String,
            enum: Object.values(PlanType),
            default: PlanType.FREE,
        },
        status: {
            type: String,
            enum: Object.values(SubscriptionStatus),
            default: SubscriptionStatus.PENDING,
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        expiryDate: {
            type: Date,
        },
        autoRenew: {
            type: Boolean,
            default: false,
        },
        amount: {
            type: Number,
            default: 0,
        },
        currency: {
            type: String,
            default: "USD",
        },
        transactionId: {
            type: String,
        },
        paymentStatus: {
            type: String,
            enum: ["Paid", "Pending", "Failed"],
            default: "Pending",
        },
    },
    { timestamps: true }
);

export const Subscription = model<ISubscription>("Subscription", subscriptionSchema);
