import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVideoThumbnail, isVideoUrl, isImageUrl } from "@/lib/cloudinary";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const contentType = searchParams.get("contentType");
        const search = searchParams.get("search") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const sortBy = searchParams.get("sortBy") || "updatedAt";
        const sortOrder = searchParams.get("sortOrder") || "desc";

        // Build where clause
        const whereClause: any = {
            status: "APPROVED",
            fileUrl: { not: null }, // Only files with uploaded content
        };

        // Filter by content type
        if (contentType && contentType !== "ALL") {
            whereClause.contentType = contentType;
        }

        // Search filter
        if (search) {
            whereClause.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
            ];
        }

        // Get total count
        const total = await prisma.submission.count({ where: whereClause });

        // Fetch archived submissions
        const submissions = await prisma.submission.findMany({
            where: whereClause,
            include: {
                author: {
                    select: {
                        nip: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                reviewer: {
                    select: {
                        nip: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                instruction: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: {
                [sortBy]: sortOrder,
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        // Transform data for frontend
        const files = submissions.map((submission) => {
            const fileUrl = submission.fileUrl || "";
            const isVideo = isVideoUrl(fileUrl);
            const isImage = isImageUrl(fileUrl);

            // Generate thumbnail if not exists or if it's a video URL
            let thumbnail = submission.thumbnail;
            if (!thumbnail || isVideoUrl(thumbnail)) {
                if (isVideo) thumbnail = getVideoThumbnail(fileUrl);
                else if (isImage) thumbnail = fileUrl;
            }

            return {
                id: submission.id,
                title: submission.title,
                description: submission.description,
                fileUrl: submission.fileUrl,
                thumbnail,
                fileSize: submission.fileSize,
                duration: submission.duration,
                contentType: submission.contentType,
                fileType: isVideo ? "VIDEO" : isImage ? "IMAGE" : "DOCUMENT",
                author: submission.author
                    ? `${submission.author.firstName} ${submission.author.lastName}`
                    : "Unknown",
                authorNip: submission.author?.nip,
                reviewer: submission.reviewer
                    ? `${submission.reviewer.firstName} ${submission.reviewer.lastName}`
                    : null,
                instructionTitle: submission.instruction?.title || null,
                createdAt: submission.createdAt.toISOString(),
                updatedAt: submission.updatedAt.toISOString(),
                approvedAt: submission.updatedAt.toISOString(), // When status changed to APPROVED
            };
        });

        // Get content type counts for filter badges
        const contentTypeCounts = await prisma.submission.groupBy({
            by: ["contentType"],
            where: {
                status: "APPROVED",
                fileUrl: { not: null },
            },
            _count: true,
        });

        const stats = {
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            contentTypeCounts: contentTypeCounts.reduce((acc, item) => {
                acc[item.contentType] = item._count;
                return acc;
            }, {} as Record<string, number>),
        };

        return NextResponse.json({
            files,
            stats,
        });

    } catch (error: any) {
        console.error("❌ Archive API Error:", error);
        return NextResponse.json(
            { error: "Gagal memuat arsip.", details: error.message },
            { status: 500 }
        );
    }
}
