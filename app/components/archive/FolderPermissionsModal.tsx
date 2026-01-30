"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Users, Check, Loader2, Shield, Eye, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

interface Staff {
    nip: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
}

interface Permission {
    id: string;
    staffNip: string;
    accessLevel: "VIEW_ONLY" | "FULL_ACCESS";
    staff: {
        nip: string;
        firstName: string;
        lastName: string;
        username: string;
    };
}

interface FolderPermissionsModalProps {
    folderId: string;
    folderName: string;
    onClose: () => void;
    currentUserNip: string;
}

export function FolderPermissionsModal({
    folderId,
    folderName,
    onClose,
    currentUserNip
}: FolderPermissionsModalProps) {
    const [allStaff, setAllStaff] = useState<Staff[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingStaff, setUpdatingStaff] = useState<Set<string>>(new Set());

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
                className={`max-w-md w-full border-2 shadow-[0_20px_60px_rgba(0,0,0,0.1)] rounded-[2.5rem] pointer-events-auto flex overflow-hidden backdrop-blur-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform ${type === 'success' ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' :
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

    // Fetch staff and permissions
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [staffRes, permRes] = await Promise.all([
                    fetch("/api/users/staff"),
                    fetch(`/api/archive/permissions?folderId=${folderId}`)
                ]);

                const staffData = await staffRes.json();
                const permData = await permRes.json();

                setAllStaff(staffData.staff || []);
                setPermissions(permData.permissions || []);
            } catch (error) {
                console.error("Error fetching data:", error);
                modernToast("error", "Gagal Memuat", "Data staff dan izin tidak dapat disinkronkan.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [folderId]);

    const getStaffAccessLevel = (staffNip: string): "VIEW_ONLY" | "FULL_ACCESS" => {
        const perm = permissions.find(p => p.staffNip === staffNip);
        // Default adalah VIEW_ONLY jika tidak ada permission record
        return perm?.accessLevel || "VIEW_ONLY";
    };

    const toggleFullAccess = async (staffNip: string) => {
        const currentLevel = getStaffAccessLevel(staffNip);
        const newLevel = currentLevel === "FULL_ACCESS" ? "VIEW_ONLY" : "FULL_ACCESS";

        setUpdatingStaff(prev => new Set(prev).add(staffNip));

        try {
            if (newLevel === "VIEW_ONLY") {
                // Remove permission (kembali ke default VIEW_ONLY)
                const perm = permissions.find(p => p.staffNip === staffNip);
                if (perm) {
                    await fetch(`/api/archive/permissions?id=${perm.id}`, {
                        method: "DELETE"
                    });
                    setPermissions(prev => prev.filter(p => p.staffNip !== staffNip));
                    modernToast("info", "Akses Diperbarui", "Akses staff telah dikembalikan ke View Only.");
                }
            } else {
                // Add/Update to FULL_ACCESS
                const res = await fetch("/api/archive/permissions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        folderId,
                        staffNip,
                        accessLevel: "FULL_ACCESS",
                        grantedById: currentUserNip
                    })
                });

                const data = await res.json();
                if (res.ok) {
                    setPermissions(prev => {
                        const existing = prev.find(p => p.staffNip === staffNip);
                        if (existing) {
                            return prev.map(p => p.staffNip === staffNip ? data.permission : p);
                        }
                        return [...prev, data.permission];
                    });
                    modernToast("success", "Akses Diberikan", "Full Access telah berhasil diaktifkan untuk staff ini.");
                }
            }
        } catch (error) {
            console.error("Error toggling access:", error);
            modernToast("error", "Simpan Gagal", "Gagal memperbarui izin akses ke database.");
        } finally {
            setUpdatingStaff(prev => {
                const newSet = new Set(prev);
                newSet.delete(staffNip);
                return newSet;
            });
        }
    };

    const fullAccessCount = permissions.filter(p => p.accessLevel === "FULL_ACCESS").length;
    const allHaveFullAccess = allStaff.length > 0 && fullAccessCount === allStaff.length;

    const handleCheckAll = async () => {
        const loadingToast = modernToast("loading", "Memproses Akses", "Menyinkronkan izin seluruh staff...");

        try {
            if (allHaveFullAccess) {
                // Remove all permissions (back to VIEW_ONLY)
                await Promise.all(
                    permissions.map(perm =>
                        fetch(`/api/archive/permissions?id=${perm.id}`, {
                            method: "DELETE"
                        })
                    )
                );
                setPermissions([]);
                modernToast("info", "Reset Selesai", "Semua staff telah dikembalikan ke akses View Only.");
            } else {
                // Give FULL_ACCESS to all staff
                const newPermissions = await Promise.all(
                    allStaff.map(async (staff) => {
                        const res = await fetch("/api/archive/permissions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                folderId,
                                staffNip: staff.nip,
                                accessLevel: "FULL_ACCESS",
                                grantedById: currentUserNip
                            })
                        });
                        const data = await res.json();
                        return data.permission;
                    })
                );
                setPermissions(newPermissions);
                modernToast("success", "Akses Massal Berhasil", `Full Access telah diberikan ke ${allStaff.length} staff.`);
            }
        } catch (error) {
            console.error("Error in check all:", error);
            modernToast("error", "Proses Gagal", "Terjadi kesalahan saat memperbarui akses massal.");
        } finally {
            toast.dismiss(loadingToast);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[300] flex items-center justify-center p-4"
            >
                {/* Background Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Premium Header Banner */}
                    <div className="h-32 bg-gradient-to-br from-[#7F0000] to-[#E30613] relative overflow-hidden flex-shrink-0">
                        {/* Decorative Patterns */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
                        </div>

                        <div className="absolute inset-0 flex items-center justify-between px-10">
                            <div className="flex items-center gap-6">
                                <div className="h-20 w-20 bg-white/20 backdrop-blur-xl rounded-[2rem] border border-white/30 flex items-center justify-center shadow-2xl">
                                    <Shield className="h-10 w-10 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
                                        Kelola Hak Akses
                                    </h2>
                                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em] mt-2">
                                        {folderName}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 bg-black/20 hover:bg-black/40 text-white rounded-2xl transition-all backdrop-blur-md"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-10 overflow-y-auto custom-scrollbar space-y-8 flex-1">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-[#E30613]" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sinkronisasi Izin...</p>
                            </div>
                        ) : (
                            <>
                                {/* Info Box Premium */}
                                <div className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 relative group overflow-hidden transition-all hover:shadow-xl hover:shadow-gray-100">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-50 transition-transform group-hover:scale-110">
                                            <Eye className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">
                                                Status Akses Default
                                            </p>
                                            <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase">
                                                Semua staff diberikan <span className="text-[#E30613] font-black">View Only</span> secara otomatis. Aktifkan toggle untuk memberikan izin penuh (tambah/hapus aset).
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Controls & Stats */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-2 bg-gray-50/50 rounded-[2.5rem] border border-gray-100">
                                    <div className="flex items-center gap-2 pl-6">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                            {fullAccessCount} / {allStaff.length} Staff Full Access
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="hidden lg:flex items-center gap-4 px-6 border-r border-gray-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-gray-300" />
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tight font-black">View Only</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tight font-black">Full Access</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleCheckAll}
                                            className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${allHaveFullAccess
                                                ? "bg-gray-900 text-white hover:bg-black shadow-gray-200"
                                                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/30"
                                                }`}
                                        >
                                            {allHaveFullAccess ? "Reset Semua" : "Pilih Semua"}
                                        </button>
                                    </div>
                                </div>

                                {/* Staff List Grid */}
                                <div className="grid grid-cols-1 gap-3">
                                    {allStaff.map(staff => {
                                        const accessLevel = getStaffAccessLevel(staff.nip);
                                        const isFullAccess = accessLevel === "FULL_ACCESS";
                                        const isUpdating = updatingStaff.has(staff.nip);

                                        return (
                                            <div
                                                key={staff.nip}
                                                className={`group p-5 rounded-[2.2rem] border-2 transition-all hover:shadow-2xl hover:shadow-gray-100 ${isFullAccess
                                                    ? "border-emerald-100 bg-emerald-50/20"
                                                    : "border-gray-50 bg-white"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${isFullAccess
                                                            ? "bg-emerald-100 text-emerald-600"
                                                            : "bg-gray-50 text-gray-300 group-hover:bg-gray-100"
                                                            }`}>
                                                            {isFullAccess ? (
                                                                <Shield className="h-6 w-6" />
                                                            ) : (
                                                                <Eye className="h-6 w-6" />
                                                            )}
                                                        </div>

                                                        <div>
                                                            <p className="text-sm font-black text-gray-900 tracking-tight">
                                                                {staff.firstName} {staff.lastName}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                                    ID: {staff.nip}
                                                                </span>
                                                                <span className="w-1 h-1 rounded-full bg-gray-200" />
                                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isFullAccess ? 'text-emerald-500' : 'text-gray-400'}`}>
                                                                    {isFullAccess ? 'Full Access' : 'View Only'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => toggleFullAccess(staff.nip)}
                                                        disabled={isUpdating}
                                                        className={`relative inline-flex h-10 w-18 p-1.5 items-center rounded-full transition-all duration-500 ${isFullAccess
                                                            ? "bg-emerald-600 shadow-lg shadow-emerald-500/20"
                                                            : "bg-gray-200"
                                                            } disabled:opacity-50`}
                                                    >
                                                        <span
                                                            className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-xl transition-transform duration-500 flex items-center justify-center ${isFullAccess ? "translate-x-9" : "translate-x-0"
                                                                }`}
                                                        >
                                                            {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
