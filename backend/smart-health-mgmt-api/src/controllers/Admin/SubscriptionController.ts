import { Request, Response } from "express";
import { Subscription, PlanType, SubscriptionStatus } from "../../models/Subscription";
import user from "../../models/user";
import { BusinessOwner } from "../../models/Business";
import asyncHandler from "../../utils/asyncHandler";
import { STATUS_CODE } from "../../utils/statusCode";
import moment from "moment";
import { sendMail } from "../../utils/sendMail";

export const getSubscriptions = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { search, planType, status, page = "1", limit = "10" } = req.query;

        const filters: any = {};
        if (planType) filters.planType = planType;
        if (status) filters.status = status;

        if (search) {
            const users = await user.find({
                $or: [
                    { fullName: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ],
            }).select("_id");
            filters.userId = { $in: users.map(u => u._id) };
        }

        const pageNumber = parseInt(page as string, 10);
        const pageSize = parseInt(limit as string, 10);

        const subscriptions = await Subscription.find(filters)
            .populate("userId")
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .lean();

        const total = await Subscription.countDocuments(filters);

        res.status(STATUS_CODE.OK).json({
            success: true,
            data: subscriptions,
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
            message: "Error fetching subscriptions",
            error,
        });
    }
});

export const updateSubscription = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { planType, status, expiryDate, days } = req.body;

        const subscription = await Subscription.findById(id);
        if (!subscription) {
            return res.status(STATUS_CODE.NOT_FOUND).json({
                success: false,
                message: "Subscription not found",
            });
        }

        let message = "Subscription updated successfully";

        if (planType && planType !== subscription.planType) {
            message = `Subscription ${planType === PlanType.PREMIUM ? 'upgraded' : 'downgraded'} to ${planType} successfully`;
            subscription.planType = planType as PlanType;
            // Reset status if upgrading/downgrading from cancelled
            if (subscription.status === SubscriptionStatus.CANCELLED) {
                subscription.status = SubscriptionStatus.ACTIVE;
            }
        }

        if (status && status !== subscription.status) {
            if (status === SubscriptionStatus.CANCELLED) {
                message = "Subscription plan has been cancelled successfully";
            } else if (status === SubscriptionStatus.ACTIVE) {
                message = "Subscription plan has been reactivated successfully";
            }
            subscription.status = status as SubscriptionStatus;
        }

        if (expiryDate) {
            subscription.expiryDate = new Date(expiryDate);
        } else if (days) {
            subscription.expiryDate = moment().add(parseInt(days), 'days').toDate();
        }

        await subscription.save();

        res.status(STATUS_CODE.OK).json({
            success: true,
            message,
            data: subscription,
        });
    } catch (error) {
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error updating subscription",
            error,
        });
    }
});

export const resendConfirmation = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const subscription = await Subscription.findById(id).populate("userId");
        if (!subscription) {
            return res.status(STATUS_CODE.NOT_FOUND).json({
                success: false,
                message: "Subscription not found",
            });
        }

        const user: any = subscription.userId;
        const emailSubject = "Subscription Payment Confirmation";
        const emailBody = `
            <h3>Hello ${user?.fullName || 'Valued Customer'},</h3>
            <p>This is a confirmation regarding your subscription plan: <strong>${subscription.planType}</strong>.</p>
            <p><strong>Status:</strong> ${subscription.paymentStatus}</p>
            <p><strong>Expiry Date:</strong> ${subscription.expiryDate ? new Date(subscription.expiryDate).toDateString() : 'Never'}</p>
            <br/>
            <p>If you have any questions, please contact support.</p>
            <p>Best regards,<br/>Smart Health Team</p>
        `;

        if (user?.email) {
            await sendMail(user.email, emailSubject, emailBody);
        }

        res.status(STATUS_CODE.OK).json({
            success: true,
            message: "Payment confirmation email sent successfully",
        });
    } catch (error) {
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error resending confirmation",
            error,
        });
    }
});

export const addSubscription = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { userId, planType, startDate, expiryDate, paymentStatus, autoRenew, days } = req.body;

        if (!userId || !planType) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success: false,
                message: "User ID and Plan Type are required",
            });
        }

        const patient = await user.findById(userId);
        if (!patient) {
            return res.status(STATUS_CODE.NOT_FOUND).json({
                success: false,
                message: "Patient not found",
            });
        }

        // Check if active subscription already exists
        const existing = await Subscription.findOne({ userId, status: "Active" });
        if (existing) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success: false,
                message: "User already has an active subscription",
            });
        }

        const subscription = new Subscription({
            userId,
            userModel: "User",
            planType: planType as PlanType,
            startDate: startDate || new Date(),
            expiryDate: expiryDate || (days ? moment().add(parseInt(days), 'days').toDate() : (planType === PlanType.PREMIUM ? moment().add(1, 'month').toDate() : null)),
            status: SubscriptionStatus.ACTIVE,
            paymentStatus: paymentStatus || "Paid",
            autoRenew: autoRenew || false,
        });

        await subscription.save();

        res.status(STATUS_CODE.CREATED).json({
            success: true,
            message: "Subscription added successfully",
            data: subscription,
        });
    } catch (error) {
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error adding subscription",
            error,
        });
    }
});

export const exportSubscriptions = asyncHandler(async (req: Request, res: Response) => {
    try {
        const subscriptions = await Subscription.find()
            .populate("userId", "fullName email")
            .lean();

        let csv = "Patient Name,Email,Plan Type,Status,Start Date,Expiry Date,Payment Status,Auto Renew\n";

        subscriptions.forEach((sub: any) => {
            const row = [
                sub.userId?.fullName || "N/A",
                sub.userId?.email || "N/A",
                sub.planType,
                sub.status,
                sub.startDate ? moment(sub.startDate).format("YYYY-MM-DD") : "N/A",
                sub.expiryDate ? moment(sub.expiryDate).format("YYYY-MM-DD") : "Never",
                sub.paymentStatus,
                sub.autoRenew ? "Yes" : "No"
            ].map(val => `"${val}"`).join(",");
            csv += row + "\n";
        });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=subscriptions.csv");
        res.status(STATUS_CODE.OK).send(csv);
    } catch (error) {
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error exporting subscriptions",
            error,
        });
    }
});
