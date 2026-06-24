// src/controllers/authController.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { CONSTANTS } from "../../utils/constant";
import asyncHandler from "../../utils/asyncHandler";
import { STATUS_CODE } from "../../utils/statusCode";
import { MESSAGE } from "../../utils/responseMessages";
import user from "../../models/user";
import { sendMail } from "../../utils/sendMail";
import { getResetLinkTemplate } from "../../utils/emailTemplates";
import { createAccessToken } from "../../utils/token";

interface ILoginForm {
  email: string;
  password: string;
}

interface IRegisterForm {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface IChangePassword {
  currentPassword: string;
  newPassword: string;
}

export const login = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  try {
    // Validate req.body exists
    if (!req.body || typeof req.body !== 'object') {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        message: "Invalid request body",
      });
    }

    const { email, password }: ILoginForm = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        message: "Email and password are required",
      });
    }
    const allowedRoles = [
      CONSTANTS.ROLE.ADMIN,
    ];

    const users = await user.findOne({ email, role: { $in: allowedRoles } });

    if (!users) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        message: "User not found",
      });
    }



    if (["inactive", "suspended", "cancelled"].includes(users.status?.toLowerCase())) {
      return res.status(403).json({
        message: "Your account is suspended. Please contact the Super Admin.",
      });
    }

    if (typeof users.comparePassword !== "function") {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        message: MESSAGE.AUTH.LOGIN_FAILED,
      });
    }

    const isMatch = await users.comparePassword(password);

    if (!isMatch) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        message: MESSAGE.AUTH.LOGIN_FAILED,
      });
    }

    // Use standardized token generator
    const token = createAccessToken({
      id: users._id.toString(),
      role: users.role,
      tokenVersion: 1, // Or users.tokenVersion if you have it in model
    });

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: isProduction,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });

    return res.status(STATUS_CODE.OK).json({
      message: MESSAGE.AUTH.LOGIN_SUCCESS,
      users,
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      message: MESSAGE.COMMON.SERVER_ERROR,
    });
  }
});

export const register = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, password, role }: IRegisterForm = req.body;

    // Validate fields
    if (!name || !email || !password) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        message: "Name, Email, and Password are required",
      });
    }

    // Check existing user
    const existing = await user.findOne({ email });

    if (existing) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        message: "Email already exists",
      });
    }

    // Create user
    const newUser = await user.create({
      fullName: name,
      email,
      password,
      role: role || CONSTANTS.ROLE.ADMIN, // or default role
    });

    // Generate JWT using standard utility
    const token = createAccessToken({
      id: newUser._id.toString(),
      role: newUser.role,
      tokenVersion: 1,
    });

    const isProduction = process.env.NODE_ENV === "production";
    // Set cookie
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: isProduction,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });

    return res.status(STATUS_CODE.OK).json({
      message: "Registration successful",
      user: newUser,
      token,
    });
  } catch (error) {
    console.error(error);

    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      message: MESSAGE.COMMON.SERVER_ERROR,
    });
  }
});

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      console.log(email, 'email')
      // Find user by email (admin in your case)
      const users = await user.findOne({ email, role: CONSTANTS.ROLE.ADMIN });
      console.log(users, 'users')

      if (!users) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { id: users._id, email: users.email },
        process.env.JWT_SECRET || "default_secret",
        { expiresIn: "15m" }
      );

      // Save token + expiry
      users.resetPasswordToken = resetToken;
      users.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 min
      await users.save();

      // Create reset link
      const resetLink = `${process.env.FRONTEND_URL_ADMIN}reset-password?token=${resetToken}`;

      // Email content
      const subject = "Reset Your Password";
      const body = getResetLinkTemplate(users.fullName, resetLink);

      // Send email
      await sendMail(email, subject, body);

      return res.status(200).json({
        message: "Reset password link sent to your email",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Server Error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token & password required" });
      }

      // Verify token
      let decoded: any;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
      } catch {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      const users = await user.findOne({
        _id: decoded.id,
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!users) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      // Update password
      users.password = password;
      users.resetPasswordToken = undefined;
      users.resetPasswordExpires = undefined;
      await users.save();

      return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      return res.status(500).json({
        message: "Server Error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

export const getProfile = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(STATUS_CODE.UNAUTHORIZED).json({
          message: MESSAGE.AUTH.UNAUTHORIZED,
        });
      }

      const users = await user
        .findById(userId)
        .select("-password -resetPasswordToken -resetPasswordExpires");

      if (!users) {
        return res.status(STATUS_CODE.NOT_FOUND).json({
          message: "User not found",
        });
      }

      return res.status(STATUS_CODE.OK).json({
        message: "Profile fetched successfully",
        user: users,
      });
    } catch (error) {
      console.error(error);
      return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
        message: MESSAGE.COMMON.SERVER_ERROR,
      });
    }
  }
);

export const changePassword = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req as any).user?.id;
      const { currentPassword, newPassword }: IChangePassword = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(STATUS_CODE.BAD_REQUEST).json({
          message: "Current password and new password are required",
        });
      }

      const users = await user.findById(userId);

      if (!users) {
        return res.status(STATUS_CODE.NOT_FOUND).json({
          message: "User not found",
        });
      }

      if (typeof users.comparePassword !== "function") {
        return res.status(STATUS_CODE.BAD_REQUEST).json({
          message: "Password comparison not available",
        });
      }

      const isMatch = await users.comparePassword(currentPassword);

      if (!isMatch) {
        return res.status(STATUS_CODE.BAD_REQUEST).json({
          message: "Current password is incorrect",
        });
      }

      users.password = newPassword;

      users.resetPasswordToken = undefined;
      users.resetPasswordExpires = undefined;

      await users.save();

      return res.status(STATUS_CODE.OK).json({
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
        message: MESSAGE.COMMON.SERVER_ERROR,
      });
    }
  }
);

export const updateProfile = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(STATUS_CODE.UNAUTHORIZED).json({
          message: MESSAGE.AUTH.UNAUTHORIZED,
        });
      }

      const users = await user.findById(userId);

      if (!users) {
        return res.status(STATUS_CODE.NOT_FOUND).json({
          message: "User not found",
        });
      }

      const { fullName, email } = req.body;

      /* ---------- EMAIL UPDATE WITH DUPLICATE CHECK ---------- */
      if (email && email !== users.email) {
        const emailExists = await user.findOne({ email });

        if (emailExists) {
          return res.status(STATUS_CODE.BAD_REQUEST).json({
            message: "Email already in use",
          });
        }

        users.email = email;
        users.emailVerified = false; // important
      }

      /* ---------- NAME UPDATE ---------- */
      if (fullName) {
        users.fullName = fullName;
      }

      /* ---------- PROFILE IMAGE ---------- */
      if (req.file) {
        users.profileImage = `/uploads/profile/${req.file.filename}`;
      }

      await users.save();

      return res.status(STATUS_CODE.OK).json({
        message: "Profile updated successfully",
        user: {
          _id: users._id,
          fullName: users.fullName,
          email: users.email,
          profileImage: users.profileImage,
          emailVerified: users.emailVerified,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
        message: MESSAGE.COMMON.SERVER_ERROR,
      });
    }
  }
);

export const logout = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const isProduction = process.env.NODE_ENV === "production";
      // Clear the accessToken cookie
      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
      });

      return res.status(STATUS_CODE.OK).json({
        message: "Logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
        message: MESSAGE.COMMON.SERVER_ERROR,
      });
    }
  }
);






