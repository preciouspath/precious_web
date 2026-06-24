import { Schema, model, Types } from "mongoose";

const otpSchema = new Schema(
  {
    ownerId: { type: Types.ObjectId, ref: "BusinessOwner", required: true },
    otp: { type: String, required: true },
    type: { type: String, enum: ["EMAIL", "MOBILE"], required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const OTP = model("OTP", otpSchema);
