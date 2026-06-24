import { Request, Response } from "express";
import { Campaign, CampaignStatus } from "../../models/Campaign";
import { AdSet } from "../../models/AdSet";
import { Creative } from "../../models/Creative";
import notificationService from "../../services/notificationService";
import { sendMail } from "../../utils/sendMail";

// Get all campaigns for admin
export const getAllCampaignsV2 = async (req: Request, res: Response) => {
    try {
        const { status, search, page = "1", limit = "10" } = req.query;

        const filters: any = {};
        if (status) filters.status = { $in: (status as string).split(',') };
        if (search) filters.name = { $regex: search as string, $options: "i" };

        const pageNumber = parseInt(page as string, 10);
        const pageSize = parseInt(limit as string, 10);

        const total = await Campaign.countDocuments(filters);
        const campaigns = await Campaign.find(filters)
            .populate("ownerId", "ownerName businessName email")
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .lean();

        // Attach AdSets and Creatives for details view
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

// Update campaign status (Moderation)
export const moderateCampaignV2 = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason, adminNotes } = req.body;

        const campaign = await Campaign.findById(id).populate("ownerId");
        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

        campaign.status = status as CampaignStatus;
        if (status === CampaignStatus.REJECTED) {
            campaign.rejectionReason = rejectionReason;
        }
        if (adminNotes) campaign.adminNotes = adminNotes;

        await campaign.save();

        // Notification logic
        const owner = campaign.ownerId as any;
        if (owner?.email) {
            if (status === CampaignStatus.APPROVED || status === CampaignStatus.ACTIVE) {
                await sendMail(owner.email, "Campaign Approved", `Your campaign "${campaign.name}" has been approved.`);
                await notificationService.notifyAdApproval(owner._id, campaign.name, campaign._id as any);
            } else if (status === CampaignStatus.REJECTED) {
                await sendMail(owner.email, "Campaign Rejected", `Your campaign "${campaign.name}" was rejected. Reason: ${rejectionReason}`);
                await notificationService.notifyAdRejection(owner._id, campaign.name, rejectionReason, campaign._id as any);
            }
        }

        return res.json({ success: true, message: `Campaign ${status} successfully` });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

// Get Platform Ad Stats
export const getPlatformAdStatsV2 = async (req: Request, res: Response) => {
    try {
        const stats = await Campaign.aggregate([
            {
                $group: {
                    _id: null,
                    totalSpent: { $sum: "$spentAmount" },
                    totalImpressions: { $sum: "$metrics.impressions" },
                    totalClicks: { $sum: "$metrics.clicks" },
                    campaignCount: { $sum: 1 }
                }
            }
        ]);

        return res.json({
            success: true,
            data: stats[0] || { totalSpent: 0, totalImpressions: 0, totalClicks: 0, campaignCount: 0 }
        });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

// Create campaign for a business (Admin)
export const createCampaignV2 = async (req: Request, res: Response) => {
    console.log("i am heree ")
    try {
        const {
            ownerId, // Admin MUST provide ownerId
            name,
            objective,
            totalBudget,
            dailyBudget,
            startDate,
            endDate,
            billingModel,
            targeting,
            placement,
            creativeType,
            headline,
            description,
            ctaType,
            ctaLink
        } = req.body;

        if (!ownerId) return res.status(400).json({ success: false, message: "ownerId is required" });

        const mediaUrl = req.file ? `/uploads/ads/${req.file.filename}` : undefined;

        const campaign = new Campaign({
            ownerId,
            name,
            objective,
            totalBudget,
            dailyBudget,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            billingModel: billingModel || 'cpm',
            status: CampaignStatus.APPROVED // Admin created are auto-approved
        });
        await campaign.save();

        const adSet = new AdSet({
            campaignId: campaign._id,
            name: `${name} - Ad Set 1`,
            targeting: typeof targeting === 'string' ? JSON.parse(targeting) : targeting,
            placement: placement || 'dashboard_banner'
        });
        await adSet.save();

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
            message: "Campaign created successfully",
            data: { campaignId: campaign._id }
        });

    } catch (err: any) {
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};
