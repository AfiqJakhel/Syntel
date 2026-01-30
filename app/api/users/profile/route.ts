import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch user profile
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const nip = searchParams.get("nip");

        if (!nip) {
            return NextResponse.json({ error: "NIP is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { nip },
            select: {
                nip: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { nip, firstName, lastName, email } = body;

        if (!nip) {
            return NextResponse.json({ error: "NIP is required" }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { nip },
        });

        if (!existingUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if email is already taken by another user
        if (email && email !== existingUser.email) {
            const emailExists = await prisma.user.findFirst({
                where: {
                    email,
                    nip: { not: nip },
                },
            });

            if (emailExists) {
                return NextResponse.json({ error: "Email sudah digunakan" }, { status: 400 });
            }
        }

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { nip },
            data: {
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
                ...(email && { email }),
            },
            select: {
                nip: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json({
            message: "Profil berhasil diperbarui",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error updating user profile:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
