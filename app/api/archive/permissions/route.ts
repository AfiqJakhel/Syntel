import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch permissions for a folder
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const folderId = searchParams.get("folderId");
        const staffNip = searchParams.get("staffNip");

        if (!folderId) {
            return NextResponse.json({ error: "folderId required" }, { status: 400 });
        }

        // Special case for root permissions
        const targetFolderId = folderId; // folderId comes from client as 'root' or a real ID

        const permissions = await prisma.archiveFolderPermission.findMany({
            where: {
                folderId: targetFolderId,
                ...(staffNip && { staffNip })
            },
            include: {
                staff: {
                    select: {
                        nip: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        role: true
                    }
                }
            },
            orderBy: {
                grantedAt: "desc"
            }
        });

        return NextResponse.json({ permissions });
    } catch (error: any) {
        console.error("❌ Permission GET Error:", error);
        return NextResponse.json(
            { error: "Gagal memuat permissions." },
            { status: 500 }
        );
    }
}

// POST: Grant or update permission for a staff on a folder
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { folderId, staffNip, accessLevel, grantedById } = body;

        if (!folderId || !staffNip || !accessLevel || !grantedById) {
            return NextResponse.json(
                { error: "Data tidak lengkap. folderId, staffNip, accessLevel, dan grantedById wajib diisi." },
                { status: 400 }
            );
        }

        // Handle root permissions
        let targetFolderId = folderId;
        if (folderId === "root") {
            // Ensure a hidden system folder exists for root permissions
            const rootMarker = await prisma.archiveFolder.upsert({
                where: { id: "root" },
                update: {},
                create: {
                    id: "root",
                    name: "Arsip Utama",
                    description: "System folder for root permissions",
                    uploaderId: grantedById,
                }
            });
            targetFolderId = rootMarker.id;
        } else {
            // Verify normal folder exists
            const folder = await prisma.archiveFolder.findUnique({
                where: { id: folderId }
            });

            if (!folder) {
                return NextResponse.json({ error: "Folder tidak ditemukan." }, { status: 404 });
            }
        }

        // Verify staff exists and is actually STAFF role
        const staff = await prisma.user.findUnique({
            where: { nip: staffNip }
        });

        if (!staff) {
            return NextResponse.json({ error: "Staff tidak ditemukan." }, { status: 404 });
        }

        if (staff.role !== "STAFF") {
            return NextResponse.json({ error: "Hanya user dengan role STAFF yang dapat diberikan permission." }, { status: 400 });
        }

        // Upsert permission (create or update)
        const permission = await prisma.archiveFolderPermission.upsert({
            where: {
                folderId_staffNip: {
                    folderId: targetFolderId,
                    staffNip
                }
            },
            create: {
                folderId: targetFolderId,
                staffNip,
                accessLevel,
                grantedById
            },
            update: {
                accessLevel,
                grantedById,
                updatedAt: new Date()
            },
            include: {
                staff: {
                    select: {
                        nip: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        return NextResponse.json({
            message: "Permission berhasil diatur",
            permission
        });
    } catch (error: any) {
        console.error("❌ Permission POST Error:", error);
        return NextResponse.json(
            { error: "Gagal mengatur permission." },
            { status: 500 }
        );
    }
}

// DELETE: Remove permission for a staff from a folder
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const permissionId = searchParams.get("id");

        if (!permissionId) {
            return NextResponse.json({ error: "Permission ID required" }, { status: 400 });
        }

        await prisma.archiveFolderPermission.delete({
            where: { id: permissionId }
        });

        return NextResponse.json({ message: "Permission berhasil dihapus" });
    } catch (error: any) {
        console.error("❌ Permission DELETE Error:", error);
        return NextResponse.json(
            { error: "Gagal menghapus permission." },
            { status: 500 }
        );
    }
}
