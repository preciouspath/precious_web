import { Request, Response } from "express";
import { Advertisement, AdStatus } from "../../models/Advertisement";

const IMPRESSION_COST = 0.01;
const CLICK_COST = 0.5;

const roundCurrency = (amount: number) => Math.round(amount * 100) / 100;

const getRemainingBudget = (ad: { budget?: number; spentAmount?: number }) =>
  Math.max(roundCurrency((ad.budget || 0) - (ad.spentAmount || 0)), 0);

const markCompletedIfNeeded = async (ad: any) => {
  const isBudgetExhausted = getRemainingBudget(ad) <= 0;
  const isExpired = !!ad.endDate && new Date(ad.endDate).getTime() < Date.now();

  if ((isBudgetExhausted || isExpired) && ad.status !== AdStatus.COMPLETED) {
    ad.status = AdStatus.COMPLETED;
    await ad.save();
  }

  return ad;
};

// Get random active ads for patient dashboard
export const getActiveAds = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        // Check if user has premium subscription
        const user = await import("../../models/user").then(m => m.default.findById(userId));

        if (user?.subscription?.type === "premium" && user?.subscription?.status === "active") {
            return res.json({ success: true, data: [] });
        }

        await Advertisement.updateMany(
            {
                status: { $in: [AdStatus.ACTIVE, AdStatus.APPROVED, AdStatus.PAUSED] },
                endDate: { $lt: new Date() }
            },
            { $set: { status: AdStatus.COMPLETED } }
        );

        const now = new Date();

        const ads = await Advertisement.aggregate([
            {
                $match: {
                    status: { $in: [AdStatus.ACTIVE, AdStatus.APPROVED] },
                    $expr: { $lt: ["$spentAmount", "$budget"] },
                    $and: [
                        {
                            $or: [
                                { startDate: { $exists: false } },
                                { startDate: null },
                                { startDate: { $lte: now } }
                            ]
                        },
                        {
                            $or: [
                                { endDate: { $exists: false } },
                                { endDate: null },
                                { endDate: { $gte: now } }
                            ]
                        }
                    ]
                }
            },
            { $sample: { size: 5 } }
        ]);

        return res.json({ success: true, data: ads });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

// Track ad impression
export const trackImpression = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const ad = await Advertisement.findById(id);
        if (!ad) return res.status(404).json({ success: false, message: "Ad not found" });

        if (![AdStatus.ACTIVE, AdStatus.APPROVED].includes(ad.status as AdStatus)) {
            return res.status(400).json({ success: false, message: "Ad is not active" });
        }

        if (ad.startDate && new Date(ad.startDate).getTime() > Date.now()) {
            return res.status(400).json({ success: false, message: "Ad has not started yet" });
        }

        if (ad.endDate && new Date(ad.endDate).getTime() < Date.now()) {
            ad.status = AdStatus.COMPLETED;
            await ad.save();
            return res.status(400).json({ success: false, message: "Ad has expired" });
        }

        const remainingBudget = getRemainingBudget(ad);
        if (remainingBudget <= 0) {
            ad.status = AdStatus.COMPLETED;
            await ad.save();
            return res.status(400).json({ success: false, message: "Ad budget exhausted" });
        }

        ad.reach = (ad.reach || 0) + 1;
        ad.spentAmount = roundCurrency((ad.spentAmount || 0) + Math.min(IMPRESSION_COST, remainingBudget));

        await ad.save();
        await markCompletedIfNeeded(ad);

        return res.json({
            success: true,
            message: "Impression tracked",
            data: {
                spentAmount: ad.spentAmount,
                remainingBudget: getRemainingBudget(ad),
                status: ad.status
            }
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

// Track ad click
export const trackClick = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const ad = await Advertisement.findById(id);
        if (!ad) return res.status(404).json({ success: false, message: "Ad not found" });

        if (![AdStatus.ACTIVE, AdStatus.APPROVED].includes(ad.status as AdStatus)) {
            return res.status(400).json({ success: false, message: "Ad is not active" });
        }

        if (ad.startDate && new Date(ad.startDate).getTime() > Date.now()) {
            return res.status(400).json({ success: false, message: "Ad has not started yet" });
        }

        if (ad.endDate && new Date(ad.endDate).getTime() < Date.now()) {
            ad.status = AdStatus.COMPLETED;
            await ad.save();
            return res.status(400).json({ success: false, message: "Ad has expired" });
        }

        const remainingBudget = getRemainingBudget(ad);
        if (remainingBudget <= 0) {
            ad.status = AdStatus.COMPLETED;
            await ad.save();
            return res.status(400).json({ success: false, message: "Ad budget exhausted" });
        }

        ad.clicks = (ad.clicks || 0) + 1;
        ad.spentAmount = roundCurrency((ad.spentAmount || 0) + Math.min(CLICK_COST, remainingBudget));

        await ad.save();
        await markCompletedIfNeeded(ad);

        return res.json({
            success: true,
            message: "Click tracked",
            data: {
                spentAmount: ad.spentAmount,
                remainingBudget: getRemainingBudget(ad),
                status: ad.status
            }
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};
