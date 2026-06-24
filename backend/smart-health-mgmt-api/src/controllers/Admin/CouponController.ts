import { Request, Response } from "express";
import { Coupon } from "../../models/Coupon";
import { SubscriptionPlan } from "../../models/SubscriptionPlan";
import asyncHandler from "../../utils/asyncHandler";
import { STATUS_CODE } from "../../utils/statusCode";
import { Parser } from "json2csv";
import moment from "moment";

// ─── Create Coupon (Admin) ───────────────────────────────────────────────────
export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
    try {
        const {
            code,
            discountType = "percentage",
            discountPercentage,
            discountAmount,
            validFrom,
            validTo,
            usageLimit,
        } = req.body;

        // Validate required fields
        if (!code || !validFrom || !validTo) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success: false,
                message: "Missing required fields: code, validFrom, validTo",
            });
        }

        // Validate discount values based on type
        if (discountType === "percentage") {
            if (!discountPercentage || discountPercentage <= 0 || discountPercentage > 100) {
                return res.status(STATUS_CODE.BAD_REQUEST).json({
                    success: false,
                    message: "discountPercentage must be between 1 and 100 for percentage coupons",
                });
            }
        } else if (discountType === "flat") {
            if (!discountAmount || discountAmount <= 0) {
                return res.status(STATUS_CODE.BAD_REQUEST).json({
                    success: false,
                    message: "discountAmount must be a positive number for flat coupons",
                });
            }
        } else {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success: false,
                message: "discountType must be 'percentage' or 'flat'",
            });
        }

        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success: false,
                message: "Coupon code already exists",
            });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountType,
            discountPercentage: discountType === "percentage" ? discountPercentage : 0,
            discountAmount: discountType === "flat" ? discountAmount : 0,
            validFrom: new Date(validFrom),
            validTo: new Date(validTo),
            usageLimit: usageLimit || 0,
        });

        res.status(STATUS_CODE.CREATED).json({
            success: true,
            message: "Coupon created successfully",
            data: coupon,
        });
    } catch (error) {
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error creating coupon",
            error,
        });
    }
});

// ─── Get Coupons (Admin) ─────────────────────────────────────────────────────
export const getCoupons = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { search, page = "1", limit = "10" } = req.query;

        const filters: any = {};
        if (search) {
            filters.code = { $regex: search as string, $options: "i" };
        }

        const pageNumber = parseInt(page as string, 10);
        const pageSize = parseInt(limit as string, 10);

        const coupons = await Coupon.find(filters)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .lean();

        const total = await Coupon.countDocuments(filters);

        res.status(STATUS_CODE.OK).json({
            success: true,
            data: coupons,
            meta: {
                total,
                page: pageNumber,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (error) {
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error fetching coupons",
            error,
        });
    }
});

// ─── Deactivate / Activate Coupon (Admin) ────────────────────────────────────
export const deactivateCoupon = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return res.status(STATUS_CODE.NOT_FOUND).json({
                success: false,
                message: "Coupon not found",
            });
        }

        coupon.active = !coupon.active;
        await coupon.save();

        res.status(STATUS_CODE.OK).json({
            success: true,
            message: `Coupon ${coupon.active ? "activated" : "deactivated"} successfully`,
            data: coupon,
        });
    } catch (error) {
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error deactivating coupon",
            error,
        });
    }
});

// ─── Export Coupons (Admin) ──────────────────────────────────────────────────
export const exportCoupons = asyncHandler(async (req: Request, res: Response) => {
    try {
        const coupons = await Coupon.find().lean();
        const parser = new Parser();
        const csv = parser.parse(coupons);

        res.header("Content-Type", "text/csv");
        res.attachment(`coupons-${moment().format("YYYYMMDD")}.csv`);
        return res.send(csv);
    } catch (error) {
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error exporting coupons",
            error,
        });
    }
});

// ─── Validate Coupon (Patient) ───────────────────────────────────────────────
// Called from the subscription page to check if a coupon is valid and
// calculate the discount amount + final payable amount for a given plan.
export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { code, planId } = req.body;

        if (!code) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success: false,
                message: "Coupon code is required",
            });
        }

        // Find coupon (case-insensitive match via uppercase storage)
        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        // Check existence
        if (!coupon) {
            return res.status(STATUS_CODE.NOT_FOUND).json({
                success: false,
                message: "Invalid coupon code. Please try again.",
            });
        }

        // Check if active
        if (!coupon.active) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success: false,
                message: "This coupon is no longer active.",
            });
        }

        // Check if user already used this coupon
        const userId = (req as any).user?.id;
        if (userId && coupon.usedByUsers.includes(userId)) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success: false,
                message: "You have already used this coupon code.",
            });
        }

        // Check expiry
        const now = new Date();
        if (now < coupon.validFrom || now > coupon.validTo) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success: false,
                message: "This coupon has expired.",
            });
        }

        // Check usage limit
        if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success: false,
                message: "This coupon has reached its usage limit.",
            });
        }

        // Look up plan price to calculate discount amounts
        let planPrice = 10; // Default fallback (Premium = $10)
        if (planId) {
            const plan = await SubscriptionPlan.findOne({ planId, isActive: true });
            if (plan) {
                planPrice = plan.price;
            }
        }

        // Calculate discount based on type
        let discountValue = 0; // In dollars
        if (coupon.discountType === "flat") {
            // Flat discount: e.g. $5 off — cap at plan price so it doesn't go negative
            discountValue = Math.min(coupon.discountAmount, planPrice);
        } else {
            // Percentage discount: e.g. 20% off $10 = $2
            discountValue = (planPrice * coupon.discountPercentage) / 100;
        }

        // Round to 2 decimal places
        discountValue = Math.round(discountValue * 100) / 100;
        const finalAmount = Math.max(0, Math.round((planPrice - discountValue) * 100) / 100);

        // Valid coupon — return calculated amounts
        return res.status(STATUS_CODE.OK).json({
            success: true,
            message: "Coupon applied successfully!",
            data: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountPercentage: coupon.discountPercentage,
                discountAmount: discountValue,        // Actual discount in dollars
                originalAmount: planPrice,             // Plan price in dollars
                finalAmount: finalAmount,              // Final payable in dollars
            },
        });
    } catch (error) {
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error validating coupon",
            error,
        });
    }
});
