import { Schema, model, Types } from "mongoose";

export enum AdStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  ACTIVE = "Active",
  PAUSED = "Paused",
  COMPLETED = "Completed",
}

const adSchema = new Schema(
  {
    ownerId: {
      type: Types.ObjectId,
      ref: "BusinessOwner",
      required: true,
    },

    title: { type: String, required: true },
    description: { type: String, required: true },

    image: { type: String, required: true },

    targetLocation: { type: String, required: true },

    startDate: Date,
    endDate: Date,

    budget: { type: Number, required: true },
    spentAmount: { type: Number, default: 0 },

    reach: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },

    status: {
      type: String,
      enum: Object.values(AdStatus),
      default: AdStatus.PENDING,
    },

    rejectionReason: String,
  },
  { timestamps: true }
);

export const Advertisement = model("Advertisement", adSchema);
