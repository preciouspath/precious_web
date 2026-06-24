import { Schema, model, Types } from "mongoose";

export enum CreativeType {
  IMAGE = "image",
  VIDEO = "video",
  CAROUSEL = "carousel",
}

export enum CtaType {
  LEARN_MORE = "learn_more",
  BOOK_NOW = "book_now",
  CONTACT_US = "contact_us",
  VISIT_WEBSITE = "visit_website",
  GET_OFFER = "get_offer",
  SIGN_UP = "sign_up",
}

const creativeSchema = new Schema(
  {
    adSetId: {
      type: Types.ObjectId,
      ref: "AdSet",
      required: true,
      index: true,
    },

    // Denormalized for fast delivery queries
    campaignId: {
      type: Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: Object.values(CreativeType),
      default: CreativeType.IMAGE,
    },

    // ─── Media ─────────────────────────────────────────
    mediaUrl: { type: String, required: true }, // primary image or video
    mediaUrls: [{ type: String }], // for carousel (multiple images)
    thumbnailUrl: { type: String }, // for video preview

    // ─── Content ───────────────────────────────────────
    headline: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },

    // ─── CTA ───────────────────────────────────────────
    ctaType: {
      type: String,
      enum: Object.values(CtaType),
      default: CtaType.LEARN_MORE,
    },
    ctaLink: { type: String, trim: true }, // destination URL or in-app route

    // ─── Denormalized Metrics (updated periodically) ───
    metrics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ["active", "paused", "rejected"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Index for delivery: find active creatives for a campaign
creativeSchema.index({ campaignId: 1, status: 1 });
creativeSchema.index({ adSetId: 1, status: 1 });

export const Creative = model("Creative", creativeSchema);
