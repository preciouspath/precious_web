/**
 * Formats a server-side file path into a full absolute URL.
 * Falls back to deriving the server root from VITE_API_URL if VITE_SERVER_URL is missing.
 */
export const formatUploadUrl = (path: string | undefined) => {
    if (!path) return "";

    // If already an absolute URL, return as is
    if (path.startsWith("http")) return path;

    const serverUrl = import.meta.env.VITE_SERVER_URL;

    if (serverUrl) {
        return `${serverUrl}${path.startsWith("/") ? "" : "/"}${path}`;
    }

    // Fallback: Derive from VITE_API_URL
    // API URL looks like: https://api.domain.com/api/patient/auth
    // We want: https://api.domain.com
    try {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (apiUrl) {
            const url = new URL(apiUrl);
            return `${url.protocol}//${url.host}${path.startsWith("/") ? "" : "/"}${path}`;
        }
    } catch (e) {
        console.error("Failed to derive server URL from API_URL", e);
    }

    // Last resort: relative path (will likely fail on frontend domain, but better than nothing)
    return path;
};
