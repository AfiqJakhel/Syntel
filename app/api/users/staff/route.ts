import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch all staff users
export async function GET(request: Request) {
    try {
        const staff = await prisma.user.findMany({
            where: {
                role: "STAFF",
                isActive: true
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

        return NextResponse.json({ staff });
    } catch (error: any) {
        console.error("❌ Staff GET Error:", error);
        return NextResponse.json(
            { error: "Gagal memuat daftar staff." },
            { status: 500 }
        );
    }
}
