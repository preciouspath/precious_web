import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { BusinessOwner } from "../../models/Business";
import { OTP } from "../../models/OTP";
import { sendMail } from "../../utils/sendMail";
import { getOtpTemplate, getAccountDeletedTemplate, getVerificationSuccessTemplate, getVerificationRejectedTemplate } from "../../utils/emailTemplates";
import { Advertisement } from "../../models/Advertisement";
import moment from "moment";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import notificationService from "../../services/notificationService";



export const registerBusinessOwner = async (req: Request, res: Response) => {
  try {
    const { businessName, ownerName, email, mobile, password, businessAddress } = req.body;
    let { businessLicense } = req.body;

    if (req.file) {
      businessLicense = `/uploads/profile/${req.file.filename}`;
    }

    if (!businessName || !ownerName || !email || !mobile || !password || !businessAddress || !businessLicense) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({ success: false, message: "Mobile must be 10 digits" });
    }

    if (password.length < 8 || !/\d/.test(password)) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters and contain a number" });
    }

    const existingOwner = await BusinessOwner.findOne({ email: email.toLowerCase() });
    if (existingOwner) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const owner = await BusinessOwner.create({
      businessName,
      ownerName,
      email: email.toLowerCase(),
      mobile,
      password: hashedPassword,
      businessAddress,
      businessLicense,
    });

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    await OTP.create({
      ownerId: owner._id,
      otp: otpCode,
      type: "EMAIL",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const subject = "Verify Your Business Owner Account";
    const body = getOtpTemplate(owner.ownerName, otpCode, "account verification");

    await sendMail(email, subject, body);

    return res.status(201).json({
      success: true,
      message: "Registration successful. OTP sent to email",
      data: { ownerId: owner._id },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};

// ------------------------ Verify OTP ------------------------
export const verifyEmailOTP = async (req: Request, res: Response) => {
  try {
    const { ownerId, otp } = req.body;

    if (!ownerId || !otp) {
      return res.status(400).json({ success: false, message: "ownerId and otp are required" });
    }

    const record = await OTP.findOne({ ownerId, otp, type: "EMAIL" });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    await BusinessOwner.findByIdAndUpdate(ownerId, { isEmailVerified: true });
    await OTP.deleteMany({ ownerId });

    return res.json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};

// ------------------------ Login ------------------------
export const loginBusinessOwner = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const owner = await BusinessOwner.findOne({ email: email.toLowerCase() });
    if (!owner) return res.status(401).json({ success: false, message: "Invalid email or password" });

    const validPassword = await bcrypt.compare(password, owner.password || "");
    if (!validPassword) return res.status(401).json({ success: false, message: "Invalid email or password" });

    if (owner.kycStatus !== "Approved") return res.status(403).json({ success: false, message: "KYC not approved" });

    const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });

    return res.json({ success: true, message: "Login successful", data: { token } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};

export const getBusinessOwners = async (req: Request, res: Response) => {
  try {
    const {
      search,
      kycStatus,
      from,
      to,
      export: exportType,
      page = "1",
      limit = "10",
    } = req.query;

    const filters: any = {};

    // Single search key for multiple fields
    if (search) {
      const regex = { $regex: search as string, $options: "i" };
      filters.$or = [
        { ownerName: regex },
        { email: regex },
        { mobile: regex },
      ];
    }

    if (kycStatus) filters.kycStatus = kycStatus;

    if (from || to) {
      filters.createdAt = {};
      if (from) filters.createdAt.$gte = new Date(from as string);
      if (to) filters.createdAt.$lte = new Date(to as string);
    }

    const pageNumber = Math.max(parseInt(page as string, 10), 1);
    const pageSize = Math.max(parseInt(limit as string, 10), 1);

    const total = await BusinessOwner.countDocuments(filters);

    if (exportType) {
      const owners = await BusinessOwner.find(filters).lean();

      if (exportType === "csv") {
        const parser = new Parser();
        const csv = parser.parse(owners);
        res.header("Content-Type", "text/csv");
        res.attachment(`business-owners-${moment().format("YYYYMMDD")}.csv`);
        return res.send(csv);
      }

      if (exportType === "pdf") {
        const doc = new PDFDocument();
        res.header("Content-Type", "application/pdf");
        res.attachment(`business-owners-${moment().format("YYYYMMDD")}.pdf`);
        doc.text(JSON.stringify(owners, null, 2));
        doc.pipe(res);
        doc.end();
        return;
      }
    }

    const owners = await BusinessOwner.find(filters)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();

    return res.json({
      success: true,
      data: owners,
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

export const getBusinessOwnerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Business owner ID is required" });
    }

    const owner = await BusinessOwner.findById(id).lean();

    if (!owner) {
      return res.status(404).json({ success: false, message: "Business owner not found" });
    }

    return res.json({
      success: true,
      data: owner,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};

export const updateBusinessOwner = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;
    const updateData = { ...req.body };

    if (req.file) {
      updateData.businessLicense = `/uploads/profile/${req.file.filename}`;
    }

    if (!ownerId) {
      return res.status(400).json({ success: false, message: "ownerId is required" });
    }

    if (updateData.password) {
      if (updateData.password.length < 8 || !/\d/.test(updateData.password)) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters and contain a number" });
      }
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const owner = await BusinessOwner.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ success: false, message: "Business Owner not found" });
    }

    if (updateData.password) {
      if (updateData.password.length < 8 || !/\d/.test(updateData.password)) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters and contain a number" });
      }
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Check for KYC status change
    if (updateData.kycStatus && updateData.kycStatus !== owner.kycStatus) {
      if (updateData.kycStatus === "Approved") {
        const subject = "Business Verification Approved";
        const body = getVerificationSuccessTemplate(owner.ownerName);
        await sendMail(owner.email, subject, body);

        // Send In-App Notification
        await notificationService.notifyVerificationApproval(owner._id);
      } else if (updateData.kycStatus === "Rejected") {
        const subject = "Business Verification Rejected";
        const reason = updateData.kycRejectionReason || "Documents requirements not met.";
        const body = getVerificationRejectedTemplate(owner.ownerName, reason);
        await sendMail(owner.email, subject, body);

        // Send In-App Notification
        await notificationService.notifyVerificationRejection(owner._id, reason);
      }
    }

    const updatedOwner = await BusinessOwner.findByIdAndUpdate(ownerId, updateData, { new: true }).lean();

    return res.json({ success: true, message: "Business Owner updated successfully", data: updatedOwner });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};

// ------------------------ Delete Business Owner ------------------------
export const deleteBusinessOwner = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;

    if (!ownerId) {
      return res.status(400).json({ success: false, message: "ownerId is required" });
    }

    const deletedOwner = await BusinessOwner.findByIdAndDelete(ownerId).lean();

    if (!deletedOwner) {
      return res.status(404).json({ success: false, message: "Business Owner not found" });
    }

    const subject = "Account Deleted";
    const body = getAccountDeletedTemplate(deletedOwner.ownerName);
    await sendMail(deletedOwner.email, subject, body);

    return res.json({ success: true, message: "Business Owner deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};

// ------------------------ Dashboard Summary ------------------------
export const dashboardSummary = async (req: Request, res: Response) => {
  try {
    const ownerId = req.body.ownerId;
    if (!ownerId) return res.status(400).json({ success: false, message: "ownerId is required" });

    const totalAds = await Advertisement.countDocuments({ ownerId });
    const approvedAds = await Advertisement.countDocuments({ ownerId, status: "Approved" });
    const totalSpentResult = await Advertisement.aggregate([
      { $match: { ownerId: ownerId as any } },
      { $group: { _id: null, totalSpent: { $sum: "$spentAmount" }, totalReach: { $sum: "$reach" } } },
    ]);

    const totalSpent = totalSpentResult[0]?.totalSpent || 0;
    const totalReach = totalSpentResult[0]?.totalReach || 0;

    return res.json({
      success: true,
      data: {
        totalAds,
        approvedAds,
        totalSpent,
        totalReach,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};
