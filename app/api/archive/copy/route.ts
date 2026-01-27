import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: "ID tidak disediakan." }, { status: 400 });
        }

        const original = await prisma.submission.findUnique({
            where: { id },
            include: {
                instruction: true,
                author: true
            }
        });

        if (!original) {
            return NextResponse.json({ error: "Arsip tidak ditemukan." }, { status: 404 });
        }

        // Create a copy of the submission
        // We preserve most metadata but add (Copy) to the title
        const copy = await prisma.submission.create({
            data: {
                title: `${original.title} (Copy)`,
                description: original.description,
                fileUrl: original.fileUrl,
                thumbnail: original.thumbnail,
                fileSize: original.fileSize,
                duration: original.duration,
                contentType: original.contentType,
                status: "APPROVED", // Already approved since it's in the archive
                authorId: original.authorId,
                instructionId: null, // Don't link it to the same instruction to avoid uniqueness constraints if any
                reviewedById: original.reviewedById,
                folderId: original.folderId,
            }
        });

        return NextResponse.json({
            message: "Berhasil menggandakan arsip",
            submission: copy
        });
    } catch (error: any) {
        console.error("❌ Copy Submission Error:", error);
        return NextResponse.json({ error: "Gagal menggandakan arsip." }, { status: 500 });
    }
}
