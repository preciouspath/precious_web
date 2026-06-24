import { Request, Response } from "express";
import { Campaign, CampaignStatus, CampaignObjective, BillingModel } from "../../models/Campaign";
import { AdSet } from "../../models/AdSet";
import { Creative } from "../../models/Creative";
import { SystemSetting } from "../../models/SystemSetting";
import { Types } from "mongoose";

// ─── Campaign Creation (Multi-Step / One-Shot) ──────────────────

export const createCampaignV2 = async (req: Request, res: Response) => {
    console.log("rainy jain !");
    try {
        const ownerId = (req as any).user.id;
        const {
            name,
            objective,
            totalBudget,
            dailyBudget,
            startDate,
            endDate,
            billingModel,
            // AdSet data
            targeting,
            placement,
            // Creative data
            creativeType,
            headline,
            description,
            ctaType,
            ctaLink
        } = req.body;

        const mediaUrl = req.file ? `/uploads/ads/${req.file.filename}` : undefined;

        // Fetch auto-approval setting
        const autoApproveSetting = await SystemSetting.findOne({ key: 'ads_auto_approve' });
        const isAutoApprove = autoApproveSetting && (autoApproveSetting.value === 'true' || autoApproveSetting.value === true);

        // 1. Create Campaign (starts as DRAFT until payment is completed)
        const campaign = new Campaign({
            ownerId,
            name,
            objective,
            totalBudget,
            dailyBudget,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            billingModel: billingModel || BillingModel.CPM,
            status: CampaignStatus.DRAFT,
            paymentStatus: 'unpaid'
        });

        await campaign.save();

        // 2. Create AdSet
        const adSet = new AdSet({
            campaignId: campaign._id,
            name: `${name} - Ad Set 1`,
            targeting: typeof targeting === 'string' ? JSON.parse(targeting) : targeting,
            placement: placement || 'dashboard_banner'
        });

        await adSet.save();

        // 3. Create Creative
        const creative = new Creative({
            adSetId: adSet._id,
            campaignId: campaign._id,
            type: creativeType || 'image',
            mediaUrl: mediaUrl || '',
            headline,
            description,
            ctaType: ctaType || 'learn_more',
            ctaLink
        });

        await creative.save();

        return res.status(201).json({
            success: true,
            message: "Campaign submitted for review",
            data: {
                campaignId: campaign._id,
                adSetId: adSet._id,
                creativeId: creative._id
            }
        });

    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

// ─── Get Campaigns with Metrics ───────────────────────────────

export const getCampaignsV2 = async (req: Request, res: Response) => {
    try {
        const ownerId = (req as any).user.id;
        const { status, page = "1", limit = "10", search } = req.query;

        const filters: any = { ownerId };
        if (status) filters.status = { $in: (status as string).split(',') };
        if (search) filters.name = { $regex: search as string, $options: "i" };

        const pageNumber = parseInt(page as string, 10);
        const pageSize = parseInt(limit as string, 10);

        const total = await Campaign.countDocuments(filters);
        const campaigns = await Campaign.find(filters)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .lean();

        // Attach AdSets and Creatives for summary view
        const enrichedCampaigns = await Promise.all(campaigns.map(async (c) => {
            const adSets = await AdSet.find({ campaignId: c._id }).lean();
            const creatives = await Creative.find({ campaignId: c._id }).lean();
            return { ...c, adSets, creatives };
        }));

        return res.json({
            success: true,
            data: enrichedCampaigns,
            meta: {
                total,
                page: pageNumber,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        });

    } catch (err: any) {
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

// ─── Get Campaign Details ────────────────────────────────────

export const getCampaignDetailsV2 = async (req: Request, res: Response) => {
    try {
        const ownerId = (req as any).user.id;
        const { id } = req.params;

        const campaign = await Campaign.findOne({ _id: id, ownerId }).lean();
        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

        const adSets = await AdSet.find({ campaignId: id }).lean();
        const creatives = await Creative.find({ campaignId: id }).lean();

        return res.json({
            success: true,
            data: {
                ...campaign,
                adSets,
                creatives
            }
        });

    } catch (err: any) {
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

// ─── Update Campaign Status (Pause/Resume) ────────────────────

export const updateCampaignStatusV2 = async (req: Request, res: Response) => {
    try {
        const ownerId = (req as any).user.id;
        const { id } = req.params;
        const { status } = req.body;

        const campaign = await Campaign.findOne({ _id: id, ownerId });
        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

        // Business can only switch between ACTIVE and PAUSED
        if (![CampaignStatus.ACTIVE, CampaignStatus.PAUSED].includes(status as CampaignStatus)) {
            // Exception: if campaign was PENDING, they can only PAUSE it or leave it.
            // If APPROVED, they can set it to ACTIVE.
        }

        campaign.status = status as CampaignStatus;
        await campaign.save();

        return res.json({ success: true, message: `Campaign ${status} successfully` });

    } catch (err: any) {
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

// ─── Get Ad Stats ─────────────────────────────────────────────

export const getAdStatsV2 = async (req: Request, res: Response) => {
    try {
        const ownerId = (req as any).user.id;

        const aggregation = await Campaign.aggregate([
            { $match: { ownerId: new Types.ObjectId(ownerId) } },
            {
                $group: {
                    _id: null,
                    totalAds: { $sum: 1 },
                    spentAmount: { $sum: "$spentAmount" },
                    reach: { $sum: "$metrics.uniqueReach" },
                    impressions: { $sum: "$metrics.impressions" },
                    clicks: { $sum: "$metrics.clicks" },
                    activeAds: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
                    approvedAds: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
                    pendingAds: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } }
                }
            }
        ]);

        const stats = aggregation[0] || {
            totalAds: 0,
            spentAmount: 0,
            reach: 0,
            impressions: 0,
            clicks: 0,
            activeAds: 0,
            approvedAds: 0,
            pendingAds: 0
        };

        return res.json({
            success: true,
            data: stats
        });

    } catch (err: any) {
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};
