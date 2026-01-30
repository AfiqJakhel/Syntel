import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, startOfWeek, endOfWeek } from "date-fns";

const prisma = new PrismaClient() as any;

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const authorId = searchParams.get('authorId');
        const period = searchParams.get('period') || 'Monthly';

        if (!authorId) {
            return NextResponse.json({ error: "authorId is required" }, { status: 400 });
        }

        let dateFilter = {};
        const now = new Date();

        if (period === 'Weekly') {
            dateFilter = {
                gte: startOfWeek(now),
                lte: endOfWeek(now)
            };
        } else if (period === 'Monthly') {
            dateFilter = {
                gte: startOfMonth(now),
                lte: endOfMonth(now)
            };
        } else if (period === 'Yearly') {
            dateFilter = {
                gte: startOfYear(now),
                lte: endOfYear(now)
            };
        }

        // Total submissions (both initiatives and instruction-based) by this staff member
        const totalSubmissions = await prisma.submission.count({
            where: {
                authorId,
                instructionId: null
            }
        });

        // Pending manual submissions
        const totalPending = await prisma.submission.count({
            where: {
                authorId,
                status: 'PENDING',
                instructionId: null
            }
        });

        // Approved submissions by this staff member (including initiatives and instruction-based)
        const totalApproved = await prisma.submission.count({
            where: {
                authorId,
                status: 'APPROVED',
                instructionId: null
            }
        });

        // Active tasks assigned to this staff member
        const activeTasks = await prisma.instructionAssignee.count({
            where: {
                staffNip: authorId,
                instruction: {
                    deadline: {
                        gte: now
                    },
                    submission: null
                }
            }
        });

        // Recent activities by this staff member (initiatives only)
        const recentActivities = await prisma.submission.findMany({
            where: {
                authorId,
                instructionId: null
            },
            take: 10,
            orderBy: { updatedAt: 'desc' },
            include: {
                author: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                instruction: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        // History (Everything: Initiatives + Assigned Instructions)
        // 1. Get IDs of instructions assigned to this user
        const assignments = await prisma.instructionAssignee.findMany({
            where: { staffNip: authorId },
            select: { instructionId: true }
        });
        const assignedIds = assignments.map((a: any) => a.instructionId);


        // 2. Fetch submissions that are either authored by user OR belong to assigned instructions
        const historyData = await prisma.submission.findMany({
            where: {
                OR: [
                    { authorId },
                    { instructionId: { in: assignedIds } }
                ]
            },
            take: 10,
            orderBy: { updatedAt: 'desc' },
            include: {
                author: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                instruction: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        const activityColors = ["bg-blue-500", "bg-purple-500", "bg-red-500", "bg-emerald-500", "bg-orange-500"];

        const activities = recentActivities.map((sub: any, index: number) => {
            const isInitiative = !sub.instructionId;
            const isUpdate = sub.createdAt.getTime() !== sub.updatedAt.getTime();
            let actionLabel = "";

            if (sub.status === "PENDING") {
                if (isUpdate) {
                    actionLabel = "upload revisi";
                } else {
                    actionLabel = isInitiative ? "membuat pengajuan" : "submit tugas";
                }
            } else if (sub.status === "REVISION") {
                actionLabel = "perlu revisi";
            } else if (sub.status === "APPROVED") {
                actionLabel = "disetujui";
            } else if (sub.status === "REJECTED") {
                actionLabel = "ditolak";
            }

            return {
                id: sub.instructionId || sub.id,
                user: `${sub.author.firstName} ${sub.author.lastName}`,
                action: actionLabel,
                status: sub.status,
                detail: sub.title,
                avatar: sub.author.firstName[0],
                color: activityColors[index % activityColors.length],
                timestamp: sub.updatedAt
            };
        });

        const history = historyData.map((sub: any, index: number) => {
            const isInitiative = !sub.instructionId;
            const isUpdate = sub.createdAt.getTime() !== sub.updatedAt.getTime();
            let actionLabel = "";

            if (sub.status === "PENDING") {
                if (isUpdate) {
                    actionLabel = "upload revisi";
                } else {
                    actionLabel = isInitiative ? "membuat pengajuan" : "submit tugas";
                }
            } else if (sub.status === "REVISION") {
                actionLabel = "perlu revisi";
            } else if (sub.status === "APPROVED") {
                actionLabel = "disetujui";
            } else if (sub.status === "REJECTED") {
                actionLabel = "ditolak";
            }

            return {
                id: sub.instructionId || sub.id,
                user: `${sub.author.firstName} ${sub.author.lastName}`,
                action: actionLabel,
                status: sub.status,
                detail: sub.instruction ? sub.instruction.title : sub.title,
                avatar: sub.author.firstName[0],
                color: activityColors[index % activityColors.length],
                timestamp: sub.updatedAt
            };
        });

        // Upcoming instructions/tasks for this staff member
        const upcomingInstructions = await prisma.instructionAssignee.findMany({
            where: {
                staffNip: authorId,
                instruction: {
                    deadline: {
                        gte: now
                    },
                    submission: null
                }
            },
            take: 6,
            orderBy: {
                instruction: {
                    deadline: 'asc'
                }
            },
            include: {
                instruction: {
                    include: {
                        submission: {
                            select: {
                                status: true
                            }
                        }
                    }
                }
            }
        });

        const deadlines = upcomingInstructions.map((assignment: any) => {
            const inst = assignment.instruction;
            let statusLabel = "Pending";
            if (inst.submission) {
                if (inst.submission.status === "PENDING") statusLabel = "Menunggu Review";
                else if (inst.submission.status === "REVISION") statusLabel = "Revisi";
            }

            return {
                id: inst.id,
                title: inst.title,
                date: inst.deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
                status: statusLabel
            };
        });

        // Content type breakdown for this staff member
        const contentStats = await prisma.submission.groupBy({
            by: ['contentType'],
            where: {
                authorId,
                status: 'APPROVED',
                instructionId: null,
                ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
            },
            _count: {
                _all: true
            }
        });

        const colors = [
            "#FF6B6B", // Red
            "#FFA94D", // Orange
            "#A78BFA", // Purple
            "#60A5FA", // Blue
            "#4ADE80", // Green
            "#F472B6", // Pink
            "#FB923C", // Amber
        ];

        const contentTypeStats = contentStats.map((item: any, index: number) => ({
            type: item.contentType,
            count: item._count._all,
            color: colors[index % colors.length]
        }));

        return NextResponse.json({
            totalSubmissions,
            totalPending,
            totalApproved,
            activeTasks,
            activities,
            history,
            deadlines,
            contentStats: contentTypeStats
        });
    } catch (error: any) {
        console.error("❌ STAFF STATS FETCH ERROR:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
