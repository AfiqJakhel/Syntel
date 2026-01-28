import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isVideoUrl, isImageUrl, getVideoThumbnail } from "@/lib/cloudinary";
import cloudinary from "@/lib/cloudinary";
import { rateLimiters, getClientIdentifier, RATE_LIMITS, createRateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const folderId = searchParams.get("folderId");

        const whereClause: any = {
            OR: [
                { title: { contains: search } },
                { description: { contains: search } },
            ],
        };

        if (folderId) {
            whereClause.folderId = folderId === "root" ? null : folderId;
        }

        const [total, resources] = await Promise.all([
            prisma.archiveResource.count({ where: whereClause }),
            prisma.archiveResource.findMany({
                where: whereClause,
                include: {
                    uploader: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                    folder: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        const files = resources.map((res: any) => {
            const isVideo = isVideoUrl(res.fileUrl);
            const isImage = isImageUrl(res.fileUrl);

            // Fix: If thumbnail is missing or is just the video URL, generate a proper JPG thumbnail
            let thumbnail = res.thumbnail;
            if (!thumbnail || isVideoUrl(thumbnail)) {
                if (isVideo) thumbnail = getVideoThumbnail(res.fileUrl);
                else if (isImage) thumbnail = res.fileUrl;
            }

            return {
                id: res.id,
                title: res.title,
                description: res.description,
                fileUrl: res.fileUrl,
                thumbnail,
                fileSize: res.fileSize,
                duration: res.duration,
                cloudinaryId: res.cloudinaryId,
                folderId: res.folderId,
                folderName: res.folder?.name || null,
                fileType: isVideo ? "VIDEO" : isImage ? "IMAGE" : "DOCUMENT",
                author: `${res.uploader.firstName} ${res.uploader.lastName}`,
                createdAt: res.createdAt.toISOString(),
                updatedAt: res.updatedAt.toISOString(),
            };
        });

        return NextResponse.json({
            files,
            stats: {
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
            }
        });
    } catch (error: any) {
        console.error("❌ Resource API Error:", error);
        return NextResponse.json({ error: "Gagal memuat bahan mentah." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    // Rate limiting check - 50 uploads per 30 minutes
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimiters.fileUpload.check(identifier);

    if (!rateLimitResult.success) {
        return createRateLimitResponse(RATE_LIMITS.FILE_UPLOAD, rateLimitResult.retryAfter);
    }

    try {
        const body = await request.json();
        const { title, description, fileUrl, thumbnail, fileSize, duration, uploaderId, contentType, cloudinaryId, folderId } = body;

        if (!title || !fileUrl || !uploaderId) {
            return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
        }

        const resource = await prisma.archiveResource.create({
            data: {
                title,
                description,
                fileUrl,
                thumbnail,
                fileSize,
                duration,
                uploaderId,
                cloudinaryId,
                folderId,
                contentType: contentType || null,
            }
        });

        return NextResponse.json({
            message: "Bahan mentah berhasil disimpan",
            resource
        });
    } catch (error: any) {
        console.error("❌ Resource Create Error:", error);
        return NextResponse.json({ error: "Gagal menyimpan bahan mentah." }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const ids = searchParams.get("ids")?.split(",") || [];
        const id = searchParams.get("id");

        const targetIds = id ? [id] : ids;

        if (targetIds.length === 0) {
            return NextResponse.json({ error: "ID tidak disediakan." }, { status: 400 });
        }

        const resources = await prisma.archiveResource.findMany({
            where: { id: { in: targetIds } }
        });

        if (resources.length === 0) {
            return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
        }

        // Delete from Cloudinary
        for (const resource of resources) {
            if (resource.cloudinaryId) {
                try {
                    const isVideo = isVideoUrl(resource.fileUrl);
                    await cloudinary.uploader.destroy(resource.cloudinaryId, {
                        resource_type: isVideo ? "video" : "image"
                    });
                } catch (err) {
                    console.error("❌ Cloudinary Delete Error:", err);
                }
            }
        }

        // Delete from database
        await prisma.archiveResource.deleteMany({
            where: { id: { in: targetIds } }
        });

        return NextResponse.json({ message: "Data berhasil dihapus dari arsip." });
    } catch (error: any) {
        console.error("❌ Resource Delete Error:", error);
        return NextResponse.json({ error: "Gagal menghapus data dari arsip." }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, title, folderId } = body;

        if (!id) {
            return NextResponse.json({ error: "ID tidak disediakan." }, { status: 400 });
        }

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (folderId !== undefined) updateData.folderId = folderId === "root" ? null : folderId;

        const resource = await prisma.archiveResource.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({
            message: "Data berhasil diperbarui",
            resource
        });
    } catch (error: any) {
        console.error("❌ Resource Update Error:", error);
        return NextResponse.json({ error: "Gagal memperbarui data." }, { status: 500 });
    }
}

