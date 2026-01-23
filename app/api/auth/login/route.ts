import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { rateLimiters, getClientIdentifier, RATE_LIMITS, createRateLimitResponse } from "@/lib/rate-limit";

// Best practice untuk inisialisasi Prisma Client di Next.js
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(request: NextRequest) {
    // Rate limiting check - 5 attempts per 15 minutes
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimiters.authLogin.check(identifier);

    if (!rateLimitResult.success) {
        return createRateLimitResponse(RATE_LIMITS.AUTH_LOGIN, rateLimitResult.retryAfter);
    }

    try {
        const body = await request.json();
        // Menerima 'email' dari frontend (bisa berisi nip, username, atau email)
        const { email, password } = body;

        // Validasi input
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email dan password wajib diisi" },
                { status: 400 }
            );
        }

        // Cari user berdasarkan nip, username, atau email (fleksibel)
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { nip: email },
                    { username: email },
                    { email: email }
                ]
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: "Email atau password salah" },
                { status: 401 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Akun tidak ditemukan atau password salah" },
                { status: 401 }
            );
        }

        if (!user.isVerified) {
            return NextResponse.json(
                {
                    error: "Akun Anda belum diverifikasi oleh Officer. Mohon tunggu proses verifikasi.",
                    isUnverified: true
                },
                { status: 403 }
            );
        }

        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            {
                message: "Login berhasil",
                user: userWithoutPassword
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan saat login" },
            { status: 500 }
        );
    }
}
