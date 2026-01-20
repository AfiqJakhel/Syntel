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
    Instagram,
    Music,
    Youtube,
    MoreHorizontal,
    LayoutGrid,
    Check,
    Info,
    RefreshCw,
    Camera,
    UploadCloud
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
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

export default function CreateInstruksiPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [contentType, setContentType] = useState("");
    const [description, setDescription] = useState("");
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
    const [availableAssignees, setAvailableAssignees] = useState<Assignee[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [deadline, setDeadline] = useState<Date | null>(null);
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [attachments, setAttachments] = useState<File[]>([]);
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const typeDropdownRef = useRef<HTMLDivElement>(null);
    const assigneeDropdownRef = useRef<HTMLDivElement>(null);

    const applyFormat = (type: "bold" | "italic" | "list" | "link" | "mention") => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const selectedText = description.substring(start, end);

        let formatted = "";
        switch (type) {
            case "bold": formatted = `**${selectedText || "teks tebal"}**`; break;
            case "italic": formatted = `*${selectedText || "teks miring"}*`; break;
            case "list": formatted = `\n- ${selectedText || "item daftar"}`; break;
            case "link": formatted = `[${selectedText || "teks link"}](https://)`; break;
            case "mention": formatted = `@${selectedText || "username"} `; break;
        }

        const newDescription = description.substring(0, start) + formatted + description.substring(end);
        setDescription(newDescription);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newPos = start + formatted.length;
                textareaRef.current.setSelectionRange(newPos, newPos);
            }
        }, 10);
    };

    // Fetch Users From API
    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                const res = await fetch("/api/officer/users");
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Filter only active users
                    const activeUsers = data
                        .filter((u: any) => u.isActive)
                        .map((u: any) => ({
                            id: u.id, // nip
                            name: u.name,
                            role: u.role,
                            avatar: u.avatar,
                            skills: u.skills || []
                        }));
                    setAvailableAssignees(activeUsers);
                }
            } catch (err) {
                console.error("Failed to fetch users:", err);
                toast.error("Gagal memuat daftar anggota.");
            } finally {
                setLoadingUsers(false);
            }
        };

        fetchUsers();

        const handleClickOutside = (event: MouseEvent) => {
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
                setShowTypeDropdown(false);
            }
            if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
                setShowAssigneeDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleThumbnailUpload = async (file: File) => {
        setIsUploading(true);
        const loadingId = modernToast("loading", "Mengupload...", "Sedang menyimpan thumbnail ke server.");

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
                setThumbnail(data.fileUrl);
                modernToast("success", "Upload Berhasil", "Thumbnail siap digunakan untuk promosi.");
            } else {
                modernToast("error", "Upload Gagal", data.error || "Gagal mengunggah gambar.");
            }
        } catch (err) {
            toast.dismiss(loadingId as string);
            modernToast("error", "Koneksi Error", "Gagal menghubungi server upload.");
        } finally {
            setIsUploading(false);
        }
    };

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Get issuerId from localStorage
        const userStr = localStorage.getItem("user");
        let issuerId = "";
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                issuerId = user.nip;
            } catch (e) {
                console.error("Failed to parse user session");
            }
        }

        if (!title || !contentType || !description || selectedAssignees.length === 0 || !deadline || !issuerId) {
            modernToast("error", "Lengkapi Field", "Mohon lengkapi semua data wajib.");
            return;
        }

        const loadingId = modernToast("loading", "Mengarsipkan...", "Instruksi sedang disimpan ke database Syntel.");

        try {
            const res = await fetch("/api/officer/instructions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    deadline: deadline.toISOString(),
                    priority: priority.toUpperCase(),
                    contentType,
                    assignees: selectedAssignees,
                    issuerId,
                    thumbnail
                }),
            });

            const data = await res.json();
            toast.dismiss(loadingId as string);

            if (res.ok) {
                modernToast("success", "Instruksi Terarsip!", "Data instruksi telah tersimpan permanen di database Syntel.");

                setTimeout(() => {
                    router.push("/dashboard/officer/instruksi");
                }, 1500);
            } else {
                modernToast("error", "Gagal Simpan", data.error || "Terjadi kesalahan saat menyimpan.");
            }
        } catch (err) {
            toast.dismiss(loadingId as string);
            modernToast("error", "Koneksi Error", "Gagal menghubungi server database.");
        }
    };

    const toggleAssignee = (id: string) => {
        setSelectedAssignees((prev) =>
            prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedAssignees.length === availableAssignees.length) {
            setSelectedAssignees([]);
        } else {
            setSelectedAssignees(availableAssignees.map((a) => a.id));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments([...attachments, ...Array.from(e.target.files)]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    return (
        <DashboardLayout role="OFFICER">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                Buat Instruksi Baru
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 font-medium">
                                Buat dan tugaskan instruksi konten kepada tim Anda
                            </p>
                        </div>
                        <button
                            onClick={() => router.back()}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Main Card - MS Teams Style */}
                    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
                        {/* Title Input */}
                        <div className="p-6 border-b border-gray-200">
                            <input
                                type="text"
                                placeholder="Judul instruksi"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full text-2xl font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none"
                                required
                            />
                        </div>

                        {/* Metadata Bar */}
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-4 flex-wrap">
                            {/* Content Type Selector */}
                            <div className="relative" ref={typeDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-red-300 transition-colors"
                                >
                                    {contentType ? (
                                        React.createElement(
                                            contentTypes.find((t) => t.value === contentType)?.icon || FileText,
                                            { className: "h-4 w-4 text-red-600" }
                                        )
                                    ) : (
                                        <FileText className="h-4 w-4 text-red-600" />
                                    )}
                                    <span className="text-sm font-semibold text-gray-700">
                                        {contentType
                                            ? contentTypes.find((t) => t.value === contentType)?.label
                                            : "Pilih Tipe Konten"}
                                    </span>
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                </button>

                                {showTypeDropdown && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl border-2 border-gray-200 shadow-2xl z-50 max-h-80 overflow-y-auto">
                                        {contentTypes.map((type) => (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => {
                                                    setContentType(type.value);
                                                    setShowTypeDropdown(false);
                                                }}
                                                className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-0"
                                            >
                                                <type.icon className="h-4 w-4 text-red-600" />
                                                <span className="text-sm font-medium text-gray-700">
                                                    {type.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Priority Selector */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">Prioritas:</span>
                                <div className="flex gap-1">
                                    {(["low", "medium", "high"] as const).map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${priority === p
                                                ? p === "high"
                                                    ? "bg-red-600 text-white"
                                                    : p === "medium"
                                                        ? "bg-orange-500 text-white"
                                                        : "bg-blue-500 text-white"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                        >
                                            {p === "high" ? "Tinggi" : p === "medium" ? "Sedang" : "Rendah"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Deadline */}
                            <div className="flex items-center gap-2">
                                <DatePicker
                                    selected={deadline}
                                    onChange={(date: Date | null) => setDeadline(date)}
                                    dateFormat="dd MMM yyyy"
                                    minDate={new Date()}
                                    placeholderText="Pilih tanggal deadline"
                                    className="custom-datepicker-input"
                                    required
                                    dayClassName={(date) => {
                                        if (!deadline) return "";
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        const checkDate = new Date(date);
                                        checkDate.setHours(0, 0, 0, 0);
                                        const selectedDate = new Date(deadline);
                                        selectedDate.setHours(0, 0, 0, 0);

                                        // Check if this is today
                                        if (checkDate.getTime() === today.getTime()) {
                                            return "react-datepicker__day--range-start";
                                        }

                                        // Check if this is the selected date
                                        if (checkDate.getTime() === selectedDate.getTime()) {
                                            return "react-datepicker__day--range-end";
                                        }

                                        // Check if date is in range (between today and selected, including cross-month)
                                        if (checkDate > today && checkDate < selectedDate) {
                                            return "react-datepicker__day--in-range";
                                        }

                                        return "";
                                    }}
                                    customInput={
                                        <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-red-300 transition-colors cursor-pointer">
                                            <Calendar className="h-4 w-4 text-red-600" />
                                            <span className="text-sm font-semibold text-gray-700">
                                                {deadline ? deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pilih Deadline'}
                                            </span>
                                        </div>
                                    }
                                />
                            </div>
                        </div>

                        {/* Rich Text Editor Area */}
                        <div className="p-6">
                            {/* Toolbar */}
                            <div className="flex items-center gap-1 mb-4 pb-4 border-b border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => applyFormat("bold")}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Bold"
                                >
                                    <Bold className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyFormat("italic")}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Italic"
                                >
                                    <Italic className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyFormat("list")}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="List"
                                >
                                    <List className="h-4 w-4" />
                                </button>
                                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                                <button
                                    type="button"
                                    onClick={() => applyFormat("mention")}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Mention"
                                >
                                    <AtSign className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyFormat("link")}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Add Link"
                                >
                                    <LinkIcon className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Text Area */}
                            <textarea
                                ref={textareaRef}
                                placeholder="Deskripsikan instruksi konten secara detail..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={8}
                                className="w-full text-gray-700 placeholder:text-gray-400 focus:outline-none resize-none"
                                required
                            />

                            {/* Attachments */}
                            {attachments.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {attachments.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-red-100 rounded-lg">
                                                    <Paperclip className="h-4 w-4 text-red-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {(file.size / 1024).toFixed(2)} KB
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Bottom Action Bar */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {!thumbnail && (
                                    <>
                                        {/* Attach File */}
                                        <label className="cursor-pointer p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                                            <Paperclip className="h-5 w-5" />
                                            <input
                                                type="file"
                                                multiple
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>

                                        {/* Image */}
                                        <button
                                            type="button"
                                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            <ImageIcon className="h-5 w-5" />
                                        </button>

                                        {/* Video */}
                                        <button
                                            type="button"
                                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            <Video className="h-5 w-5" />
                                        </button>
                                        <div className="mx-2 h-4 w-px bg-gray-200" />
                                    </>
                                )}

                                {/* Sub-toolbar: Thumbnail & Attachments */}
                                <div className="flex items-center gap-3">
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            id="thumbnail-upload"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleThumbnailUpload(file);
                                            }}
                                        />
                                        <label
                                            htmlFor="thumbnail-upload"
                                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-dashed transition-all cursor-pointer ${thumbnail
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-red-300 hover:bg-red-50'
                                                }`}
                                        >
                                            {isUploading ? (
                                                <RefreshCw className="h-3.5 w-3.5 animate-spin text-red-500" />
                                            ) : thumbnail ? (
                                                <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                                            ) : (
                                                <Camera className="h-3.5 w-3.5" />
                                            )}
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                {isUploading ? "Uploading..." : thumbnail ? "Thumbnail Tersemat" : "Upload Thumbnail"}
                                            </span>
                                        </label>

                                        {thumbnail && (
                                            <div className="absolute top-10 left-0 z-10 p-2 bg-white rounded-2xl shadow-xl border border-gray-100 hidden group-hover:block transition-all">
                                                <img
                                                    src={thumbnail}
                                                    alt="Thumbnail Preview"
                                                    className="w-40 h-24 object-cover rounded-xl shadow-inner"
                                                />
                                                <button
                                                    onClick={() => setThumbnail(null)}
                                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="px-3 py-1.5 bg-gray-50 border border-dashed border-gray-200 rounded-full flex items-center gap-2 opacity-60">
                                        <UploadCloud className="h-3 w-3 text-gray-400" />
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.15em]">PNG, JPG (5MB)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Assignees Card */}
                    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden" ref={assigneeDropdownRef}>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-red-600" />
                                    <h3 className="text-lg font-bold text-gray-900">Tugaskan Kepada</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                                >
                                    <Users className="h-4 w-4" />
                                    Tambah Anggota
                                </button>
                            </div>

                            {/* Assignee Dropdown */}
                            {showAssigneeDropdown && (
                                <div className="mb-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                                    {/* Select All Toggle Button */}
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
                                    <div className="space-y-2">
                                        {availableAssignees.map((assignee) => (
                                            <label
                                                key={assignee.id}
                                                className="flex items-center gap-3 p-3 hover:bg-white rounded-lg cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAssignees.includes(assignee.id)}
                                                    onChange={() => toggleAssignee(assignee.id)}
                                                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                                />
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white text-sm font-bold">
                                                    {assignee.avatar}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">
                                                        {assignee.name}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                                        {assignee.skills.length > 0 ? (
                                                            assignee.skills.slice(0, 3).map((skill, i) => (
                                                                <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-[#E30613] text-[8px] font-black uppercase tracking-tighter rounded-md border border-gray-200">
                                                                    {skill}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <p className="text-[10px] text-gray-400 font-medium italic">Belum ada skill...</p>
                                                        )}
                                                        {assignee.skills.length > 3 && (
                                                            <span className="text-[8px] text-gray-400 font-bold">+{assignee.skills.length - 3}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Selected Assignees */}
                            {selectedAssignees.length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                    {selectedAssignees.map((id) => {
                                        const assignee = availableAssignees.find((a) => a.id === id);
                                        return (
                                            <div
                                                key={id}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-50 border-2 border-red-200 rounded-xl"
                                            >
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white text-xs font-bold">
                                                    {assignee?.avatar}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 leading-tight">
                                                        {assignee?.name}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {assignee?.skills.map((skill, i) => (
                                                            <span key={i} className="px-1.5 py-0.5 bg-white text-[#9B0000] text-[8px] font-black uppercase tracking-tighter rounded-md border border-red-100 shadow-sm">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleAssignee(id)}
                                                    className="ml-2 p-1 text-red-400 hover:text-red-600 transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-400 font-medium">Belum ada anggota yang ditugaskan</p>
                                    <p className="text-sm text-gray-300 mt-1">
                                        Klik "Tambah Anggota" untuk memilih tim
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-500/25 flex items-center gap-2"
                        >
                            <Send className="h-5 w-5" />
                            Kirim Instruksi
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
