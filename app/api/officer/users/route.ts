import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient() as any;

// GET all verified users
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            where: {
                isVerified: true,
                role: "STAFF"
            },
            orderBy: { createdAt: "desc" },
        });

        const mappedUsers = users.map((user: any) => ({
            id: user.nip,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            // Skills is stored as Json, we ensure it's an array for the UI
            skills: Array.isArray(user.skills) ? user.skills : JSON.parse(user.skills as string || "[]"),
            isActive: user.isActive,
            avatar: user.firstName.charAt(0) + user.lastName.charAt(0),
            joinedAt: user.createdAt.toISOString()
        }));

        return NextResponse.json(mappedUsers);
    } catch (error: any) {
        console.error("❌ GET USERS ERROR:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH to update user status, skills, or password
export async function PATCH(request: Request) {
    try {
        const { nip, isActive, skills, password } = await request.json();

        if (!nip) {
            return NextResponse.json({ error: "NIP is required" }, { status: 400 });
        }

        const updateData: any = {};
        if (isActive !== undefined) updateData.isActive = isActive;
        if (skills !== undefined) updateData.skills = skills;

        // If password is changed, hash it first
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        const updatedUser = await prisma.user.update({
            where: { nip },
            data: updateData,
        });

        return NextResponse.json({
            message: "User updated successfully",
            isActive: updatedUser.isActive,
            skills: updatedUser.skills
        });
    } catch (error: any) {
        console.error("❌ UPDATE USER ERROR:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
