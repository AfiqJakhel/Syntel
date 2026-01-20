"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/app/components/dashboard/layout/DashboardLayout";
import {
    Search, Eye, Edit2, Trash2, Mail, Shield,
    RefreshCw, Plus, X, Phone, Calendar,
    UserCheck, UserX, Info, Check, Filter
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Types
interface User {
    id: string; // NIP
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: "STAFF" | "OFFICER";
    skills: string[];
    isActive: boolean;
    avatar: string;
    joinedAt: string;
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

    // Modal States
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [showSkillsDialog, setShowSkillsDialog] = useState(false);
    const [newSkill, setNewSkill] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showPassInput, setShowPassInput] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/officer/users");
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch (err) {
            console.error("Failed to fetch users:", err);
            modernToast("error", "Gagal Memuat", "Data user tidak dapat disinkronkan.");
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

    const toggleStatus = async (user: User) => {
        const isDeactivating = user.isActive;
        const actingLabel = isDeactivating ? 'Menonaktifkan' : 'Mengaktifkan';
        const loadingId = modernToast("loading", actingLabel, `Memproses profil ${user.name}...`);

        try {
            const res = await fetch("/api/officer/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nip: user.id, isActive: !user.isActive })
            });

            toast.dismiss(loadingId as string);

            if (res.ok) {
                const isNowActive = !user.isActive;
                modernToast(
                    isNowActive ? "success" : "info",
                    "Status Diperbarui",
                    `Akun ${user.name} sekarang berstatus ${isNowActive ? 'AKTIF' : 'NONAKTIF'}.`
                );
                setUsers(users.map(u => u.id === user.id ? { ...u, isActive: isNowActive } : u));
                if (selectedUser?.id === user.id) setSelectedUser({ ...selectedUser, isActive: isNowActive });
            } else {
                throw new Error("Update failed");
            }
        } catch (err) {
            toast.dismiss(loadingId as string);
            modernToast("error", "Simpan Gagal", "Gagal memperbarui status di database Syntel.");
        }
    };

    const handleUpdatePassword = async () => {
        if (!selectedUser || !newPassword.trim()) return;

        const loadingId = modernToast("loading", "Update Password", `Mengamankan akun ${selectedUser.name}...`);
        setIsUpdating(true);

        try {
            const res = await fetch("/api/officer/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nip: selectedUser.id, password: newPassword })
            });

            toast.dismiss(loadingId as string);

            if (res.ok) {
                modernToast("success", "Password Berhasil!", "Kredensial baru telah tersimpan di cloud.");
                setNewPassword("");
                setShowPassInput(false);
            } else {
                throw new Error("Update failed");
            }
        } catch (err) {
            toast.dismiss(loadingId as string);
            modernToast("error", "Update Gagal", "Sistem gagal mengenkripsi password baru.");
        } finally {
            setIsUpdating(false);
        }
    };

    const addSkill = async (userId: string) => {
        if (!newSkill.trim() || isUpdating) return;

        setIsUpdating(true);
        const currentUser = users.find(u => u.id === userId);
        if (!currentUser) return;

        const updatedSkills = [...currentUser.skills, newSkill.trim()];

        try {
            const res = await fetch("/api/officer/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nip: userId, skills: updatedSkills })
            });

            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, skills: updatedSkills } : u));
                setNewSkill("");
                modernToast("success", "Keahlian Disinkronkan", `Skill "${newSkill}" telah tersimpan di cloud storage.`);
            } else {
                modernToast("error", "Error Cloud", "Gagal menyimpan keahlian baru ke dalam database.");
            }
        } catch (error) {
            modernToast("error", "Koneksi Terputus", "Masalah jaringan saat mencoba menghubungi server.");
        } finally {
            setIsUpdating(false);
        }
    };

    const removeSkill = async (userId: string, skillToRemove: string) => {
        if (isUpdating) return;

        setIsUpdating(true);
        const currentUser = users.find(u => u.id === userId);
        if (!currentUser) return;

        const updatedSkills = currentUser.skills.filter(s => s !== skillToRemove);

        try {
            const res = await fetch("/api/officer/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nip: userId, skills: updatedSkills })
            });

            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, skills: updatedSkills } : u));
                modernToast("info", "Keahlian Dihapus", `Label "${skillToRemove}" telah dihapus dari profil staff.`);
            }
        } catch (error) {
            modernToast("error", "Update Gagal", "Gagal memperbarui database keahlian.");
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredUsers = users.filter((u) => {
        // Only apply search filter if query has 3+ characters
        const matchesSearch = searchQuery.length < 3 ||
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.id.includes(searchQuery) ||
            u.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === "ALL" ||
            (statusFilter === "ACTIVE" ? u.isActive : !u.isActive);

        return matchesSearch && matchesStatus;
    });

    return (
        <DashboardLayout role="OFFICER">
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manajemen Staff</h1>
                        <p className="text-sm text-gray-500 font-medium">Data keahlian kini tersimpan permanen di database cloud Syntel.</p>
                    </div>
                </div>

                {/* Filters & Tools */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, NIP, atau keahlian..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all shadow-md"
                        />
                    </div>
                    <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-md">
                        {(["ALL", "ACTIVE", "INACTIVE"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setStatusFilter(tab)}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${statusFilter === tab ? "bg-red-600 text-white shadow-lg shadow-red-500/30" : "text-gray-400 hover:text-gray-600"
                                    }`}
                            >
                                {tab === "ALL" ? "Semua" : tab === "ACTIVE" ? "Aktif" : "Nonaktif"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/30 border-b border-gray-200">
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Profil Pegawai</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Keahlian</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan={4} className="px-8 py-20 text-center"><div className="flex flex-col items-center gap-2"><RefreshCw className="h-6 w-6 text-red-600 animate-spin" /><p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Mengsinkronisasi Data...</p></div></td></tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr><td colSpan={4} className="px-8 py-20 text-center"><Shield className="h-16 w-16 text-gray-100 mx-auto mb-4" /><p className="text-gray-400 font-bold text-sm">Tidak ada data yang cocok</p></td></tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className={`group transition-all ${!user.isActive ? 'opacity-50 grayscale bg-gray-50/50' : 'hover:bg-gray-50/20'}`}>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-xl border-2 border-white rotate-3 group-hover:rotate-0 transition-transform ${!user.isActive ? 'bg-gray-400' : 'bg-gradient-to-br from-red-600 to-red-700'}`}>
                                                        {user.avatar}
                                                    </div>
                                                    <div>
                                                        <p className={`font-black text-sm ${!user.isActive ? 'text-gray-500' : 'text-gray-900'}`}>{user.name}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Employee ID: {user.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-1.5 flex-wrap max-w-[240px]">
                                                    {user.skills.length > 0 ? (
                                                        user.skills.map((skill, i) => (
                                                            <span key={i} className="px-2.5 py-1 rounded-lg bg-gray-900 text-white text-[9px] font-black uppercase tracking-tight border border-white/10 flex items-center gap-1.5 shadow-md">
                                                                {skill}
                                                                <X className="h-2.5 w-2.5 cursor-pointer hover:text-red-400 transition-colors" onClick={() => removeSkill(user.id, skill)} />
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] text-gray-300 italic font-medium">Bebas diatur Officer...</span>
                                                    )}
                                                    <button
                                                        onClick={() => { setSelectedUser(user); setShowSkillsDialog(true); }}
                                                        className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:shadow-lg transition-all"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm transition-all ${user.isActive
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/10'
                                                    : 'bg-red-50 text-red-600 border-red-100 shadow-red-500/10'
                                                    }`}>
                                                    {user.isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                                    {user.isActive ? 'Active' : 'Deactive'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button
                                                        onClick={() => { setSelectedUser(user); setShowDetailDialog(true); }}
                                                        className="p-3 rounded-2xl bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-2xl transition-all"
                                                        title="View Details"
                                                    >
                                                        <Info className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleStatus(user)}
                                                        className={`p-3 rounded-2xl border transition-all ${user.isActive
                                                            ? 'bg-white border-gray-200 text-gray-400 hover:text-[#E30613] hover:border-red-200 hover:shadow-2xl'
                                                            : 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-500/40 hover:scale-110 active:scale-95'
                                                            }`}
                                                        title={user.isActive ? "Deactivate Account" : "Activate Account"}
                                                    >
                                                        {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
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

                {/* Profile Modal */}
                {showDetailDialog && selectedUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" onClick={() => setShowDetailDialog(false)} />
                        <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className={`h-32 bg-gradient-to-br ${selectedUser.isActive ? 'from-[#7F0000] to-[#E30613]' : 'from-gray-700 to-gray-900'}`} />
                            <button onClick={() => setShowDetailDialog(false)} className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"><X className="h-5 w-5" /></button>

                            <div className="px-10 pb-10 -mt-16 text-center">
                                <div className="inline-flex h-32 w-32 rounded-[2.5rem] bg-white p-2 shadow-2xl mb-6 rotate-6 hover:rotate-0 transition-transform duration-500">
                                    <div className={`h-full w-full rounded-[2rem] flex items-center justify-center text-4xl font-black text-white ${selectedUser.isActive ? 'bg-gradient-to-br from-[#9B0000] to-[#E30613]' : 'bg-gray-800'}`}>
                                        {selectedUser.avatar}
                                    </div>
                                </div>

                                <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-1">{selectedUser.name}</h2>
                                <span className="px-3 py-1 rounded-full bg-red-50 text-[#E30613] text-[10px] font-black uppercase tracking-[0.2em] border border-red-100">{selectedUser.role}</span>

                                <div className="grid grid-cols-2 gap-4 mt-8 text-left">
                                    {[
                                        { label: "NIP", value: selectedUser.id, icon: Shield, color: "text-[#E30613]" },
                                        { label: "Phone", value: selectedUser.phone || "Not Set", icon: Phone, color: "text-blue-500" },
                                        { label: "Email", value: selectedUser.email, icon: Mail, color: "text-emerald-500", full: true },
                                        { label: "Member Since", value: new Date(selectedUser.joinedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), icon: Calendar, color: "text-purple-500", full: true }
                                    ].map((item, idx) => (
                                        <div key={idx} className={`${item.full ? 'col-span-2' : ''} p-5 rounded-[2rem] bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors`}>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-2xl bg-white shadow-sm flex items-center justify-center"><item.icon className={`h-5 w-5 ${item.color}`} /></div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                                                    <p className="text-sm font-bold text-gray-800 break-all">{item.value}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Skills Section - Integrated into Detail */}
                                <div className="mt-6 text-left">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Keahlian & Spesialisasi</p>
                                    <div className="flex flex-wrap gap-2 p-4 rounded-[2rem] bg-gray-900 border border-white/10 shadow-xl">
                                        {selectedUser.skills.length > 0 ? (
                                            selectedUser.skills.map((skill, i) => (
                                                <span key={i} className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-[9px] font-black uppercase tracking-tight border border-white/5 flex items-center gap-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] text-gray-500 italic py-1">Belum ada keahlian yang tercatat...</span>
                                        )}
                                    </div>
                                </div>

                                {/* Password Change Section */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    {!showPassInput ? (
                                        <button
                                            onClick={() => setShowPassInput(true)}
                                            className="w-full flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                                        >
                                            <RefreshCw className="h-3 w-3" /> Ganti Password
                                        </button>
                                    ) : (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Masukkan Password Baru..."
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full pl-6 pr-12 py-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-xs font-bold text-emerald-900 focus:bg-white focus:border-emerald-600 outline-none transition-all placeholder:text-emerald-300"
                                                />
                                                <button
                                                    onClick={() => setShowPassInput(false)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleUpdatePassword}
                                                disabled={isUpdating}
                                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                {isUpdating ? 'Mengenkripsi...' : 'Simpan Password'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manage Skills Modal */}
                {showSkillsDialog && selectedUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowSkillsDialog(false)} />
                        <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-gray-200 p-10">
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Setting Keahlian</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Role: {selectedUser.name}</p>

                            <div className="relative group mb-8">
                                <input
                                    type="text"
                                    placeholder="Skill Name..."
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addSkill(selectedUser.id)}
                                    className="w-full pl-6 pr-16 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-red-600/5 focus:border-red-600 transition-all outline-none"
                                />
                                <button
                                    onClick={() => addSkill(selectedUser.id)}
                                    disabled={isUpdating}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl disabled:opacity-50"
                                >
                                    {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 min-h-[100px] content-start">
                                {users.find(u => u.id === selectedUser.id)?.skills.map((skill, i) => (
                                    <div key={i} className="group flex items-center gap-3 px-4 py-2 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-[10px] font-black uppercase tracking-tight hover:bg-red-600 hover:text-white transition-all">
                                        {skill}
                                        <X className="h-3 w-3 cursor-pointer opacity-50 group-hover:opacity-100" onClick={() => removeSkill(selectedUser.id, skill)} />
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => setShowSkillsDialog(false)} className="w-full mt-10 py-5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-red-500/40 hover:scale-[1.02] transition-all">Selesai & Cloud Save</button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
