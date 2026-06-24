export const formatUploadUrl = (url: string | undefined | null) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    
    const baseUrl = import.meta.env.VITE_IMAGE_URL || "http://localhost:4000";
    // Ensure we don't have double slashes if url starts with /
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    return `${baseUrl}${cleanUrl}`;
};
