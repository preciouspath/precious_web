import { Schema, model, Types } from "mongoose";

const adClickSchema = new Schema(
  {
    campaignId: {
      type: Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    adSetId: {
      type: Types.ObjectId,
      ref: "AdSet",
      required: true,
    },
    creativeId: {
      type: Types.ObjectId,
      ref: "Creative",
      required: true,
    },
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    ctaType: { type: String },
    cost: { type: Number, default: 0 }, // cost charged for this click

    // User context snapshot
    userContext: {
      gender: { type: String },
      ageGroup: { type: String },
      country: { type: String },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ─── Indexes ───────────────────────────────────────────
// Frequency cap check: clicks by user on campaign today
adClickSchema.index({ userId: 1, campaignId: 1, createdAt: -1 });

// Analytics: clicks per campaign
adClickSchema.index({ campaignId: 1, createdAt: -1 });

// Analytics: clicks per creative
adClickSchema.index({ creativeId: 1, createdAt: -1 });

// Auto-delete clicks older than 90 days
adClickSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AdClick = model("AdClick", adClickSchema);
