/**
 * Fitbit OAuth 2.0 Service
 * Handles authorization, token exchange, token refresh, and health data fetching.
 *
 * Fitbit API Reference: https://dev.fitbit.com/build/reference/web-api/
 */
import crypto from "crypto";
import { encryptData, decryptData } from "../utils/crypto";

// ─── Configuration ──────────────────────────────────────────────────────────
const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID || "";
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET || "";
const FITBIT_REDIRECT_URI = process.env.FITBIT_REDIRECT_URI || "";
const FITBIT_AUTH_URI =
  process.env.FITBIT_AUTH_URI || "https://www.fitbit.com/oauth2/authorize";
const FITBIT_TOKEN_URI =
  process.env.FITBIT_TOKEN_URI || "https://api.fitbit.com/oauth2/token";
const FITBIT_OAUTH_APP_TYPE = "server";

// Scopes we request from the user
const FITBIT_SCOPES = "activity heartrate sleep oxygen_saturation profile";

// Basic auth header for token requests: base64(client_id:client_secret)
const BASIC_AUTH = Buffer.from(
  `${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`
).toString("base64");

function inferFitbitAppType(): "server" | "client" {
  if (FITBIT_CLIENT_SECRET) {
    return "server";
  }

  if (
    FITBIT_REDIRECT_URI.startsWith("http://") ||
    FITBIT_REDIRECT_URI.startsWith("https://")
  ) {
    return "server";
  }

  return "client";
}

function shouldUseBasicAuth(): boolean {
  return true;
}

function getTokenRequestHeaders(useBasicAuth: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (useBasicAuth) {
    headers.Authorization = `Basic ${BASIC_AUTH}`;
  }

  return headers;
}

function parseFitbitErrorBody(errorBody: string): any {
  try {
    return JSON.parse(errorBody);
  } catch {
    return errorBody;
  }
}

function getFitbitErrorType(parsedError: any): string | undefined {
  if (
    parsedError &&
    typeof parsedError === "object" &&
    Array.isArray(parsedError.errors) &&
    parsedError.errors.length > 0
  ) {
    return parsedError.errors[0]?.errorType;
  }

  return undefined;
}

async function postFitbitTokenRequest(
  body: URLSearchParams,
  useBasicAuth: boolean
) {
  return fetch(FITBIT_TOKEN_URI, {
    method: "POST",
    headers: getTokenRequestHeaders(useBasicAuth),
    body: body.toString(),
  });
}

// ─── Token Encryption Helpers ───────────────────────────────────────────────

/**
 * Encrypt a token string and return a JSON-stringified payload
 * suitable for storing in MongoDB.
 */
export function encryptToken(token: string): string {
  const encrypted = encryptData(token);
  return JSON.stringify(encrypted);
}

/**
 * Decrypt a token that was encrypted with encryptToken().
 */
export function decryptToken(encryptedJson: string): string {
  const payload = JSON.parse(encryptedJson);
  return decryptData(payload);
}

// ─── OAuth Flow ─────────────────────────────────────────────────────────────

/**
 * Generates a random PKCE code verifier and its S256 challenge
 */
export function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = getCodeChallenge(verifier);
  return { verifier, challenge };
}

/**
 * Derive the S256 challenge for an existing PKCE verifier.
 */
export function getCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Generates the Fitbit OAuth 2.0 authorization URL
 */
export async function getAuthorizationUrl(
  codeChallenge?: string,
  state?: string,
  redirectUri?: string
): Promise<{
  url: string;
  state: string;
}> {
  const authState = state || crypto.randomBytes(16).toString("hex");

  const params: any = {
    response_type: "code",
    client_id: FITBIT_CLIENT_ID,
    redirect_uri: redirectUri || FITBIT_REDIRECT_URI,
    scope: FITBIT_SCOPES,
    state: authState,
    prompt: "login consent",
  };

  // Add PKCE parameters if challenge is provided
  if (codeChallenge) {
    params.code_challenge = codeChallenge;
    params.code_challenge_method = "S256";
  }

  const searchParams = new URLSearchParams(params);
  const result = {
    url: `${FITBIT_AUTH_URI}?${searchParams.toString()}`,
    state: authState,
  };

  console.log(`[Fitbit] Generated Auth URL (PKCE: ${!!codeChallenge}): ${result.url}`);
  return result;
}

/**
 * Exchanges the authorization code for access and refresh tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier?: string,
  redirectUri?: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  userId: string;
  scope: string;
  expiresIn: number;
}> {
  const cleanCode = code.trim();

  const bodyParams: Record<string, string> = {
    grant_type: "authorization_code",
    code: cleanCode,
    client_id: FITBIT_CLIENT_ID,
    redirect_uri: redirectUri || FITBIT_REDIRECT_URI,
    client_secret: FITBIT_CLIENT_SECRET
  };

  // Include code_verifier if it was used in the first part of the flow
  if (codeVerifier) {
    bodyParams.code_verifier = codeVerifier;
    console.log(`[Fitbit] Using PKCE code_verifier for exchange`);
  } else {
    console.log("[Fitbit] Using standard authorization code exchange");
  }

  const body = new URLSearchParams(bodyParams);
  const authModes = shouldUseBasicAuth()
    ? [true, false]
    : [false, true].filter((mode) => !mode || !!FITBIT_CLIENT_SECRET);

  let lastStatus = 0;
  let lastParsedError: any;
  let lastUseBasicAuth = authModes[0];

  for (let index = 0; index < authModes.length; index++) {
    const useBasicAuth = authModes[index];
    lastUseBasicAuth = useBasicAuth;

    console.log(`[Fitbit] Attempting token exchange. URL: ${FITBIT_TOKEN_URI}`);
    console.log(`[Fitbit] Callback Code: ${cleanCode.substring(0, 5)}...${cleanCode.substring(cleanCode.length - 5)} (Length: ${cleanCode.length})`);
    console.log(`[Fitbit] OAuth app type: ${FITBIT_OAUTH_APP_TYPE}`);
    console.log(`[Fitbit] Using Basic Auth: ${useBasicAuth}`);
    console.log(`[Fitbit] Redirect URI used in exchange: ${FITBIT_REDIRECT_URI}`);
    console.log(
      `[Fitbit] Full Body (sanitized): ${codeVerifier
        ? `grant_type=authorization_code&code=REDACTED&client_id=${FITBIT_CLIENT_ID}&redirect_uri=${encodeURIComponent(
          FITBIT_REDIRECT_URI
        )}&code_verifier=REDACTED`
        : `grant_type=authorization_code&code=REDACTED&client_id=${FITBIT_CLIENT_ID}&redirect_uri=${encodeURIComponent(
          FITBIT_REDIRECT_URI
        )}`}`
    );

    const response = await postFitbitTokenRequest(body, useBasicAuth);

    if (response.ok) {
      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        userId: data.user_id,
        scope: data.scope,
        expiresIn: data.expires_in, // seconds (default 28800 = 8 hours)
      };
    }

    const errorBody = await response.text();
    const parsedError = parseFitbitErrorBody(errorBody);
    const errorType = getFitbitErrorType(parsedError);

    lastStatus = response.status;
    lastParsedError = parsedError;

    const canRetryWithAlternateAuth =
      response.status === 401 &&
      errorType === "invalid_client" &&
      index < authModes.length - 1;

    if (canRetryWithAlternateAuth) {
      console.warn("[Fitbit] Token exchange rejected current auth mode, retrying with alternate auth mode.", {
        status: response.status,
        error: JSON.stringify(parsedError, null, 2),
        using_basic_auth: useBasicAuth,
        next_using_basic_auth: authModes[index + 1],
      });
      continue;
    }

    console.error("[Fitbit] Token exchange failed:", {
      status: response.status,
      error: JSON.stringify(parsedError, null, 2),
      redirect_uri: codeVerifier ? undefined : FITBIT_REDIRECT_URI,
      app_type: FITBIT_OAUTH_APP_TYPE,
      using_basic_auth: useBasicAuth,
    });
    break;
  }

  throw new Error(
    `Fitbit token exchange failed (${lastStatus}): ${typeof lastParsedError === "object" ? JSON.stringify(lastParsedError) : lastParsedError}`
  );
}

/**
 * Refresh an expired access token using the refresh token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const authModes = shouldUseBasicAuth()
    ? [true, false]
    : [false, true].filter((mode) => !mode || !!FITBIT_CLIENT_SECRET);

  let lastStatus = 0;
  let lastParsedError: any;

  for (let index = 0; index < authModes.length; index++) {
    const useBasicAuth = authModes[index];
    const response = await postFitbitTokenRequest(body, useBasicAuth);

    if (response.ok) {
      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token, // Fitbit rotates refresh tokens
        expiresIn: data.expires_in,
      };
    }

    const errorBody = await response.text();
    const parsedError = parseFitbitErrorBody(errorBody);
    const errorType = getFitbitErrorType(parsedError);

    lastStatus = response.status;
    lastParsedError = parsedError;

    const canRetryWithAlternateAuth =
      response.status === 401 &&
      errorType === "invalid_client" &&
      index < authModes.length - 1;

    if (canRetryWithAlternateAuth) {
      console.warn("[Fitbit] Token refresh rejected current auth mode, retrying with alternate auth mode.", {
        status: response.status,
        error: JSON.stringify(parsedError, null, 2),
        using_basic_auth: useBasicAuth,
        next_using_basic_auth: authModes[index + 1],
      });
      continue;
    }

    console.error("Fitbit token refresh failed:", response.status, errorBody);
    break;
  }

  throw new Error(
    `Fitbit token refresh failed (${lastStatus}): ${typeof lastParsedError === "object" ? JSON.stringify(lastParsedError) : lastParsedError}`
  );
}

// ─── Data Fetching ──────────────────────────────────────────────────────────

const FITBIT_API_BASE = "https://api.fitbit.com";

/**
 * Generic helper to call a Fitbit API endpoint with Bearer token.
 */
async function fitbitApiGet(
  accessToken: string,
  path: string
): Promise<any> {
  const response = await fetch(`${FITBIT_API_BASE}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Fitbit API GET ${path} failed (${response.status}): ${errorBody}`
    );
  }

  return response.json();
}

/**
 * Get today's date in YYYY-MM-DD format.
 */
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Fetch heart rate data for today.
 * Endpoint: GET /1/user/-/activities/heart/date/{date}/1d.json
 */
export async function fetchHeartRate(
  accessToken: string,
  date?: string
): Promise<string> {
  try {
    const d = date || getTodayDate();
    const data = await fitbitApiGet(
      accessToken,
      `/1/user/-/activities/heart/date/${d}/1d.json`
    );

    // Extract resting heart rate or latest heart rate value
    const heartRateZones =
      data?.["activities-heart"]?.[0]?.value?.heartRateZones;
    const restingHR =
      data?.["activities-heart"]?.[0]?.value?.restingHeartRate;

    if (restingHR) return String(restingHR);

    // Fallback: get the average from the "Fat Burn" zone or any available zone
    if (heartRateZones && heartRateZones.length > 0) {
      const zone = heartRateZones.find((z: any) => z.minutes > 0);
      if (zone) return String(Math.round((zone.min + zone.max) / 2));
    }

    return "0";
  } catch (error) {
    console.error("Fitbit fetchHeartRate error:", error);
    return "0";
  }
}

/**
 * Fetch step count for today.
 * Endpoint: GET /1/user/-/activities/date/{date}.json
 */
export async function fetchSteps(
  accessToken: string,
  date?: string
): Promise<string> {
  try {
    const d = date || getTodayDate();
    const data = await fitbitApiGet(
      accessToken,
      `/1/user/-/activities/date/${d}.json`
    );

    const steps = data?.summary?.steps;
    return steps !== undefined ? String(steps) : "0";
  } catch (error) {
    console.error("Fitbit fetchSteps error:", error);
    return "0";
  }
}

/**
 * Fetch sleep data for today.
 * Endpoint: GET /1.2/user/-/sleep/date/{date}.json
 * Returns total hours of sleep.
 */
export async function fetchSleep(
  accessToken: string,
  date?: string
): Promise<string> {
  try {
    const d = date || getTodayDate();
    const data = await fitbitApiGet(
      accessToken,
      `/1.2/user/-/sleep/date/${d}.json`
    );

    const totalMinutes = data?.summary?.totalMinutesAsleep;
    if (totalMinutes !== undefined) {
      const hours = (totalMinutes / 60).toFixed(1);
      return hours;
    }

    return "0";
  } catch (error) {
    console.error("Fitbit fetchSleep error:", error);
    return "0";
  }
}

/**
 * Fetch SpO2 (blood oxygen) data for today.
 * Endpoint: GET /1/user/-/spo2/date/{date}.json
 * Note: SpO2 may not be available on all Fitbit devices.
 */
export async function fetchSpO2(
  accessToken: string,
  date?: string
): Promise<string> {
  try {
    const d = date || getTodayDate();
    const data = await fitbitApiGet(
      accessToken,
      `/1/user/-/spo2/date/${d}.json`
    );

    const avgValue = data?.value?.avg;
    if (avgValue !== undefined) return String(Math.round(avgValue));

    // Some Fitbit models return different structure
    const minMax = data?.value;
    if (minMax?.min && minMax?.max) {
      return String(Math.round((minMax.min + minMax.max) / 2));
    }

    return "0";
  } catch (error) {
    console.error("Fitbit fetchSpO2 error:", error);
    return "0";
  }
}

/**
 * Fetch all health data from Fitbit and return normalized object
 * matching the existing healthProfile.smartwatch.data schema.
 */
export async function fetchAllHealthData(
  accessToken: string,
  date?: string
): Promise<{
  heartRate: string;
  steps: string;
  sleep: string;
  bloodOxygen: string;
  bloodPressure: string;
}> {
  // Fetch all metrics in parallel for performance
  const [heartRate, steps, sleep, bloodOxygen] = await Promise.all([
    fetchHeartRate(accessToken, date),
    fetchSteps(accessToken, date),
    fetchSleep(accessToken, date),
    fetchSpO2(accessToken, date),
  ]);

  return {
    heartRate,
    steps,
    sleep,
    bloodOxygen,
    bloodPressure: "--/--", // Fitbit does not provide blood pressure data
  };
}

/**
 * Checks if a token is expired based on the stored expiry date.
 * Returns true if expired or will expire within 5 minutes.
 */
export function isTokenExpired(expiresAt: Date): boolean {
  const bufferMs = 5 * 60 * 1000; // 5-minute buffer
  return new Date().getTime() >= new Date(expiresAt).getTime() - bufferMs;
}
