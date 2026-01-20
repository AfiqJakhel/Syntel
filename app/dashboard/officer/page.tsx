"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/app/components/dashboard/layout/DashboardLayout";
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, MoreVertical, Eye, Clock, ChevronDown, Users } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface ContentStats {
    type: string;
    count: number;
    color: string;
    [key: string]: any;
}

interface Deadline {
    id: string;
    title: string;
    date: string;
    assignee: string;
    status: "Pending" | "Revisi" | "Menunggu Review";
}

interface Activity {
    id: string;
    user: string;
    action: string;
    detail: string;
    avatar: string;
    color: string;
    timestamp: string;
    status?: string;
}

interface Event {
    id: string;
    title: string;
    description: string;
    date: string; // ISO string from API
    location: string;
    pic: string[]; // Array of NIPs (user IDs)
    color: "GREEN" | "YELLOW" | "RED" | "BLUE";
}

export default function OfficerDashboard() {
    const [selectedPeriod, setSelectedPeriod] = useState("Monthly");
    const [contentData, setContentData] = useState<ContentStats[]>([]);
    const [stats, setStats] = useState({
        totalSubmissions: 0,
        totalPending: 0,
        totalApproved: 0,
        recentSubmissions: 0,
        growthRate: "+0%"
    });
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [isPieHovered, setIsPieHovered] = useState(false);
    const [isPeriodOpen, setIsPeriodOpen] = useState(false);

    const [deadlines, setDeadlines] = useState<Deadline[]>([]);

    const [activities, setActivities] = useState<Activity[]>([
        { id: "1", user: "Fajar Nugraha", action: "mengunggah konten", detail: "Kampanye Promo Awal Tahun 2026", avatar: "F", color: "bg-blue-500", timestamp: new Date().toISOString() },
        { id: "2", user: "Budi", action: "revisi artikel", detail: "Artikel Earth Mission: Mangrove Chapter", avatar: "B", color: "bg-purple-500", timestamp: new Date().toISOString() },
        { id: "3", user: "Adit", action: "upload banner baru", detail: "Indibiz periode Januari - Februari 2026", avatar: "A", color: "bg-red-500", timestamp: new Date().toISOString() },
        { id: "4", user: "Fajar Nugraha", action: "Revisi reels instagram", detail: "Hari Batikwan Nasional 2026", avatar: "F", color: "bg-blue-500", timestamp: new Date().toISOString() },
    ]);

    const [events, setEvents] = useState<Event[]>([]);

    const [tick, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick(prev => prev + 1), 60000); // Update every 1 minute
        return () => clearInterval(timer);
    }, []);

    const formatRelativeTime = (timestamp: string) => {
        if (!timestamp) return "Baru Saja";
        const now = new Date();
        const past = new Date(timestamp);
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

        if (diffInSeconds < 60) return "Baru Saja";

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} jam yang lalu`;

        // If more than 24 hours, show date
        return past.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    const formatContentType = (type: string) => {
        const mapping: { [key: string]: string } = {
            "INSTAGRAM_POST": "Instagram Post",
            "INSTAGRAM_CAROUSEL": "Instagram Carousel",
            "INSTAGRAM_REELS": "Instagram Reels",
            "INSTAGRAM_STORY": "Instagram Story",
            "TIKTOK_POST": "TikTok Post",
            "YOUTUBE_VIDEO": "YouTube Video",
            "POSTER": "Poster",
            "DOKUMEN_INTERNAL": "Dokumen Internal"
        };
        return mapping[type] || type;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Events
                const eventsRes = await fetch('/api/events');
                if (eventsRes.ok) {
                    const eventsData = await eventsRes.json();
                    setEvents(eventsData);
                }

                // Fetch Stats with Period
                const statsRes = await fetch(`/api/officer/stats?period=${selectedPeriod}`);
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setContentData(statsData.contentStats);
                    setActivities(statsData.activities);
                    setDeadlines(statsData.deadlines); // Update deadlines state
                    setStats({
                        totalSubmissions: statsData.totalSubmissions,
                        totalPending: statsData.totalPending,
                        totalApproved: statsData.totalApproved,
                        recentSubmissions: statsData.recentSubmissions,
                        growthRate: statsData.growthRate
                    });
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        };

        fetchData();

        // Real-time polling: fetch data every 30 seconds
        const pollInterval = setInterval(fetchData, 30000);

        return () => clearInterval(pollInterval);
    }, [selectedPeriod]);

    const getEventsForDate = (date: Date) => {
        return events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === date.toDateString();
        });
    };

    const colorPriority = {
        BLUE: 1,
        GREEN: 2,
        YELLOW: 3,
        RED: 4
    };



    return (
        <DashboardLayout role="OFFICER" showNavbar={true}>
            <div className="space-y-6 pb-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">Selamat Datang, Officer!</h1>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium mt-2">Berikut ringkasan aktivitas konten Anda hari ini</p>
                </div>

                {/* Top Row: Pie Chart & Calendar */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Jenis Konten - Pie Chart */}
                    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-gray-900">Konten Disetujui</h2>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:inline">Periode</span>
                                    <div className="relative period-dropdown">
                                        <button
                                            onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                                            className="flex items-center gap-3 px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black text-gray-900 hover:bg-white hover:shadow-md transition-all active:scale-95 group"
                                        >
                                            <span className="uppercase tracking-widest">{selectedPeriod}</span>
                                            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isPeriodOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {isPeriodOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-[1.5rem] shadow-2xl p-2 z-50 overflow-hidden"
                                                >
                                                    {["Weekly", "Monthly", "Yearly"].map((period) => (
                                                        <button
                                                            key={period}
                                                            onClick={() => {
                                                                setSelectedPeriod(period);
                                                                setIsPeriodOpen(false);
                                                            }}
                                                            className={`w-full text-left px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedPeriod === period
                                                                ? "bg-red-50 text-red-600"
                                                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                                                }`}
                                                        >
                                                            {period}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col xl:flex-row items-center gap-10">
                            {/* Pie Chart */}
                            <div className="relative w-64 h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={contentData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={4}
                                            dataKey="count"
                                            nameKey="type"
                                            stroke="none"
                                            animationBegin={0}
                                            animationDuration={1500}
                                            onMouseEnter={(_, index) => {
                                                setActiveIndex(index);
                                                setIsPieHovered(true);
                                            }}
                                            onMouseLeave={() => {
                                                setActiveIndex(null);
                                                setIsPieHovered(false);
                                            }}
                                        >
                                            {contentData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                    className="outline-none cursor-pointer"
                                                />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <p className="text-5xl font-black text-gray-900">
                                            {contentData.reduce((acc, curr) => acc + curr.count, 0)}
                                        </p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Total</p>
                                    </div>
                                </div>
                            </div>

                            {/* Legend & Hover Info */}
                            <div className="flex-1 w-full flex flex-col justify-center">
                                <div className="h-28 relative mb-6">
                                    <AnimatePresence mode="wait">
                                        {activeIndex !== null && isPieHovered ? (
                                            <motion.div
                                                key="detail"
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="bg-gray-50/80 backdrop-blur-sm border border-gray-100 p-5 rounded-[2rem] shadow-sm flex items-center justify-between group"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: contentData[activeIndex].color }} />
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{formatContentType(contentData[activeIndex].type)}</p>
                                                    </div>
                                                    <div className="flex items-baseline gap-3">
                                                        <p className="text-4xl font-black text-gray-900 leading-none">
                                                            {contentData[activeIndex].count}
                                                        </p>
                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Konten</span>
                                                    </div>
                                                </div>
                                                <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-50 text-center min-w-[80px]">
                                                    <p className="text-xl font-black text-emerald-600">
                                                        {((contentData[activeIndex].count / contentData.reduce((a, b) => a + b.count, 0)) * 100).toFixed(1)}%
                                                    </p>
                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mt-0.5">Kontribusi</p>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="placeholder"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 0.5 }}
                                                className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[2rem] text-center px-6"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                                                    <TrendingUp className="h-5 w-5 text-gray-300" />
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                                                    Arahkan kursor ke grafik<br />untuk melihat detail statistik
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                                    {contentData.map((item, index) => (
                                        <div
                                            key={index}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            onMouseLeave={() => setActiveIndex(null)}
                                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 cursor-default ${activeIndex === index ? 'bg-white shadow-lg border-gray-100 scale-[1.02]' : 'bg-gray-50/50 border-transparent opacity-70'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                                                <span className="text-[11px] font-bold text-gray-700">{formatContentType(item.type)}</span>
                                            </div>
                                            <span className="text-lg font-black text-gray-900">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Calendar */}
                    <Link
                        href="/dashboard/officer/kalender"
                        className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8 block hover:scale-[1.01] transition-transform cursor-pointer"
                    >
                        <h2 className="text-xl font-black text-gray-900 mb-6">Calendar</h2>

                        <div className="calendar-container w-full pointer-events-none">
                            <DatePicker
                                selected={null}
                                onChange={() => { }}
                                inline
                                dayClassName={(date: Date) => {
                                    const eventsOnDate = getEventsForDate(date);
                                    const classes = [];
                                    if (eventsOnDate.length > 0) {
                                        // Show highest priority color on calendar dot
                                        const sortedByPriority = [...eventsOnDate].sort((a, b) =>
                                            colorPriority[b.color as keyof typeof colorPriority] -
                                            colorPriority[a.color as keyof typeof colorPriority]
                                        );
                                        classes.push(`event-dot-${sortedByPriority[0].color.toLowerCase()}`);
                                    }
                                    return classes.join(' ');
                                }}
                                renderCustomHeader={({
                                    date,
                                    decreaseMonth,
                                    increaseMonth,
                                    prevMonthButtonDisabled,
                                    nextMonthButtonDisabled,
                                }) => (
                                    <div className="flex items-center justify-between px-2 mb-8 bg-gray-50/50 p-2 rounded-2xl border border-gray-200">
                                        <button
                                            onClick={decreaseMonth}
                                            disabled={prevMonthButtonDisabled}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white text-gray-400 hover:text-gray-900 transition-all"
                                        >
                                            <span className="text-lg">←</span>
                                        </button>
                                        <span className="text-sm font-bold text-gray-900 tracking-tight">
                                            {date.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                                        </span>
                                        <button
                                            onClick={increaseMonth}
                                            disabled={nextMonthButtonDisabled}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white text-gray-400 hover:text-gray-900 transition-all"
                                        >
                                            <span className="text-lg">→</span>
                                        </button>
                                    </div>
                                )}
                            />
                        </div>

                        <style jsx global>{`
                            .calendar-container .react-datepicker {
                                border: none !important;
                                font-family: inherit !important;
                                width: 100% !important;
                                display: flex !important;
                                justify-content: center !important;
                                background: transparent !important;
                            }

                            .calendar-container .react-datepicker__month-container {
                                width: 100% !important;
                            }

                            .calendar-container .react-datepicker__header {
                                background-color: transparent !important;
                                border-bottom: none !important;
                                padding: 0 !important;
                            }

                            .calendar-container .react-datepicker__day-names {
                                display: grid !important;
                                grid-template-columns: repeat(7, 1fr) !important;
                                margin-bottom: 0.5rem !important;
                            }

                            .calendar-container .react-datepicker__day-name {
                                color: #9ca3af !important;
                                font-weight: 700 !important;
                                font-size: 0.75rem !important;
                                text-transform: uppercase !important;
                                margin: 0 !important;
                                width: auto !important;
                            }

                            .calendar-container .react-datepicker__month {
                                margin: 0 !important;
                                display: flex !important;
                                flex-direction: column !important;
                                gap: 0.5rem !important;
                            }

                            .calendar-container .react-datepicker__week {
                                display: grid !important;
                                grid-template-columns: repeat(7, 1fr) !important;
                            }

                            .calendar-container .react-datepicker__day {
                                width: auto !important;
                                height: 2.75rem !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                margin: 2px !important;
                                border-radius: 12px !important;
                                color: #4b5563 !important;
                                font-size: 0.875rem !important;
                                font-weight: 600 !important;
                                transition: all 0.2s !important;
                            }

                            .calendar-container .react-datepicker__day:hover {
                                background-color: #f3f4f6 !important;
                                color: #111827 !important;
                            }

                            .calendar-container .react-datepicker__day--today,
                            .calendar-container .react-datepicker__day--selected,
                            .calendar-container .react-datepicker__day--keyboard-selected {
                                background: none !important;
                                border: none !important;
                                font-weight: 600 !important;
                            }

                            /* Highlighted Event Days */
                            .calendar-container .react-datepicker__day.event-dot-blue {
                                background-color: #dbeafe !important;
                                color: #1d4ed8 !important;
                                font-weight: 700 !important;
                            }
                            .calendar-container .react-datepicker__day.event-dot-green {
                                background-color: #d1fae5 !important;
                                color: #047857 !important;
                                font-weight: 700 !important;
                            }
                            .calendar-container .react-datepicker__day.event-dot-yellow {
                                background-color: #fef3c7 !important;
                                color: #b45309 !important;
                                font-weight: 700 !important;
                            }
                            .calendar-container .react-datepicker__day.event-dot-red {
                                background-color: #fee2e2 !important;
                                color: #b91c1c !important;
                                font-weight: 700 !important;
                            }

                            /* Hide default elements ONLY for the inline dashboard calendar */
                            .calendar-container .react-datepicker__navigation {
                                display: none !important;
                            }
                            .calendar-container .react-datepicker__current-month {
                                display: none !important;
                            }
                        `}</style>
                    </Link>
                </div>

                {/* Middle Row: Deadlines */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Deadline Mendatang */}
                    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-red-50 rounded-2xl">
                                    <Calendar className="h-5 w-5 text-red-600" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900">Deadline Terdekat</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 -mx-6 sm:-mx-8 mt-6 border-t border-gray-100">
                            {deadlines.map((deadline, index) => (
                                <Link
                                    key={deadline.id}
                                    href={`/dashboard/officer/instruksi?view=TRACKING&search=${encodeURIComponent(deadline.title)}`}
                                    className={`flex items-center gap-5 p-8 hover:bg-gray-50/50 transition-all group relative cursor-pointer border-b border-gray-100
                                        ${(index + 1) % 3 !== 0 ? 'lg:border-r' : ''}
                                        ${(index + 1) % 2 !== 0 ? 'md:border-r lg:border-r-0 lg:[(index+1)%3==0]:border-r-0' : ''}
                                    `}
                                    style={{
                                        borderRight: (index + 1) % 3 === 0 ? 'none' : undefined
                                    }}
                                >
                                    <div className="w-1.5 h-12 bg-red-500 rounded-full group-hover:scale-y-110 transition-transform flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Urgent</span>
                                            <h3 className="font-black text-gray-900 text-sm truncate group-hover:text-red-600 transition-colors uppercase tracking-tight">{deadline.title}</h3>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5">
                                            <Users className="h-3 w-3 text-gray-400" />
                                            {deadline.assignee}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xs font-black text-red-600 flex items-center justify-end gap-1">
                                            <Clock className="h-3 w-3" />
                                            {deadline.date}
                                        </p>
                                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[9px] font-black mt-2 uppercase tracking-widest shadow-sm border ${deadline.status === "Pending"
                                            ? "bg-gray-50 text-gray-500 border-gray-100"
                                            : deadline.status === "Menunggu Review"
                                                ? "bg-orange-50 text-orange-600 border-orange-100"
                                                : "bg-red-50 text-red-600 border-red-100"
                                            }`}>
                                            {deadline.status}
                                        </span>
                                    </div>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                        <ChevronRight className="h-4 w-4 text-red-600" />
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
                            <Link
                                href="/dashboard/officer/instruksi?view=TRACKING"
                                className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                            >
                                <Eye className="h-4 w-4" />
                                Monitoring Semua Instruksi
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Statistics */}
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                        {/* Total Konten */}
                        <div className="p-8 sm:p-10 hover:bg-gray-50/30 transition-colors">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Aset Digital</h3>
                                </div>
                            </div>
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-6xl lg:text-7xl font-black text-gray-900 tracking-tighter">{stats.totalApproved}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-3">Total Konten Disetujui</p>
                                </div>
                            </div>
                        </div>

                        {/* Total Pengajuan */}
                        <div className="p-8 sm:p-10 hover:bg-gray-50/30 transition-colors">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Pengajuan Konten</h3>
                                </div>
                            </div>
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-6xl lg:text-7xl font-black text-gray-900 tracking-tighter">{stats.totalPending}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-3">Menunggu Review / Revisi</p>
                                </div>
                                <Link href="/dashboard/officer/instruksi?filter=PENDING" className="flex items-center gap-3 px-6 py-3.5 bg-red-600 text-white rounded-[1.25rem] shadow-xl shadow-red-200 cursor-pointer hover:scale-105 hover:bg-red-700 active:scale-95 transition-all mb-2">
                                    <span className="text-xs font-black uppercase tracking-widest">Review Sekarang</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Full Width Activity Feed */}
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 sm:p-10 mb-6">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Aktivitas Terbaru</h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time update dari tim Creative</p>
                            </div>
                        </div>
                        <Link
                            href="/dashboard/officer/laporan"
                            className="px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                            Lihat Semua
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-gray-100 border-t border-gray-100 -mx-8 sm:-mx-10 mt-10">
                        {activities.map((activity) => (
                            <div key={activity.id} className="relative p-8 hover:bg-gray-50/50 transition-all duration-300 group cursor-pointer overflow-hidden">
                                {/* Interactive Background Glow */}
                                <div className={`absolute top-0 left-0 w-1 h-full ${activity.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`h-11 w-11 rounded-2xl ${activity.color} shadow-lg flex items-center justify-center text-white font-black text-base group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                        {activity.avatar}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-gray-900 truncate group-hover:text-red-600 transition-colors">{activity.user}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Staff Creative</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-4 w-4 items-center justify-center">
                                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${activity.status === "PENDING" ? "bg-emerald-500" :
                                                activity.status === "REVISION" ? "bg-orange-500" :
                                                    activity.status === "APPROVED" ? "bg-blue-500" : "bg-gray-500"
                                                }`}></span>
                                        </div>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${activity.status === "PENDING" ? "text-emerald-600" :
                                            activity.status === "REVISION" ? "text-orange-600" :
                                                activity.status === "APPROVED" ? "text-blue-600" : "text-gray-600"
                                            }`}>{activity.action}</p>
                                    </div>
                                    <p className="text-xs font-bold text-gray-600 line-clamp-3 leading-relaxed group-hover:text-gray-900 transition-colors">
                                        "{activity.detail}"
                                    </p>
                                </div>
                                <div className="mt-6 pt-5 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-gray-500 transition-colors">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">
                                            {formatRelativeTime(activity.timestamp)}
                                        </span>
                                    </div>
                                    <Link
                                        href={`/dashboard/officer/instruksi?submissionId=${activity.id}`}
                                        className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 hover:bg-red-50 hover:border-red-100"
                                    >
                                        <Eye className="h-3.5 w-3.5 text-red-600" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout >
    );
}
