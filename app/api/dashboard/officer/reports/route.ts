import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { startOfMonth, subMonths, endOfMonth, format, startOfYear, subYears, endOfYear, startOfWeek, subWeeks, endOfWeek } from "date-fns";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "Bulanan";
    const comparison = searchParams.get("comparison") || "1 Bulan Terakhir";

    try {
        const now = new Date();
        let currentStart: Date, currentEnd: Date;
        let comparisonStart: Date, comparisonEnd: Date;

        // 1. Define Current Range
        if (period === "Bulanan") {
            currentStart = startOfMonth(now);
            currentEnd = endOfMonth(now);
        } else if (period === "Tahunan") {
            currentStart = startOfYear(now);
            currentEnd = endOfYear(now);
        } else { // Mingguan
            currentStart = startOfWeek(now);
            currentEnd = endOfWeek(now);
        }

        // 2. Define Comparison Range
        const compValue = parseInt(comparison.split(" ")[0]);
        if (period === "Bulanan") {
            const targetMonth = subMonths(now, compValue);
            comparisonStart = startOfMonth(targetMonth);
            comparisonEnd = endOfMonth(targetMonth);
        } else if (period === "Tahunan") {
            const targetYear = subYears(now, compValue);
            comparisonStart = startOfYear(targetYear);
            comparisonEnd = endOfYear(targetYear);
        } else { // Mingguan
            const targetWeek = subWeeks(now, compValue);
            comparisonStart = startOfWeek(targetWeek);
            comparisonEnd = endOfWeek(targetWeek);
        }

        // 3. Fetch Data for Summary Cards
        const [
            allTotal, // Current Total across all time
            periodTotal, // Total in current period
            compTotal, // Total in comparison period
            allApproved, currentApproved, compApproved,
            allPending, currentPending, compPending,
            allRevision, currentRevision, compRevision
        ] = await Promise.all([
            prisma.submission.count(),
            prisma.submission.count({ where: { createdAt: { gte: currentStart, lte: currentEnd } } }),
            prisma.submission.count({ where: { createdAt: { gte: comparisonStart, lte: comparisonEnd } } }),
            prisma.submission.count({ where: { status: "APPROVED" } }),
            prisma.submission.count({ where: { status: "APPROVED", createdAt: { gte: currentStart, lte: currentEnd } } }),
            prisma.submission.count({ where: { status: "APPROVED", createdAt: { gte: comparisonStart, lte: comparisonEnd } } }),
            prisma.submission.count({ where: { status: "PENDING" } }),
            prisma.submission.count({ where: { status: "PENDING", createdAt: { gte: currentStart, lte: currentEnd } } }),
            prisma.submission.count({ where: { status: "PENDING", createdAt: { gte: comparisonStart, lte: comparisonEnd } } }),
            prisma.submission.count({ where: { status: "REVISION" } }),
            prisma.submission.count({ where: { status: "REVISION", createdAt: { gte: currentStart, lte: currentEnd } } }),
            prisma.submission.count({ where: { status: "REVISION", createdAt: { gte: comparisonStart, lte: comparisonEnd } } }),
        ]);

        const calcTrend = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? "+100%" : "0%";
            const diff = ((curr - prev) / prev) * 100;
            return (diff >= 0 ? "+" : "") + diff.toFixed(1) + "%";
        };

        const summary = [
            {
                label: "Total Konten",
                value: periodTotal,
                comparisonValue: compTotal,
                trend: calcTrend(periodTotal, compTotal),
                isPositive: periodTotal >= compTotal
            },
            {
                label: "Approved",
                value: currentApproved,
                comparisonValue: compApproved,
                trend: calcTrend(currentApproved, compApproved),
                isPositive: currentApproved >= compApproved
            },
            {
                label: "Pending Review",
                value: currentPending,
                comparisonValue: compPending,
                trend: calcTrend(currentPending, compPending),
                isPositive: currentPending <= compPending
            },
            {
                label: "Perlu Revisi",
                value: currentRevision,
                comparisonValue: compRevision,
                trend: calcTrend(currentRevision, compRevision),
                isPositive: currentRevision <= compRevision
            },
        ];

        // 4. Monthly Trends (Last 7 Months)
        const monthlyTrends = [];
        let maxTrendValue = 0;
        for (let i = 6; i >= 0; i--) {
            const month = subMonths(now, i);
            const mStart = startOfMonth(month);
            const mEnd = endOfMonth(month);

            const [approved, pending, revision] = await Promise.all([
                prisma.submission.count({ where: { status: "APPROVED", createdAt: { gte: mStart, lte: mEnd } } }),
                prisma.submission.count({ where: { status: "PENDING", createdAt: { gte: mStart, lte: mEnd } } }),
                prisma.submission.count({ where: { status: "REVISION", createdAt: { gte: mStart, lte: mEnd } } }),
            ]);

            const total = approved + pending + revision;
            if (total > maxTrendValue) maxTrendValue = total;

            monthlyTrends.push({
                month: format(month, "MMMM"),
                approved,
                pending,
                revision,
                total
            });
        }

        // 5. platform Distribution (ContentType)
        const distributions = await prisma.submission.groupBy({
            by: ['contentType'],
            _count: { _all: true },
            where: { createdAt: { gte: currentStart, lte: currentEnd } }
        });

        const platformMap: Record<string, string> = {
            "INSTAGRAM_POST": "Instagram Post",
            "INSTAGRAM_CAROUSEL": "Instagram Carousel",
            "INSTAGRAM_REELS": "Instagram Reels",
            "INSTAGRAM_STORY": "Instagram Story",
            "TIKTOK_POST": "Tiktok Video",
            "YOUTUBE_VIDEO": "Youtube Video",
            "POSTER": "Poster",
            "DOKUMEN_INTERNAL": "Internal Doc"
        };

        const contentTypes = distributions.map(d => ({
            name: platformMap[d.contentType] || d.contentType,
            count: d._count._all,
            percentage: periodTotal > 0 ? parseFloat(((d._count._all / periodTotal) * 100).toFixed(1)) : 0
        })).sort((a, b) => b.count - a.count);

        // 6. KPIs (Mocking some if not directly available, but average approval time can be calculated)
        // Average Approval Time (diff between createdAt and updatedAt for APPROVED submissions in current period)
        const approvedSubs = await prisma.submission.findMany({
            where: { status: "APPROVED", createdAt: { gte: currentStart, lte: currentEnd } },
            select: { createdAt: true, updatedAt: true }
        });

        let totalDays = 0;
        approvedSubs.forEach(s => {
            const diff = s.updatedAt.getTime() - s.createdAt.getTime();
            totalDays += diff / (1000 * 60 * 60 * 24);
        });
        const avgApprovalTime = approvedSubs.length > 0 ? (totalDays / approvedSubs.length).toFixed(1) : "0";

        // Events this month
        const eventCount = await prisma.event.count({
            where: { date: { gte: currentStart, lte: currentEnd } }
        });

        // Folder total (unique instructions with submissions)
        const folderCount = await prisma.instruction.count({
            where: { createdAt: { gte: currentStart, lte: currentEnd } }
        });

        // 7. Recent Activities (Log)
        const activities = await prisma.submission.findMany({
            take: 100, // Increased to allow for pagination/search on frontend
            orderBy: { updatedAt: 'desc' },
            include: { author: true }
        });

        const formattedActivities = activities.map(a => ({
            id: a.id,
            user: `${a.author.firstName} ${a.author.lastName}`,
            action: a.status === 'APPROVED' ? 'berhasil disetujui' : (a.status === 'REVISION' ? 'meminta revisi' : 'mengunggah konten'),
            detail: a.title,
            avatar: a.author.firstName[0],
            color: a.status === 'APPROVED' ? 'bg-emerald-500' : (a.status === 'REVISION' ? 'bg-red-500' : 'bg-blue-500'),
            timestamp: formatDistanceToNow(a.updatedAt, { addSuffix: true, locale: undefined }) // Using updatedAt
        }));

        return NextResponse.json({
            summary,
            monthlyTrends,
            contentTypes,
            kpis: {
                avgApprovalTime,
                eventCount,
                folderCount
            },
            activities: formattedActivities
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Helper (simple version of formatDistanceToNow)
function formatDistanceToNow(date: Date, options: any) {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} detik yang lalu`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} hari yang lalu`;
}
