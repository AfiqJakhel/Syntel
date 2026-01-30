"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/app/components/dashboard/layout/DashboardLayout";
import { User, Lock, Bell, Shield, Save, Eye, EyeOff, Check, X, Camera } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";

interface UserProfile {
    nip: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    createdAt: string;
}

export default function OfficerSettingsPage() {
    const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications">("profile");
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Profile form state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");

    // Password form state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Notification preferences
    const [submissionAlerts, setSubmissionAlerts] = useState(true);
    const [deadlineReminders, setDeadlineReminders] = useState(true);

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const userData = JSON.parse(userStr);
            setUser(userData);
            setFirstName(userData.firstName || "");
            setLastName(userData.lastName || "");
            setEmail(userData.email || "");
        }
        setLoading(false);
    }, []);

    const handleSaveProfile = async () => {
        if (!user) return;

        setIsSaving(true);
        try {
            const response = await fetch("/api/users/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nip: user.nip,
                    firstName,
                    lastName,
                    email,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Gagal menyimpan profil");
                setIsSaving(false);
                return;
            }

            // Update localStorage with new data
            const updatedUser = { ...user, firstName, lastName, email };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);

            toast.success("Profil berhasil diperbarui!");
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error("Terjadi kesalahan saat menyimpan profil");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error("Password baru tidak cocok!");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password minimal 6 karakter!");
            return;
        }

        setIsSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast.success("Password berhasil diubah!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsSaving(false);
    };

    const handleSaveNotifications = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        toast.success("Pengaturan notifikasi berhasil disimpan!");
        setIsSaving(false);
    };

    const tabs = [
        { id: "profile", label: "Profil", icon: User },
        { id: "security", label: "Keamanan", icon: Lock },
        { id: "notifications", label: "Notifikasi", icon: Bell },
    ];

    if (loading) {
        return (
            <DashboardLayout role="OFFICER">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="OFFICER">
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pengaturan</h1>
                    <p className="text-sm text-gray-500 font-medium mt-2">Kelola akun dan preferensi Anda</p>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-100">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? "bg-white text-red-600 shadow-lg"
                                : "text-gray-400 hover:text-gray-900 hover:bg-white/50"
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {activeTab === "profile" && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-red-50 rounded-2xl">
                                    <User className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">Informasi Profil</h2>
                                    <p className="text-xs text-gray-400 font-bold">Perbarui informasi akun Anda</p>
                                </div>
                            </div>

                            {/* Avatar Section */}
                            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                                <div className="relative">
                                    <div className="h-24 w-24 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl">
                                        {firstName?.[0]}{lastName?.[0]}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-lg font-black text-gray-900">{firstName} {lastName}</p>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{user?.role}</p>
                                    <p className="text-[10px] text-gray-300 font-bold mt-1">NIP: {user?.nip}</p>
                                </div>
                            </div>

                            {/* Form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Depan</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold text-gray-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Belakang</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold text-gray-800"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold text-gray-800"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Simpan Perubahan
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "security" && (
                        <motion.div
                            key="security"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-red-50 rounded-2xl">
                                    <Shield className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">Keamanan Akun</h2>
                                    <p className="text-xs text-gray-400 font-bold">Ubah password dan pengaturan keamanan</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password Saat Ini</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold text-gray-800 pr-14"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password Baru</label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold text-gray-800 pr-14"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Konfirmasi Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold text-gray-800"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={handleChangePassword}
                                    disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
                                    className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        <Lock className="h-4 w-4" />
                                    )}
                                    Ubah Password
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "notifications" && (
                        <motion.div
                            key="notifications"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-red-50 rounded-2xl">
                                    <Bell className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">Preferensi Notifikasi</h2>
                                    <p className="text-xs text-gray-400 font-bold">Atur notifikasi yang ingin Anda terima</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { id: "submission", label: "Pengajuan Baru", desc: "Notifikasi saat ada pengajuan konten baru", value: submissionAlerts, setter: setSubmissionAlerts },
                                    { id: "deadline", label: "Pengingat Deadline", desc: "Diingatkan sebelum deadline instruksi", value: deadlineReminders, setter: setDeadlineReminders },
                                ].map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all"
                                    >
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{item.label}</p>
                                            <p className="text-xs text-gray-400 font-medium mt-0.5">{item.desc}</p>
                                        </div>
                                        <button
                                            onClick={() => item.setter(!item.value)}
                                            className={`relative h-8 w-14 rounded-full transition-all ${item.value ? "bg-red-600" : "bg-gray-200"}`}
                                        >
                                            <div className={`absolute top-1 left-1 h-6 w-6 bg-white rounded-full shadow transition-transform ${item.value ? "translate-x-6" : "translate-x-0"}`} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={handleSaveNotifications}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}
                                    Simpan Preferensi
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
}
