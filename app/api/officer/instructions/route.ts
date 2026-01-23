import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { rateLimiters, getClientIdentifier, RATE_LIMITS, createRateLimitResponse } from "@/lib/rate-limit";

const prisma = new PrismaClient() as any;

export async function POST(request: Request) {
    // Rate limiting check - 20 instructions per hour
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimiters.createInstruction.check(identifier);

    if (!rateLimitResult.success) {
        return createRateLimitResponse(RATE_LIMITS.CREATE_INSTRUCTION, rateLimitResult.retryAfter);
    }

    try {
        const body = await request.json();
        const { title, description, deadline, priority, assignees, issuerId, contentType, thumbnail } = body;

        // Basic validation
        if (!title || !description || !deadline || !assignees || assignees.length === 0 || !issuerId) {
            return NextResponse.json(
                { error: "Lengkapi semua data instruksi." },
                { status: 400 }
            );
        }

        // Generate Custom ID: INS-XX (Sequential)
        const instructions = await prisma.instruction.findMany({
            where: {
                id: { startsWith: "INS-" }
            },
            select: { id: true }
        });

        let maxNumber = 0;
        instructions.forEach((inst: any) => {
            const match = inst.id.match(/^INS-(\d+)$/);
            if (match) {
                const num = parseInt(match[1]);
                if (num > maxNumber) maxNumber = num;
            }
        });

        const nextNumber = maxNumber + 1;
        const customId = `INS-${String(nextNumber).padStart(2, '0')}`;

        // Create the instruction with assignees in a single transaction
        const instruction = await prisma.instruction.create({
            data: {
                id: customId,
                title,
                description,
                deadline: new Date(deadline),
                priority: priority.toUpperCase(),
                contentType,
                thumbnail,
                issuerId,
                assignees: {
                    create: assignees.map((nip: string) => ({
                        staffNip: nip
                    }))
                }
            }
        });

        // Trigger Notifications for all Assignees
        try {
            // Get last notification ID to start sequential generation
            const lastNotif = await prisma.notification.findFirst({
                where: { id: { startsWith: "NTF-" } },
                orderBy: { id: 'desc' },
                select: { id: true }
            });

            let currentNum = 1;
            if (lastNotif) {
                currentNum = parseInt(lastNotif.id.split("-")[1]) + 1;
            }

            // Create notification for each assignee
            for (const nip of assignees) {
                const customNotifId = `NTF-${String(currentNum).padStart(2, '0')}`;
                await prisma.notification.create({
                    data: {
                        id: customNotifId,
                        userId: nip,
                        type: "INSTRUCTION_ASSIGNED",
                        title: "Instruksi Baru Ditugaskan",
                        message: `Anda telah ditugaskan untuk instruksi: "${title}". Segera cek detail tugas Anda.`,
                        link: "/dashboard/staff"
                    }
                });
                currentNum++;
            }
        } catch (notifErr: any) {
            console.error("⚠️ Failed to create notifications:", notifErr.message);
            // Don't fail the whole request if only notifications fail
        }

        return NextResponse.json({
            message: "Instruksi berhasil dibuat dan staff telah dinotifikasi",
            instructionId: instruction.id
        });

    } catch (error: any) {
        console.error("❌ CREATE INSTRUCTION ERROR:", error.message);
        return NextResponse.json(
            { error: "Gagal menyimpan instruksi ke database." },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const instructions = await prisma.instruction.findMany({
            include: {
                assignees: {
                    include: {
                        staff: {
                            select: {
                                nip: true,
                                firstName: true,
                                lastName: true,
                                role: true
                            }
                        }
                    }
                },
                issuer: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(instructions);
    } catch (error: any) {
        console.error("❌ GET INSTRUCTIONS ERROR:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
