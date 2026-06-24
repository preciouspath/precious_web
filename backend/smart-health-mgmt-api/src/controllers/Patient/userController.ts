// src/controllers/Admin/patientController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import user from "../../models/user";
import HealthHistory from "../../models/HealthHistory";
import { sendMail } from "../../utils/sendMail";
import { getOtpTemplate } from "../../utils/emailTemplates";
import { REFRESH_SECRET, createAccessToken, createRefreshSession } from "../../utils/token";
import QRCode from 'qrcode';
import { encryptId, decryptId } from "../../utils/crypto";
import MedicalReport from "../../models/MedicalReport";
import Folder from "../../models/Folder";
import jwt from "jsonwebtoken";
import { notifyDashboardUpdate } from "../../utils/socketHandler";
import notificationService from "../../services/notificationService";
import UserNotification from "../../models/UserNotification";
import { Subscription, PlanType, SubscriptionStatus } from "../../models/Subscription";
import { SystemSetting } from "../../models/SystemSetting";
import moment from "moment";

const STATIC_MOBILE_OTP = "2222";
const generateNumericOtp = (length: number) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min)).toString();
};

// const generateTemporaryPassword = (length: number = 8) => {
//   const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//   let retVal = "";
//   for (let i = 0, n = charset.length; i < length; ++i) {
//     retVal += charset.charAt(Math.floor(Math.random() * n));
//   }
//   return retVal;
// };

// export const addPatient = async (req: Request, res: Response) => {
//   try {
//     const {
//       fullName,
//       email,
//       password,
//       mobileNumber,
//       countryCode,
//       dateOfBirth,
//       gender,
//       healthProfile,
//     } = req.body;

//     const existingEmail = await user.findOne({ email });
//     if (existingEmail) {
//       return res.status(400).json({ success: false, message: "Email already exists" });
//     }

//     const existingMobile = await user.findOne({ mobileNumber });
//     if (existingMobile) {
//       return res.status(400).json({ success: false, message: "Mobile number already exists" });
//     }

//     const patient = new user({
//       fullName,
//       email,
//       password: password,
//       mobileNumber,
//       countryCode: countryCode || "+91",
//       dateOfBirth,
//       gender: gender && gender.toLowerCase(),
//       role: "patient",
//       healthProfile: healthProfile || {},
//     });

//     // Generate and save OTP
//     const otp = generateNumericOtp(4);
//     patient.otp = await bcrypt.hash(otp, 10);

//     // Generate QR Code
//     // FSD: Unique, encrypted QR code pointing to the patient upload page
//     const frontendUrl = process.env.FRONTEND_URL;
//     const encryptedId = encryptId(patient._id.toString());
//     const qrUrl = `${frontendUrl}/upload/${encryptedId}`;

//     patient.qrCode = await QRCode.toDataURL(qrUrl);
//     patient.qrUrl = qrUrl; // Storing the raw URL too for sharing

//     await patient.save();

//     // Send OTP Email
//     await sendMail(patient.email, "Login OTP", `Your OTP is ${otp}`);

//     res.status(201).json({ success: true, message: "Account created successfully. Please verify OTP sent to your email.", data: patient });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server Error", error: err });
//   }
// };

// export const addPatient = async (req: Request, res: Response) => {
//   try {
//     const {
//       fullName,
//       email,
//       mobileNumber,
//       countryCode,
//       countryName,
//       password, // Only required for email signup
//       dateOfBirth,
//       gender,
//       healthProfile,
//     } = req.body;

//     // Validate: At least email OR mobile must be provided
//     if (!email && !mobileNumber) {
//       return res.status(400).json({
//         success: false,
//         message: "Either email or mobile number is required"
//       });
//     }
//     if (mobileNumber && (!countryCode || !countryName)) {
//       return res.status(400).json({
//         success: false,
//         message: "Country code and country name are required for mobile signup"
//       });
//     }

//     // Validate required fields
//     if (!fullName) {
//       return res.status(400).json({
//         success: false,
//         message: "Full name is required"
//       });
//     }

//     // Validate password for email signup
//     if (email && !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Password is required for email signup"
//       });
//     }

//     // Check if email already exists
//     if (email) {
//       const existingEmail = await user.findOne({ email });
//       if (existingEmail) {
//         return res.status(400).json({
//           success: false,
//           message: "Email already exists"
//         });
//       }
//     }

//     // Check if mobile number already exists
//     if (mobileNumber) {
//       const existingMobile = await user.findOne({ mobileNumber });
//       if (existingMobile) {
//         return res.status(400).json({
//           success: false,
//           message: "Mobile number already exists"
//         });
//       }
//     }

//     // Determine signup method
//     const signupMethod = email ? "email" : "mobile";

//     // Create new patient
//     const patient = new user({
//       fullName,
//       email,
//       mobileNumber,
//       countryCode: countryCode || "+91",
//       countryName: countryName,
//       // Only set password for email signup
//       password: signupMethod === "email" ? password : `MOBILE_USER_${Date.now()}`, // Random password for mobile users (never used)
//       dateOfBirth,
//       gender: gender && gender.toLowerCase(),
//       role: "patient",
//       emailVerified: false, // Must verify before login
//       healthProfile: healthProfile || {},
//     });

//     // Generate OTP based on signup method
//     let otp: string;
//     let otpMessage: string;

//     if (signupMethod === "mobile") {
//       // Mobile signup: Use static OTP
//       otp = STATIC_MOBILE_OTP;
//       patient.otp = await bcrypt.hash(otp, 10);
//       otpMessage = `Your verification OTP is ${otp}`;
//       console.log(`[MOBILE SIGNUP] Static OTP for ${mobileNumber}: ${otp}`);
//     } else {
//       // Email signup: Generate dynamic OTP
//       otp = generateNumericOtp(4);
//       patient.otp = await bcrypt.hash(otp, 10);
//       otpMessage = `Your verification OTP is ${otp}. Please verify your email to complete registration.`;

//       // Send OTP via email
//       await sendMail(patient.email, "Verify Your Email", otpMessage);
//     }

//     // Generate QR Code
//     const frontendUrl = process.env.FRONTEND_URL;
//     const encryptedId = encryptId(patient._id.toString());
//     const qrUrl = `${frontendUrl}/upload/${encryptedId}`;

//     patient.qrCode = await QRCode.toDataURL(qrUrl);
//     patient.qrUrl = qrUrl;

//     await patient.save();

//     res.status(201).json({
//       success: true,
//       message: `Account created successfully. OTP sent to your ${signupMethod}.`,
//       data: {
//         userId: patient._id,
//         email: patient.email,
//         mobileNumber: patient.mobileNumber,
//         countryCode: patient.countryCode, // 3. Included in response
//         countryName: patient.countryName,
//         fullName: patient.fullName,
//         signupMethod,
//         // Include OTP in response for mobile (since it's static)
//         ...(signupMethod === "mobile" && { otp: STATIC_MOBILE_OTP })
//       }
//     });
//   } catch (err) {
//     console.error("Signup Error:", err);
//     res.status(500).json({ success: false, message: "Server Error", error: err });
//   }
// };




// export const loginPatient = async (req: Request, res: Response) => {
//   try {
//     const { email, password, mobileNumber } = req.body;

//     if ((!email && !mobileNumber) || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Email/Mobile and password are required"
//       });
//     }

//     const query = email ? { email, role: "patient" } : { mobileNumber, role: "patient" };
//     const person = await user.findOne(query);
//     if (!person) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     if (!person.emailVerified) {
//       return res.status(403).json({
//         success: false,
//         message: "Please verify your account first. Check your email/phone for OTP.",
//         requiresVerification: true,
//         userId: person._id,
//       });
//     }

//     const isMatch = await person.comparePassword(password);
//     if (!isMatch) {
//       return res.status(400).json({ success: false, message: "Invalid credentials" });
//     }

//     const accessToken = createAccessToken({ id: person._id.toString(), role: "patient", tokenVersion: person.tokenVersion });
//     const { token: refreshToken } = await createRefreshSession(person._id.toString(), req.headers['user-agent'] || 'unknown');

//     const frontendUrl = process.env.FRONTEND_URL;
//     const encryptedId = encryptId(person._id.toString());
//     const qrUrl = `${frontendUrl}/upload/${encryptedId}`;

//     if (!person.qrCode || person.qrCode.includes('patientId')) {
//       person.qrCode = await QRCode.toDataURL(qrUrl);
//       person.qrUrl = qrUrl;
//       await person.save();
//     }

//     // Set HTTP-only cookies for tokens using helper
//     setAuthCookies(res, accessToken, refreshToken);

//     res.json({
//       success: true,
//       message: "Login successful",
//       data: {
//         _id: person._id,
//         email: person.email,
//         fullName: person.fullName,
//         mobileNumber: person.mobileNumber,
//         countryCode: (person as any).countryCode,
//         role: "patient",
//         dateOfBirth: person.dateOfBirth,
//         gender: person.gender,
//         qrCode: person.qrCode,
//         healthProfile: person.healthProfile,
//       }
//     });

//   } catch (error) {
//     console.error("Login Error:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error", error });
//   }
// };


// export const loginPatient = async (req: Request, res: Response) => {
//   try {
//     const { email, password, mobileNumber } = req.body;

//     // Validate: email/mobile and password required
//     if ((!email && !mobileNumber) || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Email/Mobile number and password are required"
//       });
//     }

//     // Find user by email or mobile
//     const query = email
//       ? { email, role: "patient" }
//       : { mobileNumber, role: "patient" };

//     const person = await user.findOne(query);

//     if (!person) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found"
//       });
//     }

//     // CRITICAL: Check if account is verified
//     if (!person.emailVerified) {
//       return res.status(403).json({
//         success: false,
//         message: "Please verify your account first. Check your email/phone for OTP.",
//         requiresVerification: true,
//         userId: person._id,
//         signupMethod: person.email ? "email" : "mobile"
//       });
//     }

//     // Verify password
//     const isMatch = await person.comparePassword(password);
//     if (!isMatch) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid credentials"
//       });
//     }

//     // Generate tokens
//     const accessToken = createAccessToken({
//       id: person._id.toString(),
//       role: "patient",
//       tokenVersion: person.tokenVersion
//     });
//     const { token: refreshToken } = await createRefreshSession(
//       person._id.toString(),
//       req.headers['user-agent'] || 'unknown'
//     );

//     // QR Code generation/update if needed
//     const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
//     const encryptedId = encryptId(person._id.toString());
//     const qrUrl = `${frontendUrl}/upload/${encryptedId}`;

//     if (!person.qrCode || person.qrCode.includes('patientId')) {
//       person.qrCode = await QRCode.toDataURL(qrUrl);
//       person.qrUrl = qrUrl;
//       await person.save();
//     }

//     // Set HTTP-only cookies for tokens
//     setAuthCookies(res, accessToken, refreshToken);

//     res.json({
//       success: true,
//       message: "Login successful",
//       data: {
//         _id: person._id,
//         email: person.email,
//         fullName: person.fullName,
//         mobileNumber: person.mobileNumber,
//         countryCode: (person as any).countryCode,
//         role: "patient",
//         dateOfBirth: person.dateOfBirth,
//         gender: person.gender,
//         qrCode: person.qrCode,
//         healthProfile: person.healthProfile,
//       }
//     });

//   } catch (error) {
//     console.error("Login Error:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error", error });
//   }
// };

// // export const sendOtp = async (req: Request, res: Response) => {
// //   try {
// //     const { mobile, email } = req.body;
// //     if (!mobile && !email) return res.status(400).json({ success: false, message: "Mobile number or Email required" });

// //     const query = email ? { email } : { mobileNumber: mobile };
// //     // Check if user exists
// //     const person = await user.findOne({ ...query, role: "patient" });

// //     if (!person) return res.status(404).json({ success: false, message: "Account not found. Please check your details or sign up." });

// //     const otp = generateNumericOtp(4);
// //     person.otp = await bcrypt.hash(otp, 10);
// //     await person.save();

// //     // Send to Email always (even if started with mobile, provided we have email) 
// //     // OR if we only have mobile, we would send SMS (but SMS not implemented, assuming Email for now)
// //     if (person.email) {
// //       await sendMail(person.email, "Login OTP", `Your OTP is ${otp}`);
// //     }

// //     res.json({ success: true, message: "OTP sent successfully" });
// //   } catch (error) {
// //     console.error("Send OTP Error:", error);
// //     res.status(500).json({ success: false, message: "Internal Server Error", error });
// //   }
// // };

// export const sendOtp = async (req: Request, res: Response) => {
//   try {
//     const { mobile, email } = req.body;

//     if (!mobile && !email) {
//       return res.status(400).json({
//         success: false,
//         message: "Mobile number or Email required"
//       });
//     }

//     const query = email ? { email } : { mobileNumber: mobile };
//     const person = await user.findOne({ ...query, role: "patient" });

//     if (!person) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found"
//       });
//     }

//     let otp: string;
//     let otpSentTo: string;

//     // Determine if this is mobile or email OTP
//     if (mobile && !email) {
//       // Mobile OTP: Use static OTP
//       otp = STATIC_MOBILE_OTP;
//       otpSentTo = "mobile";
//       console.log(`[RESEND OTP] Static OTP for ${mobile}: ${otp}`);
//     } else {
//       // Email OTP: Generate dynamic OTP and send via email
//       otp = generateNumericOtp(4);
//       otpSentTo = "email";

//       if (person.email) {
//         await sendMail(
//           person.email,
//           "Your OTP Code",
//           `Your verification OTP is ${otp}`
//         );
//       } else {
//         return res.status(400).json({
//           success: false,
//           message: "No email associated with this account"
//         });
//       }
//     }

//     person.otp = await bcrypt.hash(otp, 10);
//     await person.save();

//     res.json({
//       success: true,
//       message: `OTP sent successfully to your ${otpSentTo}`,
//       // Include static OTP in response for mobile
//       ...(otpSentTo === "mobile" && { otp: STATIC_MOBILE_OTP })
//     });
//   } catch (error) {
//     console.error("Send OTP Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error
//     });
//   }
// };

// export const resetPassword = async (req: Request, res: Response) => {
//   try {
//     const { userId, newPassword } = req.body;

//     if (!userId || !newPassword) {
//       return res.status(400).json({ success: false, message: "Missing credentials" });
//     }

//     const person = await user.findById(userId);
//     if (!person) return res.status(404).json({ success: false, message: "Account not found. Please check your details or sign up." });

//     // Update password (pre-save hook will NOT hash it if we modify it directly on document unless we assign plain text? 
//     // Wait, pre-save hook checks isModified("password").
//     // Assigning person.password = newPassword will trigger the hook.

//     person.password = newPassword;
//     await person.save();

//     res.json({ success: true, message: "Password reset successfully" });
//   } catch (error) {
//     console.error("Reset Password Error:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error", error });
//   }
// };

// // export const verifyOtp = async (req: Request, res: Response) => {
// //   try {
// //     const { mobile, email, otp } = req.body;
// //     const query = email ? { email } : { mobileNumber: mobile };
// //     if (!otp) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "OTP is required"
// //       });
// //     }

// //     const person = await user.findOne({ ...query, role: "patient" });
// //     if (!person) return res.status(404).json({ success: false, message: "Account not found. Please check your details or sign up." });

// //     const isMatch = await person.compareOtp(otp);
// //     if (!isMatch) return res.status(400).json({ success: false, message: "Invalid OTP" });

// //     person.emailVerified = true;
// //     person.otp = undefined; // Clear OTP
// //     await person.save();

// //     const accessToken = createAccessToken({ id: person._id.toString(), role: "patient", tokenVersion: person.tokenVersion });
// //     const { token: refreshToken } = await createRefreshSession(person._id.toString(), req.headers['user-agent'] || 'unknown');

// //     // Set HTTP-only cookies for tokens using helper
// //     setAuthCookies(res, accessToken, refreshToken);

// //     res.json({
// //       success: true,
// //       message: "OTP Verified",
// //       data: {
// //         user: { _id: person._id, email: person.email, role: "patient" },
// //       }
// //     });

// //   } catch (error) {
// //     console.error("Verify OTP Error:", error);
// //     res.status(500).json({ success: false, message: "Internal Server Error", error });
// //   }
// // }

// export const verifyOtp = async (req: Request, res: Response) => {
//   try {
//     const { mobile, email, otp } = req.body;

//     if (!otp) {
//       return res.status(400).json({
//         success: false,
//         message: "OTP is required"
//       });
//     }

//     if (!mobile && !email) {
//       return res.status(400).json({
//         success: false,
//         message: "Email or mobile number is required"
//       });
//     }

//     const query = email ? { email } : { mobileNumber: mobile };
//     const person = await user.findOne({ ...query, role: "patient" });

//     if (!person) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found"
//       });
//     }

//     if (!person.otp) {
//       return res.status(400).json({
//         success: false,
//         message: "No OTP found. Please request a new OTP."
//       });
//     }

//     // Verify OTP
//     const isMatch = await person.compareOtp(otp);
//     if (!isMatch) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid OTP"
//       });
//     }

//     // Mark as verified and clear OTP
//     person.emailVerified = true;
//     person.otp = undefined;
//     await person.save();

//     // Generate tokens and log user in automatically after verification
//     const accessToken = createAccessToken({
//       id: person._id.toString(),
//       role: "patient",
//       tokenVersion: person.tokenVersion
//     });
//     const { token: refreshToken } = await createRefreshSession(
//       person._id.toString(),
//       req.headers['user-agent'] || 'unknown'
//     );

//     // Set HTTP-only cookies for tokens
//     setAuthCookies(res, accessToken, refreshToken);

//     res.json({
//       success: true,
//       message: "OTP verified successfully. Account activated.",
//       data: {
//         user: {
//           _id: person._id,
//           email: person.email,
//           mobileNumber: person.mobileNumber,
//           fullName: person.fullName,
//           role: "patient"
//         },
//       }
//     });

//   } catch (error) {
//     console.error("Verify OTP Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error
//     });
//   }
// };


// export const updateProfile = async (req: Request, res: Response) => {
//   try {
//     // Get userId from authenticated middleware (req.user.id)
//     const userId = (req as any).user?.id;

//     const {
//       height,
//       weight,
//       healthConditions,
//       emergencyContact,
//       dateOfBirth,
//       gender,
//       countryCode,
//       bloodGroup,
//       bloodPressure,
//       diabetes,
//       smartwatch,
//       trustedDoctors
//     } = req.body;

//     if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

//     const person = await user.findById(userId);
//     if (!person) return res.status(404).json({ success: false, message: "Account not found. Please check your details or sign up." });

//     // Update Core Fields
//     if (dateOfBirth) person.dateOfBirth = dateOfBirth;
//     if (gender) person.gender = gender.toLowerCase();
//     if (countryCode) (person as any).countryCode = countryCode;

//     // Update Health Profile
//     if (!person.healthProfile) person.healthProfile = {};
//     if (height) person.healthProfile.height = height;
//     if (weight) person.healthProfile.weight = weight;
//     if (healthConditions) person.healthProfile.healthConditions = healthConditions;
//     if (emergencyContact) person.healthProfile.emergencyContact = emergencyContact;
//     if (bloodGroup) person.healthProfile.bloodGroup = bloodGroup;
//     if (bloodPressure) person.healthProfile.bloodPressure = bloodPressure;
//     if (diabetes) person.healthProfile.diabetes = diabetes;
//     if (smartwatch) person.healthProfile.smartwatch = smartwatch;
//     if (trustedDoctors) person.trustedDoctors = trustedDoctors;

//     await person.save();

//     res.json({ success: true, message: "Profile updated successfully", data: person });
//   } catch (error) {
//     console.error("Update Profile Error:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error", error });
//   }
// };

// export const uploadProfileImage = async (req: Request, res: Response) => {
//   try {
//     const userId = (req as any).user?.id;
//     if (!req.file) {
//       return res.status(400).json({ success: false, message: "No file uploaded" });
//     }

//     const imagePath = `/uploads/profile/${req.file.filename}`;
//     const person = await user.findByIdAndUpdate(userId, { profileImage: imagePath }, { new: true });

//     if (!person) return res.status(404).json({ success: false, message: "Account not found. Please check your details or sign up." });

//     res.json({ success: true, message: "Profile image uploaded successfully", data: person });
//   } catch (error) {
//     console.error("Upload Image Error:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error", error });
//   }
// };

// export const removeProfileImage = async (req: Request, res: Response) => {
//   try {
//     const userId = (req as any).user?.id;
//     const person = await user.findByIdAndUpdate(userId, { profileImage: null }, { new: true });

//     if (!person) return res.status(404).json({ success: false, message: "Account not found. Please check your details or sign up." });

//     res.json({ success: true, message: "Profile image removed successfully", data: person });
//   } catch (error) {
//     console.error("Remove Image Error:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error", error });
//   }
// };

// export const changePassword = async (req: Request, res: Response) => {
//   try {
//     const userId = (req as any).user?.id;
//     const { oldPassword, newPassword } = req.body;

//     if (!oldPassword || !newPassword) {
//       return res.status(400).json({ success: false, message: "Old and new passwords are required" });
//     }

//     const person = await user.findById(userId);
//     if (!person) return res.status(404).json({ success: false, message: "Account not found. Please check your details or sign up." });

//     const isMatch = await person.comparePassword(oldPassword);
//     if (!isMatch) {
//       return res.status(400).json({ success: false, message: "Incorrect old password" });
//     }

//     person.password = newPassword;
//     await person.save();

//     res.json({ success: true, message: "Password updated successfully" });
//   } catch (error) {
//     console.error("Change Password Error:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error", error });
//   }
// };

// export const addTrustedDoctor = async (req: Request, res: Response) => {
//   try {
//     const userId = (req as any).user?.id;
//     const { name, specialty, email, phone } = req.body;

//     if (!name || !specialty || !email || !phone) {
//       return res.status(400).json({ success: false, message: "All fields are required" });
//     }

//     const person = await user.findById(userId);
//     if (!person) return res.status(404).json({ success: false, message: "Account not found. Please check your details or sign up." });

//     if (!person.trustedDoctors) person.trustedDoctors = [];
//     person.trustedDoctors.push({ name, specialty, email, phone, isFavorite: false });
//     await person.save();

//     res.json({ success: true, message: "Doctor added successfully", data: person.trustedDoctors });
//   } catch (error) {
//     console.error("Add Doctor Error:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error", error });
//   }
// };

// export const getTrustedDoctors = async (req: Request, res: Response) => {
//   try {
//     const userId = (req as any).user?.id;
//     const person = await user.findById(userId).select('trustedDoctors');
//     if (!person) return res.status(404).json({ success: false, message: "Account not found. Please check your details or sign up." });

//     res.json({ success: true, data: person.trustedDoctors || [] });
//   } catch (error) {
//     console.error("Gat Doctors Error:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error", error });
//   }
// };

// export const deleteTrustedDoctor = async (req: Request, res: Response) => {
//   try {
//     const userId = (req as any).user?.id;
//     const { doctorId } = req.params;

//     const person = await user.findById(userId);
//     if (!person) return res.status(404).json({ success: false, message: "Account not found. Please check your details or sign up." });

//     person.trustedDoctors = person.trustedDoctors?.filter((d: any) => d._id.toString() !== doctorId);
//     await person.save();

//     res.json({ success: true, message: "Doctor removed successfully", data: person.trustedDoctors });
//   } catch (error) {
//     console.error("Delete Doctor Error:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error", error });
//   }
// };

// export const getReports = async (req: Request, res: Response) => {
//   try {
//     const userId = (req as any).user?.id;
//     const { uploadedBy } = req.query;

//     const query: any = { patientId: userId };
//     if (uploadedBy) {
//       query.uploadedBy = uploadedBy;
//     }

//     const reports = await MedicalReport.find(query).sort({ createdAt: -1 });
//     res.json({ success: true, data: reports });
//   } catch (error) {
//     console.error("Get Reports Error:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error", error });
//   }
// };


// export const getUser = async (req: Request, res: Response) => {
//   try {
//     let { id } = req.params;
//     if (!id) return res.status(400).json({ success: false, message: "User ID required" });

//     // Handle encrypted ID (period indicates our custom format)
//     if (id.includes('.')) {
//       try {
//         id = decryptId(id);
//       } catch (e) {
//         return res.status(400).json({ success: false, message: "Invalid encrypted ID" });
//       }
//     }

//     const person = await user.findById(id).select('-password -otp');
//     if (!person) return res.status(404).json({ success: false, message: "Account not found. Please check your details or sign up." });

//     res.json({ success: true, data: person });
//   } catch (error) {
//     console.error("Get User Error:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error", error });
//   }
// };

// // GET /me - Uses token from middleware, no userId needed
// export const getMe = async (req: Request, res: Response) => {
//   try {
//     const userId = (req as any).user?.id;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     const person = await user.findById(userId).select('-password -otp');
//     if (!person) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     // QR Generation Fix in getMe too
//     const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
//     const encryptedId = encryptId(person._id.toString());
//     const qrUrl = `${frontendUrl}/upload/${encryptedId}`;

//     if (!person.qrCode || person.qrCode.includes('patientId')) {
//       person.qrCode = await QRCode.toDataURL(qrUrl);
//       person.qrUrl = qrUrl;
//       await person.save();
//     }

//     res.json({ success: true, data: person });
//   } catch (error) {
//     console.error("Get Me Error:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error", error });
//   }
// };

// // POST /logout - Clears auth cookies
// export const logout = async (req: Request, res: Response) => {
//   try {
//     const isProduction = process.env.NODE_ENV === 'production';
//     const sameSite: "strict" | "lax" | "none" = isProduction ? "none" : "lax";

//     res.cookie('accessToken', '', {
//       httpOnly: true,
//       secure: isProduction,
//       sameSite,
//       path: '/',
//       expires: new Date(0),
//     });

//     res.cookie('refreshToken', '', {
//       httpOnly: true,
//       secure: isProduction,
//       sameSite,
//       path: '/',
//       expires: new Date(0),
//     });

//     res.json({ success: true, message: "Logged out successfully" });
//   } catch (error) {
//     console.error("Logout Error:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error", error });
//   }
// };

// export const doctorUploadDocument = async (req: Request, res: Response) => {
//   try {
//     let { patientId, uploadedBy } = req.body;

//     // If patientId is missing, try to get it from authenticated user (for patient's own uploads)
//     if (!patientId && (req as any).user?.id) {
//       patientId = (req as any).user.id;
//     }

//     if (!req.file) {
//       return res.status(400).json({ success: false, message: "No file uploaded" });
//     }

//     if (!patientId) {
//       return res.status(400).json({ success: false, message: "Patient ID required" });
//     }

//     // Handle encrypted ID (period indicates our custom format)
//     if (patientId.includes('.')) {
//       try {
//         patientId = decryptId(patientId);
//       } catch (e) {
//         return res.status(400).json({ success: false, message: "Invalid encrypted patient ID" });
//       }
//     }

//     const patient = await user.findById(patientId);
//     if (!patient) {
//       return res.status(404).json({ success: false, message: "Patient not found" });
//     }

//     const report = new MedicalReport({
//       patientId,
//       fileUrl: `/uploads/reports/${req.file.filename}`,
//       fileName: req.file.originalname,
//       fileType: req.file.mimetype,
//       uploadedBy: uploadedBy || "doctor",
//     });

//     await report.save();

//     res.json({
//       success: true,
//       message: "Document uploaded successfully",
//       data: report
//     });
//   } catch (error) {
//     console.error("Doctor Upload Error:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error", error });
//   }
// };

// export const deleteReport = async (req: Request, res: Response) => {
//   try {
//     const { reportId } = req.params;
//     const userId = (req as any).user?.id;

//     const report = await MedicalReport.findOneAndDelete({ _id: reportId, patientId: userId });
//     if (!report) return res.status(404).json({ success: false, message: "Report not found or unauthorized" });

//     res.json({ success: true, message: "Report deleted successfully" });
//   } catch (error) {
//     console.error("Delete Report Error:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error", error });
//   }
// };

// // Helper function to set auth cookies consistently
// const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
//   const isProduction = process.env.NODE_ENV === 'production';
//   const sameSite: "strict" | "lax" | "none" = isProduction ? "none" : "lax";

//   const cookieOptions = {
//     httpOnly: true,
//     secure: isProduction,
//     sameSite,
//     path: '/',
//   };

//   res.cookie('accessToken', accessToken, {
//     ...cookieOptions,
//     maxAge: 15 * 60 * 1000, // 15 minutes
//   });

//   res.cookie('refreshToken', refreshToken, {
//     ...cookieOptions,
//     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//   });
// };







export const addPatient = async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      email,
      mobileNumber,
      countryCode,
      countryName,
      password,
      dateOfBirth,
      gender,
      healthProfile,
      fcmToken,
    } = req.body;

    // 1. Basic Validation
    if (!email && !mobileNumber) {
      return res.status(400).json({ success: false, message: "Either email or mobile number is required" });
    }
    if (!fullName) {
      return res.status(400).json({ success: false, message: "Full name is required" });
    }

    // 2. Check for Existing User
    const query = email ? { email } : { mobileNumber };
    let patient = await user.findOne(query);

    if (patient) {
      // If user exists and is already verified, then we show "Already exists"
      if (patient.emailVerified) {
        return res.status(400).json({
          success: false,
          message: `${email ? "Email" : "Mobile number"} is already registered and verified. Please login.`
        });
      }

      // If user exists but NOT verified, we update the existing record instead of creating a new one
      patient.fullName = fullName;
      if (password && email) patient.password = password; // Will be hashed by pre-save hook
      patient.dateOfBirth = dateOfBirth;
      patient.gender = gender && gender.toLowerCase();
      if (fcmToken) patient.fcmToken = fcmToken;
    } else {
      // Create new patient instance if no existing user found
      const signupMethod = email ? "email" : "mobile";

      patient = new user({
        fullName,
        email,
        mobileNumber,
        countryCode: countryCode || "+91",
        countryName,
        password: signupMethod === "email" ? password : `MOBILE_USER_${Date.now()}`,
        dateOfBirth,
        gender: gender && gender.toLowerCase(),
        role: "patient",
        emailVerified: false,
        healthProfile: healthProfile || {},
        fcmToken: fcmToken || null,
      });
    }

    // 3. Generate and Handle OTP
    const signupMethod = email ? "email" : "mobile";
    let otp: string;

    if (signupMethod === "mobile") {
      otp = STATIC_MOBILE_OTP;
      patient.otp = await bcrypt.hash(otp, 10);
      console.log(`[MOBILE SIGNUP] Static OTP for ${mobileNumber}: ${otp}`);
    } else {
      otp = generateNumericOtp(4);
      patient.otp = await bcrypt.hash(otp, 10);
      // Send OTP via email
      await sendMail(patient.email, "Verify Your Email", getOtpTemplate(patient.fullName, otp, "account verification"));
    }

    // 4. Handle QR Code (Only generate if it doesn't exist)
    if (!patient.qrCode) {
      const frontendUrl = process.env.FRONTEND_URL;
      const encryptedId = encryptId(patient._id.toString());
      const qrUrl = `${frontendUrl}/upload/${encryptedId}`;
      patient.qrCode = await QRCode.toDataURL(qrUrl);
      patient.qrUrl = qrUrl;
    }

    await patient.save();

    // 5. Create Initial Free Subscription
    try {
      const daysSetting = await SystemSetting.findOne({ key: 'default_free_subscription_days' });
      const days = parseInt(daysSetting?.value || '30');
      const expiryDate = moment().add(days, 'days').toDate();

      const initialSub = new Subscription({
        userId: patient._id,
        userModel: "User",
        planType: PlanType.FREE,
        startDate: new Date(),
        expiryDate: expiryDate,
        status: SubscriptionStatus.ACTIVE,
        paymentStatus: "Paid",
      });
      await initialSub.save();

      // Update user document subscription field for quick access
      patient.subscription = {
        type: "free",
        startDate: new Date(),
        endDate: expiryDate,
        status: "active"
      };
      await patient.save();
    } catch (subErr) {
      console.error("Initial Subscription Error:", subErr);
      // We don't fail registration if subscription creation fails
    }

    res.status(201).json({
      success: true,
      message: `OTP sent successfully to your ${signupMethod}.`,
      data: {
        userId: patient._id,
        email: patient.email,
        mobileNumber: patient.mobileNumber,
        fullName: patient.fullName,
        signupMethod,
        ...(signupMethod === "mobile" && { otp: STATIC_MOBILE_OTP })
      }
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const loginPatient = async (req: Request, res: Response) => {
  try {
    const { email, password, mobileNumber, countryCode, fcmToken } = req.body;

    if (!email && !mobileNumber) {
      return res.status(400).json({ success: false, message: "Email or mobile number is required" });
    }

    const loginMethod = email ? "email" : "mobile";

    // ── Build lookup query ─────────────────────────────────────────────────
    let query: Record<string, any>;
    if (email) {
      query = { email, role: "patient" };
    } else {
      query = { mobileNumber, role: "patient" };
      if (countryCode) {
        query.countryCode = countryCode;
      }
    }


    const person = await user.findOne(query);
    if (!person) {
      const errorMessage = email
        ? "Email address is not registered."
        : "Mobile number is not registered with this country code.";

      return res.status(404).json({
        success: false,
        message: errorMessage
      });
    }

    if (!person.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your account first.",
        requiresVerification: true,
        userId: person._id,
        loginMethod
      });
    }

    if (loginMethod === "email") {
      if (!password) return res.status(400).json({ success: false, message: "Password is required" });

      const isMatch = await person.comparePassword(password);
      if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

      const accessToken = createAccessToken({ id: person._id.toString(), role: "patient", tokenVersion: person.tokenVersion });
      const { token: refreshToken } = await createRefreshSession(person._id.toString(), req.headers['user-agent'] || 'unknown');

      // Update QR Code logic...
      const frontendUrl = process.env.FRONTEND_URL;
      const encryptedId = encryptId(person._id.toString());
      const qrUrl = `${frontendUrl}/upload/${encryptedId}`;

      if (!person.qrCode || person.qrCode.includes('patientId')) {
        person.qrCode = await QRCode.toDataURL(qrUrl);
        person.qrUrl = qrUrl;
      }
      if (fcmToken) {
        person.fcmToken = fcmToken;
      }
      await person.save();

      setAuthCookies(res, accessToken, refreshToken);

      return res.json({
        success: true,
        message: "Login successful",
        accessToken,
        refreshToken,
        data: {
          _id: person._id,
          email: person.email,
          fullName: person.fullName,
          mobileNumber: person.mobileNumber,
          countryCode: person.countryCode, // Updated
          countryName: person.countryName, // Added
          role: "patient",
          dateOfBirth: person.dateOfBirth,
          gender: person.gender,
          qrCode: person.qrCode,
          healthProfile: person.healthProfile,
          isCompleted: person.isCompleted,
        }
      });

    } else {
      // MOBILE LOGIN
      const otp = STATIC_MOBILE_OTP;
      person.otp = await bcrypt.hash(otp, 10);
      if (fcmToken) {
        person.fcmToken = fcmToken;
      }
      await person.save();

      return res.json({
        success: true,
        message: "OTP sent to your mobile number.",
        requiresOtpVerification: true,
        data: {
          userId: person._id,
          mobileNumber: person.mobileNumber,
          countryCode: person.countryCode, // Added for frontend context
          countryName: person.countryName, // Added for frontend context
          otp: STATIC_MOBILE_OTP
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


export const refreshToken = async (req: Request, res: Response) => {
  try {
    // 1. Get token from Cookies (Web) OR Body (Mobile App)
    const token = req.cookies?.refreshToken || req.body.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh Token is required"
      });
    }

    // 2. Verify JWT Token
    // Replace 'process.env.REFRESH_TOKEN_SECRET' with your actual secret variable
    const decoded = jwt.verify(token, REFRESH_SECRET) as { uid: string; sid: string };
    // const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as any;

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token"
      });
    }

    // 3. Find User and check Token Version (Security best practice)
    const person = await user.findById(decoded.uid);

    if (!person) {
      return res.status(404).json({
        success: false,
        message: "User no longer exists"
      });
    }

    // 4. Check if account is still active
    if (person.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Account is suspended or inactive"
      });
    }

    // 5. Generate New Access Token
    // We use person.tokenVersion to allow "Global Logout" by incrementing version in DB
    const newAccessToken = createAccessToken({
      id: person._id.toString(),
      role: person.role,
      tokenVersion: person.tokenVersion
    });

    // 6. Update Cookies (if request came from web)
    // We keep the same refresh token or you can rotate it here if your 'createRefreshSession' supports it
    setAuthCookies(res, newAccessToken, token);

    return res.json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: token, // Send back for mobile app storage
      data: {
        userId: person._id,
        role: person.role
      }
    });

  } catch (error) {
    console.error("Refresh Token Error:", error);
    return res.status(401).json({
      success: false,
      message: "Token expired or invalid session",
      error: error instanceof Error ? error.message : "Unauthorized"
    });
  }
};

/**
 * Send OTP
 * For email: Resend verification OTP
 * For mobile: Send login OTP
 * 
 * POST /api/patients/send-otp
 */
export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, email, countryCode } = req.body;

    if (!mobileNumber && !email) {
      return res.status(400).json({
        success: false,
        message: "Mobile number or Email required"
      });
    }

    // ── Build lookup query ─────────────────────────────────────────────────
    let query: Record<string, any>;
    if (email) {
      query = { email, role: "patient" };
    } else {
      query = { mobileNumber, role: "patient" };
      if (countryCode) {
        query.countryCode = countryCode;
      }
    }
    const person = await user.findOne(query);

    if (!person) {
      const errorMessage = email
        ? "Email address is not registered."
        : "Mobile number is not registered with this country code.";

      return res.status(404).json({
        success: false,
        message: errorMessage
      });
    }

    let otp: string;
    let otpSentTo: string;

    // Determine OTP type based on request
    if (mobileNumber && !email) {
      // Mobile OTP: Use static OTP
      otp = STATIC_MOBILE_OTP;
      otpSentTo = "mobile";
      console.log(`[RESEND OTP] Static OTP for ${countryCode || ''}${mobileNumber}: ${otp}`);
    } else {
      // Email OTP: Generate dynamic OTP and send via email
      otp = generateNumericOtp(4);
      otpSentTo = "email";

      if (person.email) {
        await sendMail(
          person.email,
          "Your OTP Code",
          getOtpTemplate(person.fullName, otp, "login")
        );
      } else {
        return res.status(400).json({
          success: false,
          message: "No email associated with this account"
        });
      }
    }

    person.otp = await bcrypt.hash(otp, 10);
    await person.save();

    res.json({
      success: true,
      message: `OTP sent successfully to your ${otpSentTo}`,
      // Include static OTP in response for mobile
      ...(otpSentTo === "mobile" && { otp: STATIC_MOBILE_OTP })
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    });
  }
};

/**
 * Verify OTP
 * For signup: Activates account
 * For mobile login: Logs user in
 * 
 * POST /api/patients/verify-otp
 */
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, email, otp, countryCode, purpose } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required"
      });
    }

    if (!mobileNumber && !email) {
      return res.status(400).json({
        success: false,
        message: "Email or mobile number is required"
      });
    }

    // ── Build lookup query ─────────────────────────────────────────────────
    let query: Record<string, any>;
    if (email) {
      query = { email, role: "patient" };
    } else {
      query = { mobileNumber, role: "patient" };
      if (countryCode) {
        query.countryCode = countryCode;
      }
    }

    const person = await user.findOne(query);

    if (!person) {
      const errorMessage = email
        ? "Email address is not registered."
        : "Mobile number is not registered with this country code.";

      return res.status(404).json({
        success: false,
        message: errorMessage
      });
    }

    if (!person.otp) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new OTP."
      });
    }

    // Verify OTP
    const isMatch = await person.compareOtp(otp);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    // Mark as verified and clear OTP
    person.emailVerified = true;
    person.otp = undefined;
    await person.save();

    // Only set tokens and cookies if NOT a password reset flow
    if (purpose === 'forgot-password') {
      return res.json({
        success: true,
        message: "OTP verified successfully. Please reset your password.",
        data: {
          user: {
            _id: person._id,
            email: person.email,
            fullName: person.fullName,
          },
        }
      });
    }

    // Generate tokens and log user in
    const accessToken = createAccessToken({
      id: person._id.toString(),
      role: "patient",
      tokenVersion: person.tokenVersion
    });
    const { token: refreshToken } = await createRefreshSession(
      person._id.toString(),
      req.headers['user-agent'] || 'unknown'
    );

    // Update QR code if needed
    const frontendUrl = process.env.FRONTEND_URL;
    const encryptedId = encryptId(person._id.toString());
    const qrUrl = `${frontendUrl}/upload/${encryptedId}`;

    if (!person.qrCode || person.qrCode.includes('patientId')) {
      person.qrCode = await QRCode.toDataURL(qrUrl);
      person.qrUrl = qrUrl;
      await person.save();
    }

    // Set HTTP-only cookies
    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      message: "OTP verified successfully.",
      accessToken,
      refreshToken,
      data: {
        user: {
          _id: person._id,
          email: person.email,
          mobileNumber: person.mobileNumber,
          countryCode: person.countryCode,
          countryName: person.countryName,
          fullName: person.fullName,
          role: "patient",
          dateOfBirth: person.dateOfBirth,
          gender: person.gender,
          qrCode: person.qrCode,
          healthProfile: person.healthProfile,
          isCompleted: person.isCompleted,
        },
      }
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Find the user by email
    const person = await user.findOne({ email, role: "patient" });

    if (!person) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address"
      });
    }

    // Professional check: If user is mobile-only, they shouldn't use this flow
    // if (!person.email) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "This account is mobile-only. Please login via OTP."
    //   });
    // }

    let otp = generateNumericOtp(4);

    await sendMail(
      person.email,
      "Your OTP Code",
      getOtpTemplate(person.fullName, otp, "password reset")
    );

    // Hash and save OTP
    person.otp = await bcrypt.hash(otp, 10);
    await person.save();

    // Success response with data for the next step
    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * Reset Password (Email users only)
 * Mobile users don't use passwords
 * 
 * POST /api/patients/reset-password
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "User ID and new password are required"
      });
    }

    const person = await user.findById(userId);
    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Account not found. Please sign up to create an account."
      });
    }

    // Check if user has email (password reset only for email users)
    if (!person.email) {
      return res.status(400).json({
        success: false,
        message: "Password reset not available for mobile-only accounts. Use OTP to login."
      });
    }

    person.password = newPassword;
    await person.save();

    res.json({
      success: true,
      message: "Password reset successfully"
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    });
  }
};

/**
 * Update Profile
 * PUT /api/patients/profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    let responseMessage = "Profile updated successfully";

    const {
      fullName,
      email,
      mobileNumber,
      height,
      weight,
      healthConditions,
      emergencyContact,
      dateOfBirth,
      gender,
      countryCode,
      countryName,
      bloodGroup,
      bloodPressure,
      diabetes,
      smartwatch,
      trustedDoctors
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const person = await user.findById(userId);
    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Account not found. Please sign up to create an account."
      });
    }

    if (req.file) {
      person.profileImage = `/uploads/profile/${req.file.filename}`;
    }

    // Update Core Fields
    if (mobileNumber && mobileNumber !== person.mobileNumber) {
      const existingMobile = await user.findOne({ mobileNumber, _id: { $ne: userId } });
      if (existingMobile) {
        return res.status(400).json({ success: false, message: "Mobile number is already in use" });
      }
      person.mobileNumber = mobileNumber;
    }

    if (email && email !== person.email) {
      const existingEmail = await user.findOne({ email, _id: { $ne: userId } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: "Email is already in use" });
      }

      const isFirstTimeEmail = !person.email;
      person.email = email;

      if (isFirstTimeEmail) {
        // Generate an 8-character random password for mobile-first users adding an email
        const generatedPassword = Math.random().toString(36).slice(-8);
        person.password = generatedPassword; // Pre-save hook will hash it automatically

        await sendMail(
          email,
          "Your Smart Health Account Password",
          `Hello ${fullName || person.fullName},\n\nYou have successfully added this email address to your mobile account.\n\nHere is your auto-generated temporary password: ${generatedPassword}\n\nYou can use this password to log in with your email address or you can change it anytime from your profile settings.`
        );

        responseMessage = "Profile updated successfully. A temporary password has been sent to your new email address.";
      }
    }

    if (fullName) person.fullName = fullName;
    if (dateOfBirth) person.dateOfBirth = dateOfBirth;
    if (gender) person.gender = gender.toLowerCase();
    if (countryCode) (person as any).countryCode = countryCode;
    if (countryName) (person as any).countryName = countryName;

    // Update Health Profile
    if (!person.healthProfile) person.healthProfile = {};
    if (height !== undefined) person.healthProfile.height = height;
    if (weight !== undefined) person.healthProfile.weight = weight;
    if (healthConditions) person.healthProfile.healthConditions = healthConditions;
    if (emergencyContact) person.healthProfile.emergencyContact = emergencyContact;
    if (bloodGroup) person.healthProfile.bloodGroup = bloodGroup;
    if (bloodPressure) person.healthProfile.bloodPressure = bloodPressure;
    if (diabetes !== undefined) person.healthProfile.diabetes = diabetes;
    if (smartwatch) {
      person.healthProfile.smartwatch = {
        ...smartwatch,
        lastSync: smartwatch.lastSync ? new Date(smartwatch.lastSync) : (person.healthProfile.smartwatch?.lastSync || new Date())
      };
    }
    if (trustedDoctors) person.trustedDoctors = trustedDoctors;
    person.isCompleted = true;
    await person.save();

    res.json({
      success: true,
      message: responseMessage,
      data: person
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    });
  }
};

/**
 * Upload Profile Image
 * POST /api/patients/profile-image
 */
export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const imagePath = `/uploads/profile/${req.file.filename}`;
    const person = await user.findByIdAndUpdate(
      userId,
      { profileImage: imagePath },
      { new: true }
    );

    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Account not found. Please sign up to create an account."
      });
    }

    res.json({
      success: true,
      message: "Profile image uploaded successfully",
      data: person
    });
  } catch (error) {
    console.error("Upload Image Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    });
  }
};

/**
 * Remove Profile Image
 * DELETE /api/patients/profile-image
 */
export const removeProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const person = await user.findByIdAndUpdate(
      userId,
      { profileImage: "/uploads/profile/default-avatar.png" },
      { new: true }
    );

    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Account not found. Please sign up to create an account."
      });
    }

    res.json({
      success: true,
      message: "Profile image removed successfully",
      data: person
    });
  } catch (error) {
    console.error("Remove Image Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    });
  }
};

/**
 * Change Password (Email users only)
 * PUT /api/patients/change-password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old and new passwords are required"
      });
    }

    const person = await user.findById(userId);
    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Account not found. Please sign up to create an account."
      });
    }

    // Check if user has email (password only for email users)
    if (!person.email) {
      return res.status(400).json({
        success: false,
        message: "Password management not available for mobile-only accounts"
      });
    }

    const isMatch = await person.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect old password"
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as the current password"
      });
    }

    person.password = newPassword;
    await person.save();

    res.json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    });
  }
};

/**
 * Add Trusted Doctor
 * POST /api/patients/trusted-doctors
 */
export const addTrustedDoctor = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { name, specialty, email, phone, countryCode, countryName } = req.body;

    if (!name || !specialty || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const person = await user.findById(userId);
    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Account not found. Please sign up to create an account."
      });
    }

    if (!person.trustedDoctors) person.trustedDoctors = [];

    // Check for duplicates (email or phone)
    const isDuplicate = person.trustedDoctors.some(
      (doc: any) => doc.email === email || doc.phone === phone
    );

    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: "Doctor with this email or phone number already exists in your list"
      });
    }

    person.trustedDoctors.push({ name, specialty, email, phone, countryCode, countryName, isFavorite: false });
    await person.save();

    res.json({
      success: true,
      message: "Doctor added successfully",
      data: person.trustedDoctors
    });
  } catch (error) {
    console.error("Add Doctor Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    });
  }
};

/**
 * Get Trusted Doctors
 * GET /api/patients/trusted-doctors
 */
export const getTrustedDoctors = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const person = await user.findById(userId).select('trustedDoctors');

    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Account not found. Please sign up to create an account."
      });
    }

    res.json({
      success: true,
      data: person.trustedDoctors || []
    });
  } catch (error) {
    console.error("Get Doctors Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    });
  }
};

/**
 * Delete Trusted Doctor
 * DELETE /api/patients/trusted-doctors/:doctorId
 */
export const deleteTrustedDoctor = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { doctorId } = req.params;

    const person = await user.findById(userId);
    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Account not found. Please sign up to create an account."
      });
    }

    person.trustedDoctors = person.trustedDoctors?.filter(
      (d: any) => d._id.toString() !== doctorId
    );
    await person.save();

    res.json({
      success: true,
      message: "Doctor removed successfully",
      data: person.trustedDoctors
    });
  } catch (error) {
    console.error("Delete Doctor Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    });
  }
};

/**
 * Toggle Trusted Doctor Favorite Status
 * PUT /api/patients/doctor/:doctorId/toggle-favorite
 */
export const toggleTrustedDoctorFavorite = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { doctorId } = req.params;

    const person = await user.findById(userId);
    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Account not found. Please sign up to create an account."
      });
    }

    const doctorIndex = person.trustedDoctors?.findIndex(
      (d: any) => d._id.toString() === doctorId
    );

    if (doctorIndex === -1 || doctorIndex === undefined) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found in your list"
      });
    }

    // Toggle the isFavorite status
    person.trustedDoctors[doctorIndex].isFavorite = !person.trustedDoctors[doctorIndex].isFavorite;

    await person.save();

    res.json({
      success: true,
      message: `Doctor ${person.trustedDoctors[doctorIndex].isFavorite ? 'added to' : 'removed from'} favorites`,
      data: person.trustedDoctors[doctorIndex]
    });
  } catch (error) {
    console.error("Toggle Favorite Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    });
  }
};

/**
 * Update Trusted Doctor
 * PUT /api/patients/doctor/:doctorId
 */
export const updateTrustedDoctor = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { doctorId } = req.params;
    const { name, specialty, email, phone, countryCode, countryName } = req.body;

    if (!name || !specialty || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const person = await user.findById(userId);
    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Account not found. Please sign up to create an account."
      });
    }

    const doctorIndex = person.trustedDoctors?.findIndex(
      (d: any) => d._id.toString() === doctorId
    );

    if (doctorIndex === -1 || doctorIndex === undefined) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found in your list"
      });
    }

    // Check for duplicates (excluding the current doctor)
    const isDuplicate = person.trustedDoctors.some(
      (doc: any) => (doc.email === email || doc.phone === phone) && doc._id.toString() !== doctorId
    );

    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: "Another doctor with this email or phone number already exists in your list"
      });
    }

    // Update doctor details
    person.trustedDoctors[doctorIndex].name = name;
    person.trustedDoctors[doctorIndex].specialty = specialty;
    person.trustedDoctors[doctorIndex].email = email;
    person.trustedDoctors[doctorIndex].phone = phone;
    person.trustedDoctors[doctorIndex].countryCode = countryCode;
    person.trustedDoctors[doctorIndex].countryName = countryName;

    await person.save();

    res.json({
      success: true,
      message: "Doctor updated successfully",
      data: person.trustedDoctors[doctorIndex]
    });
  } catch (error) {
    console.error("Update Doctor Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    });
  }
};

/**
 * Get Reports
 * GET /api/patients/reports
 */
export const getReports = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const {
      uploadedBy,
      folderId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      fileType,
      startDate,
      endDate
    } = req.query;

    const query: any = { patientId: userId };

    // Filters
    // Filters
    if (uploadedBy) query.uploadedBy = uploadedBy;
    if (fileType && fileType !== 'all') query.fileType = { $regex: fileType, $options: 'i' };

    // Date Range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate as string).setHours(23, 59, 59, 999));
    }

    // Search (File Name or OCR Text)
    if (search) {
      query.$or = [
        { fileName: { $regex: search, $options: 'i' } },
        { ocrText: { $regex: search, $options: 'i' } }
      ];
    }

    // Folder Scoping
    if (folderId) {
      if (folderId === 'root') {
        // If at root and searching, we can keep it global or root-only.
        // The previous logic for root was $exists: false. 
        // We'll keep it root-only if NO search is present.
        // If search is present at root, we'll allow global search (common pattern).
        if (!search) {
          query.folderId = { $exists: false };
        }
      } else {
        // Inside a folder: Always scope search to this folder
        query.folderId = folderId;
      }
    }

    // Sort
    const sortOptions: any = {};
    const order = sortOrder === 'asc' ? 1 : -1;

    if (sortBy === 'name') sortOptions.fileName = order;
    else if (sortBy === 'date') sortOptions.createdAt = order;
    else if (sortBy === 'type') sortOptions.fileType = order;
    // Cleanup orphaned reports (where folder exists in report but not in Folder collection)
    if (!search && !folderId) {
      const FolderModel = require('../../models/Folder').default;
      const reportsWithFolders = await MedicalReport.find({ patientId: userId, folderId: { $exists: true } });

      const uniqueFolderIds = [...new Set(reportsWithFolders.map((r: any) => r.folderId.toString()))];
      const existingFolders = await FolderModel.find({ _id: { $in: uniqueFolderIds } });
      const existingFolderIdStrings = existingFolders.map((f: any) => f._id.toString());

      const orphanedReportIds = reportsWithFolders
        .filter((r: any) => !existingFolderIdStrings.includes(r.folderId.toString()))
        .map((r: any) => r._id);

      if (orphanedReportIds.length > 0) {
        console.log(`Cleaning up ${orphanedReportIds.length} orphaned reports for user ${userId}`);
        await MedicalReport.deleteMany({ _id: { $in: orphanedReportIds } });
      }
    }

    const reports = await MedicalReport.find(query).sort(sortOptions);
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error("Get Reports Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    });
  }
};

/**
 * Get Report Counts (Optimized)
 * GET /api/patients/report-counts
 */
export const getReportCounts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const [myCount, doctorCount, myRootCount] = await Promise.all([
      MedicalReport.countDocuments({ patientId: userId, uploadedBy: 'patient' }),
      MedicalReport.countDocuments({ patientId: userId, uploadedBy: 'doctor' }),
      MedicalReport.countDocuments({ patientId: userId, uploadedBy: 'patient', folderId: { $exists: false } })
    ]);

    res.json({
      success: true,
      data: {
        myCount,
        doctorCount,
        myRootCount
      }
    });
  } catch (error) {
    console.error("Get Report Counts Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    });
  }
};

/**
 * Get User by ID
 * GET /api/patients/user/:id
 */
export const getUser = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      return res.status(400).json({ success: false, message: "User ID required" });
    }
    // 1. Try to find by database _id directly if it looks like a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      const person = await user.findById(id).select('-password -otp');
      if (person) {
        return res.json({ success: true, data: person });
      }
    }

    // 2. Try to find by scanningId (Stable ID)
    let person = await user.findOne({ scanningId: id }).select('-password -otp');
    if (person) {
      return res.json({ success: true, data: person });
    }

    // 3. Handle encrypted ID or Old QR URLs
    if (id.includes('.')) {
      try {
        const decryptedId = decryptId(id);
        if (mongoose.Types.ObjectId.isValid(decryptedId)) {
          person = await user.findById(decryptedId).select('-password -otp');
        }
      } catch (e) {
        // Decryption failed - could be due to key change. 
        // Fallback: Try to find by checking if the ID exists within any stored qrUrl
        person = await user.findOne({ qrUrl: { $regex: id } }).select('-password -otp');
      }
    }

    if (!person) {
      return res.status(404).json({ success: false, message: "User not found or invalid QR code" });
    }

    res.json({
      success: true,
      data: person
    });
  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * Get Current User
 * GET /api/patients/me
 */
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Fetch user - countryCode and countryName are included by default
    const person = await user.findById(userId).select('-password -otp');

    if (!person) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // QR Code generation/update logic (remains live-safe)
    const frontendUrl = process.env.FRONTEND_URL;

    // Generate scanningId if missing (lifelong stable ID)
    if (!person.scanningId) {
      const { v4: uuidv4 } = require('uuid');
      person.scanningId = uuidv4();
      await person.save();
    }

    const qrUrl = `${frontendUrl}/upload/${person.scanningId}`;

    if (!person.qrCode || person.qrUrl !== qrUrl) {
      const QRCode = require('qrcode');
      person.qrCode = await QRCode.toDataURL(qrUrl);
      person.qrUrl = qrUrl;
      await person.save();
    }

    res.json({
      success: true,
      data: person // Includes countryCode, countryName, and updated QR
    });
  } catch (error) {
    console.error("Get Me Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * Logout
 * POST /api/patients/logout
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const sameSite: "strict" | "lax" | "none" = isProduction ? "none" : "lax";

    res.cookie('accessToken', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite,
      path: '/',
      expires: new Date(0),
    });

    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite,
      path: '/',
      expires: new Date(0),
    });

    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    });
  }
};


export const transcribeDoctorAudio = async (req: Request, res: Response) => {
  try {
    const file = (req.file as Express.Multer.File | undefined) || ((req.files as any)?.audio?.[0] as Express.Multer.File | undefined);

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Audio file is required",
      });
    }

    const geminiService = require("../../services/geminiService");
    const transcriptResult = await geminiService.transcribeAudio(file.path, file.mimetype);

    if (!transcriptResult.success) {
      return res.status(500).json({
        success: false,
        message: transcriptResult.text || "Audio transcription failed",
      });
    }

    return res.json({
      success: true,
      message: "Audio transcribed successfully",
      data: {
        transcriptText: transcriptResult.text,
      },
    });
  } catch (error) {
    console.error("Audio Transcription Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error,
    });
  }
};

/**
 * Doctor Upload Document
 * POST /api/patients/upload-document
 */
export const doctorUploadDocument = async (req: Request, res: Response) => {
  try {
    let { patientId, uploadedBy, folderId, transcriptText } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const documentFile = files?.file?.[0];
    const audioFile = files?.audio?.[0];
    let cleanedTranscript = typeof transcriptText === "string" ? transcriptText.trim() : "";

    // If patientId is missing, try authenticated user
    if (!patientId && (req as any).user?.id) {
      patientId = (req as any).user.id;
    }

    if (!documentFile && !audioFile) {
      return res.status(400).json({
        success: false,
        message: "Please upload a document or audio recording"
      });
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID required"
      });
    }

    // Robust Patient Resolution Logic
    let patient;

    // 1. Try to find by database _id directly if it looks like a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(patientId)) {
      patient = await user.findById(patientId);
    }

    // 2. Try to find by scanningId (Stable ID) if not found yet
    if (!patient) {
      patient = await user.findOne({ scanningId: patientId });
    }

    // 3. Handle encrypted ID or Old QR URLs
    if (!patient && patientId.includes('.')) {
      try {
        const decryptedId = decryptId(patientId);
        if (mongoose.Types.ObjectId.isValid(decryptedId)) {
          patient = await user.findById(decryptedId);
        }
      } catch (e) {
        // Fallback: Try to find by checking if the ID exists within any stored qrUrl
        patient = await user.findOne({ qrUrl: { $regex: patientId } });
      }
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found or invalid QR code"
      });
    }

    // Re-assign correct patientId for subsequent use
    const finalPatientId = patient._id;

    let ocrResult = { success: false, text: cleanedTranscript || "", metadata: {} as any };

    if (documentFile) {
      // ── OCR Subscription Cap Check ────────────────────────────────────────────
      // Free users are limited to FREE_PLAN_OCR_MONTHLY_LIMIT successful OCR scans per calendar month.
      // The uploader's own subscription (the authenticated user) controls the cap.
      const uploaderId = (req as any).user?.id || finalPatientId.toString();
      const patientForBilling = await user.findById(uploaderId).select('subscription');
      const uploaderPlan: string = (patientForBilling as any)?.subscription?.type || 'free';

      if (uploaderPlan !== 'premium') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const ocrUsedThisMonth = await MedicalReport.countDocuments({
          patientId: finalPatientId,
          ocrStatus: 'completed',
          createdAt: { $gte: startOfMonth },
        });

        // Fetch dynamic limit from settings
        const limitSetting = await SystemSetting.findOne({ key: 'free_plan_ocr_monthly_limit' });
        const monthlyLimit = parseInt(limitSetting?.value || '20');

        if (ocrUsedThisMonth >= monthlyLimit) {
          return res.status(403).json({
            success: false,
            upgradeRequired: true,
            ocrUsed: ocrUsedThisMonth,
            ocrLimit: monthlyLimit,
            message: `You've used all ${monthlyLimit} free OCR transcriptions for this month. Upgrade to Premium for unlimited OCR.`,
          });
        }
      }

      try {
        const geminiService = require("../../services/geminiService");
        ocrResult = await geminiService.analyzePrescription(documentFile.path);
      } catch (aiError) {
        console.error("Gemini Analysis Failed:", aiError);
        try {
          const ocrService = require("../../services/ocrService");
          ocrResult = await ocrService.processDocument(documentFile.path);
        } catch (ocrError) {
          console.error("OCR Also Failed:", ocrError);
          ocrResult = { success: false, text: cleanedTranscript || "AI and OCR Processing Failed", metadata: {} };
        }
      }
    }

    if (audioFile && !cleanedTranscript) {
      try {
        const geminiService = require("../../services/geminiService");
        const transcriptResult = await geminiService.transcribeAudio(audioFile.path, audioFile.mimetype);
        if (transcriptResult?.success && transcriptResult.text) {
          cleanedTranscript = transcriptResult.text.trim();
        }
      } catch (transcriptionError) {
        console.error("Audio Transcription During Upload Failed:", transcriptionError);
      }
    }

    // Default 'uploadedBy' to 'doctor' if not provided (e.g. from QR scan upload)
    const finalUploadedBy = uploadedBy || "doctor";

    let finalFolderId = folderId;
    const inputMode = documentFile && audioFile ? "mixed" : audioFile ? "voice" : "document";
    const primaryFile = documentFile || audioFile;

    const report = new MedicalReport({
      patientId: finalPatientId,
      folderId: finalFolderId || undefined,
      fileUrl: documentFile ? `/uploads/reports/${documentFile.filename}` : "",
      fileName: documentFile ? documentFile.originalname : (audioFile ? "Voice Note" : "unknown"),
      fileType: documentFile ? documentFile.mimetype : "",
      inputMode,
      audioUrl: audioFile ? `/uploads/reports/${audioFile.filename}` : undefined,
      audioFileName: audioFile?.originalname,
      audioMimeType: audioFile?.mimetype,
      transcriptText: cleanedTranscript || ocrResult?.text || undefined,
      uploadedBy: finalUploadedBy,
      ocrStatus: documentFile ? (ocrResult?.success ? 'completed' : 'failed') : (cleanedTranscript ? 'completed' : 'pending'),
      ocrText: ocrResult?.text || cleanedTranscript,
      extractedData: {
        ...ocrResult?.metadata,
        transcriptSource: audioFile ? 'voice' : undefined,
        extractedAt: new Date(),
      }
    });

    await report.save();

    // Send In-App Notification to Patient
    // Requirement: "A new prescription has been added and transcribed."
    await notificationService.notifyDoctorUpload(finalPatientId, report._id);

    res.json({
      success: true,
      message: inputMode === "voice" ? "Voice note saved successfully" : "Document uploaded successfully",
      data: report
    });
  } catch (error) {
    console.error("Doctor Upload Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    });
  }
};

/**
 * Delete Report
 * DELETE /api/patients/reports/:reportId
 */
export const deleteReport = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const userId = (req as any).user?.id;

    const report = await MedicalReport.findOneAndDelete({
      _id: reportId,
      patientId: userId
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found or unauthorized"
      });
    }

    res.json({
      success: true,
      message: "Report deleted successfully"
    });
  } catch (error) {
    console.error("Delete Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    });
  }
};

/**
 * Helper: Set Auth Cookies
 */
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite: "strict" | "lax" | "none" = isProduction ? "none" : "lax";

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: '/',
  };
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours (matching ACCESS_TOKEN_TTL in .env)
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

/**
 * Move Report to Folder
 * PUT /api/patients/report/:reportId/move
 */
export const moveReport = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { folderId } = req.body;
    const userId = (req as any).user?.id;

    // Verify report ownership
    const report = await MedicalReport.findOne({ _id: reportId, patientId: userId });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found or access denied"
      });
    }

    // Update folderId
    report.folderId = folderId || undefined;
    await report.save();

    res.json({
      success: true,
      message: "Report moved successfully",
      data: report
    });
  } catch (error) {
    console.error("Move Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    await MedicalReport.deleteMany({ patientId: userId });

    await Folder.deleteMany({ userId: userId });

    await UserNotification.deleteMany({ userId: userId });

    const deletedUser = await user.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "Account not found. Please sign up to create an account."
      });
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({
      success: true,
      message: "Account and all associated data deleted successfully"
    });
  } catch (error) {
    console.error("Delete Account Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error
    });
  }
};

/**
 * Update Smartwatch Data (For App)
 * POST /api/patient/smartwatch-data
 */
const parseSleepHours = (sleepValue: any) => {
  if (!sleepValue) return 0;
  if (typeof sleepValue === 'number') return sleepValue;
  if (typeof sleepValue === 'string') {
    const matches = sleepValue.match(/(\d+(?:\.\d+)?)\s*h(?:ours?)?/i);
    const minutes = sleepValue.match(/(\d+)\s*m(?:in(?:utes?)?)?/i);
    const hours = matches ? parseFloat(matches[1]) : 0;
    return hours + (minutes ? parseInt(minutes[1], 10) / 60 : 0);
  }
  return 0;
};

export const updateSmartwatchData = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { data, lastSync } = req.body;

    if (!userId || !data) {
      return res.status(400).json({
        success: false,
        message: "User ID and data are required",
      });
    }

    const normalizedData = {
      heartRate: Number(data.heartRate) || 0,
      steps: Number(data.steps) || 0,
      bloodOxygen: Number(data.bloodOxygen) || 0,
      bloodPressure: data.bloodPressure || "--/--",
      sleepHours: parseSleepHours(data.sleep),
    };

    const updatedUser = await user.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          "healthProfile.smartwatch.data": data,
          "healthProfile.smartwatch.lastSync": lastSync ? new Date(lastSync) : new Date(),
          "healthProfile.smartwatch.connected": true,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const recordDate = new Date();
    recordDate.setHours(0, 0, 0, 0);

    const existingRecord = await HealthHistory.findOne({
      userId: userId,
      date: {
        $gte: recordDate,
        $lt: new Date(recordDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingRecord) {
      existingRecord.steps = normalizedData.steps;
      existingRecord.heartRate = normalizedData.heartRate;
      existingRecord.bloodOxygen = normalizedData.bloodOxygen;
      existingRecord.bloodPressure = normalizedData.bloodPressure;
      existingRecord.sleepHours = normalizedData.sleepHours;
      existingRecord.source = "fitbit";
      await existingRecord.save();
    } else {
      await HealthHistory.create({
        userId: userId,
        date: recordDate,
        steps: normalizedData.steps,
        heartRate: normalizedData.heartRate,
        bloodOxygen: normalizedData.bloodOxygen,
        bloodPressure: normalizedData.bloodPressure,
        sleepHours: normalizedData.sleepHours,
        source: "fitbit",
      });
    }

    // Trigger real-time update to web dashboard via socket
    notifyDashboardUpdate(userId, {
      ...data,
      ...normalizedData,
    });

    res.json({
      success: true,
      message: "Smartwatch data updated successfully",
      data: updatedUser.healthProfile.smartwatch?.data,
    });
  } catch (error) {
    console.error("Update Smartwatch Data Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

import geminiService from "../../services/geminiService";

export const generateQuestions = async (req: Request, res: Response) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ success: false, message: "Transcript text is required" });
    }

    const result = await geminiService.generateQuestionsFromTranscript(transcript);
    
    if (result.success) {
      res.json({ success: true, questions: result.questions });
    } else {
      res.status(500).json({ success: false, message: "Failed to generate questions" });
    }
  } catch (error) {
    console.error("Generate Questions Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error });
  }
};
