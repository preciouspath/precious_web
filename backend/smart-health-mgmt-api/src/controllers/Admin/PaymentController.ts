import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import { STATUS_CODE } from "../../utils/statusCode";
import { Payment } from "../../models/Payment";
import user from "../../models/user";

// ─── Get All Payments (Admin) ─────────────────────────────────────────────────
export const getAllPayments = asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      status,
      userId,
      startDate,
      endDate,
      search,
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const filters: any = {};

    if (status) filters.status = status;
    if (userId) filters.userId = userId;

    // Date range filter
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate as string);
      if (endDate) filters.createdAt.$lte = new Date(endDate as string);
    }

    // Search by Stripe payment intent ID
    if (search) {
      filters.stripePaymentIntentId = { $regex: search, $options: "i" };
    }

    const [payments, total] = await Promise.all([
      Payment.find(filters)
        .populate("userId", "fullName email")
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Payment.countDocuments(filters),
    ]);

    return res.status(STATUS_CODE.OK).json({
      success: true,
      data: payments,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Failed to fetch payments",
    });
  }
});

// ─── Get Payment By ID (Admin) ────────────────────────────────────────────────
export const getPaymentById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate("userId", "fullName email phone")
      .lean();

    if (!payment) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.status(STATUS_CODE.OK).json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Failed to fetch payment",
    });
  }
});

// ─── Export Payments as CSV (Admin) ──────────────────────────────────────────
export const exportPayments = asyncHandler(async (req: Request, res: Response) => {
  try {
    const payments = await Payment.find()
      .populate("userId", "fullName email")
      .lean();

    let csv = "Payment ID,User Name,Email,Amount,Currency,Status,Stripe Intent ID,Date\n";

    payments.forEach((p: any) => {
      const row = [
        p._id.toString(),
        p.userId?.fullName || "N/A",
        p.userId?.email || "N/A",
        (p.amount / 100).toFixed(2), // convert cents to dollars
        p.currency?.toUpperCase() || "USD",
        p.status,
        p.stripePaymentIntentId,
        p.createdAt ? new Date(p.createdAt).toISOString() : "N/A",
      ]
        .map((val) => `"${val}"`)
        .join(",");
      csv += row + "\n";
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=payments.csv");
    return res.status(STATUS_CODE.OK).send(csv);
  } catch (error: any) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Error exporting payments",
    });
  }
});
