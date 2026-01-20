import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch users with filters
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const role = searchParams.get('role');
        const verified = searchParams.get('verified');

        // Build where clause
        const where: any = {};

        if (role) {
            where.role = role;
        }

        if (verified !== null) {
            where.isVerified = verified === 'true';
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                nip: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isVerified: true
            },
            orderBy: {
                firstName: 'asc'
            }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}
