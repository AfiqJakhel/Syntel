import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient() as any;

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Find if submission exists
        const submission = await prisma.submission.findUnique({
            where: { id }
        });

        if (!submission) {
            return NextResponse.json(
                { error: "Submission tidak ditemukan" },
                { status: 404 }
            );
        }

        // Check if it's already approved (can't undo if approved)
        if (submission.status === "APPROVED") {
            return NextResponse.json(
                { error: "Tidak dapat membatalkan submission yang sudah disetujui" },
                { status: 400 }
            );
        }

        // Delete the submission
        await prisma.submission.delete({
            where: { id }
        });

        return NextResponse.json({
            message: "Submission berhasil dibatalkan"
        });

    } catch (error: any) {
        console.error("❌ UNDO SUBMISSION ERROR:", error.message);
        return NextResponse.json(
            { error: "Gagal membatalkan submission" },
            { status: 500 }
        );
    }
}
