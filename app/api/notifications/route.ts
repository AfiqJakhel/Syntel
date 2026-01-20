import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const nip = searchParams.get("nip");

    if (!nip) {
        return NextResponse.json({ error: "NIP required" }, { status: 400 });
    }

    try {
        // Use raw SQL to bypass Prisma model property missing issues
        const notifications = await (prisma as any).$queryRawUnsafe(`
            SELECT id, userId, type, title, message, isRead, link, createdAt 
            FROM notifications 
            WHERE userId = ? 
            ORDER BY createdAt DESC 
            LIMIT 20
        `, nip);

        return NextResponse.json(notifications);
    } catch (error: any) {
        console.error("[DEBUG_RAW] Raw fetch error:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const nip = searchParams.get("nip");

    try {
        if (id) {
            await (prisma as any).$executeRawUnsafe(`
                UPDATE notifications SET isRead = 1 WHERE id = ?
            `, id);
        } else if (nip) {
            await (prisma as any).$executeRawUnsafe(`
                UPDATE notifications SET isRead = 1 WHERE userId = ? AND isRead = 0
            `, nip);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[DEBUG_RAW] Raw update error:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const nip = searchParams.get("nip");

    try {
        if (id) {
            await (prisma as any).$executeRawUnsafe(`
                DELETE FROM notifications WHERE id = ?
            `, id);
        } else if (nip) {
            await (prisma as any).$executeRawUnsafe(`
                DELETE FROM notifications WHERE userId = ?
            `, nip);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[DEBUG_RAW] Raw delete error:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
