"use client";

import React, { useState, useEffect } from "react";
import { Bell, Settings, Plus, Users, RefreshCw, Clock, Check, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    link: string | null;
    createdAt: string;
}

interface DashboardNavbarProps {
    onLogout: () => void;
    role?: "STAFF" | "OFFICER";
}

export function DashboardNavbar({ onLogout, role = "STAFF" }: DashboardNavbarProps) {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
            console.log("[NAVBAR] No user found in localStorage");
            return;
        }

        try {
            const user = JSON.parse(userStr);
            console.log(`[NAVBAR] Fetching notifications for NIP: ${user.nip}`);
            const res = await fetch(`/api/notifications?nip=${user.nip}`);
            if (res.ok) {
                const data = await res.json();
                console.log(`[NAVBAR] Received ${data.length} notifications`);
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
            } else {
                console.error(`[NAVBAR] Fetch failed with status: ${res.status}`);
            }
        } catch (error) {
            console.error("[NAVBAR] Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications?id=${id}`, { method: "PATCH" });
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const user = JSON.parse(userStr);

        try {
            await fetch(`/api/notifications?nip=${user.nip}`, { method: "PATCH" });
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "SUBMISSION_NEW": return <Plus className="h-4 w-4" strokeWidth={3} />;
            case "INSTRUCTION_URGENT": return <Bell className="h-4 w-4" strokeWidth={3} />;
            case "SUBMISSION_REVISION": return <RefreshCw className="h-4 w-4" strokeWidth={3} />;
            case "USER_VERIFICATION": return <Users className="h-4 w-4" strokeWidth={3} />;
            default: return <Bell className="h-4 w-4" strokeWidth={3} />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case "SUBMISSION_NEW": return "bg-emerald-50 text-emerald-600";
            case "INSTRUCTION_URGENT": return "bg-red-50 text-red-600";
            case "SUBMISSION_REVISION": return "bg-orange-50 text-orange-600";
            case "USER_VERIFICATION": return "bg-blue-50 text-blue-600";
            default: return "bg-gray-50 text-gray-600";
        }
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 md:h-24 items-center justify-between bg-white/80 px-4 md:px-12 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
            {/* Left side */}
            <div className="hidden md:flex flex-col">
                <span className="text-sm font-black uppercase tracking-widest text-red-600 mb-1">Portal Syntel</span>
                <span className="text-sm font-bold text-gray-400">Dashboard / {role}</span>
            </div>

            <div className="flex items-center gap-2 md:gap-6 w-full md:w-auto justify-end">
                {role === "OFFICER" && (
                    <button
                        onClick={() => router.push("/dashboard/officer/instruksi/create")}
                        className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-black text-white shadow-[0_10px_20px_-5px_rgba(220,38,38,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(220,38,38,0.4)] transition-all hover:-translate-y-1 active:translate-y-0 active:scale-95"
                    >
                        <Plus className="h-4 w-4 md:h-5 md:w-5" strokeWidth={3} />
                        <span className="hidden sm:inline">Buat Instruksi</span>
                    </button>
                )}

                <div className="hidden md:block h-10 w-px bg-gray-100 mx-2" />

                <div className="flex items-center gap-1 md:gap-3">
                    {/* Notifications Dropdown */}
                    <div className="relative group/notif">
                        <button className="relative rounded-2xl p-2 md:p-3 text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-all active:scale-90 group">
                            <Bell className="h-5 w-5 md:h-6 md:w-6 transition-transform group-hover:rotate-12" />
                            {unreadCount > 0 && (
                                <span className="absolute right-2.5 top-2.5 md:right-3.5 md:top-3.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white ring-4 ring-red-500/10" />
                            )}
                        </button>

                        <div className="absolute right-0 mt-4 w-80 md:w-96 origin-top-right scale-95 opacity-0 invisible group-hover/notif:scale-100 group-hover/notif:opacity-100 group-hover/notif:visible transition-all duration-300 z-50">
                            <div className="rounded-[2.5rem] border border-gray-100 bg-white shadow-2xl shadow-gray-200/50 backdrop-blur-xl overflow-hidden">
                                <div className="bg-gradient-to-br from-red-600 to-red-700 p-6 text-white">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-sm font-black uppercase tracking-widest">Notifikasi</h3>
                                        <div className="flex items-center gap-3">
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                                                    className="text-[9px] font-bold bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                                                >
                                                    <Check className="h-2.5 w-2.5" /> Tandai Terbaca
                                                </button>
                                            )}
                                            <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold">{unreadCount} Baru</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-red-100 font-medium tracking-tight">Pembaruan sistem & pengajuan staff Anda</p>
                                </div>

                                <div className="max-h-[24rem] overflow-y-auto p-2 space-y-1">
                                    {notifications.length > 0 ? (
                                        notifications.slice(0, 5).map((notif) => (
                                            <button
                                                key={notif.id}
                                                onClick={() => {
                                                    if (!notif.isRead) markAsRead(notif.id);
                                                    if (notif.link) router.push(notif.link);
                                                }}
                                                className={`w-full flex gap-4 p-4 rounded-[1.5rem] transition-all text-left group/item items-start ${notif.isRead ? 'hover:bg-gray-50 opacity-60' : 'bg-red-50/30 hover:bg-red-50/50 shadow-sm'}`}
                                            >
                                                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover/item:scale-110 ${getColor(notif.type)}`}>
                                                    {getIcon(notif.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className={`text-xs leading-relaxed ${!notif.isRead ? 'font-black text-gray-900' : 'font-bold text-gray-500'}`}>
                                                            {notif.title}
                                                        </p>
                                                        {!notif.isRead && <span className="h-2 w-2 rounded-full bg-red-500 mt-1" />}
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 font-medium mb-1.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                                                    <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-black uppercase tracking-wider">
                                                        <Clock className="h-2.5 w-2.5" />
                                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: id })}
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-12 text-center">
                                            <Bell className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                                            <p className="text-xs font-bold text-gray-400">Belum ada notifikasi baru</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                                    <Link
                                        href={`/dashboard/${role.toLowerCase()}/notifications`}
                                        className="w-full h-10 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-red-600 hover:bg-white border-2 border-transparent hover:border-red-50 transition-all group/seeall"
                                    >
                                        Lihat Semua Notifikasi
                                        <ChevronRight className="h-3 w-3 group-hover/seeall:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings & Logout */}
                    <div className="relative group">
                        <button className="rounded-2xl p-2 md:p-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-90">
                            <Settings className="h-5 w-5 md:h-6 md:w-6" />
                        </button>
                        <div className="absolute right-0 mt-4 w-56 origin-top-right scale-95 opacity-0 invisible group-hover:scale-100 group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                            <div className="rounded-[2rem] border border-gray-100 bg-white p-3 shadow-2xl shadow-gray-200/50 backdrop-blur-xl">
                                <div className="px-4 py-3 mb-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pengaturan</p>
                                </div>
                                <Link
                                    href={`/dashboard/${role.toLowerCase()}/settings`}
                                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all hover:translate-x-1 outline-none"
                                >
                                    <div className="p-2 bg-gray-100 rounded-xl group-hover:bg-white transition-colors">
                                        <Settings className="h-4 w-4" />
                                    </div>
                                    Akun Saya
                                </Link>
                                <div className="my-2 border-t border-gray-50"></div>
                                <button
                                    onClick={onLogout}
                                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-red-600 hover:bg-red-50 transition-all hover:translate-x-1 outline-none"
                                >
                                    <div className="p-2 bg-red-100 rounded-xl">
                                        <Plus className="h-4 w-4 rotate-45" strokeWidth={3} />
                                    </div>
                                    Keluar Sesi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
