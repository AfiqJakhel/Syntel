"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/app/components/dashboard/layout/DashboardLayout";
import {
    Search, Grid3X3, List, Download, Eye, X, Folder,
    ChevronDown, Filter, SortAsc, SortDesc, Upload,
    Plus, Loader2, Trash2, AlertCircle, FolderPlus,
    Archive, Lock, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResumableUploadModal } from "@/app/components/upload/ResumableUploadModal";
import { toast } from "react-hot-toast";

// Types (sama dengan officer)
type ArchiveTab = "FINISHED" | "RAW";

interface ArchiveFolder {
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    _count?: {
        resources?: number;
        subFolders?: number;
    };
}

interface ArchiveFile {
    id: string;
    title: string;
    description: string | null;
    fileUrl: string;
    thumbnail: string | null;
    fileSize: number | null;
    duration: number | null;
    cloudinaryId?: string | null;
    folderId: string | null;
    folderName?: string | null;
    contentType: string;
    fileType: "VIDEO" | "IMAGE" | "DOCUMENT";
    author: string;
    createdAt: string;
    updatedAt: string;
}

const contentTypeLabels: Record<string, string> = {
    INSTAGRAM_POST: "Instagram Post",
    INSTAGRAM_CAROUSEL: "Instagram Carousel",
    INSTAGRAM_REELS: "Instagram Reels",
    INSTAGRAM_STORY: "Instagram Story",
    TIKTOK_POST: "TikTok Post",
    YOUTUBE_VIDEO: "YouTube Video",
    POSTER: "Poster",
    DOKUMEN_INTERNAL: "Dokumen Internal",
};

// Helper untuk check permission
async function checkFolderPermission(_folderId: string | null, staffNip: string): Promise<boolean> {
    const targetFolderId = "root";

    try {
        const res = await fetch(`/api/archive/permissions?folderId=${targetFolderId}&staffNip=${staffNip}`);
        const data = await res.json();

        // Cek apakah ada permission FULL_ACCESS
        const hasFullAccess = data.permissions?.some(
            (p: any) => p.staffNip === staffNip && p.accessLevel === "FULL_ACCESS"
        );

        return hasFullAccess;
    } catch (error) {
        console.error("Error checking permission:", error);
        return false;
    }
}

export default function StaffArchivePage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Active tab with localStorage persistence
    const [activeTab, setActiveTab] = useState<ArchiveTab>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("staffArchiveActiveTab");
            return (saved === "RAW" || saved === "FINISHED") ? saved as ArchiveTab : "RAW";
        }
        return "RAW";
    });

    // Current user
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Folder navigation
    const currentFolderId = searchParams?.get("folderId") || null;
    const [breadcrumbs, setBreadcrumbs] = useState<ArchiveFolder[]>([]);

    // Data
    const [folders, setFolders] = useState<ArchiveFolder[]>([]);
    const [files, setFiles] = useState<ArchiveFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Permissions
    const [hasFullAccess, setHasFullAccess] = useState(false);
    const [isCheckingPermission, setIsCheckingPermission] = useState(false);

    // UI States
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [search, setSearch] = useState("");
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Fetch current user
    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                setCurrentUser(JSON.parse(userStr));
            } catch (e) {
                console.error("Failed to parse user data");
            }
        }
    }, []);

    // Save activeTab to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("staffArchiveActiveTab", activeTab);
        }
    }, [activeTab]);

    // Check permission untuk folder saat ini
    useEffect(() => {
        const checkPermission = async () => {
            if (!currentUser?.nip) return;

            setIsCheckingPermission(true);
            const hasAccess = await checkFolderPermission(currentFolderId, currentUser.nip);
            setHasFullAccess(hasAccess);
            setIsCheckingPermission(false);
        };

        checkPermission();
    }, [currentFolderId, currentUser]);

    // Fetch folders and files
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Build API endpoint based on active tab
                const apiEndpoint = activeTab === "FINISHED" ? "/api/archive" : "/api/archive/resources";
                const params = new URLSearchParams({
                    page: "1",
                    limit: "100",
                    ...(activeTab === "RAW" && { folderId: currentFolderId || "root" }),
                });

                const fetchPromises = [
                    activeTab === "RAW" ? fetch(`/api/archive/folders?parentId=${currentFolderId || "null"}`) : Promise.resolve({ json: async () => ({ folders: [] }) }),
                    fetch(`${apiEndpoint}?${params}`)
                ];

                const [foldersRes, filesRes] = await Promise.all(fetchPromises);

                const foldersData = await foldersRes.json();
                const filesData = await filesRes.json();

                setFolders(foldersData.folders || []);
                setFiles(filesData.files || []); // API returns { files, stats }
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Gagal memuat data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentFolderId, activeTab]);

    // Navigate to folder
    const navigateToFolder = (folderId: string) => {
        router.push(`/dashboard/staff/arsip?folderId=${folderId}`);
    };

    // Navigate back
    const navigateBack = () => {
        router.push("/dashboard/staff/arsip");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus file ini?")) return;
        try {
            const res = await fetch(`/api/archive/resources?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("File berhasil dihapus");
                setFiles(prev => prev.filter(f => f.id !== id));
            } else {
                toast.error("Gagal menghapus file");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    };

    // Filter files
    const filteredFiles = files.filter(file =>
        file.title.toLowerCase().includes(search.toLowerCase())
    );

    const filteredFolders = folders.filter(folder =>
        folder.name.toLowerCase().includes(search.toLowerCase())
    );

    // Check if user can upload (either root folder or has FULL_ACCESS)
    const canUpload = hasFullAccess;

    return (
        <DashboardLayout role="STAFF">
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
                    <div className="max-w-[120rem] mx-auto px-8 py-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
                                    <Archive className="h-8 w-8 text-red-600" />
                                    Arsip Dokumen
                                </h1>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">
                                    Lihat dan Kelola Dokumen
                                </p>
                            </div>

                            {/* Upload Button - dengan permission check */}
                            {canUpload ? (
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    disabled={isCheckingPermission}
                                    className="flex items-center gap-3 px-8 py-4 bg-red-600 text-white rounded-[2rem] shadow-xl shadow-red-200 hover:bg-red-700 transition-all font-black uppercase tracking-widest text-sm disabled:opacity-50"
                                >
                                    <Upload className="h-5 w-5" />
                                    Upload File
                                </button>
                            ) : (
                                <div className="flex items-center gap-3 px-8 py-4 bg-gray-100 text-gray-400 rounded-[2rem] font-black uppercase tracking-widest text-sm">
                                    <Lock className="h-5 w-5" />
                                    View Only
                                </div>
                            )}
                        </div>

                        {/* Tab Navigation & Permission Indicator */}
                        <div className="flex items-center justify-between mb-6">
                            {/* Permission indicator */}
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${hasFullAccess
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                                }`}>
                                {hasFullAccess ? (
                                    <>
                                        <Shield className="h-4 w-4" />
                                        {currentFolderId ? "Full Access - Anda bisa upload, edit, dan hapus" : "Akses Utama - Anda bisa upload ke root"}
                                    </>
                                ) : (
                                    <>
                                        <Eye className="h-4 w-4" />
                                        View Only - Anda hanya bisa melihat
                                    </>
                                )}
                            </div>
                            {/* Tab Navigation */}
                            <div className="bg-gray-50/80 p-1.5 rounded-[2rem] flex items-center gap-1 border border-gray-100 shadow-sm backdrop-blur-sm">
                                <button
                                    onClick={() => { setActiveTab("RAW"); }}
                                    className={`px-8 py-3.5 rounded-[1.7rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === "RAW"
                                        ? "bg-white text-red-600 shadow-xl shadow-red-500/10 border border-red-50"
                                        : "text-gray-400 hover:text-gray-600"
                                        }`}
                                >
                                    Dokumentasi
                                </button>
                                <button
                                    onClick={() => setActiveTab("FINISHED")}
                                    className={`px-8 py-3.5 rounded-[1.7rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === "FINISHED"
                                        ? "bg-white text-red-600 shadow-xl shadow-red-500/10 border border-red-50"
                                        : "text-gray-400 hover:text-gray-600"
                                        }`}
                                >
                                    Hasil Konten
                                </button>
                            </div>
                        </div>

                        {/* Search & View Mode */}
                        <div className="flex items-center justify-between mt-6">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari file atau folder..."
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-red-500/5 focus:border-red-500 focus:outline-none transition-all"
                                />
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-3 rounded-xl transition-all ${viewMode === "grid"
                                        ? "bg-white shadow-lg text-red-600"
                                        : "text-gray-400 hover:text-gray-600"
                                        }`}
                                >
                                    <Grid3X3 className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-3 rounded-xl transition-all ${viewMode === "list"
                                        ? "bg-white shadow-lg text-red-600"
                                        : "text-gray-400 hover:text-gray-600"
                                        }`}
                                >
                                    <List className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Breadcrumbs */}
                        {activeTab === "RAW" && currentFolderId && (
                            <div className="flex items-center gap-2 mt-4">
                                <button
                                    onClick={navigateBack}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                                >
                                    ← Kembali ke Root
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-[120rem] mx-auto px-8 py-10">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                        </div>
                    ) : (
                        <>
                            {/* Folders */}
                            {activeTab === "RAW" && filteredFolders.length > 0 && (
                                <div className="mb-12">
                                    <div className="flex items-center gap-3 mb-6">
                                        <FolderPlus className="h-4 w-4 text-red-600" />
                                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                                            Folders
                                        </h2>
                                    </div>
                                    <div className={viewMode === "grid"
                                        ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
                                        : "space-y-3"
                                    }>
                                        {filteredFolders.map(folder => (
                                            <div
                                                key={folder.id}
                                                onClick={() => navigateToFolder(folder.id)}
                                                className="group flex items-center gap-4 bg-white border border-gray-100 p-5 rounded-2xl hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5 transition-all cursor-pointer"
                                            >
                                                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                                                    <Folder className="h-5 w-5 text-red-600 fill-red-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] font-black text-gray-900 uppercase truncate tracking-tight">
                                                        {folder.name}
                                                    </p>
                                                    <p className="text-[8px] font-bold text-gray-400 uppercase">
                                                        {folder._count?.resources || 0} Files • {folder._count?.subFolders || 0} Folders
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Files */}
                            {filteredFiles.length > 0 ? (
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <Archive className="h-4 w-4 text-red-600" />
                                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                                            Files ({filteredFiles.length})
                                        </h2>
                                    </div>
                                    <div className={viewMode === "grid"
                                        ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6"
                                        : "space-y-3"
                                    }>
                                        {filteredFiles.map(file => (
                                            viewMode === "grid" ? (
                                                <FileCard
                                                    key={file.id}
                                                    file={file}
                                                    hasFullAccess={hasFullAccess}
                                                    onDelete={handleDelete}
                                                />
                                            ) : (
                                                <FileListItem
                                                    key={file.id}
                                                    file={file}
                                                    hasFullAccess={hasFullAccess}
                                                    onDelete={handleDelete}
                                                />
                                            )
                                        ))}
                                    </div>
                                </div>
                            ) : !isLoading && folders.length === 0 && (
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-center">
                                        <Archive className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                            Belum Ada File
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && currentUser && (
                <ResumableUploadModal
                    onClose={() => setShowUploadModal(false)}
                    onComplete={(uploadedFiles) => {
                        console.log("Upload complete:", uploadedFiles);
                        setShowUploadModal(false);
                        // Reload data
                        window.location.reload();
                    }}
                    uploaderId={currentUser.nip}
                    currentFolderId={currentFolderId}
                />
            )}
        </DashboardLayout>
    );
}

// Helper components
function FileCard({ file, hasFullAccess, onDelete }: { file: ArchiveFile, hasFullAccess: boolean, onDelete: (id: string) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-red-200 transition-all duration-500"
        >
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                {file.fileType === "IMAGE" || file.fileType === "VIDEO" ? (
                    <img
                        src={file.thumbnail || "/api/placeholder/400/300"}
                        alt={file.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "/api/placeholder/400/300";
                        }}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Archive className="h-10 w-10 text-gray-300" />
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Document</span>
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">{file.title}</h3>
                <div className="flex items-center justify-between mt-3 gap-2">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">
                        {file.fileSize ? `${(file.fileSize / 1024).toFixed(0)} KB` : "N/A"}
                    </p>
                    <div className="flex items-center gap-1">
                        <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all"
                            title="Buka / Preview"
                        >
                            <Eye className="h-3 w-3" />
                        </a>
                        <a
                            href={file.fileUrl}
                            download
                            className="p-2 bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-lg transition-all"
                            title="Download"
                        >
                            <Download className="h-3 w-3" />
                        </a>
                        {hasFullAccess && (
                            <button
                                onClick={() => onDelete(file.id)}
                                className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all"
                                title="Hapus"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function FileListItem({ file, hasFullAccess, onDelete }: { file: ArchiveFile, hasFullAccess: boolean, onDelete: (id: string) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="group flex items-center gap-4 bg-white border border-gray-100 p-4 rounded-2xl hover:border-red-200 hover:shadow-xl transition-all"
        >
            <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                {file.thumbnail ? (
                    <img src={file.thumbnail} alt={file.title} className="w-full h-full object-cover" />
                ) : (
                    <Archive className="h-5 w-5 text-gray-300" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-[11px] font-black text-gray-900 uppercase truncate tracking-tight">{file.title}</h3>
                <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">
                    {file.author} • {new Date(file.createdAt).toLocaleDateString()}
                </p>
            </div>
            <div className="text-[10px] font-black text-gray-400 uppercase">
                {file.fileSize ? `${(file.fileSize / 1024).toFixed(0)} KB` : "N/A"}
            </div>
            <div className="flex items-center gap-2">
                <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all"
                >
                    <Eye className="h-4 w-4" />
                </a>
                <a
                    href={file.fileUrl}
                    download
                    className="p-2.5 bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-xl transition-all"
                >
                    <Download className="h-4 w-4" />
                </a>
                {hasFullAccess && (
                    <button
                        onClick={() => onDelete(file.id)}
                        className="p-2.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}
