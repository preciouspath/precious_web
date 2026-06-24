import { Schema, model, Types } from "mongoose";

export enum PaymentStatus {
  PENDING = "pending",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  REFUNDED = "refunded",
  CANCELLED = "cancelled",
}

export interface IPayment {
  userId: Types.ObjectId;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  stripeCustomerId?: string;
  amount: number;           // Final charged amount in cents (e.g., 999 = $9.99)
  originalAmount?: number;  // Pre-discount amount in cents
  discountAmount?: number;  // Discount applied in cents
  couponCode?: string;      // Coupon code used (if any)
  planId?: string;          // Subscription plan that was purchased
  subscriptionId?: Types.ObjectId;  // Reference to Subscription record
  currency: string;
  status: PaymentStatus;
  description?: string;
  refundId?: string;
  refundedAmount?: number;
  metadata?: Record<string, any>;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      sparse: true,
      index: true,
      unique: true,
    },
    stripeSessionId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    originalAmount: {
      type: Number,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
    },
    planId: {
      type: String,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
    },
    currency: {
      type: String,
      default: "usd",
      lowercase: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    description: {
      type: String,
    },
    refundId: {
      type: String,
    },
    refundedAmount: {
      type: Number,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

export const Payment = model<IPayment>("Payment", paymentSchema);
