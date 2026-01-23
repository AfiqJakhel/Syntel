import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { isVideoUrl } from "@/lib/cloudinary";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const uploaderId = searchParams.get("uploaderId");

        const folders = await prisma.archiveFolder.findMany({
            where: uploaderId ? { uploaderId } : {},
            include: {
                _count: {
                    select: { resources: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ folders });
    } catch (error: any) {
        console.error("❌ Folder API Error:", error);
        return NextResponse.json({ error: "Gagal memuat folder." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, uploaderId } = body;

        if (!name || !uploaderId) {
            return NextResponse.json({ error: "Nama folder dan pengunggah diperlukan." }, { status: 400 });
        }

        const folder = await prisma.archiveFolder.create({
            data: {
                name,
                description,
                uploaderId
            }
        });

        return NextResponse.json({
            message: "Folder berhasil dibuat",
            folder
        });
    } catch (error: any) {
        console.error("❌ Folder Create Error:", error);
        return NextResponse.json({ error: "Gagal membuat folder." }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const deleteContents = searchParams.get("deleteContents") === "true";

        if (!id) {
            return NextResponse.json({ error: "ID folder tidak disediakan." }, { status: 400 });
        }

        const folder = await prisma.archiveFolder.findUnique({
            where: { id },
            include: { resources: true }
        });

        if (!folder) {
            return NextResponse.json({ error: "Folder tidak ditemukan." }, { status: 404 });
        }

        if (deleteContents) {
            // Delete all resources in the folder from Cloudinary
            for (const res of folder.resources) {
                if (res.cloudinaryId) {
                    try {
                        const isVideo = isVideoUrl(res.fileUrl);
                        await cloudinary.uploader.destroy(res.cloudinaryId, {
                            resource_type: isVideo ? "video" : "image"
                        });
                    } catch (err) {
                        console.error(`❌ Cloudinary Delete Error for ${res.id}:`, err);
                    }
                }
            }
            // Resources will be deleted automatically or via SetNull depending on schema
            // Since we used onDelete: SetNull, we should manually delete them if deleteContents is true
            await prisma.archiveResource.deleteMany({
                where: { folderId: id }
            });
        }

        await prisma.archiveFolder.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Folder berhasil dihapus." });
    } catch (error: any) {
        console.error("❌ Folder Delete Error:", error);
        return NextResponse.json({ error: "Gagal menghapus folder." }, { status: 500 });
    }
}
