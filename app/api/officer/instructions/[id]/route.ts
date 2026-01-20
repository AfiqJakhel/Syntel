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
                assignees: {
                    include: {
                        staff: {
                            select: {
                                nip: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                role: true,
                                skills: true
                            }
                        }
                    }
                },
                issuer: {
                    select: {
                        nip: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        if (!instruction) {
            return NextResponse.json({ error: "Instruksi tidak ditemukan" }, { status: 404 });
        }

        return NextResponse.json(instruction);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();
        const { title, description, deadline, priority, assignees, contentType, thumbnail } = body;

        // Start a transaction to update instruction and its assignees
        const updatedInstruction = await prisma.$transaction(async (tx: any) => {
            // 1. Delete old assignees
            await tx.instructionAssignee.deleteMany({
                where: { instructionId: id }
            });

            // 2. Build update data object carefully
            const updateData: any = {
                title,
                description,
                deadline: new Date(deadline),
                priority: priority ? (priority as string).toUpperCase() : undefined,
                thumbnail,
                assignees: {
                    create: (assignees || []).filter((nip: any) => typeof nip === "string" && nip.trim() !== "").map((nip: string) => ({
                        staff: {
                            connect: { nip: nip }
                        }
                    }))
                }
            };

            // Only update contentType if it's provided in the request
            if (contentType) {
                updateData.contentType = contentType;
            }

            return await tx.instruction.update({
                where: { id },
                data: updateData
            });
        });

        return NextResponse.json({
            message: "Instruksi berhasil diperbarui",
            instruction: updatedInstruction
        });

    } catch (error: any) {
        console.error("❌ UPDATE INSTRUCTION ERROR:", error.message);
        return NextResponse.json(
            { error: "Gagal memperbarui instruksi." },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        await prisma.instruction.delete({
            where: { id }
        });
        return NextResponse.json({ message: "Instruksi berhasil dihapus" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
