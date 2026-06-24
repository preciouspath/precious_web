import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { BusinessOwner, KYCStatus } from "../../models/Business"; // Use Business Model
import { sendMail } from "../../utils/sendMail";
import { getOtpTemplate } from "../../utils/emailTemplates";
import { createAccessToken, createRefreshSession } from "../../utils/token";

// Helper to generate numeric OTP
const generateNumericOtp = (length: number) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min)).toString();
};




export const registerBusiness = async (req: Request, res: Response) => {
    try {
        const { businessName, ownerName, email, mobileNumber, countryCode, businessAddress, password } = req.body;
        const businessLicense = req.file ? `/uploads/profile/${req.file.filename}` : undefined;

        // Validation
        if (!email || !mobileNumber || !businessName || !ownerName || !businessLicense) {
            return res.status(400).json({ success: false, message: "Missing required fields (including Business License)." });
        }

        // Check if user exists
        // Check if email exists
        const emailExists = await BusinessOwner.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ success: false, message: "Email already exists" });
        }

        // Check if mobile exists
        const mobileExists = await BusinessOwner.findOne({ mobile: mobileNumber });
        if (mobileExists) {
            return res.status(400).json({ success: false, message: "Mobile number already exists" });
        }

        // Generate OTP
        const otp = generateNumericOtp(6);

        // Hash Password 
        let hashedPassword = undefined;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }

        // Create Business Owner
        const newUser = new BusinessOwner({
            businessName,
            ownerName,
            email,
            mobile: mobileNumber,
            countryCode: countryCode || "+91",
            password: hashedPassword,
            businessAddress,
            businessLicense,
            otp: await bcrypt.hash(otp, 10),
            isEmailVerified: false,
            tokenVersion: 0
        });

        await newUser.save();

        // Send OTP Email
        await sendMail(
            email,
            "Verify your Business Account",
            getOtpTemplate(ownerName, otp, "registration")
        );

        res.status(201).json({
            success: true,
            message: "Registration successful. Please verify OTP sent to your email.",
            data: {
                userId: newUser._id,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error("Register Business Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error instanceof Error ? error.message : String(error) });
    }
};

export const loginBusiness = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        console.log(email, password, 'yes');

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const user = await BusinessOwner.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!user.password) {
            return res.status(400).json({ success: false, message: "Please login with OTP (Password not set)" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        // Generate Tokens
        const accessToken = createAccessToken({ id: user._id.toString(), role: "business", tokenVersion: (user as any).tokenVersion });
        const { token: refreshToken, sessionId } = await createRefreshSession(user._id.toString(), req.headers['user-agent'] || 'unknown');

        // Can store sessionId if needed in User model or separate session store

        // Cookie (Optional)
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: "none", });

        res.json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    ownerName: user.ownerName,
                    role: "business",
                    kycStatus: user.kycStatus,
                    countryCode: user.countryCode,
                    profileImage: (user as any).profileImage
                },
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error instanceof Error ? error.message : String(error) });
    }
};

export const sendOtp = async (req: Request, res: Response) => {
    try {
        const { mobile } = req.body;
        if (!mobile) return res.status(400).json({ success: false, message: "Mobile number is required" });

        const user = await BusinessOwner.findOne({ mobile });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const otp = generateNumericOtp(4);
        (user as any).otp = await bcrypt.hash(otp, 10);
        await user.save();

        // Send OTP logic (via SMS in real world, using Email here as per available tools if mobile integration is missing)
        // Check if we can send SMS? No SMS tool visible. Fallback to Email.
        await sendMail(
            user.email,
            "Login OTP",
            getOtpTemplate(user.ownerName, otp, "login")
        );

        res.json({ success: true, message: "OTP sent to your registered email" });

    } catch (error) {
        console.error("Send OTP Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error instanceof Error ? error.message : String(error) });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp, mobile } = req.body;

        if (!otp) return res.status(400).json({ success: false, message: "OTP is required" });

        // Allow lookup by email OR mobile (Register vs Login)
        const query = email ? { email } : { mobile };
        if (!email && !mobile) return res.status(400).json({ success: false, message: "Email or Mobile required" });

        const existingUser = await BusinessOwner.findOne(query);
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Manual compare 
        const dbOtp = (existingUser as any).otp;
        if (!dbOtp) {
            return res.status(400).json({ success: false, message: "No OTP found or Expired" });
        }

        const isMatch = await bcrypt.compare(otp, dbOtp);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid OTP CODE" });
        }

        existingUser.isEmailVerified = true;
        if (mobile) existingUser.isMobileVerified = true; // If verifying by mobile
        (existingUser as any).otp = undefined; // Clear OTP
        await existingUser.save();

        // Generate Tokens for Login
        const accessToken = createAccessToken({ id: existingUser._id.toString(), role: "business", tokenVersion: (existingUser as any).tokenVersion });
        const { token: refreshToken } = await createRefreshSession(existingUser._id.toString(), req.headers['user-agent'] || 'unknown');

        res.status(200).json({
            success: true,
            message: "OTP Verified Successfully.",
            data: {
                user: {
                    _id: existingUser._id,
                    email: existingUser.email,
                    ownerName: existingUser.ownerName,
                    role: "business",
                    kycStatus: existingUser.kycStatus,
                    businessName: existingUser.businessName,
                    mobile: existingUser.mobile,
                    profileImage: (existingUser as any).profileImage
                },
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.error("Verify OTP Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error instanceof Error ? error.message : String(error) });
    }
};

export const resendOtp = async (req: Request, res: Response) => {
    try {
        const { email, mobile } = req.body;
        if (!email && !mobile) return res.status(400).json({ success: false, message: "Email or Mobile is required" });

        const query = email ? { email } : { mobile };
        const user = await BusinessOwner.findOne(query);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const otp = generateNumericOtp(6);
        (user as any).otp = await bcrypt.hash(otp, 10);
        await user.save();

        // Send OTP Email
        await sendMail(
            user.email,
            "Resend OTP",
            getOtpTemplate(user.ownerName, otp, "verification")
        );

        res.json({ success: true, message: "New OTP sent to your registered email" });

    } catch (error) {
        console.error("Resend OTP Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: "Email is required" });

        const user = await BusinessOwner.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: "Email not found" });
        }

        const otp = generateNumericOtp(6);
        (user as any).otp = await bcrypt.hash(otp, 10);
        await user.save();

        await sendMail(
            email,
            "Password Reset OTP",
            getOtpTemplate(user.ownerName, otp, "password reset")
        );

        res.json({ success: true, message: "OTP sent to your email" });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error instanceof Error ? error.message : String(error) });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, password, otp } = req.body;

        if (!email || !password || !otp) {
            return res.status(400).json({ success: false, message: "Email, OTP and new password are required" });
        }

        const user = await BusinessOwner.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Verify OTP
        const dbOtp = (user as any).otp;
        if (!dbOtp) {
            return res.status(400).json({ success: false, message: "No OTP found or Expired" });
        }

        const isMatch = await bcrypt.compare(otp, dbOtp);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid OTP code" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        (user as any).otp = undefined; // Clear any pending OTP
        await user.save();

        res.json({ success: true, message: "Password reset successful. You can now login with your new password." });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error instanceof Error ? error.message : String(error) });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const user = await BusinessOwner.findById(userId).select("-password -otp");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    ownerName: user.ownerName,
                    role: "business",
                    kycStatus: user.kycStatus,
                    businessName: user.businessName,
                    mobile: user.mobile,
                    profileImage: (user as any).profileImage,
                    businessAddress: user.businessAddress,
                    countryCode: user.countryCode,
                    businessLicense: user.businessLicense,
                    kycRejectionReason: user.kycRejectionReason
                }
            }
        });
    } catch (error) {
        console.error("Get Me Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const logoutBusiness = async (req: Request, res: Response) => {
    try {
        // Clear refresh token cookie if used
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
        });

        // If sessions are stored in DB, we could invalidate them here using req.user.id
        // For now, clearing the cookie is sufficient for a basic setup

        res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { ownerName, businessName, businessAddress, mobile, countryCode, email } = req.body;

        const user = await BusinessOwner.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (ownerName) user.ownerName = ownerName;
        if (businessName) user.businessName = businessName;
        if (businessAddress) user.businessAddress = businessAddress;

        if (mobile && mobile !== user.mobile) {
            const existingMobile = await BusinessOwner.findOne({ mobile, _id: { $ne: userId } });
            if (existingMobile) {
                return res.status(400).json({ success: false, message: "Mobile number is already in use" });
            }
            user.mobile = mobile;
        }

        if (email && email !== user.email) {
            const existingEmail = await BusinessOwner.findOne({ email, _id: { $ne: userId } });
            if (existingEmail) {
                return res.status(400).json({ success: false, message: "Email is already in use" });
            }
            user.email = email;
        }

        if (countryCode) user.countryCode = countryCode;

        // Handle multiple file uploads
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (files) {
            if (files.profileImage && files.profileImage[0]) {
                (user as any).profileImage = `/uploads/profile/${files.profileImage[0].filename}`;
            }
            if (files.businessLicense && files.businessLicense[0]) {
                user.businessLicense = `/uploads/profile/${files.businessLicense[0].filename}`;
            }
        }

        await user.save();

        res.json({
            success: true,
            message: "Profile updated successfully",
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    ownerName: user.ownerName,
                    role: "business",
                    kycStatus: user.kycStatus,
                    businessName: user.businessName,
                    mobile: user.mobile,
                    businessAddress: user.businessAddress,
                    profileImage: (user as any).profileImage,
                    businessLicense: user.businessLicense,
                    kycRejectionReason: user.kycRejectionReason
                }
            }
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error instanceof Error ? error.message : String(error) });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Old and new passwords are required" });
        }

        const user = await BusinessOwner.findById(userId);
        if (!user || !user.password) {
            return res.status(404).json({ success: false, message: "User not found or password not set" });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect current password" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getNotificationPreferences = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const user = await BusinessOwner.findById(userId).select("notificationPreferences");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            data: user.notificationPreferences || {
                emailAdApproval: true,
                emailPlatformUpdates: true,
                inAppCampaignStatus: true,
                inAppBudgetAlerts: true
            }
        });
    } catch (error) {
        console.error("Get Notification Preferences Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const updateNotificationPreferences = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { emailAdApproval, emailPlatformUpdates, inAppCampaignStatus, inAppBudgetAlerts } = req.body;

        const user = await BusinessOwner.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.notificationPreferences = {
            emailAdApproval: emailAdApproval !== undefined ? emailAdApproval : (user.notificationPreferences?.emailAdApproval ?? true),
            emailPlatformUpdates: emailPlatformUpdates !== undefined ? emailPlatformUpdates : (user.notificationPreferences?.emailPlatformUpdates ?? true),
            inAppCampaignStatus: inAppCampaignStatus !== undefined ? inAppCampaignStatus : (user.notificationPreferences?.inAppCampaignStatus ?? true),
            inAppBudgetAlerts: inAppBudgetAlerts !== undefined ? inAppBudgetAlerts : (user.notificationPreferences?.inAppBudgetAlerts ?? true),
        };

        await user.save();

        res.json({
            success: true,
            message: "Notification preferences updated successfully",
            data: user.notificationPreferences
        });
    } catch (error) {
        console.error("Update Notification Preferences Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const logoutAllSessions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const user = await BusinessOwner.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Increment token version to invalidate all current JWTs
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
        });

        res.json({ success: true, message: "Logged out from all sessions successfully" });
    } catch (error) {
        console.error("Logout All Sessions Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
