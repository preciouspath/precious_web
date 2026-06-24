import { Request, Response } from "express";
import user from "../../models/user";
import { SubscriptionPlan } from "../../models/SubscriptionPlan";
import { Coupon } from "../../models/Coupon";
import { Types } from "mongoose";
import { SystemSetting } from "../../models/SystemSetting";

export const getSubscriptionPlans = async (req: Request, res: Response) => {
    try {
        let plans: any[] = await SubscriptionPlan.find({ isActive: true }).lean();

        // Seed initial plans if none exist
        if (plans.length === 0) {
            const initialPlans = [
                {
                    planId: "free",
                    name: "Free Plan",
                    price: 0,
                    currency: "USD",
                    interval: "monthly",
                    description: "Basic plan for everyone",
                    features: ["Ads enabled", "Unlimited uploads", "OCR transcription capped (5/month)"],
                    isActive: true
                },
                {
                    planId: "premium",
                    name: "Premium Plan",
                    price: 10,
                    currency: "USD",
                    interval: "monthly",
                    description: "Advanced features for professionals",
                    features: ["No ads", "Unlimited uploads", "Unlimited OCR"],
                    isActive: true
                }
            ];
            await SubscriptionPlan.insertMany(initialPlans);
            plans = await SubscriptionPlan.find({ isActive: true }).lean();
        }

        // ─── Override Premium Price from System Settings ──────────────────
        const premiumPriceSetting = await SystemSetting.findOne({ key: "premium_plan_monthly_price" }).lean();
        if (premiumPriceSetting && premiumPriceSetting.value) {
            const dynamicPrice = parseFloat(premiumPriceSetting.value);
            if (!isNaN(dynamicPrice)) {
                plans = plans.map(plan => {
                    if (plan.planId === 'premium') {
                        return { ...plan, price: dynamicPrice };
                    }
                    return plan;
                });
            }
        }

        res.json({
            success: true,
            data: plans
        });
    } catch (error) {
        console.error("Get Subscription Plans Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error });
    }
};

export const getSubscriptionStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const person = await user.findById(userId);

        if (!person) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const subscription = (person as any).subscription || { type: "free" };
        const planType: string = subscription.type || "free";
        const endDate: Date | undefined = subscription.endDate;
        const now = new Date();

        // ── Expiry Check ─────────────────────────────────────────────────────
        // If premium user's subscription has passed its end date, auto-downgrade them
        let isExpired = false;
        let effectivePlan = planType;

        if (planType === "premium" && endDate && now > new Date(endDate)) {
            isExpired = true;
            effectivePlan = "free";

            // Auto-downgrade in the database so future requests are consistent
            await user.findByIdAndUpdate(userId, {
                "subscription.type": "free",
                "subscription.status": "inactive",
            });

            console.log(`🔴 Auto-downgraded expired premium user ${userId}. Was valid until ${endDate}`);
        }

        res.json({
            success: true,
            data: {
                plan: effectivePlan,
                originalPlan: planType,
                isActive: !isExpired,
                isExpired,
                endDate: endDate ?? null,
                startDate: subscription.startDate ?? null,
                status: isExpired ? "expired" : (subscription.status || "active"),
            }
        });
    } catch (error) {
        console.error("Get Subscription Status Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error });
    }
};

export const upgradeSubscription = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { planId, promoCode } = req.body;

        const person = await user.findById(userId);
        if (!person) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(now.getMonth() + 1);

        (person as any).subscription = {
            type: "premium",
            startDate: now,
            endDate: endDate,
            status: "active",
        };
        if (promoCode) {
            const coupon = await Coupon.findOne({ code: promoCode });
            if (coupon && !coupon.usedByUsers.includes(userId)) {
                coupon.usedByUsers.push(userId);
                coupon.usedCount += 1;
                await coupon.save();
            }
        }

        await person.save();

        res.json({
            success: true,
            message: "Successfully upgraded to Premium plan",
            data: { plan: "premium" }
        });
    } catch (error) {
        console.error("Upgrade Subscription Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error });
    }
};

export const downgradeSubscription = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const person = await user.findById(userId);

        if (!person) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        (person as any).subscription = {
            type: "free",
            startDate: new Date(),
            status: "active",
        };

        await person.save();

        res.json({
            success: true,
            message: "Successfully downgraded to Free plan",
            data: { plan: "free" }
        });
    } catch (error) {
        console.error("Downgrade Subscription Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error });
    }
};
