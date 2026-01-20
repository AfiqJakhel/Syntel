"use client";

import React, { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/app/components/dashboard/layout/DashboardLayout";
import {
    X,
    Users,
    Calendar,
    Paperclip,
    Send,
    ChevronDown,
    AlertCircle,
    FileText,
    Image as ImageIcon,
    Video,
    Link as LinkIcon,
    Bold,
    Italic,
    List,
    AtSign,
    Check,
    Info,
    RefreshCw,
    Camera,
    UploadCloud,
    LayoutGrid,
    Music,
    Youtube,
    MoreHorizontal,
    ArrowLeft
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { InstagramPostIcon, InstagramReelsIcon, InstagramStoryIcon } from "@/app/components/icons/InstagramIcons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/app/styles/datepicker.css";

interface Assignee {
    id: string;
    name: string;
    role: string;
    avatar: string;
    skills: string[];
}

const contentTypes = [
    { value: "INSTAGRAM_POST", label: "Instagram Post", icon: InstagramPostIcon },
    { value: "INSTAGRAM_CAROUSEL", label: "Instagram Carousel", icon: LayoutGrid },
    { value: "INSTAGRAM_REELS", label: "Instagram Reels", icon: InstagramReelsIcon },
    { value: "INSTAGRAM_STORY", label: "Instagram Story", icon: InstagramStoryIcon },
    { value: "TIKTOK_POST", label: "TikTok Post", icon: Music },
    { value: "YOUTUBE_VIDEO", label: "YouTube Video", icon: Youtube },
    { value: "POSTER", label: "Poster", icon: ImageIcon },
    { value: "DOKUMEN_INTERNAL", label: "Dokumen Internal", icon: FileText },
];

export default function EditInstruksiPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [title, setTitle] = useState("");
    const [contentType, setContentType] = useState("");
    const [description, setDescription] = useState("");
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
    const [availableAssignees, setAvailableAssignees] = useState<Assignee[]>([]);
    const [loading, setLoading] = useState(true);
    const [deadline, setDeadline] = useState<Date | null>(null);
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const typeDropdownRef = useRef<HTMLDivElement>(null);
    const assigneeDropdownRef = useRef<HTMLDivElement>(null);

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
        ), { duration: type === 'loading' ? Infinity : 5000 });
    };

    // Load Data
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                // Fetch Users
                const usersRes = await fetch("/api/officer/users");
                const usersData = await usersRes.json();
                const activeUsers = usersData
                    .filter((u: any) => u.isActive)
                    .map((u: any) => ({
                        id: u.nip || u.id,
                        name: u.name || `${u.firstName} ${u.lastName}`,
                        role: u.role,
                        avatar: u.avatar || (u.firstName ? u.firstName[0] : "?"),
                        skills: u.skills || []
                    }));
                setAvailableAssignees(activeUsers);

                // Fetch Instruction Detail
                const instRes = await fetch(`/api/officer/instructions/${id}`);
                if (!instRes.ok) throw new Error("Gagal memuat instruksi");
                const instData = await instRes.json();

                setTitle(instData.title);
                setContentType(instData.contentType);
                setDescription(instData.description);
                setDeadline(new Date(instData.deadline));
                setPriority(instData.priority.toLowerCase());
                setThumbnail(instData.thumbnail);
                setSelectedAssignees(instData.assignees.map((a: any) => a.staffNip));

            } catch (err: any) {
                console.error("Load Error:", err);
                toast.error(err.message || "Gagal memuat data");
            } finally {
                setLoading(false);
            }
        };

        if (id) loadInitialData();

        const handleClickOutside = (event: MouseEvent) => {
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) setShowTypeDropdown(false);
            if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) setShowAssigneeDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [id]);

    const toggleSelectAll = () => {
        if (selectedAssignees.length === availableAssignees.length && availableAssignees.length > 0) {
            setSelectedAssignees([]);
        } else {
            setSelectedAssignees(availableAssignees.map(a => a.id));
        }
    };

    const handleThumbnailUpload = async (file: File) => {
        setIsUploading(true);
        const loadingId = modernToast("loading", "Mengupload...", "Sedang menyimpan thumbnail ke server.");
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            toast.dismiss(loadingId as string);
            if (res.ok) {
                setThumbnail(data.fileUrl);
                modernToast("success", "Upload Berhasil", "Thumbnail siap digunakan.");
            } else {
                modernToast("error", "Upload Gagal", data.error);
            }
        } catch (err) {
            toast.dismiss(loadingId as string);
            modernToast("error", "Koneksi Error", "Gagal menghubungi server.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !contentType || !description || selectedAssignees.length === 0 || !deadline) {
            modernToast("error", "Lengkapi Field", "Mohon lengkapi semua data wajib.");
            return;
        }

        const loadingId = modernToast("loading", "Memperbarui...", "Sistem sedang mensinkronisasi data ke cloud.");

        try {
            const res = await fetch(`/api/officer/instructions/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    deadline: deadline.toISOString(),
                    priority,
                    contentType,
                    assignees: selectedAssignees.filter(nip => typeof nip === "string" && nip.trim() !== ""),
                    thumbnail
                }),
            });

            toast.dismiss(loadingId as string);

            if (res.ok) {
                modernToast("success", "Perubahan Disimpan", "Instruksi berhasil diperbarui secara real-time.");
                setTimeout(() => router.push("/dashboard/officer/instruksi"), 1500);
            } else {
                const data = await res.json();
                modernToast("error", "Gagal Simpan", data.error);
            }
        } catch (err) {
            toast.dismiss(loadingId as string);
            modernToast("error", "Koneksi Error", "Gagal menghubungi server database.");
        }
    };

    if (loading) {
        return (
            <DashboardLayout role="OFFICER">
                <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
                    <RefreshCw className="h-12 w-12 text-red-600 animate-spin" />
                    <p className="text-gray-500 font-bold animate-pulse">Menyiapkan Workspace...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="OFFICER">
            <div className="max-w-5xl mx-auto pb-20">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-3 bg-white border-2 border-gray-100 rounded-2xl text-gray-400 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Edit Detail Instruksi</h1>
                            <p className="text-sm font-bold text-gray-400">ID: <span className="text-red-600 font-mono">{id}</span> • Modifikasi parameter dan penugasan</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Main Workspace Card */}
                    <div className="bg-white rounded-[2.5rem] border-2 border-gray-200 shadow-2xl shadow-gray-200/50 overflow-hidden">
                        {/* Title Input */}
                        <div className="p-8 border-b-2 border-gray-50 bg-gradient-to-b from-gray-50/50 to-white">
                            <input
                                type="text"
                                placeholder="Judul Instruksi..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full text-3xl font-black text-gray-900 placeholder:text-gray-200 focus:outline-none bg-transparent"
                                required
                            />
                        </div>

                        {/* Control Bar */}
                        <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-200 flex items-center gap-4 flex-wrap">
                            <div className="relative" ref={typeDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 rounded-2xl hover:border-red-200 hover:shadow-lg transition-all"
                                >
                                    <FileText className="h-4 w-4 text-red-600" />
                                    <span className="text-sm font-black text-gray-700 uppercase tracking-wider">
                                        {contentType ? contentTypes.find(t => t.value === contentType)?.label : "Tipe Konten"}
                                    </span>
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                </button>
                                {showTypeDropdown && (
                                    <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-[2rem] border-2 border-gray-200 shadow-2xl z-50 p-2 overflow-hidden">
                                        {contentTypes.map((type) => (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => { setContentType(type.value); setShowTypeDropdown(false); }}
                                                className="w-full px-5 py-4 text-left hover:bg-red-50 rounded-2xl transition-all flex items-center gap-4 group"
                                            >
                                                <type.icon className="h-5 w-5 text-gray-400 group-hover:text-red-600 transition-colors" />
                                                <span className="text-sm font-bold text-gray-600 group-hover:text-red-900">{type.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl border-2 border-gray-200 shadow-md">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority</span>
                                <div className="flex gap-1">
                                    {(["low", "medium", "high"] as const).map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p)}
                                            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all ${priority === p
                                                ? 'bg-red-600 text-white shadow-lg shadow-red-200'
                                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1" />

                            <DatePicker
                                selected={deadline}
                                onChange={(date: Date | null) => setDeadline(date)}
                                dateFormat="dd MMM yyyy"
                                customInput={
                                    <button type="button" className="flex items-center gap-3 px-5 py-2.5 bg-white border-2 border-gray-200 rounded-2xl hover:border-red-200 transition-all shadow-md">
                                        <Calendar className="h-4 w-4 text-red-600" />
                                        <span className="text-sm font-black text-gray-700 uppercase tracking-widest">
                                            {deadline ? deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pilih Deadline'}
                                        </span>
                                    </button>
                                }
                            />
                        </div>

                        {/* Editor Workspace */}
                        <div className="p-8">
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={10}
                                placeholder="Tulis instruksi detail di sini..."
                                className="w-full text-lg leading-relaxed text-gray-700 placeholder:text-gray-200 focus:outline-none resize-none"
                            />

                            <div className="mt-8 pt-8 border-t-2 border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {!thumbnail && (
                                        <div className="flex items-center gap-2">
                                            <button type="button" className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"><Paperclip className="h-5 w-5" /></button>
                                            <button type="button" className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"><ImageIcon className="h-5 w-5" /></button>
                                            <button type="button" className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"><Video className="h-5 w-5" /></button>
                                            <div className="w-px h-6 bg-gray-100 mx-2" />
                                        </div>
                                    )}

                                    <div className="relative group">
                                        <input type="file" id="thumb" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])} />
                                        <label htmlFor="thumb" className={`flex items-center gap-3 px-6 py-2.5 rounded-full border-2 border-dashed transition-all cursor-pointer ${thumbnail ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-red-300'}`}>
                                            {isUploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : thumbnail ? <Check className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                                            <span className="text-xs font-black uppercase tracking-widest">{thumbnail ? "Thumbnail Tersemat" : "Update Thumbnail"}</span>
                                        </label>
                                        {thumbnail && (
                                            <div className="absolute top-full mt-4 left-0 z-50 p-3 bg-white rounded-[2rem] shadow-2xl border-2 border-gray-200 hidden group-hover:block transition-all transform -translate-y-2">
                                                <img src={thumbnail} className="w-64 h-36 object-cover rounded-2xl shadow-inner border border-gray-100" />
                                                <button onClick={() => setThumbnail(null)} className="absolute -top-3 -right-3 p-2 bg-red-600 text-white rounded-full shadow-xl hover:scale-110 transition-transform"><X className="h-4 w-4" /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 border-2 border-dashed border-gray-100 rounded-full opacity-50">
                                    <UploadCloud className="h-4 w-4 text-gray-400" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest tracking-[0.2em]">MAX 5MB (PNG/JPG)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Team Assignment Card */}
                    <div className="bg-white rounded-[2.5rem] border-2 border-gray-200 shadow-xl overflow-hidden" ref={assigneeDropdownRef}>
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900">Modifikasi Tim Kerja</h3>
                                        <p className="text-sm font-bold text-gray-400">Total {selectedAssignees.length} anggota ditugaskan</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                                    className="px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center gap-2"
                                >
                                    <PlusIcon className="h-4 w-4" /> Edit Tim
                                </button>
                            </div>

                            {showAssigneeDropdown && (
                                <div className="mb-8 p-8 bg-gray-50/50 rounded-[2.5rem] border-2 border-gray-100 transition-all animate-in fade-in slide-in-from-top-4 shadow-inner">
                                    <div className="flex justify-between items-center mb-6 px-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Pilih Anggota Tim</p>
                                        <button
                                            type="button"
                                            onClick={toggleSelectAll}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedAssignees.length === availableAssignees.length && availableAssignees.length > 0
                                                    ? "bg-red-600 text-white shadow-lg shadow-red-200"
                                                    : "bg-white border-2 border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-600"
                                                }`}
                                        >
                                            {selectedAssignees.length === availableAssignees.length && availableAssignees.length > 0 ? (
                                                <><Check className="h-3 w-3" /> Batalkan Semua</>
                                            ) : (
                                                <><Users className="h-3 w-3" /> Pilih Semua</>
                                            )}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {availableAssignees.map((assignee) => (
                                            <label key={assignee.id} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${selectedAssignees.includes(assignee.id) ? 'bg-white border-red-500 shadow-md' : 'bg-transparent border-transparent hover:bg-white/50'}`}>
                                                <input type="checkbox" checked={selectedAssignees.includes(assignee.id)} onChange={() => {
                                                    setSelectedAssignees(prev => prev.includes(assignee.id) ? prev.filter(a => a !== assignee.id) : [...prev, assignee.id]);
                                                }} className="hidden" />
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-black text-xs shadow-sm capitalize">{assignee.avatar}</div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900">{assignee.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{assignee.role}</p>
                                                </div>
                                                {selectedAssignees.includes(assignee.id) && <Check className="ml-auto h-4 w-4 text-red-600" />}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-4">
                                {selectedAssignees.length > 0 ? (
                                    selectedAssignees.map(id => {
                                        const assignee = availableAssignees.find(a => a.id === id);
                                        return (
                                            <div key={id} className="flex items-center gap-4 p-2 pl-2 pr-4 bg-white border-2 border-gray-50 rounded-2xl shadow-sm hover:border-red-100 transition-all">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-black text-xs capitalize shadow-sm">
                                                    {assignee?.avatar || "?"}
                                                </div>
                                                <p className="text-sm font-black text-gray-900">{assignee?.name}</p>
                                                <button type="button" onClick={() => setSelectedAssignees(prev => prev.filter(a => a !== id))} className="text-gray-300 hover:text-red-600 transition-colors"><X className="h-4 w-4" /></button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="w-full text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                        <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                        <p className="text-gray-400 font-black uppercase tracking-[0.2em]">Belum Ada Anggota</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Final Action Bar */}
                    <div className="flex items-center justify-end gap-4 pt-4">
                        <button type="button" onClick={() => router.back()} className="px-10 py-4 border-2 border-gray-200 text-gray-400 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Batal</button>
                        <button type="submit" className="px-10 py-4 bg-red-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-red-700 shadow-2xl shadow-red-200 transition-all flex items-center gap-3 active:scale-95">
                            <Send className="h-5 w-5" /> Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    );
}
