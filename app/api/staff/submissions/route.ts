import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { rateLimiters, getClientIdentifier, RATE_LIMITS, createRateLimitResponse } from "@/lib/rate-limit";

const prisma = new PrismaClient() as any;

export async function POST(request: Request) {
    // Rate limiting check - 10 submissions per hour
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimiters.createSubmission.check(identifier);

    if (!rateLimitResult.success) {
        return createRateLimitResponse(RATE_LIMITS.CREATE_SUBMISSION, rateLimitResult.retryAfter);
    }

    try {
        const body = await request.json();
        const { title, description, fileUrl, contentType, authorId, instructionId } = body;

        // Basic validation
        if (!title || !contentType || !authorId) {
            const missing = [];
            if (!title) missing.push("Judul");
            if (!contentType) missing.push("Tipe Konten");
            if (!authorId) missing.push("Penulis");

            return NextResponse.json(
                { error: `Data berikut wajib diisi: ${missing.join(", ")}.` },
                { status: 400 }
            );
        }

        // 1. Check if submission already exists for this instruction (Revision Case)
        let existingSubmission = null;
        if (instructionId) {
            existingSubmission = await prisma.submission.findUnique({
                where: { instructionId }
            });
        }

        if (existingSubmission) {
            // UPDATE existing submission
            const submission = await prisma.submission.update({
                where: { id: existingSubmission.id },
                data: {
                    title,
                    description,
                    fileUrl,
                    thumbnail: body.thumbnail || null,
                    fileSize: body.fileSize || null,
                    duration: body.duration || null,
                    cloudinaryId: body.cloudinaryId || null,
                    contentType,
                    category: body.category || null,
                    status: "PENDING", // Reset to pending for officer review
                    feedback: null // Clear old feedback upon resubmission
                }
            });

            return NextResponse.json({
                message: "Revisi berhasil dikirim",
                submissionId: submission.id
            });
        }

        // 2. CREATE NEW submission
        // Generate Custom ID: SBM-XX (Sequential)
        // We fetch all SBM IDs and find the true maximum to avoid string sorting issues
        const allSubmissions = await prisma.submission.findMany({
            where: { id: { startsWith: "SBM-" } },
            select: { id: true }
        });

        let nextNumber = 1;
        if (allSubmissions.length > 0) {
            const numbers = allSubmissions.map((s: any) => {
                const parts = s.id.split("-");
                return parts.length > 1 ? parseInt(parts[1]) : 0;
            }).filter((n: number) => !isNaN(n));

            if (numbers.length > 0) {
                nextNumber = Math.max(...numbers) + 1;
            }
        }

        const customId = `SBM-${String(nextNumber).padStart(2, '0')}`;

        const submission = await prisma.submission.create({
            data: {
                id: customId,
                title,
                description,
                fileUrl,
                thumbnail: body.thumbnail || null,
                fileSize: body.fileSize || null,
                duration: body.duration || null,
                cloudinaryId: body.cloudinaryId || null,
                contentType,
                category: body.category || null,
                authorId,
                instructionId: instructionId || null,
                status: "PENDING"
            }
        });

        return NextResponse.json({
            message: "Submission berhasil dikirim",
            submissionId: submission.id
        });

    } catch (error: any) {
        console.error("❌ CREATE SUBMISSION ERROR:", error.message);
        return NextResponse.json(
            { error: "Gagal menyimpan pengajuan ke database." },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    // This could be used by staff to see THEIR submissions
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get("authorId");

    try {
        const submissions = await prisma.submission.findMany({
            where: authorId ? { authorId } : {},
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(submissions);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
