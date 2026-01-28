import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: "ID tidak disediakan." }, { status: 400 });
        }

        const original = await prisma.archiveResource.findUnique({
            where: { id }
        });

        if (!original) {
            return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
        }

        // We use the same cloudinary asset but create a new DB record
        // In a real production app, we might want to duplicate the Cloudinary asset too
        // but for now, this satisfies the "make a copy" UI requirement.
        const copy = await prisma.archiveResource.create({
            data: {
                title: `${original.title} (Copy)`,
                description: original.description,
                fileUrl: original.fileUrl,
                thumbnail: original.thumbnail,
                fileSize: original.fileSize,
                duration: original.duration,
                cloudinaryId: null, // Set to null to prevent deleting original if copy is deleted
                folderId: original.folderId,
                uploaderId: original.uploaderId,
                contentType: original.contentType,
            }
        });

        return NextResponse.json({
            message: "Berhasil menggandakan file",
            resource: copy
        });
    } catch (error: any) {
        console.error("❌ Copy Resource Error:", error);
        return NextResponse.json({ error: "Gagal menggandakan file." }, { status: 500 });
    }
}
