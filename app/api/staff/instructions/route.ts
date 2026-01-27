import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient() as any;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const nip = searchParams.get("nip");

    if (!nip) {
        return NextResponse.json(
            { error: "NIP staff diperlukan" },
            { status: 400 }
        );
    }

    try {
        // 1. Fetch assigned instructions
        const assignments = await prisma.instructionAssignee.findMany({
            where: {
                staffNip: nip
            },
            include: {
                instruction: {
                    include: {
                        issuer: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        },
                        submission: {
                            select: {
                                status: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                instruction: {
                    deadline: "asc"
                }
            }
        });

        // 2. Fetch independent submissions (initiatives)
        const initiatives = await prisma.submission.findMany({
            where: {
                authorId: nip,
                instructionId: null
            },
            include: {
                author: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        // Map assignments
        const formattedAssignments = assignments.map((item: any) => ({
            id: item.instruction.id,
            title: item.instruction.title,
            description: item.instruction.description,
            deadline: item.instruction.deadline,
            priority: item.instruction.priority,
            contentType: item.instruction.contentType,
            thumbnail: item.instruction.thumbnail,
            issuer: `${item.instruction.issuer.firstName} ${item.instruction.issuer.lastName}`,
            status: item.instruction.submission?.status || "PENDING",
            isSubmitted: !!item.instruction.submission,
            assignedAt: item.assignedAt,
            source: "INSTRUKSI"
        }));

        const formattedInitiatives = initiatives.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            deadline: item.createdAt,
            priority: "MEDIUM",
            contentType: item.contentType,
            category: item.category || item.contentType,
            thumbnail: item.thumbnail,
            issuer: `${item.author.firstName} ${item.author.lastName}`,
            status: item.status || "PENDING",
            isSubmitted: true,
            assignedAt: item.createdAt,
            source: "INISIATIF"
        }));

        const combined = [...formattedAssignments, ...formattedInitiatives].sort(
            (a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
        );

        return NextResponse.json(combined);
    } catch (error: any) {
        console.error("❌ GET STAFF INSTRUCTIONS ERROR:", error.message);
        return NextResponse.json(
            { error: "Gagal mengambil data instruksi" },
            { status: 500 }
        );
    }
}
