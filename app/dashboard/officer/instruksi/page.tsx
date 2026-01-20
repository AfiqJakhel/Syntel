"use client";

import React, { useState, useEffect, Suspense } from "react";
import { DashboardLayout } from "@/app/components/dashboard/layout/DashboardLayout";
import {
    Search, Eye, Edit2, Trash2, Calendar, FileText,
    Plus, Lightbulb, ClipboardList, CheckCircle2,
    Clock, AlertCircle, LayoutGrid, ListTodo, X,
    MessageSquare, ExternalLink, Send, Image as ImageIcon,
    ChevronLeft, ChevronRight
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// Types
interface Submission {
    id: string;
    title: string;
    description?: string;
    type: string;
    author: string;
    authorRole: string;
    date: string;
    status: "PENDING" | "REVISION" | "APPROVED" | "REJECTED";
    source: "INSTRUKSI" | "INISIATIF";
    notes?: string;
    fileUrl?: string;
}

interface InstructionTracking {
    id: string;
    title: string;
    assignees: string[];
    deadline: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    status: string;
    statusColor: string;
    hasSubmission: boolean;
    submission?: Submission | null;
    lastUpdate: string;
    thumbnail?: string;
}

export default function InstruksiManagementPage() {
    return (
        <Suspense fallback={
            <DashboardLayout role="OFFICER">
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
                </div>
            </DashboardLayout>
        }>
            <InstruksiContent />
        </Suspense>
    );
}

function InstruksiContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get("view") as "FEED" | "TRACKING") || "FEED";
    const initialSearch = searchParams.get("search") || "";
    const initialFilter = searchParams.get("filter") || "ALL";

    // State management
    const [viewMode, setViewMode] = useState<"FEED" | "TRACKING">(initialTab);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [trackingData, setTrackingData] = useState<InstructionTracking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [activeFilter, setActiveFilter] = useState<string>(initialFilter);
    const [sourceFilter, setSourceFilter] = useState<"SEMUA" | "INSTRUKSI" | "INISIATIF">("SEMUA");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

    // Modal States
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const modernToast = (type: "success" | "error" | "loading" | "info", title: string, description?: string) => {
        return toast.custom((t) => (
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{
                    opacity: t.visible ? 1 : 0,
                    y: t.visible ? 0 : -20,
                    scale: t.visible ? 1 : 0.95
                }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                onClick={() => toast.dismiss(t.id)}
                className={`max-w-md w-full border-2 shadow-[0_20px_60px_rgba(0,0,0,0.1)] rounded-[2.5rem] pointer-events-auto flex overflow-hidden backdrop-blur-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all z-[9999] ${type === 'success' ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' :
                    type === 'info' || type === 'error' ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300' :
                        'bg-white/90 border-gray-100'
                    }`}
            >
                <div className="flex-1 p-5">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                            <div className="relative">
                                <div className={`absolute inset-0 rounded-full blur-md opacity-40 animate-pulse ${type === 'success' ? 'bg-emerald-400' :
                                    type === 'info' || type === 'error' ? 'bg-red-500' :
                                        'bg-gray-400'
                                    }`}></div>
                                <div className={`relative h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-transform ${type === 'success' ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
                                    type === 'info' || type === 'error' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                                        'bg-gray-800'
                                    }`}>
                                    {type === 'success' ? <CheckCircle2 className="h-6 w-6 text-white" strokeWidth={3} /> :
                                        type === 'error' ? <X className="h-6 w-6 text-white" strokeWidth={3} /> :
                                            <Clock className="h-6 w-6 text-white animate-spin" />}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="text-base font-black tracking-tight text-gray-900">{title}</p>
                            <p className="text-sm font-bold mt-0.5 leading-relaxed text-gray-500">{description || "Sistem telah diperbarui secara real-time."}</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        ), { duration: type === 'loading' ? Infinity : 5000 });
    };

    const handleUpdateStatus = async (status: Submission["status"]) => {
        if (!selectedSubmission) return;
        setIsSubmitting(true);
        const loadingId = modernToast("loading", "Memproses Anggota...", "Status pengajuan sedang diperbarui.");

        try {
            const res = await fetch("/api/officer/submissions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: selectedSubmission.id,
                    status,
                    feedback
                })
            });

            if (res.ok) {
                toast.dismiss(loadingId as string);
                modernToast("success", "Review Selesai!", `Status pengajuan berhasil diubah menjadi ${status}.`);
                setShowDetailModal(false);
                fetchData();
            } else {
                toast.dismiss(loadingId as string);
                modernToast("error", "Gagal Update", "Terjadi kesalahan saat menghubungi server.");
            }
        } catch (err) {
            toast.dismiss(loadingId as string);
            modernToast("error", "Koneksi Error", "Pastikan internet Anda stabil.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const statusFilters = ["ALL", "PENDING", "REVISION", "APPROVED", "REJECTED"];

    const fetchData = async () => {
        setLoading(true);
        try {
            if (viewMode === "FEED") {
                const res = await fetch("/api/officer/submissions");
                const data = await res.json();
                if (Array.isArray(data)) setSubmissions(data);
            } else {
                const res = await fetch("/api/officer/instructions/tracking");
                const data = await res.json();
                if (Array.isArray(data)) setTrackingData(data);
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Update URL to match current viewMode 
        const params = new URLSearchParams(searchParams.toString());
        params.set("view", viewMode);
        router.replace(`?${params.toString()}`, { scroll: false });
    }, [viewMode]);

    useEffect(() => {
        const subId = searchParams.get("submissionId");
        if (subId && submissions.length > 0) {
            const sub = submissions.find(s => s.id === subId);
            if (sub) {
                setViewMode("FEED");
                setSelectedSubmission(sub);
                setShowDetailModal(true);
            }
        }
    }, [submissions, searchParams]);

    // Filter logics
    const filteredSubmissions = submissions.filter((item) => {
        // Only apply search filter if query has 3+ characters
        const matchesSearch = searchQuery.length < 3 ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.author.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = activeFilter === "ALL" || item.status === activeFilter;
        const matchesSource = sourceFilter === "SEMUA" || item.source === sourceFilter;
        return matchesSearch && matchesStatus && matchesSource;
    });

    const filteredTracking = trackingData.filter((item) => {
        // Only apply search filter if query has 3+ characters
        const matchesSearch = searchQuery.length < 3 ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.assignees.some(name => name.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    // Pagination logic
    useEffect(() => {
        setCurrentPage(1);
    }, [viewMode, searchQuery, activeFilter, sourceFilter]);

    const paginatedSubmissions = filteredSubmissions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const paginatedTracking = filteredTracking.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const totalPages = Math.ceil(
        (viewMode === "FEED" ? filteredSubmissions.length : filteredTracking.length) / ITEMS_PER_PAGE
    );

    const getPageNumbers = () => {
        const pages: number[] = [];
        let start = currentPage - 2;
        let end = currentPage + 2;

        // Aturan Khusus: Jika di halaman 1, hanya tampilkan 3
        if (currentPage === 1) {
            start = 1;
            end = 3;
        }
        // Jika di halaman 2, tampilkan 4 (untuk transisi yang mulus ke window size 5)
        else if (currentPage === 2) {
            start = 1;
            end = 4;
        }

        // Batasi range sesuai total halaman yang ada
        if (start < 1) start = 1;
        if (end > totalPages) end = totalPages;

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const getStatusBadge = (status: Submission["status"]) => {
        const styles = {
            "Menunggu Review": "bg-yellow-100 text-yellow-700 border-yellow-200",
            "Selesai": "bg-emerald-100 text-emerald-700 border-emerald-200",
            "APPROVED": "bg-emerald-100 text-emerald-700 border-emerald-200",
            "REVISION": "bg-amber-100 text-amber-700 border-amber-200",
            "PENDING": "bg-blue-100 text-blue-700 border-blue-200",
            "REJECTED": "bg-red-100 text-red-700 border-red-200",
        };
        return styles[status] || "bg-gray-100 text-gray-700 border-gray-200";
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

    const formatStatus = (status: Submission["status"]) => {
        const mapping: { [key: string]: string } = {
            "PENDING": "Menunggu Review",
            "REVISION": "Revisi",
            "APPROVED": "Disetujui",
            "REJECTED": "Ditolak"
        };
        return mapping[status] || status;
    };

    const getSourceLabel = (source: string) => {
        return source === "INSTRUKSI" ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold uppercase tracking-wider">
                <ClipboardList className="h-3 w-3" />
                Instruksi
            </div>
        ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold uppercase tracking-wider">
                <Lightbulb className="h-3 w-3" />
                Inisiatif
            </div>
        );
    };

    const getTrackingStatusIcon = (status: string) => {
        switch (status) {
            case "Selesai": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case "Menunggu Review": return <Clock className="h-4 w-4 text-yellow-500" />;
            case "Perlu Revisi": return <AlertCircle className="h-4 w-4 text-orange-500" />;
            default: return <Clock className="h-4 w-4 text-gray-400" />;
        }
    };

    return (
        <DashboardLayout role="OFFICER">
            <div className="space-y-6">
                {/* Header - Responsive */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                            Manajemen Konten
                        </h1>
                        <p className="mt-1.5 text-xs sm:text-sm text-gray-500 font-medium">
                            {viewMode === "FEED"
                                ? "Kelola instruksi tugas dan inisiatif konten dari staff."
                                : "Pantau progres dari setiap instruksi yang telah diberikan."}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-3">
                        {/* View Switcher - Left of Button */}
                        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-full sm:w-auto order-1">
                            <button
                                onClick={() => setViewMode("FEED")}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${viewMode === "FEED"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Daftar Pengajuan</span>
                                <span className="sm:hidden">Pengajuan</span>
                            </button>
                            <button
                                onClick={() => setViewMode("TRACKING")}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${viewMode === "TRACKING"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                <ListTodo className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Tracking Tugas</span>
                                <span className="sm:hidden">Tracking</span>
                            </button>
                        </div>

                        {/* Create Button - Far Right */}
                        <button
                            onClick={() => router.push("/dashboard/officer/instruksi/create")}
                            className="flex items-center justify-center gap-2.5 w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest hover:from-red-700 hover:to-red-800 transition-all shadow-xl shadow-red-500/10 active:scale-[0.98] group order-2"
                        >
                            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                            <span>Buat Instruksi Baru</span>
                        </button>
                    </div>
                </div>

                {/* Filters View for FEED - Responsive */}
                {viewMode === "FEED" && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-md space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-col gap-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari judul atau pengirim..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                                />
                            </div>
                            <div className="flex bg-gray-100 p-1 rounded-xl w-full">
                                {(["SEMUA", "INSTRUKSI", "INISIATIF"] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setSourceFilter(tab)}
                                        className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${sourceFilter === tab
                                            ? "bg-white text-gray-900 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        {tab === "SEMUA" ? "Semua" : tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-50">
                            {statusFilters.map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all duration-200 ${activeFilter === filter
                                        ? "bg-red-600 text-white shadow-md shadow-red-500/25"
                                        : "bg-gray-50 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {filter === "ALL" ? "Semua" :
                                        filter === "PENDING" ? "Menunggu Review" :
                                            filter === "REVISION" ? "Revisi" :
                                                filter === "APPROVED" ? "Disetujui" :
                                                    filter === "REJECTED" ? "Ditolak" : filter}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters View for TRACKING - Responsive */}
                {viewMode === "TRACKING" && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari judul tugas atau staff..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                )}

                {/* Table Content - Responsive with horizontal scroll on mobile */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        {viewMode === "FEED" ? (
                                            <>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Judul Konten & Sumber</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Staff / Kreator</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tanggal</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Instruksi Tugas</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ditugaskan Kepada</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deadline</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progres Pengerjaan</th>
                                            </>
                                        )}
                                        <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium italic">
                                                Memuat data {viewMode === "FEED" ? "konten" : "instruksi"}...
                                            </td>
                                        </tr>
                                    ) : (viewMode === "FEED" ? filteredSubmissions : filteredTracking).length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <FileText className="h-12 w-12 text-gray-300 mb-3" />
                                                    <p className="text-gray-400 font-medium">Tidak ada data ditemukan</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : viewMode === "FEED" ? (
                                        paginatedSubmissions.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${item.source === 'INSTRUKSI' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' : 'bg-purple-50 text-purple-600 group-hover:bg-purple-100'}`}>
                                                            {item.source === 'INSTRUKSI' ? <ClipboardList className="h-5 w-5" /> : <Lightbulb className="h-5 w-5" />}
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <p className="font-bold text-gray-900 text-sm leading-none">{item.title}</p>
                                                            <div className="flex items-center gap-2">
                                                                {getSourceLabel(item.source)}
                                                                <span className="text-[11px] text-gray-400 font-medium">• {formatContentType(item.type)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-bold border border-gray-200">
                                                            {item.author.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <p className="text-sm font-bold text-gray-900">{item.author}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                        {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-sm ${getStatusBadge(item.status)}`}>
                                                        {formatStatus(item.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedSubmission(item as unknown as Submission);
                                                                setFeedback(item.notes || "");
                                                                setShowDetailModal(true);
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Lihat Detail"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        paginatedTracking.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-1 h-12 w-20 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-white overflow-hidden border border-gray-100 flex items-center justify-center flex-shrink-0 transition-all`}>
                                                            {item.thumbnail ? (
                                                                <img src={item.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <ImageIcon className="h-5 w-5" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                                                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono font-bold border border-gray-200">
                                                                    {item.id}
                                                                </span>
                                                            </div>
                                                            <span className={`text-[9px] font-black uppercase tracking-widest ${item.priority === 'HIGH' ? 'text-red-500' : item.priority === 'MEDIUM' ? 'text-orange-500' : 'text-blue-500'
                                                                }`}>
                                                                Priority: {item.priority}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 text-[10px] font-bold">
                                                            {item.assignees[0]?.split(' ').map(n => n[0]).join('') || '?'}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="text-sm font-bold text-gray-900">{item.assignees[0]}</p>
                                                            {item.assignees.length > 1 && (
                                                                <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[10px] font-black border border-red-100">
                                                                    {item.assignees.length - 1}+
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                            {new Date(item.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        {new Date(item.deadline) < new Date() && item.status !== "Selesai" && (
                                                            <span className="text-[10px] text-red-600 font-bold mt-1 animate-pulse">OVERDUE</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {getTrackingStatusIcon(item.status)}
                                                        <span className={`text-xs font-bold ${item.statusColor === 'green' ? 'text-emerald-700' :
                                                            item.statusColor === 'yellow' ? 'text-yellow-700' :
                                                                item.statusColor === 'orange' ? 'text-orange-700' :
                                                                    item.statusColor === 'red' ? 'text-red-700' : 'text-gray-500'
                                                            }`}>
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {/* Eye Icon - Active only when status is "Menunggu Review" */}
                                                        {item.status === "Menunggu Review" && item.submission ? (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedSubmission(item.submission as Submission);
                                                                    setFeedback(item.submission?.notes || "");
                                                                    setShowDetailModal(true);
                                                                }}
                                                                className="p-2 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-all shadow-md shadow-emerald-200"
                                                                title="Review & Approve Submission"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                disabled
                                                                className="p-2 text-gray-200 bg-gray-50 rounded-lg cursor-not-allowed"
                                                                title="Belum ada submission"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                        )}

                                                        {/* Edit Icon - Always active */}
                                                        <button
                                                            onClick={() => router.push(`/dashboard/officer/instruksi/edit/${item.id}`)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Edit & Lihat Detail Instruksi"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mt-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Halaman {currentPage} dari {totalPages}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="w-10 h-10 flex items-center justify-center rounded-xl border border-red-600 text-red-600 hover:bg-red-50 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>

                            {/* Page Numbers */}
                            <div className="flex items-center gap-2 mx-1">
                                {getPageNumbers().map((pageNum) => (
                                    <button
                                        key={`page-${pageNum}`}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === pageNum
                                            ? "bg-red-600 text-white shadow-lg shadow-red-200"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="w-10 h-10 flex items-center justify-center rounded-xl border border-red-600 text-red-600 hover:bg-red-50 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer Info - Responsive */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-widest px-2">
                    <p className="text-center sm:text-left">
                        Total <span className="text-gray-900">{(viewMode === "FEED" ? filteredSubmissions : filteredTracking).length}</span> {viewMode === "FEED" ? "Konten" : "Tugas"} Ditampilkan
                    </p>
                    <p className="text-center sm:text-right">© 2026 Syntel tracking module</p>
                </div>
            </div>

            {/* Submission Detail Modal */}
            <AnimatePresence>
                {showDetailModal && selectedSubmission && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDetailModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-200"
                        >
                            {/* Modal Header */}
                            <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center shadow-inner">
                                        <FileText className="h-7 w-7 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Review Pengajuan</h3>
                                        <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-[0.2em] font-mono">{selectedSubmission.id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="p-3 hover:bg-red-50 rounded-full transition-all group"
                                >
                                    <X className="h-6 w-6 text-gray-300 group-hover:text-red-600 group-hover:rotate-90 transition-all" />
                                </button>
                            </div>

                            <div className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-10 mb-10">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Judul Materi</p>
                                        <p className="text-xl font-black text-gray-900 leading-tight">{selectedSubmission.title}</p>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Dikirim Oleh</p>
                                        <div className="flex items-center gap-3 bg-gray-50/50 p-2 pr-4 rounded-2xl border border-gray-100/50 inline-flex">
                                            <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center text-xs text-white font-black shadow-lg">
                                                {selectedSubmission.author.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <p className="text-sm font-black text-gray-800">{selectedSubmission.author}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {/* Description Section */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Deskripsi / Caption</p>
                                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-sm text-gray-600 leading-relaxed font-medium italic">
                                            {selectedSubmission.description || "Tidak ada deskripsi tambahan."}
                                        </div>
                                    </div>

                                    {/* Hasil Video / Tugas Preview */}
                                    {selectedSubmission.fileUrl && (
                                        <div className="space-y-4 pt-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Hasil Video / Media Tugas</p>
                                                <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-widest">{selectedSubmission.type}</span>
                                            </div>

                                            {/* Advanced Media Container */}
                                            <div className="relative group rounded-[2.5rem] overflow-hidden border-8 border-gray-50 shadow-2xl bg-black aspect-video flex items-center justify-center transition-transform hover:scale-[1.01] duration-500">
                                                {selectedSubmission.fileUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                                                    <video
                                                        src={selectedSubmission.fileUrl}
                                                        controls
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <img
                                                        src={selectedSubmission.fileUrl}
                                                        alt="Submission Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}

                                                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                                    <a
                                                        href={selectedSubmission.fileUrl}
                                                        target="_blank"
                                                        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/30 transition-all"
                                                    >
                                                        <ExternalLink className="h-3 w-3" /> Full View
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Feedback Section */}
                                    <div className="pt-6 border-t border-gray-100 space-y-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <MessageSquare className="h-4 w-4 text-red-600" />
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Berikan Feedback / Catatan</p>
                                        </div>
                                        <textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="Tuliskan catatan revisi atau alasan penolakan di sini..."
                                            className="w-full h-36 p-6 bg-white border-2 border-dashed border-gray-100 rounded-[2rem] text-sm font-medium focus:border-red-500 focus:bg-gray-50/30 transition-all resize-none placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="px-10 py-8 bg-gray-50/80 backdrop-blur-md border-t border-gray-100 flex items-center justify-center">
                                {selectedSubmission.status === "APPROVED" ? (
                                    // If already approved, show only "Batalkan Persetujuan" button
                                    <button
                                        onClick={() => handleUpdateStatus("PENDING")}
                                        disabled={isSubmitting}
                                        className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:from-orange-600 hover:to-orange-700 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center gap-3 group active:scale-95"
                                    >
                                        <AlertCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                        Batalkan Persetujuan
                                    </button>
                                ) : (
                                    // For OTHER statuses
                                    <div className="flex items-center gap-10">
                                        <button
                                            onClick={() => handleUpdateStatus("REVISION")}
                                            disabled={isSubmitting}
                                            className="px-8 py-4 bg-orange-100 text-orange-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-orange-200 hover:-translate-y-1 transition-all disabled:opacity-50 active:scale-95"
                                        >
                                            Revisi
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus("APPROVED")}
                                            disabled={isSubmitting}
                                            className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-xl shadow-emerald-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:from-emerald-600 hover:to-green-700 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center gap-3 group active:scale-95"
                                        >
                                            <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                            Approved
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
