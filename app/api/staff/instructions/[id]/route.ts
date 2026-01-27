import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient() as any;

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const instruction = await prisma.instruction.findUnique({
            where: { id },
            include: {
                issuer: {
                    select: {
                        firstName: true,
                        lastName: true,
                        nip: true
                    }
                },
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
                submission: {
                    include: {
                        author: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });

        if (!instruction) {
            return NextResponse.json(
                { error: "Instruksi tidak ditemukan" },
                { status: 404 }
            );
        }

        // Format data for simpler consumption
        const formatted = {
            id: instruction.id,
            title: instruction.title,
            description: instruction.description,
            deadline: instruction.deadline,
            priority: instruction.priority,
            contentType: instruction.contentType,
            thumbnail: instruction.thumbnail,
            issuer: {
                nip: instruction.issuer.nip,
                name: `${instruction.issuer.firstName} ${instruction.issuer.lastName}`
            },
            assignees: instruction.assignees.map((a: any) => ({
                nip: a.staff.nip,
                name: `${a.staff.firstName} ${a.staff.lastName}`,
                role: a.staff.role
            })),
            isSubmitted: !!instruction.submission,
            submission: instruction.submission ? {
                id: instruction.submission.id,
                title: instruction.submission.title,
                description: instruction.submission.description,
                fileUrl: instruction.submission.fileUrl,
                thumbnail: instruction.submission.thumbnail,
                category: instruction.submission.category,
                status: instruction.submission.status,
                submittedBy: `${instruction.submission.author.firstName} ${instruction.submission.author.lastName}`,
                submittedAt: instruction.submission.createdAt,
                feedback: instruction.submission.feedback
            } : null
        };

        return NextResponse.json(formatted);
    } catch (error: any) {
        console.error("❌ GET STAFF INSTRUCTION DETAIL ERROR:", error.message);
        return NextResponse.json(
            { error: error.message || "Gagal mengambil detail instruksi" },
            { status: 500 }
        );
    }
}
