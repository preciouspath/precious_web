import { Schema, model, Types } from "mongoose";

export type DiscountType = "percentage" | "flat";

export interface ICoupon {
    code: string;
    discountType: DiscountType;
    discountPercentage: number;  // Used when discountType = "percentage" (0–100)
    discountAmount: number;      // Used when discountType = "flat" (in dollars, e.g. 5 = $5 off)
    validFrom: Date;
    validTo: Date;
    usageLimit: number;
    usedCount: number;
    usedByUsers: Types.ObjectId[];
    active: boolean;
}

const couponSchema = new Schema<ICoupon>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        discountType: {
            type: String,
            enum: ["percentage", "flat"],
            default: "percentage",
        },
        discountPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        discountAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        validFrom: {
            type: Date,
            required: true,
        },
        validTo: {
            type: Date,
            required: true,
        },
        usageLimit: {
            type: Number,
            required: true,
            default: 0, // 0 means unlimited
        },
        usedCount: {
            type: Number,
            default: 0,
        },
        usedByUsers: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        active: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

export const Coupon = model<ICoupon>("Coupon", couponSchema);
