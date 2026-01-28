import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient() as any;

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        let instruction = await prisma.instruction.findUnique({
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
                                nip: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });

        // 2. If not found as instruction, check if it's a submission (Initiative)
        if (!instruction) {
            const submission = await prisma.submission.findUnique({
                where: { id },
                include: {
                    author: {
                        select: {
                            nip: true,
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    }
                }
            });

            if (!submission) {
                return NextResponse.json(
                    { error: "Instruksi atau Pengajuan tidak ditemukan" },
                    { status: 404 }
                );
            }

            // If it has an instructionId, we should probably have found it above, 
            // but for safety, if found via SBM-ID but belongs to an instruction, return that
            if (submission.instructionId) {
                return NextResponse.json({ error: "Gunakan ID Instruksi untuk mengakses detail ini" }, { status: 400 });
            }

            // Return Virtual Instruction for Initiative
            const formattedInitiative = {
                id: submission.id,
                title: submission.title,
                description: submission.description || "Pengajuan Mandiri (Inisiatif)",
                deadline: submission.createdAt,
                priority: "MEDIUM",
                contentType: submission.contentType,
                thumbnail: submission.thumbnail,
                issuer: {
                    nip: submission.author.nip,
                    name: `${submission.author.firstName} ${submission.author.lastName}`
                },
                assignees: [{
                    nip: submission.author.nip,
                    name: `${submission.author.firstName} ${submission.author.lastName}`,
                    role: submission.author.role
                }],
                isSubmitted: true,
                submission: {
                    id: submission.id,
                    title: submission.title,
                    description: submission.description,
                    fileUrl: submission.fileUrl,
                    thumbnail: submission.thumbnail,
                    category: submission.category,
                    status: submission.status,
                    submittedBy: `${submission.author.firstName} ${submission.author.lastName}`,
                    submittedAt: submission.createdAt,
                    feedback: submission.feedback
                }
            };

            return NextResponse.json(formattedInitiative);
        }

        // 3. Format data for Instruction
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
