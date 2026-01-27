import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: "ID folder disediakan." }, { status: 400 });
        }

        const original = await (prisma.archiveFolder as any).findUnique({
            where: { id },
            include: {
                resources: true,
                archivedSubmissions: true,
                subFolders: true,
            }
        });

        if (!original) {
            return NextResponse.json({ error: "Folder tidak ditemukan." }, { status: 404 });
        }

        async function duplicateFolder(originalFolder: any, parentId: string | null) {
            // Create the new folder record
            const newFolder = await (prisma.archiveFolder as any).create({
                data: {
                    name: `${originalFolder.name} (Copy)`,
                    description: originalFolder.description,
                    uploaderId: originalFolder.uploaderId,
                    parentId: parentId,
                }
            });

            // Copy resources
            if (originalFolder.resources && originalFolder.resources.length > 0) {
                for (const res of originalFolder.resources) {
                    await (prisma.archiveResource as any).create({
                        data: {
                            title: `${res.title} (Copy)`,
                            description: res.description,
                            fileUrl: res.fileUrl,
                            thumbnail: res.thumbnail,
                            fileSize: res.fileSize,
                            duration: res.duration,
                            cloudinaryId: null, // Don't delete original app resources
                            folderId: newFolder.id,
                            uploaderId: res.uploaderId,
                            contentType: res.contentType,
                        }
                    });
                }
            }

            // Copy submissions
            if (originalFolder.archivedSubmissions && originalFolder.archivedSubmissions.length > 0) {
                for (const sub of originalFolder.archivedSubmissions) {
                    await (prisma.submission as any).create({
                        data: {
                            title: `${sub.title} (Copy)`,
                            description: sub.description,
                            fileUrl: sub.fileUrl,
                            thumbnail: sub.thumbnail,
                            fileSize: sub.fileSize,
                            duration: sub.duration,
                            contentType: sub.contentType,
                            status: sub.status,
                            authorId: sub.authorId,
                            reviewedById: sub.reviewedById,
                            folderId: newFolder.id,
                        }
                    });
                }
            }

            // Recurse for subfolders
            const subFolders = await (prisma.archiveFolder as any).findMany({
                where: { parentId: originalFolder.id },
                include: {
                    resources: true,
                    archivedSubmissions: true,
                }
            });

            for (const subF of subFolders) {
                await duplicateFolder(subF, newFolder.id);
            }

            return newFolder;
        }

        const copiedFolder = await duplicateFolder(original, original.parentId);

        return NextResponse.json({
            message: "Folder berhasil digandakan",
            folder: copiedFolder
        });
    } catch (error: any) {
        console.error("❌ Copy Folder Error:", error);
        return NextResponse.json({ error: "Gagal menggandakan folder." }, { status: 500 });
    }
}
