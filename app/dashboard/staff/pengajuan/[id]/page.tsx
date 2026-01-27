"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Calendar, User, Upload, FileText, Users, CheckCircle, AlertCircle, X, Trash2, Download } from "lucide-react";
import { DashboardLayout } from "@/app/components/dashboard/layout/DashboardLayout";
import { cn } from "@/app/lib/utils";
import toast from "react-hot-toast";

interface Assignee {
    nip: string;
    name: string;
    role: string;
}

interface InstructionDetail {
    id: string;
    title: string;
    description: string;
    deadline: string;
    priority: string;
    contentType: string;
    thumbnail: string | null;
    issuer: {
        nip: string;
        name: string;
    };
    assignees: Assignee[];
    isSubmitted: boolean;
    submission: {
        id: string;
        title: string;
        description?: string;
        fileUrl?: string;
        thumbnail?: string;
        category?: string;
        status: string;
        submittedBy: string;
        submittedAt: string;
        feedback?: string;
    } | null;
}

export default function AssignmentDetailPage() {
    const router = useRouter();
    const params = useParams();
    const instructionId = params.id as string;

    const [detail, setDetail] = useState<InstructionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [submissionTitle, setSubmissionTitle] = useState("");
    const [submissionDescription, setSubmissionDescription] = useState("");
    const [category, setCategory] = useState<"PROMOSI" | "KEGIATAN">("PROMOSI");
    const [isDraggingContent, setIsDraggingContent] = useState(false);
    const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);

    useEffect(() => {
        fetchDetail();
    }, [instructionId]);

    const fetchDetail = async () => {
        try {
            const res = await fetch(`/api/staff/instructions/${instructionId}`);
            if (!res.ok) throw new Error("Gagal mengambil detail");
            const data = await res.json();
            setDetail(data);

            // Auto-populate form if submission exists (for revision or view)
            if (data.submission) {
                setSubmissionTitle(data.submission.title);
                setSubmissionDescription(data.submission.description || "");
                if (data.submission.category) setCategory(data.submission.category as any);
                setPreviewUrl(data.submission.fileUrl || null);
                setThumbnailPreview(data.submission.thumbnail || null);
            } else {
                setSubmissionTitle(data.title);
            }

            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error("Instruksi tidak ditemukan");
            setLoading(false);
        }
    };

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

    const handleUndoSubmit = async () => {
        if (!detail?.submission?.id) return;

        if (!confirm("Apakah Anda yakin ingin membatalkan submission ini? Pemberian tugas akan kembali ke status pending.")) {
            return;
        }

        const prevSubmission = detail.submission;
        setUploading(true);
        try {
            const res = await fetch(`/api/staff/submissions/${detail.submission.id}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Gagal membatalkan submission");
            }

            // Restore data to form states before refreshing
            setSubmissionTitle(prevSubmission.title);
            setSubmissionDescription(prevSubmission.description || "");
            if (prevSubmission.category) setCategory(prevSubmission.category as any);
            setPreviewUrl(prevSubmission.fileUrl || null);
            setThumbnailPreview(prevSubmission.thumbnail || null);
            // Clear selected files since they are now represented by preview URLs (existing on server)
            setSelectedFile(null);
            setSelectedThumbnail(null);

            toast.success("Submission berhasil dibatalkan. Data Anda telah dikembalikan ke formulir.");
            fetchDetail(); // Refresh page state (isSubmitted will become false)
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Allow submission if there's a new file OR an existing one (indicated by previewUrl)
        if (!selectedFile && !previewUrl) return toast.error("Pilih file video/konten terlebih dahulu");

        setUploading(true);
        const userStr = localStorage.getItem("user");
        const user = JSON.parse(userStr || "{}");

        try {
            let finalFileUrl = previewUrl || "";
            let finalThumbnailUrl = thumbnailPreview || null;
            let finalPublicId = null;

            // 1. Upload new main file if selected
            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) throw new Error("Gagal upload file utama");
                const uploadData = await uploadRes.json();
                finalFileUrl = uploadData.fileUrl;
                finalThumbnailUrl = uploadData.thumbnailUrl;
                finalPublicId = uploadData.publicId;
            }

            // 2. Upload new thumbnail if selected specifically
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
                    title: submissionTitle,
                    description: submissionDescription,
                    fileUrl: finalFileUrl,
                    thumbnail: finalThumbnailUrl || null,
                    fileSize: selectedFile ? selectedFile.size : 0, // Fallback to 0 if keeping existing
                    cloudinaryId: finalPublicId || null,
                    contentType: detail?.contentType,
                    category: category,
                    authorId: user.nip,
                    instructionId: instructionId
                }),
            });

            if (!submissionRes.ok) throw new Error("Gagal menyimpan submission");

            toast.success("Tugas berhasil dikirim!");
            fetchDetail(); // Refresh to show completed state
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan");
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout role="STAFF">
                <div className="flex items-center justify-center p-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!detail) return null;

    return (
        <DashboardLayout role="STAFF">
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Navigation & Header */}
                <div className="flex flex-col gap-6">
                    <button
                        onClick={() => router.push("/dashboard/staff/pengajuan")}
                        className="flex items-center gap-2 text-gray-400 hover:text-red-600 font-black uppercase tracking-widest text-[10px] transition-all w-fit"
                    >
                        <ArrowLeft size={16} />
                        Kembali ke Daftar Instruksi
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">
                                    {detail.id}
                                </span>
                                <span className={cn(
                                    "px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest",
                                    detail.priority === "HIGH" ? "bg-red-100 text-red-600" :
                                        detail.priority === "MEDIUM" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                                )}>
                                    {detail.priority} PRIORITY
                                </span>
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">
                                {detail.title}
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {detail.isSubmitted && detail.submission?.status !== "REVISION" ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                {/* Success Header Card */}
                                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-emerald-50">
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 flex-shrink-0">
                                            <CheckCircle className="text-white" size={32} />
                                        </div>
                                        <div className="text-center md:text-left">
                                            <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Instruksi Selesai!</h2>
                                            <p className="text-gray-600 font-bold text-sm">
                                                Tugas disubmit oleh <span className="text-emerald-700">{detail.submission?.submittedBy}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleUndoSubmit}
                                        disabled={uploading || detail.submission?.status === "APPROVED"}
                                        className="px-8 py-4 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        {uploading ? "MEMPROSES..." : "Batal Submit (Undo)"}
                                    </button>
                                </div>

                                {/* Submission Detail View */}
                                <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
                                    {/* Preview Section */}
                                    {detail.submission?.fileUrl && (
                                        <div className="relative aspect-video w-full bg-black">
                                            {detail.submission.fileUrl.match(/\.(mp4|webm|mov|ogg)$/i) || detail.submission.fileUrl.includes('video/upload') ? (
                                                <video
                                                    src={detail.submission.fileUrl}
                                                    className="w-full h-full object-contain"
                                                    controls
                                                    poster={detail.submission.thumbnail || undefined}
                                                />
                                            ) : (
                                                <img
                                                    src={detail.submission.fileUrl}
                                                    className="w-full h-full object-contain"
                                                    alt="Submitted Work"
                                                />
                                            )}

                                            <div className="absolute top-6 left-6 flex gap-2">
                                                <div className="bg-emerald-600/90 backdrop-blur-md text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl">
                                                    HASIL KARYA FINAL
                                                </div>
                                                <a
                                                    href={detail.submission.fileUrl}
                                                    download
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-white/90 backdrop-blur-md text-gray-900 h-9 w-9 rounded-full flex items-center justify-center shadow-2xl hover:bg-red-600 hover:text-white transition-all transform hover:scale-110"
                                                    title="Download Konten Utama"
                                                >
                                                    <Download size={16} />
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-10 space-y-10">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-gray-50 pb-8">
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest leading-none">
                                                        {detail.submission?.category || "UMUM"}
                                                    </span>
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black rounded-lg uppercase tracking-widest leading-none">
                                                        {(detail.contentType || "GENERAL").replace(/_/g, " ")}
                                                    </span>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                                        • DISUBMIT: {new Date(detail.submission?.submittedAt || "").toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <h3 className="text-4xl font-black text-gray-900 italic tracking-tight uppercase leading-tight">
                                                    {detail.submission?.title}
                                                </h3>
                                            </div>

                                            <div className="bg-gray-50 px-8 py-4 rounded-3xl border border-gray-100 shadow-sm text-center min-w-[120px]">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Status</p>
                                                <p className={cn(
                                                    "font-black italic tracking-tighter text-lg uppercase",
                                                    detail.submission?.status === "APPROVED" ? "text-emerald-600" :
                                                        detail.submission?.status === "REVISION" ? "text-amber-600" : "text-blue-600"
                                                )}>
                                                    {detail.submission?.status}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Full Width Assets Block */}
                                        <div className="space-y-10">
                                            {/* Thumbnail Section */}
                                            {detail.submission?.thumbnail && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between ml-2">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Thumbnail Hasil Karya</p>
                                                        <a
                                                            href={detail.submission.thumbnail}
                                                            download
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-red-600 hover:text-red-800 transition-colors flex items-center gap-2"
                                                        >
                                                            <span className="text-[9px] font-black uppercase">Download Thumbnail</span>
                                                            <Download size={14} />
                                                        </a>
                                                    </div>
                                                    <div className="relative group aspect-video rounded-[3rem] overflow-hidden shadow-xl border-4 border-white">
                                                        <img
                                                            src={detail.submission.thumbnail}
                                                            className="w-full h-full object-cover"
                                                            alt="Submitted Thumbnail"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <a
                                                                href={detail.submission.thumbnail}
                                                                download
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="bg-white text-gray-900 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-3 transform translate-y-4 group-hover:translate-y-0 transition-all"
                                                            >
                                                                <Download size={18} /> DOWNLOAD THUMBNAIL
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Description Section */}
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Deskripsi & Catatan Pengirim</p>
                                                <div className="bg-gray-50 p-10 rounded-[3rem] border-2 border-transparent italic text-gray-700 font-semibold leading-relaxed shadow-inner">
                                                    &quot;{detail.submission?.description || "Tidak ada catatan tambahan."}&quot;
                                                </div>
                                            </div>
                                        </div>

                                        {detail.submission?.feedback && (
                                            <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[2rem] space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-200">
                                                        <AlertCircle size={16} />
                                                    </div>
                                                    <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Feedback dari Officer</p>
                                                </div>
                                                <p className="font-bold text-gray-800 leading-relaxed italic border-l-4 border-red-500 pl-6 py-2">
                                                    {detail.submission.feedback}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
                                <div className="p-10 space-y-8">
                                    {detail.submission?.status === "REVISION" && detail.submission.feedback && (
                                        <div className="p-8 bg-amber-50 border-2 border-amber-100 rounded-[3rem] space-y-4 shadow-xl shadow-amber-50 animate-in slide-in-from-top-4 duration-500">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                                                    <AlertCircle size={24} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-amber-900 leading-none italic uppercase">Revisi Diperlukan</h3>
                                                    <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-1">Periksa catatan dan kirim ulang hasil karya Anda</p>
                                                </div>
                                            </div>
                                            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-[2rem] border-2 border-amber-100 italic text-gray-700 font-semibold leading-relaxed">
                                                &quot;{detail.submission.feedback}&quot;
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                                        <div className="h-12 w-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200">
                                            <Upload size={24} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl italic">{detail.submission?.status === "REVISION" ? "Upload Revisi Karya" : "Upload Hasil Karya"}</h3>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kirimkan file sesuai instruksi di bawah</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-8">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Judul Video / Konten</label>
                                            <input
                                                type="text"
                                                placeholder="Contoh: Highlight Event Indibiz"
                                                value={submissionTitle}
                                                onChange={(e) => setSubmissionTitle(e.target.value)}
                                                className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-[2rem] transition-all font-bold text-gray-800 shadow-inner"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Deskripsi & Catatan</label>
                                            <textarea
                                                placeholder="Tuliskan catatan atau deskripsi tambahan mengenai hasil karya Anda..."
                                                value={submissionDescription}
                                                onChange={(e) => setSubmissionDescription(e.target.value)}
                                                className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-[2.5rem] transition-all font-semibold text-gray-700 min-h-[120px] resize-none shadow-inner"
                                            />
                                        </div>

                                        {/* Main File Upload */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">File Video / Konten</label>
                                                {selectedFile && (
                                                    <button
                                                        type="button"
                                                        onClick={removeContentFile}
                                                        className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors"
                                                    >
                                                        <Trash2 size={12} />
                                                        <span className="text-[9px] font-black uppercase">Hapus File</span>
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                id="staff-submission-upload"
                                                className="hidden"
                                                accept="image/*,video/*"
                                                onChange={handleFileChange}
                                            />
                                            <label
                                                htmlFor="staff-submission-upload"
                                                onDragOver={(e) => handleDragOver(e, "content")}
                                                onDragLeave={(e) => handleDragLeave(e, "content")}
                                                onDrop={(e) => handleDrop(e, "content")}
                                                className={cn(
                                                    "flex flex-col items-center justify-center h-[180px] rounded-[2.5rem] border-4 border-dashed transition-all cursor-pointer group text-center p-4 relative overflow-hidden",
                                                    isDraggingContent ? "border-red-500 bg-red-50" :
                                                        (selectedFile || previewUrl) ? "bg-emerald-50 border-emerald-300" : "bg-gray-50 border-gray-100 hover:border-red-300 hover:bg-red-50/30"
                                                )}
                                            >
                                                {(selectedFile || previewUrl) ? (
                                                    <div className="flex flex-col items-center">
                                                        <CheckCircle className="text-emerald-500 mb-2" size={32} />
                                                        <p className="font-black text-gray-900 text-xs truncate max-w-full px-4">
                                                            {selectedFile ? selectedFile.name : "File tersimpan dari submission sebelumnya"}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">SERET ATAU KLIK UNTUK MENGGANTI FILE</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload size={32} className={cn("transition-colors mb-2", isDraggingContent ? "text-red-500 animate-bounce" : "text-gray-300 group-hover:text-red-500")} />
                                                        <p className="font-black text-[10px] text-gray-900 uppercase">{isDraggingContent ? "LEPASKAN FILE DISINI" : "UPLOAD ATAU SERET FILE DISINI"}</p>
                                                        {!isDraggingContent && <p className="text-[9px] text-gray-400 font-bold mt-1">MAKSIMAL 100MB (PNG, JPG, MP4)</p>}
                                                    </>
                                                )}
                                            </label>
                                        </div>

                                        {/* Main Content Preview - NOW LOCATED HERE */}
                                        {previewUrl && (
                                            <div className="space-y-4 pt-2">
                                                <div className="flex items-center justify-between ml-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Main Content Preview</label>
                                                </div>
                                                <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white group">
                                                    {(selectedFile?.type.startsWith('video') || previewUrl.match(/\.(mp4|webm|mov|ogg)$/i) || previewUrl.includes('video/upload')) ? (
                                                        <video src={previewUrl} className="w-full h-full object-cover" controls />
                                                    ) : (
                                                        <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={removeContentFile}
                                                        className="absolute top-4 right-4 h-10 w-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 active:scale-95"
                                                    >
                                                        <X size={20} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Thumbnail Upload */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Foto Thumbnail</label>
                                                {selectedThumbnail && (
                                                    <button
                                                        type="button"
                                                        onClick={removeThumbnailFile}
                                                        className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors"
                                                    >
                                                        <Trash2 size={12} />
                                                        <span className="text-[9px] font-black uppercase">Hapus Thumbnail</span>
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                id="staff-thumbnail-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleThumbnailChange}
                                            />
                                            <label
                                                htmlFor="staff-thumbnail-upload"
                                                onDragOver={(e) => handleDragOver(e, "thumbnail")}
                                                onDragLeave={(e) => handleDragLeave(e, "thumbnail")}
                                                onDrop={(e) => handleDrop(e, "thumbnail")}
                                                className={cn(
                                                    "flex flex-col items-center justify-center h-[200px] rounded-[2.5rem] border-4 border-dashed transition-all cursor-pointer group text-center p-4 relative overflow-hidden",
                                                    isDraggingThumbnail ? "border-red-500 bg-red-50" :
                                                        (selectedThumbnail || thumbnailPreview) ? "bg-amber-50 border-amber-300" : "bg-gray-50 border-gray-100 hover:border-red-300 hover:bg-red-50/30"
                                                )}
                                            >
                                                {thumbnailPreview ? (
                                                    <img src={thumbnailPreview} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Thumbnail Preview" />
                                                ) : null}

                                                <div className="relative z-10 flex flex-col items-center bg-white/70 backdrop-blur-md p-4 rounded-3xl border border-white/50 shadow-xl group-hover:scale-105 transition-transform duration-300">
                                                    <Upload size={24} className={cn("mb-1", isDraggingThumbnail ? "text-red-500 animate-bounce" : "text-gray-400 group-hover:text-red-500")} />
                                                    <p className="font-black text-[9px] text-gray-900 uppercase">
                                                        {isDraggingThumbnail ? "LEPASKAN DISINI" : (selectedThumbnail || thumbnailPreview) ? "GANTI THUMBNAIL" : "UPLOAD ATAU SERET THUMBNAIL"}
                                                    </p>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Tipe Konten</label>
                                            <div className="flex gap-2">
                                                {["PROMOSI", "KEGIATAN"].map((cat) => (
                                                    <button
                                                        key={cat}
                                                        type="button"
                                                        onClick={() => setCategory(cat as any)}
                                                        className={cn(
                                                            "flex-1 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all border-2",
                                                            category === cat
                                                                ? "bg-red-600 text-white border-red-600 shadow-xl shadow-red-200"
                                                                : "bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100"
                                                        )}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>



                                        <button
                                            type="submit"
                                            disabled={uploading || (!selectedFile && !previewUrl)}
                                            className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-red-600 hover:shadow-[0_20px_40px_rgba(220,38,38,0.3)] transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                                        >
                                            {uploading ? "SINKRONISASI KE SERVER..." : detail.submission?.status === "REVISION" ? "KIRIM REVISI SEKARANG" : "KIRIM SEKARANG"}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-8">
                        {/* Brief Details */}
                        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 space-y-6">
                            <h3 className="text-lg font-black text-gray-900 leading-none italic uppercase">Brief & Informasi</h3>

                            <div className="space-y-4">
                                <div className="p-6 bg-gray-50 rounded-2xl border border-transparent min-h-[160px]">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deskripsi Tugas</p>
                                    <p className="text-sm font-bold text-gray-700 leading-relaxed">{detail.description || "Tidak ada deskripsi tambahan."}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-6 bg-gray-50 rounded-2xl border border-transparent overflow-hidden">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Materi</p>
                                        <p className="text-sm font-black text-gray-900 leading-tight">
                                            {(detail.contentType || "GENERAL").replace(/_/g, " ")}
                                        </p>
                                    </div>
                                    <div className="p-6 bg-gray-50 rounded-2xl border border-transparent overflow-hidden">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deadline</p>
                                        <p className="text-sm font-black text-red-600 leading-tight">
                                            {new Date(detail.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50 rounded-2xl border border-transparent flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs">
                                        {detail.issuer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Diberikan Oleh</p>
                                        <p className="text-xs font-black text-gray-800">{detail.issuer.name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Team Members */}
                        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-gray-900 leading-none italic uppercase">Team Assignee</h3>
                                <span className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-600">{detail.assignees.length}</span>
                            </div>

                            <div className="space-y-3">
                                {detail.assignees.map((person) => (
                                    <div key={person.nip} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                                        <div className="h-9 w-9 bg-red-50 rounded-xl flex items-center justify-center text-red-600 font-bold text-xs border border-red-100 shadow-sm">
                                            {person.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-800 leading-none mb-1">{person.name}</p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">{person.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-3">
                                <AlertCircle className="text-blue-500 flex-shrink-0" size={16} />
                                <p className="text-[10px] font-bold text-blue-700 leading-relaxed italic">
                                    Tugas ini bersifat kolaboratif. Jika salah satu anggota mengirimkan tugas, maka status untuk anggota lainnya juga akan dianggap selesai.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
