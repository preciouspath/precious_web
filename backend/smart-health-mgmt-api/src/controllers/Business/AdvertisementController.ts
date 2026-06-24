import { Request, Response } from "express";
import { Advertisement, AdStatus } from "../../models/Advertisement";

const roundCurrency = (amount: number) => Math.round(amount * 100) / 100;

const attachBudgetMetrics = (ad: any) => {
    const budget = Number(ad.budget || 0);
    const spentAmount = Number(ad.spentAmount || 0);
    const remainingBudget = Math.max(roundCurrency(budget - spentAmount), 0);
    const budgetConsumedPercent = budget > 0 ? Math.min(Math.round((spentAmount / budget) * 100), 100) : 0;

    return {
        ...ad,
        remainingBudget,
        budgetConsumedPercent
    };
};

// ------------------------ Create Ad ------------------------
export const createAd = async (req: Request, res: Response) => {
    try {
        const ownerId = (req as any).user.id;
        const { title, description, targetLocation, budget, startDate, endDate } = req.body;
        const image = req.file ? `/uploads/profile/${req.file.filename}` : undefined;

        if (!title || !description || !image || !targetLocation || !budget) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const newAd = new Advertisement({
            ownerId,
            title,
            description,
            image,
            targetLocation,
            budget,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            status: AdStatus.PENDING, // Always pending for business owners
        });

        await newAd.save();

        return res.status(201).json({ success: true, message: "Advertisement created successfully", data: newAd });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err });
    }
};

// ------------------------ Get Ads ------------------------
export const getAds = async (req: Request, res: Response) => {
    try {
        const ownerId = (req as any).user.id;
        const {
            search,
            status,
            page = "1",
            limit = "10",
        } = req.query;

        const filters: any = { ownerId }; // Enforce ownership

        if (search) {
            filters.title = { $regex: search as string, $options: "i" };
        }

        if (status) {
            const statuses = (status as string).split(',');

            // If checking for Active, also include Approved ads (verified ads)
            if (statuses.includes(AdStatus.ACTIVE) && !statuses.includes(AdStatus.APPROVED)) {
                statuses.push(AdStatus.APPROVED);
            }

            filters.status = { $in: statuses };
        }

        const pageNumber = Math.max(parseInt(page as string, 10), 1);
        const pageSize = Math.max(parseInt(limit as string, 10), 1);

        await Advertisement.updateMany(
            {
                ownerId,
                status: { $in: [AdStatus.ACTIVE, AdStatus.APPROVED, AdStatus.PAUSED] },
                $or: [
                    { endDate: { $lt: new Date() } },
                    { $expr: { $gte: ["$spentAmount", "$budget"] } }
                ]
            },
            { $set: { status: AdStatus.COMPLETED } }
        );

        const total = await Advertisement.countDocuments(filters);

        const ads = await Advertisement.find(filters)
            .populate("ownerId", "ownerName businessName email") // Optional, but good for confirmation
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .lean();

        const enrichedAds = ads.map(attachBudgetMetrics);

        return res.json({
            success: true,
            data: enrichedAds,
            meta: {
                total,
                page: pageNumber,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err });
    }
};

// ------------------------ Get Ad Stats ------------------------
export const getAdStats = async (req: Request, res: Response) => {
    try {
        const ownerId = (req as any).user.id;
        const totalAds = await Advertisement.countDocuments({ ownerId });
        const activeAds = await Advertisement.countDocuments({ status: AdStatus.ACTIVE, ownerId });
        const pendingAds = await Advertisement.countDocuments({ status: AdStatus.PENDING, ownerId });
        const completedAds = await Advertisement.countDocuments({ status: AdStatus.COMPLETED, ownerId });
        const approvedAds = await Advertisement.countDocuments({ status: AdStatus.APPROVED, ownerId });

        // Aggregate total spend and reach
        const aggregation = await Advertisement.aggregate([
            { $match: { ownerId: ownerId } }, // Match strictly by string ID? Mongoose usually handles cast.
            // Note: ownerId in model is ObjectId. req.user.id is string.
            // We might need to cast if using aggregate.
            // However, let's try without casting first, or import Types.
        ]);

        // Since aggregate needs ObjectId usually:
        // Let's rely on simple find sum for safety if casting is tricky without mongoose types import
        // Or better:

        const adsList = await Advertisement.find({ ownerId }, "spentAmount reach");
        const totalSpent = adsList.reduce((acc, curr) => acc + (curr.spentAmount || 0), 0);
        const totalReach = adsList.reduce((acc, curr) => acc + (curr.reach || 0), 0);

        return res.json({
            success: true,
            data: {
                totalAds,
                activeAds,
                pendingAds,
                completedAds,
                approvedAds,
                spentAmount: totalSpent,
                reach: totalReach
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err });
    }
}

// ------------------------ Update Ad Status ------------------------
export const updateAdStatus = async (req: Request, res: Response) => {
    try {
        const ownerId = (req as any).user.id;
        const { id } = req.params;
        const { status } = req.body;

        if (!id || !status) {
            return res.status(400).json({ success: false, message: "Ad ID and status are required" });
        }

        // Only allow Business to PAUSE or CANCEL (simulated by STOPPED/EXPIRED or just PENDING/INACTIVE)
        // For now, let's assume they can switch between ACTIVE and PAUSED if we have a PAUSED status.
        // Or if they want to stop it. 
        // Let's restrict them from setting APPROVED.
        if (status === AdStatus.APPROVED) {
            return res.status(403).json({ success: false, message: "Cannot approve own ads" });
        }

        const ad = await Advertisement.findOne({ _id: id, ownerId });
        if (!ad) {
            return res.status(404).json({ success: false, message: "Advertisement not found" });
        }

        ad.status = status;
        await ad.save();

        return res.json({ success: true, message: `Ad status updated to ${status}`, data: ad });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err });
    }
};
