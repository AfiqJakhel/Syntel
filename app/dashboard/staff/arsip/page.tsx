"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/app/components/dashboard/layout/DashboardLayout";
import {
    Search, Grid3X3, List, Download, Eye, X, Folder,
    ChevronDown, Filter, SortAsc, SortDesc, Upload,
    Plus, Loader2, Trash2, AlertCircle, FolderPlus,
    Archive, Lock, Shield, Info, Edit2, Copy, Move, MoreVertical, CheckCircle2,
    Image as ImageIcon, FileText, Check, Play, User
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
    createdAt: string;
    uploaderId: string;
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
async function checkFolderPermission(folderId: string | null, staffNip: string): Promise<boolean> {
    try {
        // 1. Cek permission di folder spesifik
        if (folderId) {
            const res = await fetch(`/api/archive/permissions?folderId=${folderId}&staffNip=${staffNip}`);
            const data = await res.json();
            const hasFullAccess = data.permissions?.some(
                (p: any) => p.staffNip === staffNip && p.accessLevel === "FULL_ACCESS"
            );
            if (hasFullAccess) return true;
        }

        // 2. Cek permission di ROOT (Global)
        const rootRes = await fetch(`/api/archive/permissions?folderId=root&staffNip=${staffNip}`);
        const rootData = await rootRes.json();
        const hasRootAccess = rootData.permissions?.some(
            (p: any) => p.staffNip === staffNip && p.accessLevel === "FULL_ACCESS"
        );

        return hasRootAccess;
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

    // Item Action States
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [fileToRename, setFileToRename] = useState<ArchiveFile | null>(null);
    const [folderToRename, setFolderToRename] = useState<ArchiveFolder | null>(null);
    const [newTitle, setNewTitle] = useState("");
    const [isRenaming, setIsRenaming] = useState(false);

    const [showMoveModal, setShowMoveModal] = useState(false);
    const [fileToMove, setFileToMove] = useState<ArchiveFile | null>(null);
    const [folderToMove, setFolderToMove] = useState<ArchiveFolder | null>(null);
    const [isMoving, setIsMoving] = useState(false);

    const [folderInfoToShow, setFolderInfoToShow] = useState<ArchiveFolder | null>(null);
    const [fileInfoToShow, setFileInfoToShow] = useState<ArchiveFile | null>(null);
    const [allPotentialFolders, setAllPotentialFolders] = useState<ArchiveFolder[]>([]);

    const [showPreview, setShowPreview] = useState(false);
    const [selectedFile, setSelectedFile] = useState<ArchiveFile | null>(null);

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
    const fetchData = useCallback(async () => {
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
                fetch(`${apiEndpoint}?${params}`),
                fetch("/api/archive/folders?all=true") // For move modal
            ];

            const [foldersRes, filesRes, allFoldersRes] = await Promise.all(fetchPromises);

            const foldersData = await foldersRes.json();
            const filesData = await filesRes.json();
            const allFoldersData = await allFoldersRes.json();

            setFolders(foldersData.folders || []);
            setFiles(filesData.files || []); // API returns { files, stats }
            setAllPotentialFolders(allFoldersData.folders || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Gagal memuat data");
        } finally {
            setIsLoading(false);
        }
    }, [currentFolderId, activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Navigate to folder
    const navigateToFolder = (id: string | null) => {
        const params = new URLSearchParams(searchParams?.toString());
        if (id) params.set("folderId", id);
        else params.delete("folderId");
        router.push(`?${params.toString()}`);
    };

    // Navigate back
    const navigateBack = () => {
        const params = new URLSearchParams(searchParams?.toString());
        params.delete("folderId");
        router.push(`?${params.toString()}`);
    };

    const formatFileSize = (bytes: number | null): string => {
        if (!bytes) return "—";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatDate = (dateStr: string): string => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const handleRename = async () => {
        if (!newTitle) return;
        setIsRenaming(true);
        try {
            const isFolder = !!folderToRename;
            const id = isFolder ? folderToRename?.id : fileToRename?.id;
            const endpoint = isFolder ? `/api/archive/folders` : `/api/archive/resources`;

            const res = await fetch(`${endpoint}?id=${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(isFolder ? { name: newTitle } : { title: newTitle }),
            });

            if (res.ok) {
                toast.success("Berhasil diubah");
                setShowRenameModal(false);
                setFileToRename(null);
                setFolderToRename(null);
                fetchData();
            } else {
                toast.error("Gagal mengubah nama");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setIsRenaming(false);
        }
    };

    const handleMove = async (targetFolderId: string | null) => {
        setIsMoving(true);
        try {
            const isFolder = !!folderToMove;
            const id = isFolder ? folderToMove?.id : fileToMove?.id;
            const endpoint = isFolder ? `/api/archive/folders` : `/api/archive/resources`;

            const res = await fetch(`${endpoint}?id=${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folderId: targetFolderId, parentId: targetFolderId }),
            });

            if (res.ok) {
                toast.success("Berhasil dipindahkan");
                setShowMoveModal(false);
                setFileToMove(null);
                setFolderToMove(null);
                fetchData();
            } else {
                toast.error("Gagal memindahkan");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setIsMoving(false);
        }
    };

    const handleCopy = async (file: ArchiveFile) => {
        const loadingToast = toast.loading("Menyalin file...");
        try {
            const res = await fetch("/api/archive/resources/copy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: file.id }),
            });

            if (res.ok) {
                toast.success("File dikopi", { id: loadingToast });
                fetchData();
            } else {
                toast.error("Gagal menyalin file", { id: loadingToast });
            }
        } catch (error) {
            toast.error("Terjadi kesalahan", { id: loadingToast });
        }
    };

    const handleCopyFolder = async (folder: ArchiveFolder) => {
        const loadingToast = toast.loading("Menyalin folder & isi...");
        try {
            const res = await fetch("/api/archive/folders/copy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: folder.id }),
            });

            if (res.ok) {
                toast.success("Folder dikopi", { id: loadingToast });
                fetchData();
            } else {
                toast.error("Gagal menyalin folder", { id: loadingToast });
            }
        } catch (error) {
            toast.error("Terjadi kesalahan", { id: loadingToast });
        }
    };

    const handleDownload = async (file: ArchiveFile) => {
        try {
            const response = await fetch(file.fileUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Ensure filename has original extension from URL if not in title
            let fileName = file.title;
            const extension = file.fileUrl.split('.').pop()?.split('?')[0];
            if (extension && !fileName.toLowerCase().endsWith('.' + extension.toLowerCase())) {
                fileName = `${fileName}.${extension}`;
            }

            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            toast.error("Gagal mengunduh file");
        }
    };

    const handleDownloadFolder = async (folder: ArchiveFolder) => {
        const loadingToast = toast.loading("Menyiapkan unduhan...");
        try {
            const res = await fetch(`/api/archive/resources?folderId=${folder.id}&limit=100`);
            const data = await res.json();

            if (data.files && data.files.length > 0) {
                toast.success(`Mengunduh ${data.files.length} file...`, { id: loadingToast });
                for (const file of data.files) {
                    await handleDownload(file);
                    await new Promise(r => setTimeout(r, 800));
                }
            } else {
                toast.error("Folder kosong", { id: loadingToast });
            }
        } catch (error) {
            toast.error("Gagal mengunduh isi folder", { id: loadingToast });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus file ini?")) return;
        try {
            const res = await fetch(`/api/archive/resources?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("File berhasil dihapus");
                fetchData();
            } else {
                toast.error("Gagal menghapus file");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        if (!confirm("Hapus folder ini beserta seluruh isinya?")) return;
        try {
            const res = await fetch(`/api/archive/folders?id=${folderId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Folder dihapus");
                fetchData();
            } else {
                toast.error("Gagal menghapus folder");
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
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                                        <Archive className="h-6 w-6 text-white" />
                                    </div>
                                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase sm:text-5xl">
                                        Arsip Dokumen
                                    </h1>
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3 ml-1">
                                    Lihat dan Kelola Dokumen <span className="w-12 h-[2px] bg-red-100"></span>
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
                                        {currentFolderId ? "Full Access - Anda bisa upload, edit, dan hapus" : "Akses Root (Full Access)"}
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

                        {/* Breadcrumbs for Folders */}
                        {activeTab === "RAW" && currentFolderId && (
                            <div className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest overflow-x-auto no-scrollbar py-2">
                                <button onClick={() => navigateToFolder(null)} className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0">Arsip</button>

                                {(() => {
                                    const path = [];
                                    let current = allPotentialFolders.find(f => f.id === currentFolderId);
                                    let safety = 0;
                                    while (current && safety < 10) {
                                        path.unshift(current);
                                        const pid = current.parentId;
                                        current = pid ? allPotentialFolders.find(f => f.id === pid) : undefined;
                                        safety++;
                                    }

                                    return path.map((f, idx) => (
                                        <React.Fragment key={f.id}>
                                            <span className="text-gray-200 flex-shrink-0">/</span>
                                            <button
                                                onClick={() => navigateToFolder(f.id)}
                                                disabled={idx === path.length - 1}
                                                className={`transition-colors flex-shrink-0 ${idx === path.length - 1 ? "text-red-600 cursor-default" : "text-gray-400 hover:text-red-600"}`}
                                            >
                                                {f.name}
                                            </button>
                                        </React.Fragment>
                                    ));
                                })()}
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
                                        {filteredFolders
                                            .sort((a, b) => {
                                                // Check for Month Names (Indonesian)
                                                // "Januari" should come before "Februari" even though 'J' > 'F'
                                                const months = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];
                                                const idxA = months.indexOf(a.name.toLowerCase().trim());
                                                const idxB = months.indexOf(b.name.toLowerCase().trim());

                                                if (idxA !== -1 && idxB !== -1) {
                                                    return idxA - idxB;
                                                }

                                                // Default / Title sort: Natural Sort (handles numbers correctly)
                                                return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
                                            })
                                            .map(folder => (
                                                <div
                                                    key={folder.id}
                                                    className="group flex items-center gap-4 bg-white border border-gray-100 p-5 rounded-2xl hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5 transition-all cursor-pointer relative"
                                                >
                                                    <div
                                                        onClick={() => navigateToFolder(folder.id)}
                                                        className="contents"
                                                    >
                                                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                                                            <Folder className="h-5 w-5 text-red-600 fill-red-600" />
                                                        </div>
                                                        <div className="min-w-0 pr-12">
                                                            <p className="text-[10px] font-black text-gray-900 uppercase truncate tracking-tight">{folder.name}</p>
                                                            <p className="text-[8px] font-bold text-gray-400 uppercase">
                                                                {folder._count?.resources || 0} Files • {folder._count?.subFolders || 0} Folders
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Dropdown Menu */}
                                                    <div className="absolute right-4 group/menu z-20">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); }}
                                                            className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-600 rounded-xl transition-all"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>

                                                        <div className="absolute right-0 mt-1 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-50 p-2 overflow-hidden">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFolderInfoToShow(folder);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-all rounded-xl"
                                                            >
                                                                <Info className="h-4 w-4" />
                                                                View Information
                                                            </button>
                                                            {hasFullAccess && (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDownloadFolder(folder);
                                                                        }}
                                                                        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-all rounded-xl"
                                                                    >
                                                                        <Download className="h-4 w-4" />
                                                                        Download
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setFolderToRename(folder);
                                                                            setNewTitle(folder.name);
                                                                            setShowRenameModal(true);
                                                                        }}
                                                                        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-all rounded-xl"
                                                                    >
                                                                        <Edit2 className="h-4 w-4" />
                                                                        Rename
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleCopyFolder(folder);
                                                                        }}
                                                                        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-all rounded-xl"
                                                                    >
                                                                        <Copy className="h-4 w-4" />
                                                                        Make a Copy
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setFolderToMove(folder);
                                                                            setShowMoveModal(true);
                                                                        }}
                                                                        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-all rounded-xl"
                                                                    >
                                                                        <Move className="h-4 w-4" />
                                                                        Move Folder
                                                                    </button>
                                                                    <div className="h-px bg-gray-50 my-1" />
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteFolder(folder.id);
                                                                        }}
                                                                        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-red-600 hover:bg-red-50 transition-all rounded-xl font-bold"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                        Delete Folder
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
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
                                                    onRename={(file) => {
                                                        setFileToRename(file);
                                                        setNewTitle(file.title);
                                                        setShowRenameModal(true);
                                                    }}
                                                    onMove={(file) => {
                                                        setFileToMove(file);
                                                        setShowMoveModal(true);
                                                    }}
                                                    onCopy={handleCopy}
                                                    onInfo={(file) => setFileInfoToShow(file)}
                                                    onDownload={handleDownload}
                                                    onPreview={(file) => {
                                                        setSelectedFile(file);
                                                        setShowPreview(true);
                                                    }}
                                                />
                                            ) : (
                                                <FileListItem
                                                    key={file.id}
                                                    file={file}
                                                    hasFullAccess={hasFullAccess}
                                                    onDelete={handleDelete}
                                                    onRename={(file) => {
                                                        setFileToRename(file);
                                                        setNewTitle(file.title);
                                                        setShowRenameModal(true);
                                                    }}
                                                    onMove={(file) => {
                                                        setFileToMove(file);
                                                        setShowMoveModal(true);
                                                    }}
                                                    onCopy={handleCopy}
                                                    onInfo={(file) => setFileInfoToShow(file)}
                                                    onDownload={handleDownload}
                                                    onPreview={(file) => {
                                                        setSelectedFile(file);
                                                        setShowPreview(true);
                                                    }}
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
                        fetchData();
                    }}
                    uploaderId={currentUser.nip}
                    currentFolderId={currentFolderId}
                />
            )}

            {/* Rename Modal */}
            <AnimatePresence>
                {showRenameModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl">
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-8">Ubah Nama {folderToRename ? "Folder" : "File"}</h2>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-red-500/5 focus:border-red-500 focus:outline-none transition-all mb-8"
                                placeholder="Masukkan nama baru..."
                                autoFocus
                            />
                            <div className="flex gap-4">
                                <button onClick={() => { setShowRenameModal(false); setFileToRename(null); setFolderToRename(null); }} className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Batal</button>
                                <button onClick={handleRename} disabled={isRenaming} className="flex-1 py-5 bg-red-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200 disabled:opacity-50">
                                    {isRenaming ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Simpan"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Move Modal */}
            <AnimatePresence>
                {showMoveModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl max-h-[80vh] flex flex-col">
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-8">Pindahkan Ke</h2>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-8 custom-scrollbar">
                                <button
                                    onClick={() => handleMove(null)}
                                    className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gray-50 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all group"
                                >
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <Archive className="h-5 w-5 text-red-600" />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Root Directory</span>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto opacity-0 group-hover:opacity-100" />
                                </button>

                                {allPotentialFolders
                                    .filter(f => {
                                        if (folderToMove && f.id === folderToMove.id) return false;
                                        return true;
                                    })
                                    .map(folder => (
                                        <button
                                            key={folder.id}
                                            onClick={() => handleMove(folder.id)}
                                            className="w-full flex items-center gap-4 p-5 rounded-2xl hover:bg-red-50 border border-transparent hover:border-red-100 transition-all group"
                                        >
                                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Folder className="h-5 w-5 text-red-600 fill-red-600" />
                                            </div>
                                            <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight truncate">{folder.name}</span>
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto opacity-0 group-hover:opacity-100" />
                                        </button>
                                    ))}
                            </div>
                            <button onClick={() => { setShowMoveModal(false); setFileToMove(null); setFolderToMove(null); }} className="w-full py-5 bg-gray-100 text-gray-500 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Batal</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Folder Info Modal */}
            <AnimatePresence>
                {folderInfoToShow && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4" onClick={() => setFolderInfoToShow(null)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Informasi Folder</h2>
                                <button onClick={() => setFolderInfoToShow(null)} className="p-3 hover:bg-gray-50 rounded-xl transition-all"><X className="h-5 w-5 text-gray-300" /></button>
                            </div>

                            <div className="flex justify-center mb-8">
                                <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center shadow-lg shadow-red-50">
                                    <Folder className="h-10 w-10 text-red-600 fill-red-600" />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2">Nama Folder</span>
                                    <p className="text-lg font-black text-gray-900 tracking-tight uppercase">{folderInfoToShow.name}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-6 rounded-3xl">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Total Isi</span>
                                        <p className="text-xs font-black text-red-600 uppercase">
                                            {folderInfoToShow._count?.resources || 0} File • {folderInfoToShow._count?.subFolders || 0} Sub
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-6 rounded-3xl">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Dibuat</span>
                                        <p className="text-xs font-black text-red-600 uppercase">
                                            {new Date(folderInfoToShow.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {folderInfoToShow.description && (
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2">Keterangan</span>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed">{folderInfoToShow.description}</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setFolderInfoToShow(null)}
                                className="w-full mt-10 py-5 bg-gray-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                            >
                                Tutup
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* File Info Modal */}
            <AnimatePresence>
                {fileInfoToShow && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4" onClick={() => setFileInfoToShow(null)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Informasi File</h2>
                                <button onClick={() => setFileInfoToShow(null)} className="p-3 hover:bg-gray-50 rounded-xl transition-all"><X className="h-5 w-5 text-gray-300" /></button>
                            </div>

                            <div className="flex justify-center mb-8">
                                <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center shadow-lg border border-gray-100 overflow-hidden">
                                    {fileInfoToShow.thumbnail ? (
                                        <img src={fileInfoToShow.thumbnail} alt={fileInfoToShow.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <FileText className="h-10 w-10 text-red-600" />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2">Nama Aset</span>
                                    <p className="text-lg font-black text-gray-900 tracking-tight uppercase">{fileInfoToShow.title}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-6 rounded-3xl">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Ukuran</span>
                                        <p className="text-xs font-black text-red-600 uppercase">
                                            {formatFileSize(fileInfoToShow.fileSize)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-6 rounded-3xl">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Dibuat</span>
                                        <p className="text-xs font-black text-red-600 uppercase">
                                            {formatDate(fileInfoToShow.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-3xl">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                        <User className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Pengunggah</span>
                                        <p className="text-xs font-bold text-gray-700 uppercase">{fileInfoToShow.author}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setFileInfoToShow(null)}
                                className="w-full mt-10 py-5 bg-gray-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                            >
                                Tutup
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview Modal */}
            <AnimatePresence>
                {showPreview && selectedFile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[500] flex items-center justify-center overflow-hidden"
                        onClick={() => setShowPreview(false)}
                    >
                        <motion.button
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-10 right-10 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-[550]"
                            onClick={() => setShowPreview(false)}
                        >
                            <X className="h-6 w-6" />
                        </motion.button>

                        <div className="w-full h-full max-w-6xl max-h-[85vh] p-4 flex items-center justify-center relative z-[510]">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                className="w-full h-full flex items-center justify-center p-4"
                                onClick={e => e.stopPropagation()}
                            >
                                {selectedFile.fileType === "IMAGE" ? (
                                    <img
                                        src={selectedFile.fileUrl}
                                        alt={selectedFile.title}
                                        className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_100px_rgba(255,255,255,0.1)]"
                                    />
                                ) : selectedFile.fileType === "VIDEO" ? (
                                    <video
                                        src={selectedFile.fileUrl}
                                        controls
                                        autoPlay
                                        className="max-w-full max-h-full rounded-2xl shadow-[0_0_100px_rgba(255,255,255,0.1)]"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-32 h-40 bg-white/10 border border-white/20 rounded-2xl flex flex-col items-center justify-center mb-8 relative group">
                                            <FileText className="h-16 w-16 text-red-500" strokeWidth={1} />
                                            <div className="absolute -bottom-3 px-4 py-1.5 bg-red-600 text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                                {selectedFile.title.split('.').pop() || 'DOC'}
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{selectedFile.title}</h3>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-10">File Dokumen • {formatFileSize(selectedFile.fileSize)}</p>
                                        {hasFullAccess && (
                                            <button
                                                onClick={() => handleDownload(selectedFile)}
                                                className="px-10 py-5 bg-red-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-2xl shadow-red-900/40 flex items-center gap-3"
                                            >
                                                <Download className="h-4 w-4" />
                                                Unduh Sekarang
                                            </button>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}

// Helper components
function FileCard({ file, hasFullAccess, onDelete, onRename, onMove, onCopy, onInfo, onDownload, onPreview }: {
    file: ArchiveFile,
    hasFullAccess: boolean,
    onDelete: (id: string) => void,
    onRename: (file: ArchiveFile) => void,
    onMove: (file: ArchiveFile) => void,
    onCopy: (file: ArchiveFile) => void,
    onInfo: (file: ArchiveFile) => void,
    onDownload: (file: ArchiveFile) => void,
    onPreview: (file: ArchiveFile) => void
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onPreview(file)}
            className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-red-200 transition-all duration-500 cursor-pointer"
        >
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden relative">
                {file.fileType === "DOCUMENT" ? (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 via-slate-50 to-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
                        {/* Decorative lines pattern */}
                        <div className="absolute inset-0 opacity-[0.04]">
                            <div className="absolute top-3 left-3 w-16 h-0.5 bg-slate-900 rounded-full" />
                            <div className="absolute top-5 left-3 w-24 h-0.5 bg-slate-900 rounded-full" />
                            <div className="absolute top-7 left-3 w-20 h-0.5 bg-slate-900 rounded-full" />
                            <div className="absolute bottom-3 right-3 w-12 h-0.5 bg-slate-900 rounded-full" />
                            <div className="absolute bottom-5 right-3 w-20 h-0.5 bg-slate-900 rounded-full" />
                        </div>

                        {/* Document Icon with Badge */}
                        <div className="relative group-hover:scale-110 transition-transform duration-500">
                            <div className="w-12 h-15 bg-white rounded-lg shadow-lg border border-slate-200/50 flex flex-col items-center justify-center relative overflow-hidden p-2">
                                <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-br from-slate-200 to-slate-100 rounded-bl-md" />
                                <FileText className="h-6 w-6 text-red-500" strokeWidth={1.5} />
                            </div>
                            {/* Extension Badge */}
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-red-600 text-white text-[6px] font-black uppercase tracking-wider rounded-full shadow-md">
                                {file.title?.split('.').pop()?.toUpperCase().slice(0, 4) || 'DOC'}
                            </div>
                        </div>
                    </div>
                ) : (
                    <img src={file.thumbnail || "/api/placeholder/400/300"} alt={file.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                )}
                <div className="absolute top-3 right-3 z-[30]">
                    <button
                        onClick={(e) => { e.stopPropagation(); onPreview(file); }}
                        className="w-8 h-8 rounded-xl bg-gray-900/40 hover:bg-gray-900/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                </div>
            </div>
            <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className="text-gray-400">
                        {file.fileType === "VIDEO" ? <Play className="h-3 w-3" fill="currentColor" /> :
                            file.fileType === "IMAGE" ? <ImageIcon className="h-3 w-3" /> :
                                <FileText className="h-3 w-3" />}
                    </div>
                    <h3 className="text-xs font-black text-gray-900 truncate uppercase tracking-tight flex-1">{file.title}</h3>
                </div>

                <div className="flex items-center justify-between mt-3 gap-2">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">
                        {file.fileSize ? `${(file.fileSize / 1024).toFixed(0)} KB` : "N/A"}
                    </p>
                    <div className="flex items-center gap-1">
                        <div className="relative group/filemenu">
                            <button
                                onClick={(e) => { e.stopPropagation(); }}
                                className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all"
                            >
                                <MoreVertical className="h-3 w-3" />
                            </button>
                            <div className="absolute right-0 bottom-full mb-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover/filemenu:opacity-100 group-hover/filemenu:visible transition-all z-50 p-2 overflow-hidden">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onInfo(file);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-all rounded-xl"
                                >
                                    <Info className="h-4 w-4" />
                                    View Information
                                </button>
                                {hasFullAccess && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDownload(file);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-all rounded-xl"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRename(file);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-all rounded-xl"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                            Rename
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onCopy(file);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-all rounded-xl"
                                        >
                                            <Copy className="h-4 w-4" />
                                            Make a Copy
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onMove(file);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-all rounded-xl"
                                        >
                                            <Move className="h-4 w-4" />
                                            Move File
                                        </button>
                                        <div className="h-px bg-gray-50 my-1" />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(file.id);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-red-600 hover:bg-red-50 transition-all rounded-xl font-bold"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete File
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function FileListItem({ file, hasFullAccess, onDelete, onRename, onMove, onCopy, onInfo, onDownload, onPreview }: {
    file: ArchiveFile,
    hasFullAccess: boolean,
    onDelete: (id: string) => void,
    onRename: (file: ArchiveFile) => void,
    onMove: (file: ArchiveFile) => void,
    onCopy: (file: ArchiveFile) => void,
    onInfo: (file: ArchiveFile) => void,
    onDownload: (file: ArchiveFile) => void,
    onPreview: (file: ArchiveFile) => void
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => onPreview(file)}
            className="group flex items-center gap-4 bg-white border border-gray-100 p-4 rounded-2xl hover:border-red-200 hover:shadow-xl transition-all cursor-pointer"
        >
            <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                {file.thumbnail ? (
                    <img src={file.thumbnail} alt={file.title} className="w-full h-full object-cover" />
                ) : (
                    <FileText className="h-5 w-5 text-red-500" />
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
                <button
                    onClick={(e) => { e.stopPropagation(); onPreview(file); }}
                    className="p-2.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all"
                >
                    <Eye className="h-4 w-4" />
                </button>
                {hasFullAccess && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDownload(file); }}
                        className="p-2.5 bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-xl transition-all"
                    >
                        <Download className="h-4 w-4" />
                    </button>
                )}

                <div className="relative group/listmenu">
                    <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="p-2.5 bg-gray-50 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-600 transition-all"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </button>
                    <div className="absolute right-0 mt-1 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover/listmenu:opacity-100 group-hover/listmenu:visible transition-all z-50 p-2 overflow-hidden">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onInfo(file);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-all rounded-xl"
                        >
                            <Info className="h-4 w-4" />
                            View Information
                        </button>
                        {hasFullAccess && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDownload(file);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-all rounded-xl"
                                >
                                    <Download className="h-4 w-4" />
                                    Download
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRename(file);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-all rounded-xl"
                                >
                                    <Edit2 className="h-4 w-4" />
                                    Rename
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCopy(file);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-all rounded-xl"
                                >
                                    <Copy className="h-4 w-4" />
                                    Make a Copy
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMove(file);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-all rounded-xl"
                                >
                                    <Move className="h-4 w-4" />
                                    Move File
                                </button>
                                <div className="h-px bg-gray-50 my-1" />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(file.id);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-red-600 hover:bg-red-50 transition-all rounded-xl font-bold"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete File
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
