import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Helper function to get video thumbnail URL from video URL
export function getVideoThumbnail(videoUrl: string, options?: {
    width?: number;
    height?: number;
    format?: string;
}): string {
    const { width = 400, height = 300, format = 'jpg' } = options || {};

    // If it's a Cloudinary URL, transform it
    if (videoUrl.includes('cloudinary.com')) {
        return videoUrl
            .replace('/video/upload/', `/video/upload/w_${width},h_${height},c_fill,so_0/`)
            .replace(/\.(mp4|mov|avi|webm)$/i, `.${format}`);
    }

    // For non-Cloudinary URLs, return as-is or a placeholder
    return videoUrl;
}

// Helper to determine if URL is a video
export function isVideoUrl(url: string): boolean {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
}

// Helper to determine if URL is an image
export function isImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.heic'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
}

// Format file size for display
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format duration from seconds to mm:ss
export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
