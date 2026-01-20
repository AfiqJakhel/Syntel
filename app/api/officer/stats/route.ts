import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, startOfWeek, endOfWeek } from "date-fns";

const prisma = new PrismaClient() as any;

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || 'Monthly';

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

        const stats = await prisma.submission.groupBy({
            by: ['contentType'],
            where: {
                status: 'APPROVED',
                ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
            },
            _count: {
                _all: true
            }
        });

        // Vibrant colors for the pie chart
        const colors = [
            "#FF6B6B", // Red
            "#FFA94D", // Orange
            "#A78BFA", // Purple
            "#60A5FA", // Blue
            "#4ADE80", // Green
            "#F472B6", // Pink
            "#FB923C", // Amber
        ];

        const contentStats = stats.map((item: any, index: number) => ({
            type: item.contentType,
            count: item._count._all,
            color: colors[index % colors.length]
        }));

        const totalSubmissions = await prisma.submission.count();

        // Get total pending (Awaiting Review)
        const totalPending = await prisma.submission.count({
            where: { status: 'PENDING' }
        });

        // Get total content (e.g., approved submissions)
        const totalApproved = await prisma.submission.count({
            where: { status: 'APPROVED' }
        });

        // Get 7-day stats for growth calculation
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentSubmissions = await prisma.submission.count({
            where: {
                createdAt: {
                    gte: sevenDaysAgo
                }
            }
        });

        // Get recent activities (last 5 submissions)
        const recentActivities = await prisma.submission.findMany({
            take: 5,
            orderBy: { updatedAt: 'desc' },
            include: {
                author: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        const activityColors = ["bg-blue-500", "bg-purple-500", "bg-red-500", "bg-emerald-500", "bg-orange-500"];

        const activities = recentActivities.map((sub: any, index: number) => {
            let actionLabel = "mengirim pengajuan";
            if (sub.status === "PENDING") actionLabel = "mengunggah pengajuan";
            else if (sub.status === "REVISION") actionLabel = "mengajukan revisi";
            else if (sub.status === "APPROVED") actionLabel = "menyelesaikan pengajuan";

            return {
                id: sub.id,
                user: `${sub.author.firstName} ${sub.author.lastName}`,
                action: actionLabel,
                status: sub.status,
                detail: sub.title,
                avatar: sub.author.firstName[0],
                color: activityColors[index % activityColors.length],
                timestamp: sub.updatedAt
            };
        });

        // Get upcoming deadlines (Instructions with deadline >= now)
        const upcomingInstructions = await prisma.instruction.findMany({
            where: {
                deadline: {
                    gte: now
                },
                // Exclude tasks that are already approved/finished
                NOT: {
                    submission: {
                        status: 'APPROVED'
                    }
                }
            },
            take: 6,
            orderBy: { deadline: 'asc' },
            include: {
                assignees: {
                    include: {
                        staff: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                },
                submission: {
                    select: {
                        status: true
                    }
                }
            }
        });

        const deadlines = upcomingInstructions.map((inst: any) => {
            let statusLabel = "Pending";
            if (inst.submission) {
                if (inst.submission.status === "PENDING") statusLabel = "Menunggu Review";
                else if (inst.submission.status === "REVISION") statusLabel = "Revisi";
            }

            return {
                id: inst.id,
                title: inst.title,
                date: inst.deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
                assignee: inst.assignees.length > 1
                    ? `${inst.assignees[0].staff.firstName} & ${inst.assignees.length - 1} lainnya`
                    : inst.assignees[0]?.staff?.firstName || "Belum ditugaskan",
                status: statusLabel
            };
        });

        return NextResponse.json({
            contentStats,
            totalSubmissions,
            totalPending,
            totalApproved,
            recentSubmissions,
            activities,
            deadlines,
            growthRate: "+100%"
        });
    } catch (error: any) {
        console.error("❌ STATS FETCH ERROR:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
