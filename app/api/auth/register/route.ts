import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { rateLimiters, getClientIdentifier, RATE_LIMITS, createRateLimitResponse } from "@/lib/rate-limit";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(request: NextRequest) {
    // Rate limiting check - 3 attempts per 15 minutes
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimiters.authRegister.check(identifier);

    if (!rateLimitResult.success) {
        return createRateLimitResponse(RATE_LIMITS.AUTH_REGISTER, rateLimitResult.retryAfter);
    }

    try {
        const body = await request.json();
        const { nip, firstName, lastName, username, email, phone, password, termsAccepted } = body;

        if (!nip || !firstName || !lastName || !username || !email || !phone || !password) {
            return NextResponse.json(
                { error: "Semua field wajib diisi" },
                { status: 400 }
            );
        }

        if (!termsAccepted) {
            return NextResponse.json(
                { error: "Anda harus menyetujui syarat & ketentuan" },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { nip },
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.nip === nip) return NextResponse.json({ error: "NIP sudah terdaftar" }, { status: 409 });
            if (existingUser.username === username) return NextResponse.json({ error: "Username sudah terdaftar" }, { status: 409 });
            if (existingUser.email === email) return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                nip,
                firstName,
                lastName,
                username,
                email,
                phone,
                password: hashedPassword,
                termsAccepted,
                role: "STAFF",
                isVerified: false
            }
        });

        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            {
                message: "Registrasi berhasil",
                user: userWithoutPassword
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan saat registrasi" },
            { status: 500 }
        );
    }
}
