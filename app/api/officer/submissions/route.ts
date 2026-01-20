import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient() as any;

export async function GET() {
    try {
        const submissions = await prisma.submission.findMany({
            include: {
                author: {
                    select: {
                        firstName: true,
                        lastName: true,
                        role: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        // Map database data to UI format
        const mappedSubmissions = submissions.map((sub: any) => ({
            id: sub.id,
            title: sub.title,
            description: sub.description,
            type: sub.contentType,
            fileUrl: sub.fileUrl,
            author: `${sub.author.firstName} ${sub.author.lastName}`,
            authorRole: sub.author.role === "OFFICER" ? "Officer" : "Staff Creative",
            date: sub.createdAt.toISOString(),
            status: sub.status,
            source: sub.instructionId ? "INSTRUKSI" : "INISIATIF",
            notes: sub.feedback
        }));

        return NextResponse.json(mappedSubmissions);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, status, feedback } = await request.json();

        if (!id || !status) {
            return NextResponse.json({ error: "ID and Status are required" }, { status: 400 });
        }

        // Fetch submission to get author and title before update
        const submission = await prisma.submission.findUnique({
            where: { id },
            include: { author: true }
        });

        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        const updatedSubmission = await prisma.submission.update({
            where: { id },
            data: {
                status: status,
                feedback: feedback || null
            }
        });

        // Trigger Notification for Staff
        let notifType: any = "SYSTEM";
        let notifTitle = "";
        let notifMessage = "";

        if (status === "APPROVED") {
            notifType = "SYSTEM"; // Or add SUBMISSION_APPROVED to enum if needed
            notifTitle = "Pengajuan Disetujui";
            notifMessage = `Selamat! Pengajuan '${submission.title}' telah disetujui oleh Officer.`;
        } else if (status === "REVISION") {
            notifType = "SUBMISSION_REVISION";
            notifTitle = "Revisi Diperlukan";
            notifMessage = `Pengajuan '${submission.title}' memerlukan perbaikan. Cek catatan feedback: "${feedback || 'Tidak ada catatan'}"`;
        } else if (status === "REJECTED") {
            notifType = "SYSTEM";
            notifTitle = "Pengajuan Ditolak";
            notifMessage = `Mohon maaf, pengajuan '${submission.title}' tidak dapat diterima saat ini.`;
        }

        if (notifTitle) {
            // Generate Custom ID: NTF-XX
            const lastNotif = await prisma.notification.findFirst({
                where: { id: { startsWith: "NTF-" } },
                orderBy: { id: 'desc' },
                select: { id: true }
            });

            let nextNum = 1;
            if (lastNotif) {
                const lastIdStr = lastNotif.id.split("-")[1];
                nextNum = parseInt(lastIdStr) + 1;
            }
            const customNotifId = `NTF-${String(nextNum).padStart(2, '0')}`;

            await prisma.notification.create({
                data: {
                    id: customNotifId,
                    userId: submission.authorId,
                    type: notifType,
                    title: notifTitle,
                    message: notifMessage,
                    link: `/dashboard/staff` // Navigate to staff dashboard to see their submissions
                }
            });
        }

        return NextResponse.json({
            message: "Submission updated and notification sent",
            submission: updatedSubmission
        });
    } catch (error: any) {
        console.error("❌ UPDATE SUBMISSION ERROR:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
