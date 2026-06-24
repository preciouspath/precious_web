import { Schema, model, Types } from "mongoose";

const adImpressionSchema = new Schema(
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

    placement: { type: String },
    cost: { type: Number, default: 0 }, // cost charged for this impression

    // User context snapshot at time of impression (for analytics breakdowns)
    userContext: {
      gender: { type: String },
      ageGroup: { type: String }, // e.g. "18-24", "25-34"
      country: { type: String },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // only need createdAt
  }
);

// ─── Indexes ───────────────────────────────────────────
// Primary lookup: how many times has this user seen this campaign today?
adImpressionSchema.index({ userId: 1, campaignId: 1, createdAt: -1 });

// Analytics: impressions per campaign over time
adImpressionSchema.index({ campaignId: 1, createdAt: -1 });

// Analytics: impressions per creative
adImpressionSchema.index({ creativeId: 1, createdAt: -1 });

// Auto-delete impressions older than 90 days to manage storage
adImpressionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AdImpression = model("AdImpression", adImpressionSchema);
