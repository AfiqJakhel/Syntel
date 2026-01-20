"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/app/components/dashboard/layout/DashboardLayout";
import { UserCheck, UserX, Search, Filter, Check, X, Info, RefreshCw } from "lucide-react";
import { cn } from "@/app/lib/utils";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface User {
    nip: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    createdAt: string;
}

const ITEMS_PER_PAGE = 10;

export default function AccountVerificationPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/officer/verify");
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch (err) {
            console.error(err);
            modernToast("error", "Gagal Sinkron", "Koneksi ke server verifikasi terputus.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

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
                className={`max-w-md w-full border-2 shadow-[0_20px_60px_rgba(0,0,0,0.1)] rounded-[2.5rem] pointer-events-auto flex overflow-hidden backdrop-blur-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all ${type === 'success' ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' :
                    type === 'info' || type === 'error' ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300' :
                        'bg-white/90 border-gray-100'
                    }`}
            >
                <div className="flex-1 p-5">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                            <div className="relative">
                                {/* Glow Effect */}
                                <div className={`absolute inset-0 rounded-full blur-md opacity-40 animate-pulse ${type === 'success' ? 'bg-emerald-400' :
                                    type === 'info' || type === 'error' ? 'bg-red-500' :
                                        'bg-gray-400'
                                    }`}></div>
                                <div className={`relative h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-transform ${type === 'success' ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
                                    type === 'info' || type === 'error' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                                        'bg-gray-800'
                                    }`}>
                                    {type === 'success' ? <Check className="h-6 w-6 text-white" strokeWidth={3} /> :
                                        type === 'info' || type === 'error' ? <X className="h-6 w-6 text-white" strokeWidth={3} /> :
                                            <RefreshCw className="h-6 w-6 text-white animate-spin" />}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className={`text-base font-black tracking-tight ${type === 'success' ? 'text-emerald-900' :
                                type === 'info' || type === 'error' ? 'text-red-900' :
                                    'text-gray-900'
                                }`}>
                                {title}
                            </p>
                            <p className={`text-sm font-bold mt-0.5 leading-relaxed ${type === 'success' ? 'text-emerald-700' :
                                type === 'info' || type === 'error' ? 'text-red-700' :
                                    'text-gray-500'
                                }`}>
                                {description || "Sistem telah diperbarui secara real-time."}
                            </p>
                        </div>
                    </div>
                </div>
                <div className={`flex border-l ${type === 'success' ? 'border-emerald-100' :
                    type === 'info' || type === 'error' ? 'border-red-100' :
                        'border-gray-100'
                    }`}>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className={`px-6 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-colors ${type === 'success' ? 'text-emerald-400 hover:text-emerald-600' :
                            type === 'info' || type === 'error' ? 'text-red-500 hover:text-red-700' :
                                'text-gray-300 hover:text-gray-500'
                            }`}
                    >
                        Tutup
                    </button>
                </div>
            </motion.div>
        ), { duration: 5000 });
    };

    const handleVerify = async (nip: string) => {
        const user = users.find((u) => u.nip === nip);
        const loadingId = modernToast("loading", "Verifikasi Akun", `Memproses pendaftaran ${user?.firstName}...`);

        try {
            const res = await fetch("/api/officer/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nip, action: "verify" }),
            });

            toast.dismiss(loadingId as string);

            if (res.ok) {
                setUsers(users.filter((u) => u.nip !== nip));
                modernToast(
                    "success",
                    "Berhasil Diverifikasi",
                    `Akun ${user?.firstName} ${user?.lastName} kini resmi menjadi bagian dari Syntel.`
                );
            } else {
                modernToast("error", "Verifikasi Gagal", "Terjadi error pada gateway verifikasi.");
            }
        } catch (err) {
            toast.dismiss(loadingId as string);
            modernToast("error", "Kesalahan Sistem", "Gagal menghubungi modul otorisasi.");
        }
    };

    const handleReject = async (nip: string) => {
        const user = users.find((u) => u.nip === nip);
        const loadingId = modernToast("loading", "Penolakan Akun", `Menghapus permintaan ${user?.firstName}...`);

        try {
            const res = await fetch("/api/officer/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nip, action: "reject" }),
            });

            toast.dismiss(loadingId as string);

            if (res.ok) {
                setUsers(users.filter((u) => u.nip !== nip));
                modernToast(
                    "info",
                    "Pendaftaran Ditolak",
                    `Akses untuk ${user?.firstName} ${user?.lastName} tidak disetujui.`
                );
            } else {
                modernToast("error", "Aksi Gagal", "Gagal memproses penolakan akun.");
            }
        } catch (err) {
            toast.dismiss(loadingId as string);
            modernToast("error", "Network Error", "Masalah koneksi saat memproses penolakan.");
        }
    };

    // Filter users based on search query
    const filteredUsers = users.filter((user) => {
        // Only apply search filter if query has 3+ characters
        if (searchQuery.length < 3) return true;

        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const query = searchQuery.toLowerCase();
        return (
            fullName.includes(query) ||
            user.nip.includes(query) ||
            user.username.toLowerCase().includes(query)
        );
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    // Reset to page 1 when search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    return (
        <DashboardLayout role="OFFICER">
            <div className="mb-8 text-center sm:text-left px-4 sm:px-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Verifikasi Akun</h1>
                <p className="mt-2 text-sm sm:text-base text-gray-500 font-medium max-w-2xl mx-auto sm:mx-0">
                    Kelola pendaftaran akun baru dan verifikasi identitas pegawai.
                </p>
            </div>

            <div className="rounded-2xl bg-white shadow-md border border-gray-200 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 p-4 md:p-6 gap-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 max-w-2xl">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari berdasarkan nama atau NIP..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl bg-gray-50 pl-10 pr-4 py-2 text-sm border-transparent focus:bg-white focus:border-red-200 outline-none transition-all border border-transparent shadow-sm"
                            />
                        </div>
                        <button className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                            <Filter className="h-4 w-4" />
                            Filter
                        </button>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-gray-500 bg-gray-50 sm:bg-transparent p-2 sm:p-0 rounded-lg text-center">
                        Total <span className="text-red-600 font-bold">{filteredUsers.length}</span> Permintaan
                    </p>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="py-10 text-center text-sm text-gray-500">
                            Memuat data...
                        </div>
                    ) : currentUsers.length === 0 ? (
                        <div className="py-10 text-center text-sm text-gray-500">
                            {searchQuery ? "Tidak ada hasil yang ditemukan." : "Tidak ada permintaan verifikasi saat ini."}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {currentUsers.map((user) => (
                                <div
                                    key={user.nip}
                                    className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 hover:shadow-lg hover:shadow-gray-100 transition-all duration-300 group"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        {/* Left Section - User Info */}
                                        <div className="flex items-start md:items-center gap-4 flex-1">
                                            {/* Avatar */}
                                            <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center text-red-600 font-bold text-base flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                                {user.firstName[0]}{user.lastName[0]}
                                            </div>

                                            {/* User Details Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 flex-1">
                                                {/* Pegawai */}
                                                <div className="min-w-0">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 group-hover:text-red-400 transition-colors">
                                                        Pegawai
                                                    </p>
                                                    <p className="text-sm font-black text-gray-900 leading-tight truncate">
                                                        {user.firstName} {user.lastName}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 mt-1 font-medium truncate">{user.email}</p>
                                                </div>

                                                {/* NIP */}
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                                        NIP
                                                    </p>
                                                    <p className="text-sm font-mono font-bold text-gray-700 bg-gray-50 px-2 py-0.5 rounded-lg inline-block">{user.nip}</p>
                                                </div>

                                                {/* Username */}
                                                <div className="min-w-0">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                                        Username
                                                    </p>
                                                    <p className="text-sm font-bold text-gray-600 truncate italic">@{user.username}</p>
                                                </div>

                                                {/* Tanggal Daftar */}
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                                        Tanggal Daftar
                                                    </p>
                                                    <p className="text-sm font-bold text-gray-600">
                                                        {new Date(user.createdAt).toLocaleDateString("id-ID", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Section - Actions */}
                                        <div className="flex items-center gap-3 pt-4 lg:pt-0 lg:pl-6 border-t lg:border-t-0 lg:border-l border-gray-50 flex-wrap sm:flex-nowrap">
                                            <button
                                                onClick={() => handleVerify(user.nip)}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-emerald-100"
                                            >
                                                <UserCheck className="h-4 w-4" />
                                                Verify
                                            </button>
                                            <button
                                                onClick={() => handleReject(user.nip)}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-red-50 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[#E30613] hover:bg-[#E30613] hover:text-white transition-all duration-300 shadow-sm hover:shadow-red-100"
                                            >
                                                <UserX className="h-4 w-4" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="border-t border-gray-200 p-6 flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                        Halaman {currentPage} dari {totalPages || 1}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            className={cn(
                                "px-3 py-1 text-xs font-bold border rounded-lg transition-colors",
                                currentPage === 1
                                    ? "text-gray-400 border-gray-100 cursor-not-allowed"
                                    : "text-gray-600 border-gray-200 hover:bg-gray-50"
                            )}
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className={cn(
                                "px-3 py-1 text-xs font-bold border rounded-lg transition-colors",
                                currentPage === totalPages || totalPages === 0
                                    ? "text-gray-400 border-gray-100 cursor-not-allowed"
                                    : "text-gray-600 border-gray-200 hover:bg-gray-50"
                            )}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
