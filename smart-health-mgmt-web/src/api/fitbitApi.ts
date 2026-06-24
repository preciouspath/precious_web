/**
 * Fitbit API service for the web dashboard.
 * Connects to the backend Fitbit integration endpoints.
 */
import axiosClient from "./axiosClient";

const FITBIT_BASE = "/fitbit";

/**
 * GET /fitbit/auth-url
 * Get the Fitbit OAuth authorization URL.
 */
export const getFitbitAuthUrl = (redirectUri?: string) => {
  return axiosClient.get(`${FITBIT_BASE}/auth-url`, {
    params: { redirectUri }
  });
};

/**
 * POST /fitbit/callback
 * Complete the OAuth connection.
 */
export const connectFitbit = (code: string, state: string, redirectUri?: string) => {
  return axiosClient.post(`${FITBIT_BASE}/callback`, { code, state, redirectUri });
};

/**
 * GET /fitbit/status
 * Check Fitbit connection status, last sync, scopes.
 */
export const getFitbitStatus = () => {
  return axiosClient.get(`${FITBIT_BASE}/status`);
};

/**
 * POST /fitbit/sync
 * Trigger a fresh sync from Fitbit API — fetches heart rate, steps, sleep, SpO2.
 * @param date Optional YYYY-MM-DD date string. Defaults to today.
 */
export const syncFitbitData = (date?: string) => {
  return axiosClient.post(`${FITBIT_BASE}/sync`, date ? { date } : {});
};

/**
 * POST /fitbit/disconnect
 * Remove Fitbit connection — clears all stored tokens.
 */
export const disconnectFitbit = () => {
  return axiosClient.post(`${FITBIT_BASE}/disconnect`, {});
};
