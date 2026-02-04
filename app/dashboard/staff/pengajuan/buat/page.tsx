"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X, CheckCircle, Trash2, FileText, ChevronDown } from "lucide-react";
import { DashboardLayout } from "@/app/components/dashboard/layout/DashboardLayout";
import { cn } from "@/app/lib/utils";
import toast from "react-hot-toast";

const contentTypes = [
    { value: "INSTAGRAM_POST", label: "Instagram Post" },
    { value: "INSTAGRAM_CAROUSEL", label: "Instagram Carousel" },
    { value: "INSTAGRAM_REELS", label: "Instagram Reels" },
    { value: "INSTAGRAM_STORY", label: "Instagram Story" },
    { value: "TIKTOK_POST", label: "TikTok Post" },
    { value: "YOUTUBE_VIDEO", label: "YouTube Video" },
    { value: "POSTER", label: "Poster" },
    { value: "DOKUMEN_INTERNAL", label: "Dokumen Internal" },
];

export default function BuatPengajuanPage() {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);

    // File states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    // UI States
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        contentType: "",
    });
    const [category, setCategory] = useState<"PROMOSI" | "KEGIATAN">("PROMOSI");
    const [isDraggingContent, setIsDraggingContent] = useState(false);
    const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedThumbnail(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const removeContentFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const removeThumbnailFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedThumbnail(null);
        setThumbnailPreview(null);
    };

    const handleDragOver = (e: React.DragEvent, type: "content" | "thumbnail") => {
        e.preventDefault();
        e.stopPropagation();
        if (type === "content") setIsDraggingContent(true);
        else setIsDraggingThumbnail(true);
    };

    const handleDragLeave = (e: React.DragEvent, type: "content" | "thumbnail") => {
        e.preventDefault();
        e.stopPropagation();
        if (type === "content") setIsDraggingContent(false);
        else setIsDraggingThumbnail(false);
    };

    const handleDrop = (e: React.DragEvent, type: "content" | "thumbnail") => {
        e.preventDefault();
        e.stopPropagation();
        if (type === "content") setIsDraggingContent(false);
        else setIsDraggingThumbnail(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (type === "content") {
                setSelectedFile(file);
                setPreviewUrl(URL.createObjectURL(file));
            } else {
                setSelectedThumbnail(file);
                setThumbnailPreview(URL.createObjectURL(file));
            }
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedFile) {
            toast.error("Silakan pilih file konten untuk diupload");
            return;
        }

        if (!formData.contentType) {
            toast.error("Silakan pilih tipe konten");
            return;
        }

        setUploading(true);

        const userStr = localStorage.getItem("user");
        const user = JSON.parse(userStr || "{}");

        try {
            let finalFileUrl = "";
            let finalThumbnailUrl = null;
            let finalPublicId = null;

            // 1. Upload main content to Cloudinary
            const contentFormData = new FormData();
            contentFormData.append("file", selectedFile);
            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: contentFormData,
            });
            if (!uploadRes.ok) throw new Error("Gagal upload file konten");
            const uploadData = await uploadRes.json();
            finalFileUrl = uploadData.fileUrl;
            finalThumbnailUrl = uploadData.thumbnailUrl;
            finalPublicId = uploadData.publicId;

            // 2. Upload dedicated thumbnail if provided
            if (selectedThumbnail) {
                const thumbFormData = new FormData();
                thumbFormData.append("file", selectedThumbnail);
                const thumbUploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: thumbFormData,
                });
                if (thumbUploadRes.ok) {
                    const thumbData = await thumbUploadRes.json();
                    finalThumbnailUrl = thumbData.fileUrl;
                }
            }

            // 3. Create submission record
            const submissionRes = await fetch("/api/staff/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    fileUrl: finalFileUrl,
                    thumbnail: finalThumbnailUrl || null,
                    fileSize: selectedFile.size,
                    cloudinaryId: finalPublicId || null,
                    contentType: formData.contentType,
                    category: category,
                    authorId: user.nip,
                    instructionId: null
                }),
            });

            if (!submissionRes.ok) throw new Error("Gagal menyimpan pengajuan");

            toast.success("Pengajuan berhasil dibuat!");
            router.push("/dashboard/staff/pengajuan");
        } catch (error: any) {
            console.error("Error submitting:", error);
            toast.error(error.message || "Gagal membuat pengajuan");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6 sticky top-0 z-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-400 hover:text-red-600 font-black uppercase tracking-widest text-[10px] transition-all mb-2"
                        >
                            <ArrowLeft size={16} />
                            Kembali
                        </button>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Buat Pengajuan Baru</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-8 py-8 max-w-6xl mx-auto">
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-gray-200/50 border border-gray-100"
                >
                    <div className="space-y-10">
                        {/* Title & Type Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Judul Konten <span className="text-red-600">*</span></label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold text-gray-800"
                                    placeholder="Masukkan judul konten"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Format Konten <span className="text-red-600">*</span></label>
                                <div className="relative">
                                    <select
                                        name="contentType"
                                        value={formData.contentType}
                                        onChange={handleInputChange}
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-2xl transition-all font-bold text-gray-800 outline-none appearance-none"
                                        required
                                    >
                                        <option value="">Pilih Format Konten</option>
                                        {contentTypes.map((type) => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Deskripsi</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full px-6 py-6 bg-gray-50 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-[2rem] transition-all font-semibold text-gray-700 resize-none shadow-inner"
                                placeholder="Tambahkan deskripsi atau catatan tambahan..."
                            />
                        </div>

                        {/* Category Toggle */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Tipe Konten</label>
                            <div className="flex gap-4">
                                {["PROMOSI", "KEGIATAN"].map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat as any)}
                                        className={cn(
                                            "flex-1 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all border-2",
                                            category === cat
                                                ? "bg-red-600 text-white border-red-600 shadow-xl shadow-red-100"
                                                : "bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-50 pt-10">
                            {/* Main File Upload */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between ml-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">File Konten Utama <span className="text-red-600">*</span></label>
                                    {selectedFile && (
                                        <button type="button" onClick={removeContentFile} className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors">
                                            <Trash2 size={12} />
                                            <span className="text-[9px] font-black uppercase">Hapus</span>
                                        </button>
                                    )}
                                </div>
                                <input type="file" id="content-upload" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                                <label
                                    htmlFor="content-upload"
                                    onDragOver={(e) => handleDragOver(e, "content")}
                                    onDragLeave={(e) => handleDragLeave(e, "content")}
                                    onDrop={(e) => handleDrop(e, "content")}
                                    className={cn(
                                        "flex flex-col items-center justify-center h-[240px] rounded-[2.5rem] border-4 border-dashed transition-all cursor-pointer group text-center p-6 relative overflow-hidden",
                                        isDraggingContent ? "border-red-500 bg-red-50" : (selectedFile || previewUrl) ? "bg-emerald-50 border-emerald-300" : "bg-gray-50 border-gray-100 hover:border-red-300 hover:bg-red-50/30"
                                    )}
                                >
                                    {previewUrl ? (
                                        <div className="absolute inset-0">
                                            {selectedFile?.type.startsWith('video') || previewUrl.match(/\.(mp4|webm|mov|ogg)$/i) || previewUrl.includes('video/upload') ? (
                                                <video src={previewUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-white text-[10px] font-black uppercase tracking-widest bg-red-600 px-4 py-2 rounded-full">Ganti File Konten</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform">
                                                <Upload size={32} className={cn("transition-colors", isDraggingContent ? "text-red-500" : "text-gray-300 group-hover:text-red-500")} />
                                            </div>
                                            <p className="font-black text-[11px] text-gray-900 uppercase">Upload Konten Utama</p>
                                            <p className="text-[9px] text-gray-400 font-bold mt-1">Seret file ke sini atau klik</p>
                                        </>
                                    )}
                                </label>
                            </div>

                            {/* Thumbnail Upload */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between ml-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Thumbnail (Opsional)</label>
                                    {selectedThumbnail && (
                                        <button type="button" onClick={removeThumbnailFile} className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors">
                                            <Trash2 size={12} />
                                            <span className="text-[9px] font-black uppercase">Hapus</span>
                                        </button>
                                    )}
                                </div>
                                <input type="file" id="thumb-upload" className="hidden" accept="image/*" onChange={handleThumbnailChange} />
                                <label
                                    htmlFor="thumb-upload"
                                    onDragOver={(e) => handleDragOver(e, "thumbnail")}
                                    onDragLeave={(e) => handleDragLeave(e, "thumbnail")}
                                    onDrop={(e) => handleDrop(e, "thumbnail")}
                                    className={cn(
                                        "flex flex-col items-center justify-center h-[240px] rounded-[2.5rem] border-4 border-dashed transition-all cursor-pointer group text-center p-6 relative overflow-hidden",
                                        isDraggingThumbnail ? "border-amber-500 bg-amber-50" : (selectedThumbnail || thumbnailPreview) ? "bg-amber-50 border-amber-300" : "bg-gray-50 border-gray-100 hover:border-amber-300 hover:bg-amber-50/30"
                                    )}
                                >
                                    {thumbnailPreview ? (
                                        <div className="absolute inset-0">
                                            <img src={thumbnailPreview} className="w-full h-full object-cover" alt="Thumb Preview" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-white text-[10px] font-black uppercase tracking-widest bg-amber-600 px-4 py-2 rounded-full">Ganti Thumbnail</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform">
                                                <Upload size={32} className={cn("transition-colors", isDraggingThumbnail ? "text-amber-500" : "text-gray-300 group-hover:text-amber-500")} />
                                            </div>
                                            <p className="font-black text-[11px] text-gray-900 uppercase">Upload Thumbnail</p>
                                            <p className="text-[9px] text-gray-400 font-bold mt-1 text-center px-4">Seret atau klik untuk sampul konten</p>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-6 pt-10 border-t border-gray-50">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 py-5 bg-white text-gray-400 border-2 border-gray-100 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-50 hover:text-gray-600 transition-all active:scale-95"
                            >
                                Batalkan Pengajuan
                            </button>
                            <button
                                type="submit"
                                disabled={uploading || !selectedFile}
                                className="flex-[2] py-5 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-red-600 transition-all shadow-2xl shadow-gray-200 hover:shadow-red-200 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                            >
                                {uploading ? "SINKRONISASI KE SERVER..." : "Kirim Pengajuan Sekarang"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

