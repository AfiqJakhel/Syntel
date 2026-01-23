import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

interface CloudinaryUploadResult extends UploadApiResponse {
    eager?: Array<{
        secure_url: string;
        width: number;
        height: number;
        format: string;
    }>;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const useCloudinary = formData.get("useCloudinary") !== "false"; // Default to true

        if (!file) {
            return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Determine resource type based on file extension
        const extension = file.name.split(".").pop()?.toLowerCase() || "";
        const videoExtensions = ["mp4", "mov", "avi", "webm", "mkv", "m4v"];
        const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

        const isVideo = videoExtensions.includes(extension);
        const isImage = imageExtensions.includes(extension);
        const resourceType = isVideo ? "video" : isImage ? "image" : "auto";

        // Check if Cloudinary is configured
        const cloudinaryConfigured =
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET;

        if (useCloudinary && cloudinaryConfigured) {
            // Upload to Cloudinary
            const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
                const uploadOptions: any = {
                    resource_type: resourceType,
                    folder: "syntel-archive",
                    use_filename: true,
                    unique_filename: true,
                };

                // Add eager transformation for videos to generate thumbnail
                if (isVideo) {
                    uploadOptions.eager = [
                        { width: 400, height: 300, crop: "fill", format: "jpg", start_offset: "0" },
                        { width: 800, height: 450, crop: "fill", format: "jpg", start_offset: "0" },
                    ];
                    uploadOptions.eager_async = false; // Wait for transformations
                }

                const uploadStream = cloudinary.uploader.upload_stream(
                    uploadOptions,
                    (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                        if (error) {
                            console.error("❌ Cloudinary upload error:", error);
                            reject(error);
                        } else if (result) {
                            resolve(result as CloudinaryUploadResult);
                        }
                    }
                );

                uploadStream.end(buffer);
            });

            // Get thumbnail URL
            let thumbnailUrl = null;
            if (isVideo && result.eager && result.eager.length > 0) {
                thumbnailUrl = result.eager[0].secure_url;
            } else if (isImage) {
                // For images, create a smaller thumbnail version
                thumbnailUrl = result.secure_url.replace(
                    "/upload/",
                    "/upload/w_400,h_300,c_fill/"
                );
            }

            return NextResponse.json({
                message: "Upload berhasil ke Cloudinary",
                fileUrl: result.secure_url,
                thumbnail: thumbnailUrl,
                cloudinaryId: result.public_id,
                fileSize: result.bytes,
                duration: result.duration ? Math.round(result.duration) : null,
                width: result.width,
                height: result.height,
                format: result.format,
                resourceType: result.resource_type,
            });
        } else {
            // Fallback to local storage
            const { writeFile, mkdir } = await import("fs/promises");
            const { join } = await import("path");

            const uploadDir = join(process.cwd(), "public", "uploads");

            try {
                await mkdir(uploadDir, { recursive: true });
            } catch (e) {
                // Directory might already exist
            }

            const uniqueId = crypto.randomUUID();
            const fileName = `${uniqueId}.${extension}`;
            const path = join(uploadDir, fileName);

            await writeFile(path, buffer);

            const fileUrl = `/uploads/${fileName}`;

            return NextResponse.json({
                message: "Upload berhasil ke local storage",
                fileUrl,
                thumbnail: isImage ? fileUrl : null,
                cloudinaryId: null,
                fileSize: buffer.length,
                duration: null,
                width: null,
                height: null,
                format: extension,
                resourceType: resourceType,
            });
        }

    } catch (error: any) {
        console.error("❌ UPLOAD ERROR:", error.message || error);
        return NextResponse.json(
            { error: "Gagal mengunggah file ke server.", details: error.message },
            { status: 500 }
        );
    }
}
