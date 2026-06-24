import { Request, Response } from "express";
import Contact from "../../models/Contact";
import asyncHandler from "../../utils/asyncHandler";
import { STATUS_CODE } from "../../utils/statusCode";
import { SystemSetting } from "../../models/SystemSetting";

export const getContactInquiries = asyncHandler(async (req: Request, res: Response) => {
  try {
    const inquiries = await Contact.find().sort({ createdAt: -1 });
    return res.status(STATUS_CODE.OK).json({
      success: true,
      data: inquiries,
    });
  } catch (error: any) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Failed to get contact inquiries",
    });
  }
});

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  try {
    const settings = await SystemSetting.find();
    return res.status(STATUS_CODE.OK).json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Failed to get settings",
    });
  }
});

export const updateStripeMode = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { mode } = req.body; // "test" or "live"
    const userId = (req as any).user?.id;

    if (!["test", "live"].includes(mode)) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Mode must be 'test' or 'live'",
      });
    }

    const setting = await SystemSetting.findOneAndUpdate(
      { key: "stripe_mode" },
      { value: mode, updatedBy: userId, description: "Active Stripe environment mode" },
      { upsert: true, new: true }
    );

    return res.status(STATUS_CODE.OK).json({
      success: true,
      data: setting,
      message: "Stripe mode updated successfully",
    });
  } catch (error: any) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Failed to update Stripe mode",
    });
  }
});

export const updateSetting = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { key, value, description } = req.body;
    const userId = (req as any).user?.id;

    if (!key) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Key is required",
      });
    }

    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      { value, updatedBy: userId, description },
      { upsert: true, new: true }
    );

    return res.status(STATUS_CODE.OK).json({
      success: true,
      data: setting,
      message: `${key} updated successfully`,
    });
  } catch (error: any) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Failed to update setting",
    });
  }
});

export const getSettingsByKey = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { keys } = req.query; // Expecting comma separated keys
    const filter = keys ? { key: { $in: (keys as string).split(",") } } : {};
    
    const settings = await SystemSetting.find(filter);
    
    // Map to object for easier consumption
    const settingsMap = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return res.status(STATUS_CODE.OK).json({
      success: true,
      data: settingsMap,
    });
  } catch (error: any) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Failed to get settings",
    });
  }
});

export const uploadSystemImage = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const fileUrl = `/uploads/settings/${req.file.filename}`;

    return res.status(STATUS_CODE.OK).json({
      success: true,
      data: fileUrl,
      message: "Image uploaded successfully",
    });
  } catch (error: any) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Failed to upload image",
    });
  }
});
