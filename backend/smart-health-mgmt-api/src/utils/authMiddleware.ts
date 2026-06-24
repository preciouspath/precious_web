import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { STATUS_CODE } from "./statusCode";
import { MESSAGE } from "./responseMessages";

interface JwtPayload {
  sub: string;
  role: string;
  tv: number;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    let token: string | undefined;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(STATUS_CODE.UNAUTHORIZED).json({
        message: MESSAGE.AUTH.UNAUTHORIZED || "Unauthorized access",
      });
    }

    // Match secret logic from token.ts
    const secret = process.env.JWT_ACCESS_SECRET_BASE64
      ? Buffer.from(process.env.JWT_ACCESS_SECRET_BASE64, 'base64')
      : "default_secret";

    const decoded = jwt.verify(
      token,
      secret
    ) as JwtPayload;

    let existingUser: any;
    if (decoded.role === "business") {
      const { BusinessOwner } = require("../models/Business");
      existingUser = await BusinessOwner.findById(decoded.sub);
    } else {
      const User = require("../models/user").default;
      existingUser = await User.findById(decoded.sub);
    }

    if (!existingUser) {
      return res.status(STATUS_CODE.UNAUTHORIZED).json({
        message: "User not found or account deleted",
      });
    }

    (req as any).user = {
      id: decoded.sub,
      role: decoded.role,
      tokenVersion: decoded.tv
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(STATUS_CODE.UNAUTHORIZED).json({
      message: "Unauthorized access",
    });
  }
};
