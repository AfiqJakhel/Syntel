import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { rateLimiters, getClientIdentifier, RATE_LIMITS, createRateLimitResponse } from "@/lib/rate-limit";

const prisma = new PrismaClient() as any;

export async function POST(request: Request) {
    // Rate limiting check - 10 submissions per hour
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimiters.createSubmission.check(identifier);

    if (!rateLimitResult.success) {
        return createRateLimitResponse(RATE_LIMITS.CREATE_SUBMISSION, rateLimitResult.retryAfter);
    }

    try {
        const body = await request.json();
        const { title, description, fileUrl, contentType, authorId, instructionId } = body;

        // Basic validation
        if (!title || !contentType || !authorId) {
            const missing = [];
            if (!title) missing.push("Judul");
            if (!contentType) missing.push("Tipe Konten");
            if (!authorId) missing.push("Penulis");

            return NextResponse.json(
                { error: `Data berikut wajib diisi: ${missing.join(", ")}.` },
                { status: 400 }
            );
        }

        // 1. Check if submission already exists (Revision Case)
        let existingSubmission = null;
        let actualInstructionId = instructionId;

        if (instructionId) {
            if (instructionId.startsWith("SBM-")) {
                // Case Initiative: User is revising an initiative (no instruction)
                existingSubmission = await prisma.submission.findUnique({
                    where: { id: instructionId }
                });
                actualInstructionId = null; // Initiatives have no parent instruction
            } else {
                // Case Instruction: User is submitting/revising for an instruction
                existingSubmission = await prisma.submission.findUnique({
                    where: { instructionId }
                });
            }
        }

        let submission;

        if (existingSubmission) {
            // UPDATE existing submission
            submission = await prisma.submission.update({
                where: { id: existingSubmission.id },
                data: {
                    title,
                    description,
                    fileUrl,
                    thumbnail: body.thumbnail || null,
                    fileSize: body.fileSize || null,
                    duration: body.duration || null,
                    cloudinaryId: body.cloudinaryId || null,
                    contentType,
                    category: body.category || null,
                    authorId, // Update the author to the person who sent the revision
                    status: "PENDING", // Reset to pending for officer review
                    feedback: null // Clear old feedback upon resubmission
                }
            });
        } else {
            // 2. CREATE NEW submission
            const allSubmissions = await prisma.submission.findMany({
                where: { id: { startsWith: "SBM-" } },
                select: { id: true }
            });

            let nextNumber = 1;
            if (allSubmissions.length > 0) {
                const numbers = allSubmissions.map((s: any) => {
                    const parts = s.id.split("-");
                    return parts.length > 1 ? parseInt(parts[1]) : 0;
                }).filter((n: number) => !isNaN(n));

                if (numbers.length > 0) {
                    nextNumber = Math.max(...numbers) + 1;
                }
            }

            const customId = `SBM-${String(nextNumber).padStart(2, '0')}`;

            submission = await prisma.submission.create({
                data: {
                    id: customId,
                    title,
                    description,
                    fileUrl,
                    thumbnail: body.thumbnail || null,
                    fileSize: body.fileSize || null,
                    duration: body.duration || null,
                    cloudinaryId: body.cloudinaryId || null,
                    contentType,
                    category: body.category || null,
                    authorId,
                    instructionId: actualInstructionId || null,
                    status: "PENDING"
                }
            });
        }

        // TRIGGER NOTIFICATIONS FOR OFFICERS
        try {
            const staff = await prisma.user.findUnique({
                where: { nip: authorId },
                select: { firstName: true, lastName: true }
            });

            const officers = await prisma.user.findMany({
                where: { role: 'OFFICER' },
                select: { nip: true }
            });

            if (officers.length > 0 && staff) {
                const lastNotif = await prisma.notification.findFirst({
                    where: { id: { startsWith: "NTF-" } },
                    orderBy: { id: 'desc' },
                    select: { id: true }
                });

                let currentNum = 1;
                if (lastNotif) {
                    const lastId = lastNotif.id.split("-")[1];
                    currentNum = (parseInt(lastId) || 0) + 1;
                }

                for (const officer of officers) {
                    const customNotifId = `NTF-${String(currentNum).padStart(2, '0')}`;
                    await prisma.notification.create({
                        data: {
                            id: customNotifId,
                            userId: officer.nip,
                            type: existingSubmission ? "SUBMISSION_REVISION" : "SUBMISSION_NEW",
                            title: existingSubmission ? "Revisi Pengajuan" : "Pengajuan Baru",
                            message: `${staff.firstName} ${staff.lastName} telah ${existingSubmission ? 'mengirim revisi' : 'mengirim pengajuan baru'}: "${title}"`,
                            link: "/dashboard/officer/verification"
                        }
                    });
                    currentNum++;
                }
            }
        } catch (notifErr: any) {
            console.error("⚠️ Failed to create notifications:", notifErr.message);
        }

        return NextResponse.json({
            message: existingSubmission ? "Revisi berhasil dikirim" : "Submission berhasil dikirim",
            submissionId: submission.id
        });

    } catch (error: any) {
        console.error("❌ CREATE SUBMISSION ERROR:", error.message);
        return NextResponse.json(
            { error: "Gagal menyimpan pengajuan ke database." },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    // This could be used by staff to see THEIR submissions
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get("authorId");

    try {
        const submissions = await prisma.submission.findMany({
            where: authorId ? { authorId } : {},
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(submissions);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
