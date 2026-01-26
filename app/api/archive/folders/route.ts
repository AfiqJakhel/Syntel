import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { isVideoUrl } from "@/lib/cloudinary";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const uploaderId = searchParams.get("uploaderId");
        const parentId = searchParams.get("parentId");
        const id = searchParams.get("id");

        // Fetch a single folder with its parent chain (breadcrumbing support)
        if (id) {
            const folder = await prisma.archiveFolder.findUnique({
                where: { id },
                include: {
                    parent: {
                        include: {
                            parent: true // Basic support for 2-3 levels easily
                        }
                    },
                    _count: true
                }
            });
            return NextResponse.json({ folder });
        }

        // Fetch multiple folders (either at root or inside another folder)
        const folders = await prisma.archiveFolder.findMany({
            where: {
                uploaderId: uploaderId || undefined,
                parentId: parentId === "null" ? null : (parentId || null) // Default to root if no parentId
            },
            include: {
                _count: true
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
        const { name, description, uploaderId, parentId } = body;

        if (!name || !uploaderId) {
            return NextResponse.json({ error: "Nama folder dan pengunggah diperlukan." }, { status: 400 });
        }

        const folder = await prisma.archiveFolder.create({
            data: {
                name,
                description,
                uploaderId,
                parentId: parentId || null
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

        // Recursive function to delete folder and all its contents
        async function deleteFolderRecursive(folderId: string): Promise<{ deletedResources: number; deletedFolders: number }> {
            let deletedResources = 0;
            let deletedFolders = 0;

            // Get folder with its resources and subfolders
            const folder = await prisma.archiveFolder.findUnique({
                where: { id: folderId },
                include: {
                    resources: true,
                    subFolders: true
                }
            });

            if (!folder) return { deletedResources, deletedFolders };

            // Recursively delete all subfolders first
            for (const subFolder of folder.subFolders) {
                const result = await deleteFolderRecursive(subFolder.id);
                deletedResources += result.deletedResources;
                deletedFolders += result.deletedFolders;
            }

            // Delete all resources in this folder from Cloudinary
            if (deleteContents) {
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
                // Delete resources from DB
                await prisma.archiveResource.deleteMany({
                    where: { folderId: folderId }
                });
                deletedResources += folder.resources.length;
            }

            // Delete the folder itself
            await prisma.archiveFolder.delete({
                where: { id: folderId }
            });
            deletedFolders += 1;

            return { deletedResources, deletedFolders };
        }

        const result = await deleteFolderRecursive(id);

        return NextResponse.json({
            message: "Folder berhasil dihapus.",
            deletedFolders: result.deletedFolders,
            deletedResources: result.deletedResources
        });
    } catch (error: any) {
        console.error("❌ Folder Delete Error:", error);
        return NextResponse.json({ error: "Gagal menghapus folder." }, { status: 500 });
    }
}
