import { Schema, model, Types } from "mongoose";

const adSetSchema = new Schema(
  {
    campaignId: {
      type: Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },

    name: { type: String, required: true, trim: true, maxlength: 100 },

    // ─── Audience Targeting ────────────────────────────
    targeting: {
      locations: [
        {
          type: {
            type: String,
            enum: ["city", "state", "country"],
            required: true,
          },
          value: { type: String, required: true }, // normalized lowercase
          label: { type: String }, // human-readable display name
        },
      ],

      ageRange: {
        min: { type: Number, default: 18, min: 13, max: 100 },
        max: { type: Number, default: 65, min: 13, max: 100 },
      },

      genders: {
        type: [String],
        enum: ["male", "female", "other", "all"],
        default: ["all"],
      },

      languages: [{ type: String }],

      // Health-specific targeting — unique to this platform
      interests: [{ type: String }], // e.g. diabetes, fitness, cardiac, dental, etc.
      healthConditions: [{ type: String }], // target by known conditions

      deviceTypes: {
        type: [String],
        enum: ["mobile", "desktop", "tablet", "all"],
        default: ["all"],
      },

      userStatus: {
        type: String,
        enum: ["all", "new", "active", "premium"],
        default: "all",
      },
    },

    // ─── Placement ─────────────────────────────────────
    placement: {
      type: String,
      enum: ["dashboard_banner", "sponsored_card"],
      default: "dashboard_banner",
    },

    // ─── Frequency Control ─────────────────────────────
    frequencyCap: {
      maxImpressionsPerDay: { type: Number, default: 3, min: 1, max: 50 },
      maxClicksPerDay: { type: Number, default: 5, min: 1, max: 50 },
      cooldownHours: { type: Number, default: 6, min: 0, max: 72 },
    },

    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Index for delivery queries
adSetSchema.index({ campaignId: 1, status: 1 });
adSetSchema.index({ "targeting.locations.value": 1 });

export const AdSet = model("AdSet", adSetSchema);
