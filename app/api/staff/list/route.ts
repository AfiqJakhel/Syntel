import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch all staff users (for permission dropdown)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";

        const staffUsers = await prisma.user.findMany({
            where: {
                role: "STAFF",
                isVerified: true,
                isActive: true,
                ...(search && {
                    OR: [
                        { firstName: { contains: search } },
                        { lastName: { contains: search } },
                        { username: { contains: search } },
                        { nip: { contains: search } }
                    ]
                })
            },
            select: {
                nip: true,
                firstName: true,
                lastName: true,
                username: true,
                email: true
            },
            orderBy: {
                firstName: "asc"
            }
        });

        return NextResponse.json({ staff: staffUsers });
    } catch (error: any) {
        console.error("❌ Staff List Error:", error);
        return NextResponse.json(
            { error: "Gagal memuat daftar staff." },
            { status: 500 }
        );
    }
}
