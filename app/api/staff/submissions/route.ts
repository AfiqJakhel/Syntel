import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient() as any;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, fileUrl, contentType, authorId, instructionId } = body;

        // Basic validation
        if (!title || !contentType || !authorId) {
            return NextResponse.json(
                { error: "Judul, tipe konten, dan penulis wajib diisi." },
                { status: 400 }
            );
        }

        // Generate Custom ID: SBM-XX (Sequential)
        const lastSubmission = await prisma.submission.findFirst({
            orderBy: { id: 'desc' },
            select: { id: true }
        });

        let nextNumber = 1;
        if (lastSubmission && lastSubmission.id.startsWith("SBM-")) {
            const lastIdStr = lastSubmission.id.split("-")[1];
            nextNumber = parseInt(lastIdStr) + 1;
        }
        const customId = `SBM-${String(nextNumber).padStart(2, '0')}`;

        // Create the submission
        const submission = await prisma.submission.create({
            data: {
                id: customId,
                title,
                description,
                fileUrl,
                contentType,
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
