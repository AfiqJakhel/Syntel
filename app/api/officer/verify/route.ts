import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { nip, action } = await request.json();

        if (!nip) {
            return NextResponse.json({ error: "NIP is required" }, { status: 400 });
        }

        if (action === "verify") {
            const user = await prisma.user.update({
                where: { nip },
                data: { isVerified: true },
            });
            return NextResponse.json({ message: "Account verified successfully", user });
        } else if (action === "reject") {
            // Delete user when verification is rejected
            await prisma.user.delete({
                where: { nip },
            });
            return NextResponse.json({ message: "Account verification rejected and user deleted" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const unverifiedUsers = await prisma.user.findMany({
            where: { isVerified: false },
            select: {
                nip: true,
                firstName: true,
                lastName: true,
                email: true,
                username: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(unverifiedUsers);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
