"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/app/components/dashboard/layout/DashboardLayout";
import {
    Bell,
    Search,
    Filter,
    Check,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Users,
    Clock,
    Trash2,
    CheckCircle2,
    ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    link: string | null;
    createdAt: string;
}

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<"ALL" | "UNREAD">("ALL");

    const fetchNotifications = async () => {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;

        try {
            const user = JSON.parse(userStr);
            const res = await fetch(`/api/notifications?nip=${user.nip}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            toast.error("Gagal memuat notifikasi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications?id=${id}`, { method: "PATCH" });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const markAllAsRead = async () => {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const user = JSON.parse(userStr);

        try {
            const res = await fetch(`/api/notifications?nip=${user.nip}`, { method: "PATCH" });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                toast.success("Semua notifikasi ditandai sebagai terbaca.");
            }
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
                toast.success("Notifikasi dihapus.");
            }
        } catch (error) {
            console.error("Error deleting notification:", error);
            toast.error("Gagal menghapus notifikasi.");
        }
    };

    const clearAllNotifications = async () => {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const user = JSON.parse(userStr);

        if (!confirm("Hapus semua notifikasi?")) return;

        try {
            const res = await fetch(`/api/notifications?nip=${user.nip}`, { method: "DELETE" });
            if (res.ok) {
                setNotifications([]);
                toast.success("Semua notifikasi dibersihkan.");
            }
        } catch (error) {
            console.error("Error clearing notifications:", error);
            toast.error("Gagal membersihkan notifikasi.");
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "SUBMISSION_NEW": return <Plus className="h-5 w-5" />;
            case "INSTRUCTION_URGENT": return <Bell className="h-5 w-5" />;
            case "SUBMISSION_REVISION": return <RefreshCw className="h-5 w-5" />;
            case "USER_VERIFICATION": return <Users className="h-5 w-5" />;
            default: return <Bell className="h-5 w-5" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case "SUBMISSION_NEW": return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case "INSTRUCTION_URGENT": return "bg-red-50 text-red-600 border-red-100";
            case "SUBMISSION_REVISION": return "bg-orange-50 text-orange-600 border-orange-100";
            case "USER_VERIFICATION": return "bg-blue-50 text-blue-600 border-blue-100";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.message.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === "ALL" ? true : !n.isRead;
        return matchesSearch && matchesFilter;
    });

    return (
        <DashboardLayout role="OFFICER">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-400 hover:text-red-600 transition-colors mb-4 group"
                        >
                            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Kembali ke Dashboard</span>
                        </button>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Pusat Notifikasi</h1>
                        <p className="text-sm font-bold text-gray-400 mt-2">Kelola semua aktivitas dan pemberitahuan sistem Anda</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-100 rounded-2xl text-xs font-black text-gray-600 hover:border-red-600 hover:text-red-600 transition-all shadow-sm active:scale-95"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Tandai Semua Terbaca
                        </button>
                        <button
                            onClick={clearAllNotifications}
                            className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 border-2 border-red-100 rounded-2xl text-xs font-black hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                        >
                            <Trash2 className="h-4 w-4" />
                            Kosongkan
                        </button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white rounded-[2.5rem] p-4 border-2 border-gray-100 shadow-xl shadow-gray-200/20 mb-8 flex flex-col md:flex-row items-center gap-4">
                    <div className="flex bg-gray-50 p-1.5 rounded-2xl w-full md:w-auto">
                        <button
                            onClick={() => setActiveFilter("ALL")}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeFilter === "ALL" ? "bg-white text-red-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            Semua
                        </button>
                        <button
                            onClick={() => setActiveFilter("UNREAD")}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeFilter === "UNREAD" ? "bg-white text-red-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            Belum Terbaca
                        </button>
                    </div>

                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                        <input
                            type="text"
                            placeholder="Cari kata kunci notifikasi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-3 bg-gray-50 border-2 border-transparent focus:border-red-100 focus:bg-white rounded-2xl text-sm font-bold text-gray-600 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-20 text-center">
                            <RefreshCw className="h-10 w-10 text-red-600 animate-spin mx-auto mb-4" />
                            <p className="text-sm font-bold text-gray-400">Menyinkronkan dengan server...</p>
                        </div>
                    ) : filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notif, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={notif.id}
                                onClick={() => {
                                    if (!notif.isRead) markAsRead(notif.id);
                                    if (notif.link) router.push(notif.link);
                                }}
                                className={`group relative bg-white border-2 rounded-[2rem] p-6 transition-all cursor-pointer hover:shadow-2xl hover:shadow-red-200/20 active:scale-[0.99] flex flex-col md:flex-row gap-6 items-start md:items-center ${notif.isRead ? 'border-gray-50 opacity-80' : 'border-red-100 bg-red-50/10'}`}
                            >
                                {/* Left Icon */}
                                <div className={`h-16 w-16 rounded-[1.5rem] border-2 flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 group-hover:rotate-3 ${getColor(notif.type)}`}>
                                    {getIcon(notif.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className={`text-lg tracking-tight ${!notif.isRead ? 'font-black text-gray-900' : 'font-bold text-gray-500'}`}>
                                            {notif.title}
                                        </h3>
                                        {!notif.isRead && (
                                            <span className="px-2.5 py-1 bg-red-600 text-[8px] font-black text-white uppercase tracking-widest rounded-full animate-pulse">Baru</span>
                                        )}
                                    </div>
                                    <p className={`text-sm leading-relaxed mb-4 ${!notif.isRead ? 'text-gray-600 font-bold' : 'text-gray-400 font-medium'}`}>
                                        {notif.message}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                                            <Clock className="h-3 w-3 text-gray-400" />
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">
                                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: id })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                                            <Bell className="h-3 w-3 text-gray-400" />
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">
                                                {notif.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 self-end md:self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!notif.isRead && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                            className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl border-2 border-emerald-100 transition-all active:scale-90"
                                            title="Tandai Terbaca"
                                        >
                                            <Check className="h-5 w-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                        className="p-3 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-2xl border-2 border-gray-100 transition-all active:scale-90"
                                        title="Hapus Notifikasi"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="bg-white rounded-[3rem] border-2 border-dashed border-gray-200 p-24 text-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Bell className="h-10 w-10 text-gray-200" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">Tidak ada notifikasi ditemukan</h3>
                            <p className="text-gray-400 font-bold max-w-sm mx-auto">
                                Coba sesuaikan kata kunci pencarian atau filter Anda untuk melihat notifikasi lain.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
