"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/app/components/dashboard/layout/DashboardLayout";
import {
    Calendar, ChevronRight, TrendingUp, Eye, Clock,
    FileText, CheckCircle2, AlertCircle, Plus, Send,
    Video, Image as ImageIcon, UploadCloud, RefreshCw, X, MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";

interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    pic: string[];
    color: "GREEN" | "YELLOW" | "RED" | "BLUE";
}

interface Deadline {
    id: string;
    title: string;
    date: string;
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

interface User {
    nip: string;
    firstName: string;
    lastName: string;
}

export default function StaffDashboard() {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [stats, setStats] = useState<{
        totalSubmissions: number;
        totalPending: number;
        totalApproved: number;
        activeTasks: number;
        deadlines?: Deadline[];
    }>({
        totalSubmissions: 0,
        totalPending: 0,
        totalApproved: 0,
        activeTasks: 0,
        deadlines: []
    });
    const [userNip, setUserNip] = useState("");
    const [userName, setUserName] = useState("Staff");
    const [tick, setTick] = useState(0);
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);

    // Submission form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [contentType, setContentType] = useState("Instagram Post");
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const contentTypes = ["Instagram Post", "Instagram Reels", "TikTok Video", "YouTube Video", "Infografis"];

    useEffect(() => {
        const timer = setInterval(() => setTick(prev => prev + 1), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserNip(user.nip);
                setUserName(`${user.firstName} ${user.lastName}`);
                fetchDashboardData(user.nip);
            } catch (e) { }
        }
    }, []);

    const fetchDashboardData = async (nip: string) => {
        try {
            // Fetch Events
            const eventsRes = await fetch('/api/events');
            if (eventsRes.ok) {
                const eventsData = await eventsRes.json();
                setEvents(eventsData);
            }

            // Fetch Users for PIC names
            const usersRes = await fetch('/api/users?role=STAFF&verified=true');
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setUsers(usersData);
            }

            // Fetch Staff Stats
            const statsRes = await fetch(`/api/staff/stats?authorId=${nip}`);
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats({
                    totalSubmissions: statsData.totalSubmissions,
                    totalPending: statsData.totalPending,
                    totalApproved: statsData.totalApproved,
                    activeTasks: statsData.activeTasks,
                    deadlines: statsData.deadlines
                });
                setActivities(statsData.activities);
                setDeadlines(statsData.deadlines);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
    };

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

        return past.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

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

    const getNamesFromNips = (nips: string[]): string[] => {
        if (!nips || nips.length === 0) return [];
        if (users.length === 0) return nips;

        return nips.map(nip => {
            const user = users.find(u => u.nip === nip);
            return user ? `${user.firstName} ${user.lastName}` : nip;
        });
    };

    const groupEventsByDate = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const futureEvents = events.filter(event => new Date(event.date).getTime() >= today.getTime());

        const grouped: { [key: string]: Event[] } = {};
        futureEvents.forEach(event => {
            const dateKey = new Date(event.date).toDateString();
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(event);
        });

        Object.keys(grouped).forEach(dateKey => {
            grouped[dateKey].sort((a, b) => colorPriority[a.color] - colorPriority[b.color]);
        });

        return Object.fromEntries(
            Object.entries(grouped).sort((a, b) =>
                new Date(a[0]).getTime() - new Date(b[0]).getTime()
            )
        );
    };

    const colorClasses = {
        BLUE: "bg-blue-50 border-blue-100 text-blue-800",
        GREEN: "bg-emerald-50 border-emerald-100 text-emerald-800",
        YELLOW: "bg-amber-50 border-amber-100 text-amber-800",
        RED: "bg-red-50 border-red-100 text-red-800"
    };

    const colorAccents = {
        BLUE: "bg-blue-500",
        GREEN: "bg-emerald-500",
        YELLOW: "bg-amber-500",
        RED: "bg-red-600"
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const modernToast = (type: "success" | "error" | "loading", title: string, desc?: string) => {
        return toast.custom((t) => (
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: t.visible ? 1 : 0, y: t.visible ? 0 : -20, scale: t.visible ? 1 : 0.95 }}
                onClick={() => toast.dismiss(t.id)}
                className={`max-w-md w-full border-2 p-5 rounded-[2rem] shadow-2xl backdrop-blur-md cursor-pointer transition-all ${type === 'success' ? 'bg-emerald-50/90 border-emerald-200' :
                    type === 'error' ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300' : 'bg-white/90 border-gray-100'
                    }`}
            >
                <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center shadow-lg ${type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gray-800'
                        }`}>
                        {type === 'success' ? <CheckCircle2 className="text-white" /> :
                            type === 'error' ? <X className="text-white" strokeWidth={3} /> :
                                <RefreshCw className="text-white animate-spin" />}
                    </div>
                    <div>
                        <p className="font-black text-gray-900">{title}</p>
                        <p className="text-sm font-bold text-gray-500">{desc || "Sistem telah diperbarui."}</p>
                    </div>
                </div>
            </motion.div>
        ));
    };

    const handleFileUpload = async (file: File) => {
        setIsUploading(true);
        const loadingId = modernToast("loading", "Mengirim File...", "Media sedang diunggah ke server cloud.");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            toast.dismiss(loadingId as string);

            if (res.ok) {
                setFileUrl(data.fileUrl);
                modernToast("success", "Upload Berhasil!", "Media telah aman tersimpan di cloud.");
            } else {
                modernToast("error", "Gagal Upload", data.error);
            }
        } catch (err) {
            toast.dismiss(loadingId as string);
            modernToast("error", "Koneksi Bermasalah", "Gagal menghubungi server upload.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !fileUrl) {
            modernToast("error", "Lengkapi Data", "Judul dan file wajib disertakan.");
            return;
        }

        setIsSubmitting(true);
        const loadingId = modernToast("loading", "Mengirim Pengajuan...", "Data sedang didaftarkan ke sistem.");

        try {
            const res = await fetch("/api/staff/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    contentType,
                    fileUrl,
                    authorId: userNip
                }),
            });

            toast.dismiss(loadingId as string);

            if (res.ok) {
                modernToast("success", "Terkirim!", "Karya Anda telah masuk antrian review Officer.");
                setTitle("");
                setDescription("");
                setFileUrl(null);
                setShowSubmissionModal(false);
                fetchDashboardData(userNip);
            } else {
                modernToast("error", "Gagal Kirim", "Terjadi kesalahan pada sistem.");
            }
        } catch (err) {
            toast.dismiss(loadingId as string);
            modernToast("error", "Error", "Gagal menghubungi server.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout role="STAFF" showNavbar={true}>
            <div className="space-y-8 pb-8">
                {/* Hero Header Section - Landing Page Style */}
                <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-red-50/30 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-500/5 rounded-full blur-[80px] -ml-28 -mb-28" />

                    <div className="relative z-10 px-6 sm:px-8 lg:px-10 py-6 sm:py-8 lg:py-10">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            {/* Left Side - Branding & Welcome */}
                            <div className="flex-1 space-y-4">
                                {/* Creative Hub Branding */}
                                <div className="inline-block">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-1 w-8 bg-gradient-to-r from-red-600 to-red-400 rounded-full" />
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em]">
                                            Syntel Digital Team
                                        </span>
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-none">
                                        <span className="text-gray-900 italic">CREATIVE</span>{" "}
                                        <span className="text-red-600 italic">HUB</span>
                                    </h1>
                                    <p className="mt-2 text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-[0.12em]">
                                        Portal Pengiriman Karya & Inisiatif Kreatif
                                    </p>
                                </div>

                                {/* Welcome Message */}
                                <div className="pt-3 border-t border-gray-200/50">
                                    <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900 tracking-tight leading-tight mb-1.5">
                                        Selamat Datang, <span className="text-red-600">{userName}</span>!
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed max-w-2xl">
                                        Berikut ringkasan aktivitas dan tugas Anda hari ini. Terus berkarya dan wujudkan ide kreatif terbaikmu!
                                    </p>
                                </div>
                            </div>

                            {/* Right Side - Quick Stats */}
                            <div className="flex flex-col items-start lg:items-end gap-3">
                                {/* Quick Stats Preview */}
                                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50">
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[11px] font-bold text-gray-600">
                                            {stats.totalSubmissions} Karya
                                        </span>
                                    </div>
                                    <div className="h-2.5 w-px bg-gray-300" />
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-1.5 w-1.5 bg-orange-500 rounded-full animate-pulse" />
                                        <span className="text-[11px] font-bold text-gray-600">
                                            {stats.activeTasks} Tugas
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Konten Diajukan */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-shadow">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-2 bg-blue-50 rounded-xl">
                                <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Konten Diajukan</h3>
                        </div>
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <p className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter">{stats.totalSubmissions}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-2">Total Pengajuan</p>
                            </div>
                        </div>
                    </div>

                    {/* Tugas Aktif */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-shadow">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-2 bg-orange-50 rounded-xl">
                                <Clock className="h-4 w-4 text-orange-600" />
                            </div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Tugas Aktif</h3>
                        </div>
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <p className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter">{stats.activeTasks}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-2">Belum Selesai</p>
                            </div>
                        </div>
                    </div>

                    {/* Dokumen Terarsipkan */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-shadow">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-2 bg-emerald-50 rounded-xl">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Dokumen Terarsipkan</h3>
                        </div>
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <p className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter">{stats.totalApproved}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-2">Konten Disetujui</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submission Tracking & Instructions Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Submission Tracking Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] p-5">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-red-600 italic tracking-tight">Pantau Pengajuan</h2>
                                <p className="text-[11px] text-gray-500 mt-1">Daftar pengajuan konten Anda</p>
                            </div>
                            <div className="px-2.5 py-1 bg-red-50 border border-red-200 rounded-full">
                                <p className="text-[11px] font-bold text-red-600">{stats.totalSubmissions} Total</p>
                            </div>
                        </div>

                        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {activities && activities.length > 0 ? (
                                activities.map((activity: any, index: number) => (
                                    <motion.div
                                        key={activity.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => router.push(`/dashboard/staff/pengajuan/${activity.id}`)}
                                        className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-white rounded-lg p-3 border border-gray-200 hover:border-red-300 hover:shadow-sm transition-all cursor-pointer"
                                    >
                                        {/* Status Label - Top Right */}
                                        <div className="absolute top-2 right-2 z-10">
                                            <div className={`px-2 py-0.5 rounded-full ${activity.status === 'PENDING' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                activity.status === 'REVISION' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                    activity.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                        'bg-gray-100 text-gray-700 border border-gray-200'
                                                }`}>
                                                <p className="text-[8px] font-bold uppercase">
                                                    {activity.status === 'PENDING' ? 'Pending' :
                                                        activity.status === 'REVISION' ? 'Revisi' :
                                                            activity.status === 'APPROVED' ? 'Disetujui' :
                                                                activity.status}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 pr-16">
                                            {/* Avatar */}
                                            <div className={`h-9 w-9 ${activity.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                <span className="text-white font-black text-sm">{activity.avatar}</span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                                                    {activity.detail}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <p className="text-[10px] font-semibold text-gray-500">
                                                        {activity.action}
                                                    </p>
                                                    <span className="text-gray-300">•</span>
                                                    <p className="text-[10px] font-semibold text-gray-400">
                                                        {formatRelativeTime(activity.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                        <FileText className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-500">Belum ada pengajuan</p>
                                    <p className="text-xs text-gray-400 mt-1">Mulai kirim karya kreatif Anda</p>
                                </div>
                            )}
                        </div>

                        {/* View All Button */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <Link href="/dashboard/staff/pengajuan?tab=inisiatif">
                                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:from-red-700 hover:to-red-800 transition-all hover:shadow-lg group">
                                    <span>Lihat Semua Pengajuan</span>
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Instructions Monitoring Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] p-5">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-red-600 italic tracking-tight">Instruksi Aktif</h2>
                                <p className="text-[11px] text-gray-500 mt-1">Tugas yang perlu diselesaikan</p>
                            </div>
                            <div className="px-2.5 py-1 bg-red-50 border border-red-200 rounded-full">
                                <p className="text-[11px] font-bold text-red-600">{stats.activeTasks} Aktif</p>
                            </div>
                        </div>

                        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {stats.deadlines && stats.deadlines.length > 0 ? (
                                stats.deadlines.map((deadline: any, index: number) => (
                                    <motion.div
                                        key={deadline.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => router.push(`/dashboard/staff/pengajuan/${deadline.id}`)}
                                        className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-white rounded-lg p-3 border border-gray-200 hover:border-red-300 hover:shadow-sm transition-all cursor-pointer"
                                    >
                                        <div className="flex items-start gap-2.5">
                                            {/* Status Indicator */}
                                            <div className={`mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0 ${deadline.status === 'Pending' ? 'bg-amber-500' :
                                                deadline.status === 'Menunggu Review' ? 'bg-blue-500' :
                                                    'bg-orange-500'
                                                }`} />

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                                                    {deadline.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 text-gray-400" />
                                                        <p className="text-[10px] font-semibold text-gray-600">{deadline.date}</p>
                                                    </div>
                                                    <div className={`px-1.5 py-0.5 rounded-full ${deadline.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                                        deadline.status === 'Menunggu Review' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        <p className="text-[8px] font-bold uppercase">{deadline.status}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                        <CheckCircle2 className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-500">Tidak ada instruksi aktif</p>
                                    <p className="text-xs text-gray-400 mt-1">Semua tugas telah selesai</p>
                                </div>
                            )}
                        </div>

                        {/* View All Button */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <Link href="/dashboard/staff/pengajuan?tab=upcoming">
                                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:from-red-700 hover:to-red-800 transition-all hover:shadow-lg group">
                                    <span>Lihat Semua Instruksi</span>
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Calendar & Events Section - Officer Style */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    {/* Left Column - Calendar and Detail */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        {/* Calendar Card */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.08),0_10px_20px_-5px_rgba(0,0,0,0.04)] p-7">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-red-600 italic tracking-tight">Calendar</h2>
                            </div>

                            <div className="calendar-container w-full">
                                <DatePicker
                                    selected={selectedEvent ? new Date(selectedEvent.date) : null}
                                    onChange={(date: Date | null) => {
                                        if (date) {
                                            const eventsOnDate = getEventsForDate(date);
                                            if (eventsOnDate.length > 0) {
                                                const sorted = [...eventsOnDate].sort((a, b) =>
                                                    colorPriority[b.color as keyof typeof colorPriority] -
                                                    colorPriority[a.color as keyof typeof colorPriority]
                                                );
                                                setSelectedEvent(sorted[0]);
                                            } else {
                                                setSelectedEvent(null);
                                            }
                                        }
                                    }}
                                    inline
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
                                    dayClassName={(date: Date) => {
                                        const eventsOnDate = getEventsForDate(date);
                                        const classes = [];
                                        if (eventsOnDate.length > 0) {
                                            const sortedByPriority = [...eventsOnDate].sort((a, b) =>
                                                colorPriority[b.color as keyof typeof colorPriority] -
                                                colorPriority[a.color as keyof typeof colorPriority]
                                            );
                                            classes.push(`event-dot-${sortedByPriority[0].color.toLowerCase()}`);
                                        }
                                        return classes.join(' ');
                                    }}
                                />
                            </div>
                        </div>

                        {/* Detail Kegiatan Card - Read Only */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.08),0_10px_20px_-5px_rgba(0,0,0,0.04)] p-6 flex flex-col flex-1 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-5 relative z-10">
                                <h2 className="text-2xl font-bold text-red-600 italic tracking-tight">Detail Kegiatan</h2>
                            </div>

                            <div className="flex-1 relative z-10">
                                {selectedEvent ? (
                                    <div className="space-y-5 animate-in fade-in duration-500">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">
                                                {selectedEvent.title}
                                            </h3>
                                            <p className="text-gray-500 text-[13px] font-medium leading-relaxed">
                                                {selectedEvent.description}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Waktu</span>
                                                </div>
                                                <p className="text-[13px] font-bold text-gray-800">{formatDate(selectedEvent.date)}</p>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Lokasi</span>
                                                </div>
                                                <p className="text-[13px] font-bold text-gray-800">{selectedEvent.location}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Penanggung Jawab</span>
                                            </div>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {getNamesFromNips(selectedEvent.pic).map((person, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-[11px] font-bold flex items-center gap-2 border border-gray-200"
                                                    >
                                                        {person}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
                                        <div className="w-24 h-24 rounded-[2.5rem] bg-gray-50 flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-50" />
                                            <Calendar className="w-10 h-10 text-gray-200" />
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Belum Ada Event Dipilih</p>
                                        <p className="text-xs text-gray-400 font-medium">Klik pada tanggal yang ditandai dot warna di kalender untuk melihat detail kegiatannya.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Upcoming Events */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.08),0_10px_20px_-5px_rgba(0,0,0,0.04)] p-7 flex flex-col h-[1000px] relative overflow-hidden">

                            <div className="mb-8 flex items-end justify-between relative z-10">
                                <div>
                                    <h2 className="text-2xl font-bold text-red-600 italic tracking-tight">Upcoming Events</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Jadwal Mendatang</p>
                                </div>
                                <div className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        {Object.keys(groupEventsByDate()).length} Hari Terdaftar
                                    </span>
                                </div>
                            </div>

                            <div className="overflow-y-auto pr-4 custom-scrollbar relative z-10">
                                {Object.entries(groupEventsByDate()).map(([dateKey, dateEvents]) => (
                                    <div key={dateKey} className="relative">
                                        <div className="sticky top-0 bg-white/95 backdrop-blur-sm py-3 z-20 flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${new Date(dateKey).toDateString() === new Date().toDateString() ? 'bg-red-600 animate-pulse' : 'bg-gray-300'}`} />
                                            <div>
                                                <h3 className="text-base font-bold text-gray-900 tracking-tight uppercase">
                                                    {new Date(dateKey).toDateString() === new Date().toDateString() ? "Hari Ini" : new Date(dateKey).toLocaleString('id-ID', { weekday: 'long' })}
                                                </h3>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5">
                                                    {formatDate(dateEvents[0].date)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pl-4 border-l-2 border-gray-200 ml-6">
                                            {dateEvents.map((event) => (
                                                <motion.div
                                                    key={event.id}
                                                    whileHover={{ x: 6, y: -2 }}
                                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                                    onClick={() => setSelectedEvent(event)}
                                                    className={`${colorClasses[event.color]} p-5 rounded-2xl cursor-pointer transition-all duration-150 border-2 border-transparent hover:border-white hover:shadow-xl hover:shadow-gray-200/50 group relative overflow-hidden`}
                                                >
                                                    <div className="relative z-10">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 text-l leading-tight pr-8 tracking-tight mb-2">
                                                                    {event.title}
                                                                </h4>
                                                                <p className="text-gray-500 text-[13px] font-bold">
                                                                    {formatDate(event.date)}
                                                                </p>
                                                            </div>
                                                            <div className={`w-2.5 h-2.5 rounded-full ${colorAccents[event.color]} border-2 border-white shadow-sm mt-1.5`} />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Instructions */}
                {deadlines.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-red-50 rounded-2xl">
                                <Calendar className="h-5 w-5 text-red-600" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">Instruksi Mendatang</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {deadlines.map((deadline) => (
                                <div
                                    key={deadline.id}
                                    className="p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group"
                                >
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <h3 className="font-black text-sm text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                                            {deadline.title}
                                        </h3>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-red-600">
                                            <Clock className="h-3 w-3" />
                                            <span className="text-xs font-black">{deadline.date}</span>
                                        </div>
                                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border ${deadline.status === "Pending"
                                            ? "bg-gray-50 text-gray-500 border-gray-100"
                                            : deadline.status === "Menunggu Review"
                                                ? "bg-orange-50 text-orange-600 border-orange-100"
                                                : "bg-red-50 text-red-600 border-red-100"
                                            }`}>
                                            {deadline.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Activity Feed */}
                {activities.length > 0 && (
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 sm:p-10">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Aktivitas Terbaru</h2>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                        Riwayat pengajuan Anda
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-gray-100 border-t border-gray-100 -mx-8 sm:-mx-10 mt-10">
                            {activities.map((activity) => (
                                <div key={activity.id} className="relative p-8 hover:bg-gray-50/50 transition-all duration-300 group cursor-pointer overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${activity.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                                    <div className="flex items-center gap-4 mb-6">
                                        <div className={`h-11 w-11 rounded-2xl ${activity.color} shadow-lg flex items-center justify-center text-white font-black text-base group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                            {activity.avatar}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-gray-900 truncate group-hover:text-red-600 transition-colors">
                                                {activity.user}
                                            </p>
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
                                                }`}>
                                                {activity.action}
                                            </p>
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
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Submission Modal */}
            <AnimatePresence>
                {showSubmissionModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowSubmissionModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[3rem] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <form onSubmit={handleSubmit}>
                                <div className="p-10 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-3xl font-black text-gray-900">Buat Pengajuan Baru</h2>
                                        <button
                                            type="button"
                                            onClick={() => setShowSubmissionModal(false)}
                                            className="h-10 w-10 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full flex items-center justify-center transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Detail Konten</label>
                                        <input
                                            type="text"
                                            placeholder="Judul Karya (Contoh: Reels Promosi Syntel)"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-[2rem] transition-all font-bold text-gray-800 placeholder:text-gray-300 shadow-inner"
                                        />
                                        <textarea
                                            placeholder="Tuliskan deskripsi atau caption sosial media di sini..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-[2.5rem] transition-all font-semibold text-gray-700 min-h-[160px] resize-none shadow-inner"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Jenis Materi</label>
                                            <div className="relative group">
                                                <select
                                                    value={contentType}
                                                    onChange={(e) => setContentType(e.target.value)}
                                                    className="w-full appearance-none px-8 py-4 bg-gray-50 border-2 border-transparent focus:border-red-500 rounded-2xl font-bold text-gray-700 transition-all cursor-pointer"
                                                >
                                                    {contentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <RefreshCw className="h-4 w-4 text-gray-400 group-hover:rotate-180 transition-transform duration-500" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Aset Media (Cloud)</label>
                                            <input
                                                type="file"
                                                id="staff-upload"
                                                className="hidden"
                                                accept="video/*,image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleFileUpload(file);
                                                }}
                                            />
                                            <label
                                                htmlFor="staff-upload"
                                                className={`flex items-center justify-between px-8 py-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${fileUrl ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-red-300 hover:bg-red-50'
                                                    }`}
                                            >
                                                <span className="text-sm font-bold truncate pr-4">
                                                    {isUploading ? "Mengunggah..." : fileUrl ? "File Terunggah ✓" : "Pilih Foto/Video"}
                                                </span>
                                                {isUploading ? <RefreshCw className="h-4 w-4 animate-spin text-red-500" /> : <UploadCloud className="h-4 w-4" />}
                                            </label>
                                        </div>
                                    </div>

                                    {fileUrl && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative group">
                                            <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                <p className="text-white font-black uppercase tracking-widest text-xs">Preview Media</p>
                                            </div>
                                            {fileUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                                                <video src={fileUrl} className="w-full h-48 object-cover rounded-3xl shadow-lg" />
                                            ) : (
                                                <img src={fileUrl} className="w-full h-48 object-cover rounded-3xl shadow-lg" alt="Preview" />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setFileUrl(null)}
                                                className="absolute -top-3 -right-3 h-8 w-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-red-600 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="px-10 py-8 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowSubmissionModal(false)}
                                        className="px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || isUploading}
                                        className="px-12 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-red-600 hover:shadow-[0_15px_30px_rgba(220,38,38,0.3)] transition-all transform hover:-translate-y-1 flex items-center gap-3 disabled:opacity-50 disabled:translate-y-0"
                                    >
                                        {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        Kirim Sekarang
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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

                .calendar-container .react-datepicker__navigation {
                    display: none !important;
                }
                .calendar-container .react-datepicker__current-month {
                    display: none !important;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
            `}</style>
        </DashboardLayout>
    );
}
