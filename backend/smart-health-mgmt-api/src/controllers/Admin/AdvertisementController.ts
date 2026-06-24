import { Request, Response } from "express";
import { Advertisement, AdStatus } from "../../models/Advertisement";
import { BusinessOwner } from "../../models/Business";
import { sendMail } from "../../utils/sendMail";
import { Parser } from "json2csv";
import pdf from "pdfkit";
import moment from "moment";
import notificationService from "../../services/notificationService";

// ------------------------ Create Ad ------------------------
export const createAd = async (req: Request, res: Response) => {
    try {
        const { ownerId, title, description, image, targetLocation, budget, startDate, endDate } = req.body;

        if (!ownerId || !title || !description || !targetLocation || !budget) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Handle image: prefer uploaded file, fallback to URL
        let imageUrl = image; // URL from body if provided
        if (req.file) {
            // File was uploaded via multer
            imageUrl = `/uploads/ads/${req.file.filename}`;
        }

        if (!imageUrl) {
            return res.status(400).json({ success: false, message: "Either upload an image file or provide an image URL" });
        }

        const newAd = new Advertisement({
            ownerId,
            title,
            description,
            image: imageUrl,
            targetLocation,
            budget,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            status: AdStatus.ACTIVE, // Admin-created ads are automatically active
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
        const {
            search,
            status,
            ownerId,
            from,
            to,
            export: exportType,
            page = "1",
            limit = "10",
        } = req.query;

        const filters: any = {};

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
        if (ownerId) filters.ownerId = ownerId;

        if (from || to) {
            filters.createdAt = {};
            if (from) filters.createdAt.$gte = new Date(from as string);
            if (to) filters.createdAt.$lte = new Date(to as string);
        }

        const pageNumber = Math.max(parseInt(page as string, 10), 1);
        const pageSize = Math.max(parseInt(limit as string, 10), 1);

        const total = await Advertisement.countDocuments(filters);

        if (exportType) {
            const ads = await Advertisement.find(filters).populate("ownerId", "ownerName businessName email").lean();

            if (exportType === "csv") {
                const parser = new Parser();
                const csv = parser.parse(ads);
                res.header("Content-Type", "text/csv");
                res.attachment(`ads-${moment().format("YYYYMMDD")}.csv`);
                return res.send(csv);
            }

            if (exportType === "pdf") {
                const doc = new pdf();
                res.header("Content-Type", "application/pdf");
                res.attachment(`ads-${moment().format("YYYYMMDD")}.pdf`);
                doc.text(JSON.stringify(ads, null, 2));
                doc.pipe(res);
                doc.end();
                return;
            }
        }

        const ads = await Advertisement.find(filters)
            .populate("ownerId", "ownerName businessName email")
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            success: true,
            data: ads,
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

// ------------------------ Update Ad Status ------------------------
export const updateAdStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;

        if (!id || !status) {
            return res.status(400).json({ success: false, message: "Ad ID and status are required" });
        }

        if (!Object.values(AdStatus).includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const ad = await Advertisement.findById(id).populate("ownerId");
        if (!ad) {
            return res.status(404).json({ success: false, message: "Advertisement not found" });
        }

        ad.status = status;
        if (status === AdStatus.REJECTED) {
            ad.rejectionReason = rejectionReason;
        } else if (status === AdStatus.ACTIVE) {
            // If approving, set start date if not set? Or typically start date is set by user.
            // Assuming approval means it goes Live/Active immediately or per schedule.
            // If needed, we can set rejectionReason to undefined
            ad.rejectionReason = undefined;
        }

        await ad.save();

        // Send Email Notification
        const owner = ad.ownerId as any;
        if (owner && owner.email) {
            let subject = "";
            let body = "";

            if (status === AdStatus.APPROVED || status === AdStatus.ACTIVE) {
                subject = "Ad Campaign Approved";
                body = `Hello ${owner.ownerName},\n\nYour ad campaign "${ad.title}" has been approved and is now live.\n\nRegards,\nSmart Health Team`;

                // Send In-App Notification
                await notificationService.notifyAdApproval(owner._id, ad.title, ad._id as any);
            } else if (status === AdStatus.REJECTED) {
                subject = "Ad Campaign Rejected";
                body = `Hello ${owner.ownerName},\n\nYour ad campaign "${ad.title}" was rejected.\nReason: ${rejectionReason || "Policy Violation"}\n\nPlease review and resubmit.\n\nRegards,\nSmart Health Team`;

                // Send In-App Notification
                await notificationService.notifyAdRejection(owner._id, ad.title, rejectionReason || "Policy Violation", ad._id as any);
            }

            if (subject) {
                await sendMail(owner.email, subject, body);
            }
        }

        return res.json({ success: true, message: `Ad status updated to ${status}`, data: ad });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err });
    }
};

// ------------------------ Get Ad Stats ------------------------
export const getAdStats = async (req: Request, res: Response) => {
    try {
        const totalAds = await Advertisement.countDocuments();
        const activeAds = await Advertisement.countDocuments({ status: AdStatus.ACTIVE });
        const pendingAds = await Advertisement.countDocuments({ status: AdStatus.PENDING });
        const completedAds = await Advertisement.countDocuments({ status: AdStatus.COMPLETED });

        // Aggregate total spend and reach
        const aggregation = await Advertisement.aggregate([
            {
                $group: {
                    _id: null,
                    totalSpent: { $sum: "$spentAmount" },
                    totalReach: { $sum: "$reach" }
                }
            }
        ]);

        const totalSpent = aggregation[0]?.totalSpent || 0;
        const totalReach = aggregation[0]?.totalReach || 0;

        return res.json({
            success: true,
            data: {
                totalAds,
                activeAds,
                pendingAds,
                completedAds,
                totalSpent,
                totalReach
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err });
    }
}
