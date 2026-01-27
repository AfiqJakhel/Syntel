"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";
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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        contentType: "",
    });
    const [category, setCategory] = useState<"PROMOSI" | "KEGIATAN">("PROMOSI");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
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
            alert("Silakan pilih file untuk diupload");
            return;
        }

        if (!formData.contentType) {
            alert("Silakan pilih tipe konten");
            return;
        }

        setUploading(true);

        const userStr = localStorage.getItem("user");
        const user = JSON.parse(userStr || "{}");

        try {
            // 1. Upload file to Cloudinary
            const uploadFormData = new FormData();
            uploadFormData.append("file", selectedFile);

            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: uploadFormData,
            });

            if (!uploadRes.ok) throw new Error("Gagal upload file");
            const uploadData = await uploadRes.json();

            // 2. Create submission record
            const submissionRes = await fetch("/api/staff/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    fileUrl: uploadData.fileUrl,
                    thumbnail: uploadData.thumbnailUrl || null,
                    fileSize: selectedFile.size,
                    cloudinaryId: uploadData.publicId || null,
                    contentType: formData.contentType,
                    category: category,
                    authorId: user.nip,
                    instructionId: null // Initiative has no instruction
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Kembali</span>
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Buat Pengajuan Baru</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Upload konten untuk mendapatkan approval dari officer
                </p>
            </div>

            {/* Content */}
            <div className="px-8 py-8 max-w-4xl mx-auto">
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-xl p-8 shadow-sm border border-gray-100"
                >
                    <div className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Judul Konten <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                placeholder="Masukkan judul konten"
                                required
                            />
                        </div>

                        {/* Content Type */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tipe Konten <span className="text-red-600">*</span>
                            </label>
                            <select
                                name="contentType"
                                value={formData.contentType}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all bg-white"
                                required
                            >
                                <option value="">Pilih tipe konten</option>
                                {contentTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Deskripsi
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={5}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                                placeholder="Tambahkan deskripsi atau catatan tentang konten ini"
                            />
                        </div>

                        {/* Category Selection */}
                        <div className="space-y-4">
                            <label className="block text-sm font-semibold text-gray-700">Tipe Konten (Kategori)</label>
                            <div className="flex gap-4">
                                {["PROMOSI", "KEGIATAN"].map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat as any)}
                                        className={cn(
                                            "flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all border-2",
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

                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Upload File <span className="text-red-600">*</span>
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-red-500 transition-colors">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                    accept="image/*,video/*,.pdf,.doc,.docx"
                                    required
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="cursor-pointer flex flex-col items-center"
                                >
                                    <Upload size={64} className="text-gray-400 mb-4" />
                                    {selectedFile ? (
                                        <div>
                                            <p className="text-base font-semibold text-gray-900">
                                                {selectedFile.name}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-2">
                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setSelectedFile(null);
                                                }}
                                                className="mt-4 text-sm text-red-600 hover:underline"
                                            >
                                                Ganti file
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-base font-semibold text-gray-700">
                                                Klik untuk upload file
                                            </p>
                                            <p className="text-sm text-gray-500 mt-2">
                                                PNG, JPG, MP4, MOV, PDF, atau DOC (Max 100MB)
                                            </p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                <span className="font-semibold">💡 Tips:</span> Pastikan konten
                                yang Anda upload sudah sesuai dengan guidelines dan siap untuk
                                direview oleh officer.
                            </p>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all active:scale-95"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={uploading}
                                className="flex-1 py-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? "Mengupload..." : "Submit Pengajuan"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
