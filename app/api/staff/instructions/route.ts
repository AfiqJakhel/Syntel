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

        // Flatten the structure for easier consumption
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
            assignedAt: item.assignedAt
        }));

        return NextResponse.json(formattedAssignments);
    } catch (error: any) {
        console.error("❌ GET STAFF INSTRUCTIONS ERROR:", error.message);
        return NextResponse.json(
            { error: "Gagal mengambil data instruksi" },
            { status: 500 }
        );
    }
}
