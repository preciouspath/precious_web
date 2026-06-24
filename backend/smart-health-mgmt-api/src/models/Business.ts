import { Schema, model, Types } from "mongoose";

export enum KYCStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
}

const businessOwnerSchema = new Schema(
  {
    businessName: { type: String, required: true },
    ownerName: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
    },

    countryCode: {
      type: String,
      default: "+91",
    },

    password: {
      type: String,
      required: false, // not required for OTP login
    },

    businessAddress: {
      type: String,
      required: true,
    },

    businessLicense: {
      type: String, // file URL
      required: true,
    },
    profileImage: {
      type: String, // file URL
    },

    kycStatus: {
      type: String,
      enum: Object.values(KYCStatus),
      default: KYCStatus.PENDING,
    },

    kycRejectionReason: {
      type: String,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
    },

    tokenVersion: {
      type: Number,
      default: 0,
    },

    isMobileVerified: {
      type: Boolean,
      default: false,
    },

    // 🔔 FCM Push Token
    fcmToken: { type: String, default: null },

    lastLoginAt: Date,
    notificationPreferences: {
      emailAdApproval: { type: Boolean, default: true },
      emailPlatformUpdates: { type: Boolean, default: true },
      inAppCampaignStatus: { type: Boolean, default: true },
      inAppBudgetAlerts: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const BusinessOwner = model("BusinessOwner", businessOwnerSchema);
