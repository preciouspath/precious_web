/**
 * Fitbit Controller
 * Handles all Fitbit OAuth and data sync endpoints for the Patient app.
 *
 * Endpoints:
 * - GET  /api/patient/auth/fitbit/auth-url     → Get Fitbit authorization URL
 * - POST /api/patient/auth/fitbit/callback      → Exchange auth code for tokens
 * - POST /api/patient/auth/fitbit/sync           → Fetch & store latest health data
 * - GET  /api/patient/auth/fitbit/status         → Check Fitbit connection status
 * - POST /api/patient/auth/fitbit/disconnect     → Remove Fitbit connection
 */
import { Request, Response } from "express";
import User from "../../models/user";
import { notifyDashboardUpdate } from "../../utils/socketHandler";
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  fetchAllHealthData,
  encryptToken,
  decryptToken,
  isTokenExpired,
} from "../../services/fitbitService";

const FITBIT_PENDING_AUTH_TTL_MS = 10 * 60 * 1000;

/**
 * GET /api/patient/auth/fitbit/auth-url
 * Generate and return the Fitbit OAuth 2.0 authorization URL.
 * The mobile app should open this URL in a browser/WebView for user consent.
 */
export const getFitbitAuthUrl = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = (req as any).user?.id;
    const user = await User.findById(userId).select("healthProfile.fitbit");

    const existingState = user?.healthProfile?.fitbit?.authState;
    const existingAuthStartedAt = user?.healthProfile?.fitbit?.authStartedAt;

    const hasFreshPendingAuth =
      !!existingState &&
      !!existingAuthStartedAt &&
      Date.now() - new Date(existingAuthStartedAt).getTime() <
        FITBIT_PENDING_AUTH_TTL_MS;

    const state = hasFreshPendingAuth ? existingState : undefined;
    const authStartedAt = hasFreshPendingAuth
      ? existingAuthStartedAt
      : new Date();

    const { redirectUri } = req.query; // Optional: specify redirect for web
    const { url, state: resolvedState } = await getAuthorizationUrl(
      undefined,
      state,
      redirectUri as string
    );

    await User.findByIdAndUpdate(userId, {
      $set: {
        "healthProfile.fitbit.codeVerifier": null,
        "healthProfile.fitbit.authState": resolvedState,
        "healthProfile.fitbit.authStartedAt": authStartedAt,
      },
    });

    res.json({
      success: true,
      message: "Fitbit authorization URL generated successfully",
      data: {
        authorizationUrl: url,
        state: resolvedState,
      },
    });
  } catch (error) {
    console.error("Fitbit Auth URL Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate Fitbit authorization URL",
      error: error instanceof Error ? error.message : error,
    });
  }
};

/**
 * POST /api/patient/auth/fitbit/callback
 * Receive the authorization code from the app after user consent.
 * Exchange it for access + refresh tokens and store (encrypted) in the DB.
 *
 * Body: { code: string }
 */
export const fitbitCallback = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = (req as any).user?.id;
    const { code, state, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is required",
      });
    }

    console.log(`[Fitbit] Received callback for user: ${userId}. Code length: ${code.length}`);

    const user = await User.findById(userId);
    const expectedState = user?.healthProfile?.fitbit?.authState;

    if (state && expectedState && state !== expectedState) {
      return res.status(400).json({
        success: false,
        message:
          "Fitbit authorization state mismatch. Please restart the connection process.",
      });
    }

    // Retrieve the codeVerifier stored during getFitbitAuthUrl
    const codeVerifier = user?.healthProfile?.fitbit?.codeVerifier;

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier, redirectUri);

    // Calculate token expiry time
    const tokenExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(tokens.accessToken);
    const encryptedRefreshToken = encryptToken(tokens.refreshToken);

    // Update user with Fitbit connection data
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          "healthProfile.fitbit.accessToken": encryptedAccessToken,
          "healthProfile.fitbit.refreshToken": encryptedRefreshToken,
          "healthProfile.fitbit.userId": tokens.userId,
          "healthProfile.fitbit.scope": tokens.scope,
          "healthProfile.fitbit.tokenExpiresAt": tokenExpiresAt,
          "healthProfile.fitbit.codeVerifier": null, // Clear verifier after use
          "healthProfile.fitbit.authState": null,
          "healthProfile.fitbit.authStartedAt": null,
          "healthProfile.smartwatch.connected": true,
          "healthProfile.smartwatch.type": "Fitbit",
          "healthProfile.smartwatch.permissions": {
            heartRate: true,
            stepCount: true,
            sleepData: true,
            bloodOxygen: true,
            bloodPressure: true
          }
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

    res.json({
      success: true,
      message: "Fitbit connected successfully",
      data: {
        fitbitUserId: tokens.userId,
        connectedScopes: tokens.scope,
        smartwatch: {
          connected: true,
          type: "Fitbit",
        },
      },
    });

    // --- Automatic Initial Sync (Background) ---
    // We do this AFTER sending response to keep the UI snappy, 
    // but the data will be ready for the next /me call.
    try {
      console.log(`[Fitbit] Triggering initial sync for user: ${userId}`);
      const healthData = await fetchAllHealthData(tokens.accessToken);
      const now = new Date();

      await User.findByIdAndUpdate(userId, {
        $set: {
          "healthProfile.smartwatch.data": healthData,
          "healthProfile.smartwatch.lastSync": now,
          "healthProfile.fitbit.lastSync": now,
        },
      });

      // Notify web dashboard via Socket.io
      notifyDashboardUpdate(userId, healthData);
      console.log(`[Fitbit] Initial sync completed for user: ${userId}`);
    } catch (syncError) {
      console.error(`[Fitbit] Initial sync failed for user ${userId}:`, syncError);
    }
  } catch (error: any) {
    // console.error(`[Fitbit] Callback error for user ${userId}:`, error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    let userFriendlyMessage = "Failed to connect Fitbit account. Please try again.";
    let statusCode = 500;

    const userId = (req as any).user?.id;

    // Handle specific Fitbit OAuth errors professionally
    if (errorMessage.includes("invalid_grant")) {
      await User.findByIdAndUpdate(userId, {
        $set: {
          "healthProfile.fitbit.codeVerifier": null,
          "healthProfile.fitbit.authState": null,
          "healthProfile.fitbit.authStartedAt": null,
        },
      });
      userFriendlyMessage = "The authorization session expired or the code was already used. Please restart the connection process.";
      statusCode = 400;
    } else if (errorMessage.includes("invalid_client")) {
      userFriendlyMessage = "System configuration error (Invalid Client). Please contact support.";
      statusCode = 500;
    } else if (errorMessage.includes("redirect_uri_mismatch")) {
      userFriendlyMessage = "System configuration error (Redirect URI mismatch). Please contact support.";
      statusCode = 500;
    }

    res.status(statusCode).json({
      success: false,
      message: userFriendlyMessage,
      error: errorMessage,
    });
  }
};

/**
 * POST /api/patient/auth/fitbit/sync
 * Fetch the latest health data from Fitbit and store it in the user's profile.
 * Automatically refreshes expired tokens.
 *
 * Body (optional): { date: "YYYY-MM-DD" }
 */
export const syncFitbitData = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = (req as any).user?.id;
    const { date } = req.body;

    // Get user with Fitbit credentials
    const person = await User.findById(userId);

    if (!person) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const fitbit = person.healthProfile?.fitbit;

    if (!fitbit?.accessToken || !fitbit?.refreshToken) {
      return res.status(400).json({
        success: false,
        message:
          "Fitbit is not connected. Please connect your Fitbit account first.",
      });
    }

    // Decrypt the stored tokens
    let accessToken = decryptToken(fitbit.accessToken);
    let refreshTokenValue = decryptToken(fitbit.refreshToken);

    // Check if access token is expired and refresh if needed
    if (fitbit.tokenExpiresAt && isTokenExpired(fitbit.tokenExpiresAt)) {
      console.log(`[Fitbit] Token expired for user ${userId}, refreshing...`);

      try {
        const refreshed = await refreshAccessToken(refreshTokenValue);

        // Calculate new expiry
        const newExpiresAt = new Date(
          Date.now() + refreshed.expiresIn * 1000
        );

        // Encrypt new tokens
        const newEncryptedAccess = encryptToken(refreshed.accessToken);
        const newEncryptedRefresh = encryptToken(refreshed.refreshToken);

        // Update in DB
        await User.findByIdAndUpdate(userId, {
          $set: {
            "healthProfile.fitbit.accessToken": newEncryptedAccess,
            "healthProfile.fitbit.refreshToken": newEncryptedRefresh,
            "healthProfile.fitbit.tokenExpiresAt": newExpiresAt,
          },
        });

        // Use new tokens
        accessToken = refreshed.accessToken;
        refreshTokenValue = refreshed.refreshToken;

        console.log(`[Fitbit] Token refreshed successfully for user ${userId}`);
      } catch (refreshError) {
        console.error("Fitbit token refresh failed:", refreshError);
        return res.status(401).json({
          success: false,
          message:
            "Fitbit session expired. Please reconnect your Fitbit account.",
          requiresReconnect: true,
        });
      }
    }

    // Fetch all health data from Fitbit API
    const healthData = await fetchAllHealthData(accessToken, date);

    // Update user's health profile with the fetched data
    const now = new Date();
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          "healthProfile.smartwatch.data": healthData,
          "healthProfile.smartwatch.lastSync": now,
          "healthProfile.smartwatch.connected": true,
          "healthProfile.smartwatch.type": "Fitbit",
          "healthProfile.fitbit.lastSync": now,
        },
      },
      { new: true }
    );

    // Send real-time update to web dashboard via WebSocket
    notifyDashboardUpdate(userId, healthData);

    res.json({
      success: true,
      message: "Fitbit data synced successfully",
      data: {
        ...healthData,
        lastSync: now.toISOString(),
        source: "Fitbit",
      },
    });
  } catch (error) {
    console.error("Fitbit Sync Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync Fitbit data",
      error: error instanceof Error ? error.message : error,
    });
  }
};

/**
 * GET /api/patient/auth/fitbit/status
 * Check the current Fitbit connection status.
 */
export const getFitbitStatus = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = (req as any).user?.id;

    const person = await User.findById(userId).select(
      "healthProfile.fitbit healthProfile.smartwatch"
    );

    if (!person) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const fitbit = person.healthProfile?.fitbit;
    const smartwatch = person.healthProfile?.smartwatch;

    const isConnected =
      !!fitbit?.accessToken &&
      smartwatch?.connected === true &&
      smartwatch?.type === "Fitbit";

    res.json({
      success: true,
      data: {
        connected: isConnected,
        type: isConnected ? "Fitbit" : null,
        fitbitUserId: fitbit?.userId || null,
        scope: fitbit?.scope || null,
        lastSync: fitbit?.lastSync || smartwatch?.lastSync || null,
        tokenExpired: fitbit?.tokenExpiresAt
          ? isTokenExpired(fitbit.tokenExpiresAt)
          : null,
        smartwatchData: smartwatch?.data || null,
      },
    });
  } catch (error) {
    console.error("Fitbit Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get Fitbit status",
      error: error instanceof Error ? error.message : error,
    });
  }
};

/**
 * POST /api/patient/auth/fitbit/disconnect
 * Remove Fitbit connection — clear tokens and mark as disconnected.
 */
export const disconnectFitbit = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = (req as any).user?.id;

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          "healthProfile.fitbit.accessToken": null,
          "healthProfile.fitbit.refreshToken": null,
          "healthProfile.fitbit.userId": null,
          "healthProfile.fitbit.scope": null,
          "healthProfile.fitbit.tokenExpiresAt": null,
          "healthProfile.fitbit.codeVerifier": null,
          "healthProfile.fitbit.authState": null,
          "healthProfile.fitbit.authStartedAt": null,
          "healthProfile.fitbit.lastSync": null,
          "healthProfile.smartwatch.connected": false,
          "healthProfile.smartwatch.type": null,
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

    res.json({
      success: true,
      message: "Fitbit disconnected successfully",
      data: {
        connected: false,
        type: null,
      },
    });
  } catch (error) {
    console.error("Fitbit Disconnect Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to disconnect Fitbit",
      error: error instanceof Error ? error.message : error,
    });
  }
};
