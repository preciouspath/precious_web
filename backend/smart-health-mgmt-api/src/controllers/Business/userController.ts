// src/controllers/Admin/businessController.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import user from "../../models/user";

export const addBusinessOwner = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, mobileNumber, businessName, businessAddress } = req.body;

    // Check if email already exists
    const existing = await user.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || "Temp@123", salt);

    const businessOwner = new user({
      fullName,
      email,
      password: hashedPassword,
      mobileNumber,
      businessName,
      businessAddress,
      role: "business",
      status: "inactive",
    });

    await businessOwner.save();

    res.status(201).json({ success: true, message: "Business owner added successfully", data: businessOwner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};

export const getBusinessOwners = async (req: Request, res: Response) => {
  try {
    const owners = await user.find({ role: "business" }).select("-password -otp -refreshToken");
    res.json({ success: true, data: owners });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};

export const getBusinessOwner = async (req: Request, res: Response) => {
  try {
    const owner = await user.findOne({ _id: req.params.id, role: "business" }).select("-password -otp -refreshToken");
    if (!owner) return res.status(404).json({ success: false, message: "Business owner not found" });
    res.json({ success: true, data: owner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};

export const updateBusinessOwner = async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const owner = await user.findOneAndUpdate(
      { _id: req.params.id, role: "business" },
      updates,
      { new: true }
    ).select("-password -otp -refreshToken");

    if (!owner) return res.status(404).json({ success: false, message: "Business owner not found" });
    res.json({ success: true, message: "Business owner updated successfully", data: owner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};

export const deleteBusinessOwner = async (req: Request, res: Response) => {
  try {
    const owner = await user.findOneAndDelete({ _id: req.params.id, role: "business" });
    if (!owner) return res.status(404).json({ success: false, message: "Business owner not found" });
    res.json({ success: true, message: "Business owner deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};

export const changeBusinessStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body; // active | inactive | suspended
    if (!status) return res.status(400).json({ success: false, message: "Status is required" });

    const owner = await user.findOneAndUpdate(
      { _id: req.params.id, role: "business" },
      { status },
      { new: true }
    ).select("-password -otp -refreshToken");

    if (!owner) return res.status(404).json({ success: false, message: "Business owner not found" });
    res.json({ success: true, message: "Status updated successfully", data: owner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};
