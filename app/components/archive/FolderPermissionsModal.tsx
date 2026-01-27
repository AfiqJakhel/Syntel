"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Users, Check, Loader2, Shield, Eye } from "lucide-react";
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
                toast.error("Gagal memuat data");
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
                    toast.success("Akses dikembalikan ke View Only");
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
                    toast.success("Full Access diberikan");
                }
            }
        } catch (error) {
            console.error("Error toggling access:", error);
            toast.error("Gagal mengubah akses");
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
        const loadingToast = toast.loading(allHaveFullAccess ? "Menghapus semua Full Access..." : "Memberikan Full Access ke semua staff...");

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
                toast.success("Semua staff kembali ke View Only", { id: loadingToast });
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
                toast.success(`Full Access diberikan ke ${allStaff.length} staff`, { id: loadingToast });
            }
        } catch (error) {
            console.error("Error in check all:", error);
            toast.error("Gagal mengubah akses", { id: loadingToast });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-10 space-y-8 overflow-y-auto max-h-[80vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between sticky top-0 bg-white pb-4 border-b border-gray-100">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                                Kelola Akses Full
                            </h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                {folderName}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-gray-50 rounded-xl transition-all"
                        >
                            <X className="h-5 w-5 text-gray-300" />
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Info Box */}
                            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Eye className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black text-blue-900 uppercase tracking-wider mb-1">
                                            Default: Semua Staff View Only
                                        </p>
                                        <p className="text-[10px] font-bold text-blue-700 leading-relaxed">
                                            Secara default, semua staff sudah bisa melihat folder ini.
                                            Gunakan toggle di bawah untuk memberikan <span className="font-black">Full Access</span> (tambah, ubah, hapus).
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats & Check All Button */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-gray-400" />
                                    <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
                                        {fullAccessCount} / {allStaff.length} Staff Full Access
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-lg">
                                            <Eye className="h-3.5 w-3.5 text-blue-600" />
                                            <span className="text-[9px] font-black text-blue-700 uppercase">View Only</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-lg">
                                            <Shield className="h-3.5 w-3.5 text-emerald-600" />
                                            <span className="text-[9px] font-black text-emerald-700 uppercase">Full Access</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCheckAll}
                                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${allHaveFullAccess
                                                ? "bg-gray-600 text-white hover:bg-gray-700 shadow-gray-200"
                                                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200"
                                            }`}
                                    >
                                        {allHaveFullAccess ? "Uncheck All" : "Check All"}
                                    </button>
                                </div>
                            </div>

                            {/* Staff List */}
                            <div className="space-y-3">
                                {allStaff.map(staff => {
                                    const accessLevel = getStaffAccessLevel(staff.nip);
                                    const isFullAccess = accessLevel === "FULL_ACCESS";
                                    const isUpdating = updatingStaff.has(staff.nip);

                                    return (
                                        <div
                                            key={staff.nip}
                                            className={`p-5 rounded-2xl border-2 transition-all ${isFullAccess
                                                ? "border-emerald-200 bg-emerald-50/50"
                                                : "border-gray-100 bg-white"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                {/* Staff Info */}
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFullAccess ? "bg-emerald-100" : "bg-gray-100"
                                                        }`}>
                                                        {isFullAccess ? (
                                                            <Shield className="h-5 w-5 text-emerald-600" />
                                                        ) : (
                                                            <Eye className="h-5 w-5 text-gray-400" />
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">
                                                            {staff.firstName} {staff.lastName}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                            {staff.username} • {staff.nip}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Toggle Button */}
                                                <button
                                                    onClick={() => toggleFullAccess(staff.nip)}
                                                    disabled={isUpdating}
                                                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 ${isFullAccess
                                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                                        : "bg-gray-300 hover:bg-gray-400"
                                                        } disabled:opacity-50`}
                                                >
                                                    <span
                                                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 flex items-center justify-center ${isFullAccess ? "translate-x-9" : "translate-x-1"
                                                            }`}
                                                    >
                                                        {isUpdating ? (
                                                            <Loader2 className="h-3 w-3 animate-spin text-gray-600" />
                                                        ) : isFullAccess ? (
                                                            <Check className="h-3 w-3 text-emerald-600" />
                                                        ) : null}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
