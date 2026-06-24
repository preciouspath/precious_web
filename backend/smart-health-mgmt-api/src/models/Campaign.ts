import { Schema, model, Types } from "mongoose";

export enum CampaignObjective {
  REACH = "reach",
  TRAFFIC = "traffic",
  MESSAGES = "messages",
  LEADS = "leads",
  ENGAGEMENT = "engagement",
  BRAND_AWARENESS = "brand_awareness",
}

export enum CampaignStatus {
  DRAFT = "draft",
  PENDING = "pending",
  APPROVED = "approved",
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  REJECTED = "rejected",
}

export enum BillingModel {
  CPM = "cpm", // Cost per 1000 impressions
  CPC = "cpc", // Cost per click
}

const campaignSchema = new Schema(
  {
    ownerId: {
      type: Types.ObjectId,
      ref: "BusinessOwner",
      required: true,
      index: true,
    },

    name: { type: String, required: true, trim: true, maxlength: 120 },

    objective: {
      type: String,
      enum: Object.values(CampaignObjective),
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(CampaignStatus),
      default: CampaignStatus.DRAFT,
      index: true,
    },

    // ─── Budget ────────────────────────────────────────
    totalBudget: { type: Number, required: true, min: 1 },
    dailyBudget: { type: Number, min: 0, default: 0 }, // 0 = no daily cap
    spentAmount: { type: Number, default: 0 },

    billingModel: {
      type: String,
      enum: Object.values(BillingModel),
      default: BillingModel.CPM,
    },

    // Cost rates (configurable per campaign)
    cpmRate: { type: Number, default: 10 }, // $ per 1000 impressions
    cpcRate: { type: Number, default: 0.5 }, // $ per click

    // ─── Schedule ──────────────────────────────────────
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // ─── Aggregated Metrics (updated periodically) ─────
    metrics: {
      impressions: { type: Number, default: 0 },
      uniqueReach: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 }, // clicks / impressions * 100
      avgCpc: { type: Number, default: 0 },
      avgCpm: { type: Number, default: 0 },
    },

    // ─── Moderation ────────────────────────────────────
    rejectionReason: { type: String },
    adminNotes: { type: String },

    // ─── Payment ──────────────────────────────────────
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "refunded"],
      default: "unpaid",
      index: true,
    },
    stripePaymentIntentId: { type: String },
    paidAmount: { type: Number, default: 0 },

    // ─── Migration ─────────────────────────────────────
    legacyAdId: { type: Types.ObjectId, ref: "Advertisement" },
  },
  { timestamps: true }
);

// Compound indexes for common queries
campaignSchema.index({ ownerId: 1, status: 1 });
campaignSchema.index({ status: 1, startDate: 1, endDate: 1 });
campaignSchema.index({ status: 1, spentAmount: 1, totalBudget: 1 });

// Virtual: remaining budget
campaignSchema.virtual("remainingBudget").get(function () {
  return Math.max(
    Math.round(((this.totalBudget || 0) - (this.spentAmount || 0)) * 100) / 100,
    0
  );
});

// Virtual: budget consumed percentage
campaignSchema.virtual("budgetConsumedPercent").get(function () {
  if (!this.totalBudget || this.totalBudget === 0) return 0;
  return Math.min(
    Math.round(((this.spentAmount || 0) / this.totalBudget) * 100),
    100
  );
});

// Ensure virtuals are included in JSON/Object output
campaignSchema.set("toJSON", { virtuals: true });
campaignSchema.set("toObject", { virtuals: true });

export const Campaign = model("Campaign", campaignSchema);
