"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/app/components/dashboard/layout/DashboardLayout";
import {
    Send, Video, Image as ImageIcon, FileText,
    CheckCircle2, Clock, AlertCircle, UploadCloud,
    RefreshCw, Play, Plus, X, Camera
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface Submission {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    contentType: string;
}

export default function StaffDashboard() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [contentType, setContentType] = useState("Instagram Post");
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
    const [userNip, setUserNip] = useState("");

    const contentTypes = ["Instagram Post", "Instagram Reels", "TikTok Video", "YouTube Video", "Infografis"];

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserNip(user.nip);
                fetchMySubmissions(user.nip);
            } catch (e) { }
        }
    }, []);

    const fetchMySubmissions = async (nip: string) => {
        try {
            const res = await fetch(`/api/staff/submissions?authorId=${nip}`);
            const data = await res.json();
            if (Array.isArray(data)) setMySubmissions(data);
        } catch (e) { }
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
                fetchMySubmissions(userNip);
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
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">
                            CREATIVE <span className="text-red-600">HUB</span>
                        </h1>
                        <p className="mt-2 text-gray-500 font-bold uppercase tracking-widest text-xs">
                            Portal Pengiriman Karya & Inisiatif Kreatif
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 font-bold text-xs text-gray-500 uppercase tracking-tighter">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        Server Cloud Active
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Submission Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
                            <div className="p-10 space-y-8">
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
                                            <img src={fileUrl} className="w-full h-48 object-cover rounded-3xl shadow-lg" />
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

                            <div className="px-10 py-8 bg-gray-50/50 border-t border-gray-100 flex justify-end">
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
                    </div>

                    {/* My Recent Activity */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 space-y-6">
                            <h3 className="text-lg font-black text-gray-900 leading-none">Aktivitas Saya</h3>
                            <div className="space-y-4">
                                {mySubmissions.length === 0 ? (
                                    <div className="text-center py-10 space-y-3">
                                        <div className="h-12 w-12 bg-gray-50 rounded-2xl mx-auto flex items-center justify-center">
                                            <Clock className="h-6 w-6 text-gray-200" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Belum ada pengiriman</p>
                                    </div>
                                ) : (
                                    mySubmissions.slice(0, 5).map(sub => (
                                        <div key={sub.id} className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 hover:bg-white transition-all group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-gray-400 font-mono tracking-tighter uppercase">{sub.id}</span>
                                                <div className={`h-2 w-2 rounded-full ${sub.status === 'APPROVED' ? 'bg-emerald-500' :
                                                    sub.status === 'REVISION' ? 'bg-orange-500' :
                                                        sub.status === 'REJECTED' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                                                    }`}></div>
                                            </div>
                                            <p className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-red-600 transition-colors">{sub.title}</p>
                                            <p className="text-[10px] font-bold text-gray-400 mt-1">{new Date(sub.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {sub.contentType}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            {mySubmissions.length > 5 && (
                                <button className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors">
                                    Lihat Semua Aktivitas
                                </button>
                            )}
                        </div>

                        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-[2.5rem] shadow-xl p-8 text-white space-y-4">
                            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <h4 className="font-black text-lg">Butuh Bantuan?</h4>
                            <p className="text-xs font-semibold leading-relaxed text-red-100">Jika mengalami kendala saat mengunggah video berukuran besar, hubungi Officer melalui jalur internal.</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
