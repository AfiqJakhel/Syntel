import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient() as any;

export async function GET() {
    try {
        const instructions = await prisma.instruction.findMany({
            include: {
                assignees: {
                    include: {
                        staff: {
                            select: {
                                firstName: true,
                                lastName: true,
                            }
                        }
                    }
                },
                submission: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        fileUrl: true,
                        contentType: true,
                        status: true,
                        updatedAt: true,
                        feedback: true,
                        thumbnail: true,
                        category: true,
                        author: {
                            select: {
                                firstName: true,
                                lastName: true,
                                role: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        // Map instructions to a tracking format
        const trackingData = instructions.map((inst: any) => {
            let statusLabel = "Belum Dikerjakan";
            let statusColor = "gray";

            if (inst.submission) {
                switch (inst.submission.status) {
                    case "PENDING":
                        statusLabel = "Menunggu Review";
                        statusColor = "yellow";
                        break;
                    case "REVISION":
                        statusLabel = "Revisi";
                        statusColor = "orange";
                        break;
                    case "APPROVED":
                        statusLabel = "Selesai";
                        statusColor = "green";
                        break;
                    case "REJECTED":
                        statusLabel = "Ditolak";
                        statusColor = "red";
                        break;
                }
            }

            return {
                id: inst.id,
                title: inst.title,
                contentType: inst.contentType,
                // Accessing nested staff field from explicit join model
                assignees: inst.assignees.map((a: any) => `${a.staff.firstName} ${a.staff.lastName}`),
                thumbnail: inst.submission?.thumbnail || inst.thumbnail, // Prioritize submission thumbnail
                deadline: inst.deadline.toISOString(),
                priority: inst.priority,
                status: statusLabel,
                statusColor: statusColor,
                hasSubmission: !!inst.submission,
                submission: inst.submission ? {
                    id: inst.submission.id,
                    title: inst.submission.title,
                    description: inst.submission.description,
                    type: inst.submission.contentType,
                    fileUrl: inst.submission.fileUrl,
                    thumbnail: inst.submission.thumbnail,
                    author: `${inst.submission.author.firstName} ${inst.submission.author.lastName}`,
                    authorRole: inst.submission.author.role === "OFFICER" ? "Officer" : "Staff Creative",
                    date: inst.submission.updatedAt.toISOString(),
                    status: inst.submission.status,
                    source: "INSTRUKSI",
                    instructionTitle: inst.title,
                    category: inst.submission.category,
                    notes: inst.submission.feedback
                } : null,
                lastUpdate: inst.submission?.updatedAt.toISOString() || inst.createdAt.toISOString()
            };
        });

        return NextResponse.json(trackingData);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
