"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/app/components/dashboard/layout/DashboardLayout";
import {
    Search,
    Grid3X3,
    List,
    Play,
    Download,
    Eye,
    X,
    Clock,
    User,
    FileVideo,
    Image as ImageIcon,
    FileText,
    Folder,
    ChevronDown,
    Filter,
    SortAsc,
    SortDesc,
    MoreVertical,
    CheckCircle2,
    Calendar,
    Info,
    Upload,
    Video,
    Plus,
    Loader2,
    Trash2,
    AlertCircle,
    Check,
    Scissors,
    Briefcase,
    FolderPlus,
    Archive
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResumableUploadModal } from "@/app/components/upload/ResumableUploadModal";
import { toast } from "react-hot-toast";
import { fetchWithDedup, invalidateCache } from "@/lib/fetchWithDedup";


interface ArchiveFile {
    id: string;
    title: string;
    description: string | null;
    fileUrl: string;
    thumbnail: string | null;
    fileSize: number | null;
    duration: number | null;
    cloudinaryId?: string | null;
    folderId?: string | null;
    folderName?: string | null;
    contentType: string;
    fileType: "VIDEO" | "IMAGE" | "DOCUMENT";
    author: string;
    authorNip?: string;
    reviewer?: string | null;
    instructionTitle?: string | null;
    createdAt: string;
    updatedAt: string;
    approvedAt?: string;
}

interface ArchiveFolder {
    id: string;
    name: string;
    description: string | null;
    parentId?: string | null;
    parent?: ArchiveFolder | null;
    _count?: {
        resources: number;
        subFolders?: number;
    };
    createdAt: string;
}

interface ArchiveStats {
    total: number;
    totalPages: number;
    currentPage: number;
    contentTypeCounts?: Record<string, number>;
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

type ArchiveTab = "FINISHED" | "RAW";

// Helper function for file size formatting
function formatFileSizeHelper(bytes: number | null): string {
    if (!bytes) return "—";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function ArchivePage() {
    const router = useRouter();
    // Initialize activeTab from localStorage or default to "FINISHED"
    const [activeTab, setActiveTab] = useState<ArchiveTab>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("archiveActiveTab");
            return (saved === "RAW" || saved === "FINISHED") ? saved as ArchiveTab : "FINISHED";
        }
        return "FINISHED";
    });
    const [files, setFiles] = useState<ArchiveFile[]>([]);
    const [folders, setFolders] = useState<ArchiveFolder[]>([]);
    const [stats, setStats] = useState<ArchiveStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedFile, setSelectedFile] = useState<ArchiveFile | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [newFolderDescription, setNewFolderDescription] = useState("");
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [uploadModalKey, setUploadModalKey] = useState(0);

    // Multi-select feature
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // Bulk Upload States
    const [uploadQueue, setUploadQueue] = useState<File[]>([]);
    const [isUploadingBulk, setIsUploadingBulk] = useState(false);
    const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
    const [uploadDescription, setUploadDescription] = useState("");
    const [showFloatingProgress, setShowFloatingProgress] = useState(false);

    // Deletion states
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Folder delete modal state
    const [folderToDelete, setFolderToDelete] = useState<ArchiveFolder | null>(null);
    const [isDeletingFolder, setIsDeletingFolder] = useState(false);

    // Filters
    const [search, setSearch] = useState("");
    const [contentTypeFilter, setContentTypeFilter] = useState("ALL");
    const [sortBy, setSortBy] = useState("updatedAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState(1);
    const searchParams = useSearchParams();
    const folderParam = searchParams ? searchParams.get("folder") : null;
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(folderParam);

    // Handle folder navigation (URL-driven to prevent double-fetch blink)
    const navigateToFolder = useCallback((id: string | null) => {
        if (!searchParams) return;

        const params = new URLSearchParams(searchParams.toString());
        if (id) {
            params.set("folder", id);
        } else {
            params.delete("folder");
        }

        const queryString = params.toString();
        const fullPath = `${window.location.pathname}${queryString ? `?${queryString}` : ""}`;
        router.push(fullPath, { scroll: false });
    }, [router, searchParams]);

    // Sync state with URL (for back/forward buttons)
    useEffect(() => {
        if (!searchParams) return;
        const folderInUrl = searchParams.get("folder");
        if (folderInUrl !== currentFolderId) {
            setCurrentFolderId(folderInUrl);
        }

    }, [searchParams, currentFolderId]);

    // Dropdowns
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const sortDropdownRef = useRef<HTMLDivElement>(null);
    const infoSidebarRef = useRef<HTMLDivElement>(null);
    const lastRequestId = useRef(0);

    // User data for uploaderId
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Save activeTab to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("archiveActiveTab", activeTab);
        }
    }, [activeTab]);

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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
                setShowSortDropdown(false);
            }
        };

        if (showSortDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showSortDropdown]);

    // Close info sidebar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (infoSidebarRef.current && !infoSidebarRef.current.contains(event.target as Node)) {
                setShowInfo(false);
            }
        };

        if (showInfo) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showInfo]);

    // Prevent page refresh/close during upload
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isUploadingBulk) {
                e.preventDefault();
                e.returnValue = "Upload sedang berjalan. Yakin ingin meninggalkan halaman?";
                return e.returnValue;
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [isUploadingBulk]);

    const fetchArchive = useCallback(async (options?: { silent?: boolean }) => {
        const requestId = ++lastRequestId.current;
        if (!options?.silent) setIsLoading(true);
        try {
            // Fetch Resources
            const apiEndpoint = activeTab === "FINISHED" ? "/api/archive" : "/api/archive/resources";
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "24",
                sortBy,
                sortOrder,
                ...(activeTab === "FINISHED" && contentTypeFilter !== "ALL" && { contentType: contentTypeFilter }),
                ...(activeTab === "RAW" && { folderId: currentFolderId || "root" }),
                ...(search && { search }),
            });

            // Build all fetch promises to run in parallel (using dedup to prevent double calls)
            const fetchPromises: Promise<any>[] = [
                fetchWithDedup(`${apiEndpoint}?${params}`)
            ];

            // Add folder info fetch if inside a folder (for breadcrumbs)
            if (currentFolderId) {
                fetchPromises.push(
                    fetchWithDedup(`/api/archive/folders?id=${currentFolderId}`)
                );
            }

            // Add subfolder fetch if in RAW tab without search
            if (activeTab === "RAW" && !search) {
                fetchPromises.push(
                    fetchWithDedup(`/api/archive/folders?parentId=${currentFolderId || "null"}`)
                );
            }

            // Execute all fetches in parallel
            const results = await Promise.all(fetchPromises);

            // Process resources result
            const resourcesData = results[0];
            if (resourcesData) {
                setFiles(resourcesData.files);
                setStats(resourcesData.stats);
            }

            // Process folder info result (if fetched)
            let resultIndex = 1;
            if (currentFolderId && results[resultIndex]) {
                const folderInfoData = results[resultIndex];
                if (folderInfoData?.folder) {
                    setFolders(prev => {
                        const foldersMap = new Map(prev.map(f => [f.id, f]));
                        let current = folderInfoData.folder;

                        // Add/Update the breadcrumb chain
                        while (current) {
                            foldersMap.set(current.id, { ...current, parent: undefined }); // Drop parent deep objects to save state
                            current = current.parent;
                        }

                        return Array.from(foldersMap.values());
                    });
                }
                resultIndex++;
            }

            // Process subfolders result (if fetched)
            if (activeTab === "RAW" && !search) {
                const folderData = results[resultIndex];
                if (folderData?.folders) {
                    setFolders(prev => {
                        const foldersMap = new Map(prev.map(f => [f.id, f]));

                        // Add or update subfolders in the map
                        folderData.folders.forEach((f: ArchiveFolder) => {
                            foldersMap.set(f.id, f);
                        });

                        return Array.from(foldersMap.values());
                    });
                }
            } else if (!currentFolderId) {
                setFolders([]);
            }

        } catch (error) {
            console.error("Error fetching archive:", error);
        } finally {
            if (requestId === lastRequestId.current) {
                setIsLoading(false);
            }
        }
    }, [activeTab, page, sortBy, sortOrder, contentTypeFilter, search, currentFolderId]);

    // Track if it's the initial mount to avoid double fetch
    const isInitialMount = useRef(true);
    const prevDepsRef = useRef({ activeTab, page, sortBy, sortOrder, contentTypeFilter, currentFolderId });

    // Main data fetching effect - handles all filter/tab/page changes
    useEffect(() => {
        const prevDeps = prevDepsRef.current;
        const tabChanged = prevDeps.activeTab !== activeTab;

        // Reset state when tab changes
        if (tabChanged) {
            setFiles([]);
            setPage(1);
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        }

        fetchArchive();

        prevDepsRef.current = { activeTab, page, sortBy, sortOrder, contentTypeFilter, currentFolderId };
    }, [activeTab, page, sortBy, sortOrder, contentTypeFilter, currentFolderId, fetchArchive]);

    // Debounced search - separate effect with proper cleanup
    useEffect(() => {
        // Skip on initial mount since main effect handles it
        if (isInitialMount.current) return;

        const timer = setTimeout(() => {
            if (page !== 1) {
                setPage(1); // This will trigger the main effect
            } else {
                fetchArchive();
            }
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

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

    // Keyboard listener for Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setShowPreview(false);
                setShowInfo(false);
                setDeleteConfirmId(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleDownload = async (file: ArchiveFile) => {
        if (!file.fileUrl) return;

        const loadingId = toast.loading("Menyiapkan unduhan...");

        try {
            // Using fetch + blob is the most reliable way to force a specific filename
            // and works across different file types without malforming Cloudinary URLs
            const response = await fetch(file.fileUrl);
            if (!response.ok) throw new Error("Gagal mengunduh file");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            // Create temporary link
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.title); // Use original title as filename
            document.body.appendChild(link);
            link.click();

            // Cleanup
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(link);
            }, 100);

            toast.dismiss(loadingId);
        } catch (error) {
            console.error("Download error:", error);
            toast.dismiss(loadingId);
            // Fallback: original URL if fetch fails (e.g. CORS issues)
            window.open(file.fileUrl, '_blank');
        }
    };

    const isPdfFile = (file: ArchiveFile) => {
        return file.title?.toLowerCase().endsWith('.pdf') ||
            file.fileUrl?.toLowerCase().includes('.pdf');
    };

    const handleBulkDownload = async () => {
        if (selectedIds.size === 0) return;
        const filesToDownload = files.filter(f => selectedIds.has(f.id));

        toast.success(`Mengunduh ${filesToDownload.length} file...`);

        for (const file of filesToDownload) {
            await handleDownload(file);
            // Small delay to prevent browser overload
            await new Promise(resolve => setTimeout(resolve, 600));
        }
    };

    const toggleSelection = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
        if (newSelected.size > 0) setIsSelectionMode(true);
        else setIsSelectionMode(false);
    };

    const handleDelete = async (id: string) => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/archive/resources?id=${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                invalidateCache("/api/archive"); // Clear cache after mutation
                setFiles(prev => prev.filter(f => f.id !== id));
                if (selectedFile?.id === id) {
                    setSelectedFile(null);
                    setShowInfo(false);
                }
                setDeleteConfirmId(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        setIsBulkDeleting(true);
        try {
            const idsArray = Array.from(selectedIds);
            const res = await fetch(`/api/archive/resources?ids=${idsArray.join(",")}`, {
                method: "DELETE"
            });
            if (res.ok) {
                invalidateCache("/api/archive"); // Clear cache after mutation
                setFiles(prev => prev.filter(f => !selectedIds.has(f.id)));
                setSelectedIds(new Set());
                setIsSelectionMode(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsBulkDeleting(false);
            setDeleteConfirmId(null);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName) return;
        setIsCreatingFolder(true);
        try {
            const res = await fetch("/api/archive/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newFolderName,
                    description: newFolderDescription,
                    uploaderId: currentUser?.nip,
                    parentId: currentFolderId // Set parent if we are inside a folder
                })
            });
            if (res.ok) {
                invalidateCache("/api/archive/folders"); // Clear cache after mutation
                const data = await res.json();
                setFolders(prev => [data.folder, ...prev]);
                setShowCreateFolderModal(false);
                setNewFolderName("");
                setNewFolderDescription("");
                toast.success("Folder berhasil dibuat!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal membuat folder");
        } finally {
            setIsCreatingFolder(false);
        }
    };

    const handleDeleteFolder = async (deleteContents: boolean = true) => {
        if (!folderToDelete) return;
        setIsDeletingFolder(true);
        try {
            const res = await fetch(`/api/archive/folders?id=${folderToDelete.id}&deleteContents=${deleteContents}`, {
                method: "DELETE"
            });
            if (res.ok) {
                const data = await res.json();
                invalidateCache("/api/archive"); // Clear all archive cache
                setFolders(prev => prev.filter(f => f.id !== folderToDelete.id));
                setFolderToDelete(null);
                toast.success(
                    deleteContents
                        ? `Folder dan ${data.deletedResources || 0} file berhasil dihapus`
                        : "Folder berhasil dihapus"
                );
                fetchArchive(); // Refresh to update file list
            } else {
                toast.error("Gagal menghapus folder");
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan saat menghapus folder");
        } finally {
            setIsDeletingFolder(false);
        }
    };

    const startBulkUpload = async (selectedFiles: File[], description: string, groupIntoFolder: boolean, folderName?: string) => {
        setUploadQueue(selectedFiles);
        setUploadDescription(description);
        setIsUploadingBulk(true);
        setShowFloatingProgress(true);
        setShowUploadModal(false);

        let finalFolderId = null;
        if (groupIntoFolder && folderName) {
            try {
                const folderRes = await fetch("/api/archive/folders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: folderName, description, uploaderId: currentUser?.nip })
                });
                if (folderRes.ok) {
                    const folderData = await folderRes.json();
                    finalFolderId = folderData.folder.id;
                }
            } catch (err) {
                console.error("Folder creation failed:", err);
            }
        }

        // Actual upload logic
        let successCount = 0;
        for (let i = 0; i < selectedFiles.length; i++) {
            setCurrentUploadIndex(i);
            const file = selectedFiles[i];

            try {
                const formData = new FormData();
                formData.append("file", file);

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                });

                if (!uploadRes.ok) throw new Error(`Gagal upload: ${file.name}`);
                const uploadData = await uploadRes.json();

                // Save to ArchiveResource DB
                await fetch("/api/archive/resources", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: file.name.split('.').slice(0, -1).join('.'),
                        description,
                        fileUrl: uploadData.fileUrl,
                        thumbnail: uploadData.thumbnail,
                        fileSize: uploadData.fileSize,
                        duration: uploadData.duration,
                        cloudinaryId: uploadData.cloudinaryId,
                        folderId: finalFolderId,
                        uploaderId: currentUser?.nip,
                        contentType: "DOKUMEN_INTERNAL"
                    })
                });
                successCount++;
            } catch (err) {
                console.error(err);
            }
        }

        setIsUploadingBulk(false);
        if (successCount > 0) {
            invalidateCache("/api/archive"); // Clear cache after upload
            fetchArchive();
        }
        setTimeout(() => setShowFloatingProgress(false), 5000);
    };

    return (
        <DashboardLayout role="OFFICER">
            <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#FDFDFD]">
                {/* Header Section */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                                <Archive className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase sm:text-5xl">
                                {currentFolderId ? (folders.find(f => f.id === currentFolderId)?.name || "Detail Folder") : "Arsip Konten"}
                            </h1>
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3 ml-1">
                            {currentFolderId ? "Isi Folder Terpilih" : "Aset Produksi & Media"} <span className="w-12 h-[2px] bg-red-100"></span>
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="bg-gray-50/80 p-1.5 rounded-[2rem] flex items-center gap-1 border border-gray-100 shadow-sm backdrop-blur-sm">
                        <button
                            onClick={() => { setActiveTab("RAW"); setCurrentFolderId(null); }}
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

                {/* Breadcrumbs for Folders */}
                {activeTab === "RAW" && currentFolderId && (
                    <div className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest overflow-x-auto no-scrollbar py-2">
                        <button onClick={() => navigateToFolder(null)} className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0">Arsip</button>

                        {(() => {
                            const path = [];
                            let current = folders.find(f => f.id === currentFolderId);
                            while (current) {
                                path.unshift(current);
                                // Try to find parent in the already fetched folders
                                current = current.parentId ? folders.find(f => f.id === current?.parentId) : undefined;
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

                {/* Toolbar Section */}
                <div className="mb-8 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Search Bar */}
                    <div className="lg:col-span-5 relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-red-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari aset..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-3xl text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500 transition-all placeholder:text-gray-300"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="lg:col-span-7 flex flex-wrap items-center justify-end gap-3">
                        {/* Multi-select Mode Logic */}
                        {isSelectionMode && (
                            <div className="flex items-center gap-2 bg-red-50 p-2 rounded-[2rem] border border-red-100 mr-4">
                                <span className="px-4 text-[10px] font-black text-red-600 uppercase tracking-widest">{selectedIds.size} Terpilih</span>
                                <button
                                    onClick={handleBulkDownload}
                                    className="p-3 bg-emerald-600 text-white rounded-[1.5rem] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                                    title="Download Semua Terpilih"
                                >
                                    <Download className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setDeleteConfirmId("bulk")}
                                    className="p-3 bg-red-600 text-white rounded-[1.5rem] hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                                    title="Hapus Terpilih"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => { setSelectedIds(new Set()); setIsSelectionMode(false); }}
                                    className="p-3 bg-white text-gray-400 rounded-[1.5rem] hover:text-gray-600 transition-all shadow-sm"
                                    title="Batalkan Pilihan"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {activeTab === "RAW" && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowCreateFolderModal(true)}
                                    className="flex items-center gap-3 bg-white border border-gray-100 text-gray-900 px-8 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-sm hover:border-red-200 transition-all"
                                >
                                    <FolderPlus className="h-5 w-5 text-red-600" />
                                    Buat Folder
                                </button>
                                <button
                                    onClick={() => {
                                        if (showUploadModal) setUploadModalKey(prev => prev + 1);
                                        setShowUploadModal(true);
                                    }}
                                    className="flex items-center gap-3 bg-red-600 text-white px-8 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-red-200 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    <Plus className="h-5 w-5" />
                                    Upload Bahan
                                </button>
                            </div>
                        )}

                        {/* Sort Dropdown */}
                        <div ref={sortDropdownRef} className="relative">
                            <button
                                onClick={() => setShowSortDropdown(!showSortDropdown)}
                                className="flex items-center gap-3 bg-white border border-gray-100 px-6 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-red-200 transition-all shadow-sm"
                            >
                                <SortAsc className="h-4 w-4" />
                                Urutkan
                                <ChevronDown className="h-4 w-4" />
                            </button>
                            <AnimatePresence>
                                {showSortDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 mt-3 w-64 bg-white border border-gray-50 rounded-3xl shadow-2xl p-4 z-50"
                                    >
                                        <div className="space-y-1">
                                            {[
                                                { label: "Terbaru", field: "updatedAt", order: "desc" },
                                                { label: "Nama (A-Z)", field: "title", order: "asc" },
                                                { label: "Ukuran Terbesar", field: "fileSize", order: "desc" },
                                            ].map((opt, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => { setSortBy(opt.field); setSortOrder(opt.order as "asc" | "desc"); setShowSortDropdown(false); }}
                                                    className={`w-full text-left px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === opt.field && sortOrder === opt.order ? "bg-red-50 text-red-600" : "hover:bg-gray-50 text-gray-400"}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex bg-gray-50 p-1.5 rounded-[2rem] items-center gap-1">
                            <button onClick={() => setViewMode("grid")} className={`p-3.5 rounded-[1.5rem] transition-all ${viewMode === "grid" ? "bg-white shadow-md text-red-600" : "text-gray-300"}`}>
                                <Grid3X3 className="h-4 w-4" />
                            </button>
                            <button onClick={() => setViewMode("list")} className={`p-3.5 rounded-[1.5rem] transition-all ${viewMode === "list" ? "bg-white shadow-md text-red-600" : "text-gray-300"}`}>
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="relative">
                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 pt-10">
                            {[...Array(12)].map((_, i) => <div key={i} className="aspect-[4/3] rounded-[2.5rem] bg-gray-100/50 animate-pulse border border-gray-50" />)}
                        </div>
                    ) : (
                        <>
                            {/* Folders Section - Now always show folders that are children of current root/folder */}
                            {folders.filter(f => f.parentId === (currentFolderId || null)).length > 0 && (
                                <div className="mb-12 space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <FolderPlus className="h-4 w-4 text-red-600" />
                                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Folders</h2>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {folders.filter(f => f.parentId === (currentFolderId || null)).map(folder => (
                                            <div
                                                key={folder.id}
                                                onClick={() => navigateToFolder(folder.id)}
                                                className="group flex items-center gap-4 bg-white border border-gray-100 p-5 rounded-2xl hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5 transition-all cursor-pointer relative"
                                            >
                                                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                                                    <Folder className="h-5 w-5 text-red-600 fill-red-600" />
                                                </div>
                                                <div className="min-w-0 pr-6">
                                                    <p className="text-[10px] font-black text-gray-900 uppercase truncate tracking-tight">{folder.name}</p>
                                                    <p className="text-[8px] font-bold text-gray-400 uppercase">
                                                        {folder._count?.resources || 0} Files • {folder._count?.subFolders || 0} Folders
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setFolderToDelete(folder); }}
                                                    className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg text-red-300 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Files Section */}
                            {files.length === 0 && folders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[4rem] border-4 border-dashed border-gray-50 mt-10">
                                    <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-12">
                                        <Folder className="h-10 w-10 text-gray-200" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Beneran Kosong Nih!</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-3">Belum ada aset editan yang diarsipkan.</p>
                                </div>
                            ) : (
                                <div className="pt-4">
                                    {files.length > 0 && (
                                        <div className="flex items-center gap-3 mb-6">
                                            <ImageIcon className="h-4 w-4 text-red-600" />
                                            <h2 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Files</h2>
                                        </div>
                                    )}
                                    {viewMode === "grid" ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                            <AnimatePresence mode="popLayout">
                                                {files.map((file) => (
                                                    <FileCard
                                                        key={file.id}
                                                        file={file}
                                                        selected={selectedIds.has(file.id)}
                                                        isCurrentActive={selectedFile?.id === file.id}
                                                        onSelect={() => {
                                                            if (isSelectionMode) toggleSelection(file.id);
                                                            else {
                                                                setSelectedFile(file);
                                                                setShowInfo(true);
                                                            }
                                                        }}
                                                        onToggleSelect={(e) => toggleSelection(file.id, e)}
                                                        onPreview={() => { setSelectedFile(file); setShowPreview(true); }}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <AnimatePresence mode="popLayout">
                                                {files.map((file) => (
                                                    <FileListItem
                                                        key={file.id}
                                                        file={file}
                                                        selected={selectedIds.has(file.id)}
                                                        isCurrentActive={selectedFile?.id === file.id}
                                                        onSelect={() => {
                                                            if (isSelectionMode) toggleSelection(file.id);
                                                            else {
                                                                setSelectedFile(file);
                                                                setShowInfo(true);
                                                            }
                                                        }}
                                                        onToggleSelect={(e) => toggleSelection(file.id, e)}
                                                        onPreview={() => { setSelectedFile(file); setShowPreview(true); }}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Extreme Premium Pagination */}
                            {stats && stats.totalPages > 1 && (
                                <div className="mt-16 flex flex-col items-center gap-6 pb-12">
                                    <div className="flex items-center gap-2 p-2 bg-white border border-gray-100 rounded-[2.5rem] shadow-xl shadow-gray-100">
                                        <button
                                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                            disabled={page === 1}
                                            className="w-12 h-12 flex items-center justify-center rounded-2xl transition-all hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent"
                                        >
                                            <ChevronDown className="h-5 w-5 rotate-90" />
                                        </button>

                                        <div className="flex items-center gap-1 px-4">
                                            {Array.from({ length: Math.min(5, stats.totalPages) }, (_, i) => {
                                                let pageNum = page;
                                                const total = stats.totalPages;

                                                if (total <= 5) pageNum = i + 1;
                                                else if (page <= 3) pageNum = i + 1;
                                                else if (page >= total - 2) pageNum = total - 4 + i;
                                                else pageNum = page - 2 + i;

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setPage(pageNum)}
                                                        className={`w-12 h-12 flex items-center justify-center rounded-2xl text-sm font-black transition-all ${page === pageNum ? "bg-red-600 text-white shadow-lg shadow-red-200" : "hover:bg-gray-50 text-gray-400"}`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => setPage(prev => Math.min(stats.totalPages, prev + 1))}
                                            disabled={page === stats.totalPages}
                                            className="w-12 h-12 flex items-center justify-center rounded-2xl transition-all hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent"
                                        >
                                            <ChevronDown className="h-5 w-5 -rotate-90" />
                                        </button>
                                    </div>

                                    <p className="text-sm font-black text-gray-300 uppercase tracking-[0.2em]">
                                        Halaman {page} dari {stats.totalPages} — Total {stats.total} Aset
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Info Sidebar Section */}
            <AnimatePresence>
                {showInfo && selectedFile && (
                    <motion.div
                        ref={infoSidebarRef}
                        initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
                        className="fixed top-0 right-0 bottom-0 w-[400px] bg-white border-l border-gray-50 shadow-2xl z-[160] overflow-y-auto"
                    >
                        <div className="p-10 space-y-12">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Detail Aset</h2>
                                <button onClick={() => setShowInfo(false)} className="p-3 hover:bg-gray-50 rounded-xl transition-all"><X className="h-5 w-5 text-gray-300" /></button>
                            </div>

                            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-gray-50 group border border-gray-100 shadow-inner">
                                {selectedFile.fileType === "DOCUMENT" ? (
                                    /* Premium Document Preview */
                                    <div className="w-full h-full bg-gradient-to-br from-slate-100 via-slate-50 to-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
                                        {/* Decorative Background Pattern */}
                                        <div className="absolute inset-0 opacity-[0.03]">
                                            <div className="absolute top-4 left-4 w-32 h-1 bg-slate-900 rounded-full" />
                                            <div className="absolute top-8 left-4 w-48 h-1 bg-slate-900 rounded-full" />
                                            <div className="absolute top-12 left-4 w-40 h-1 bg-slate-900 rounded-full" />
                                            <div className="absolute top-16 left-4 w-52 h-1 bg-slate-900 rounded-full" />
                                            <div className="absolute top-20 left-4 w-36 h-1 bg-slate-900 rounded-full" />
                                            <div className="absolute bottom-4 right-4 w-28 h-1 bg-slate-900 rounded-full" />
                                            <div className="absolute bottom-8 right-4 w-44 h-1 bg-slate-900 rounded-full" />
                                        </div>

                                        {/* Document Icon with Extension Badge */}
                                        <div className="relative mb-4 group-hover:scale-110 transition-transform duration-500">
                                            <div className="w-20 h-24 bg-white rounded-xl shadow-xl border border-slate-200/50 flex flex-col items-center justify-center relative overflow-hidden">
                                                {/* Document corner fold effect */}
                                                <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-br from-slate-200 to-slate-100 rounded-bl-lg shadow-inner" />
                                                <div className="absolute top-0 right-0 w-0 h-0 border-l-[24px] border-l-transparent border-t-[24px] border-t-slate-100" />

                                                <FileText className="h-8 w-8 text-red-500 mb-1" strokeWidth={1.5} />

                                                {/* File Extension Badge */}
                                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-600 text-white text-[8px] font-black uppercase tracking-wider rounded-full shadow-lg">
                                                    {selectedFile.title?.split('.').pop()?.toUpperCase() || 'DOC'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* File Name */}
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mt-4 max-w-[80%] truncate">
                                            {selectedFile.title}
                                        </p>
                                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                                            Berkas Dokumen
                                        </p>

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-red-600/90 via-red-600/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center pb-8">
                                            <button onClick={() => setShowPreview(true)} className="px-6 py-3 bg-white text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform flex items-center gap-2">
                                                <Eye className="h-4 w-4" /> Lihat Dokumen
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Image/Video Preview */
                                    <>
                                        <img src={selectedFile.thumbnail || "/api/placeholder/400/300"} alt={selectedFile.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                            <button onClick={() => setShowPreview(true)} className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                                {selectedFile.fileType === "VIDEO" ? <Play className="h-6 w-6" fill="currentColor" /> : <Eye className="h-6 w-6" />}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Nama Aset</span>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-tight mt-1 truncate">{selectedFile.title}</h3>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-gray-50 space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50/50 p-6 rounded-[2rem]">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Ukuran</span>
                                        <p className="text-xs font-black text-red-600 uppercase">{formatFileSize(selectedFile.fileSize)}</p>
                                    </div>
                                    <div className="bg-gray-50/50 p-6 rounded-[2rem]">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Tipe</span>
                                        <p className="text-xs font-black text-red-600 uppercase">{selectedFile.fileType}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-600">
                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center"><User className="h-4 w-4 text-gray-400" /></div>
                                        <div>
                                            <span className="block text-[8px] font-black text-gray-300 uppercase">Uploader</span>
                                            {selectedFile.author}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-600">
                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center"><Clock className="h-4 w-4 text-gray-400" /></div>
                                        <div>
                                            <span className="block text-[8px] font-black text-gray-300 uppercase">Diupload</span>
                                            {formatDate(selectedFile.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleDownload(selectedFile)}
                                    className="col-span-2 flex items-center justify-center gap-3 bg-gray-900 text-white py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
                                >
                                    <Download className="h-5 w-5" /> UNDUH
                                </button>
                                {activeTab === "RAW" && (
                                    <button
                                        onClick={() => setDeleteConfirmId(selectedFile.id)}
                                        className="col-span-2 flex items-center justify-center gap-3 bg-red-50 text-red-600 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                                    >
                                        <Trash2 className="h-5 w-5" /> HAPUS
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Float Upload Progress Bar */}
            <AnimatePresence>
                {showFloatingProgress && (
                    <motion.div
                        initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }}
                        className="fixed bottom-10 left-10 z-[200] w-80 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${isUploadingBulk ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {isUploadingBulk ? <Upload className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest">{isUploadingBulk ? `Mengunggah (${currentUploadIndex + 1}/${uploadQueue.length})` : 'Selesai!'}</p>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase truncate max-w-[150px]">{uploadQueue[currentUploadIndex]?.name || 'Semua aset tersimpan'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-red-600" animate={{ width: `${((currentUploadIndex + (isUploadingBulk ? 0.5 : 1)) / uploadQueue.length) * 100}%` }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals & Layout Styles omitted for brevity but they are included in full rewrite */}
            <AnimatePresence>
                {showPreview && selectedFile && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-10"
                    >
                        <div className="w-full h-full max-w-6xl flex flex-col items-center justify-center gap-8 relative">
                            <button onClick={() => setShowPreview(false)} className="absolute top-0 right-0 p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all backdrop-blur-md z-10"><X className="h-8 w-8" /></button>
                            <div className="w-full aspect-video rounded-[3rem] overflow-hidden bg-black border border-white/10 shadow-3xl">
                                {selectedFile.fileType === "VIDEO" ? (
                                    <video src={selectedFile.fileUrl} controls autoPlay className="w-full h-full" />
                                ) : selectedFile.fileType === "DOCUMENT" ? (
                                    /* Premium Document Download Card - Safe from auto-downloads & white screens */
                                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-12 relative overflow-hidden">
                                        {/* Animated Background Pattern */}
                                        <div className="absolute inset-0 opacity-10">
                                            <div className="absolute top-10 left-10 w-40 h-1 bg-white rounded-full" />
                                            <div className="absolute top-16 left-10 w-60 h-1 bg-white rounded-full" />
                                            <div className="absolute top-22 left-10 w-48 h-1 bg-white rounded-full" />
                                            <div className="absolute bottom-10 right-10 w-32 h-1 bg-white rounded-full" />
                                            <div className="absolute bottom-16 right-10 w-52 h-1 bg-white rounded-full" />
                                        </div>

                                        {/* Large Document Icon */}
                                        <div className="relative mb-8">
                                            <div className="w-32 h-40 bg-white rounded-2xl shadow-2xl flex flex-col items-center justify-center relative">
                                                <div className="absolute top-0 right-0 w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-100 rounded-bl-xl" />
                                                <FileText className="h-14 w-14 text-red-500" strokeWidth={1.5} />
                                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg">
                                                    {selectedFile.title?.split('.').pop()?.toUpperCase() || 'DOC'}
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-black text-white uppercase tracking-tight text-center mb-2 px-10">
                                            {selectedFile.title}
                                        </h3>
                                        <p className="text-xs font-bold text-slate-400 mb-10 uppercase tracking-widest">
                                            Berkas Dokumen
                                        </p>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(selectedFile);
                                            }}
                                            className="group relative z-[30] flex items-center gap-4 px-12 py-6 bg-red-600 hover:bg-red-700 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-red-900/40 hover:scale-105 transition-all active:scale-95 cursor-pointer pointer-events-auto"
                                        >
                                            <Download className="h-5 w-5 group-hover:bounce" />
                                            Unduh Dokumen
                                        </button>
                                    </div>
                                ) : (
                                    <img src={selectedFile.fileUrl} alt={selectedFile.title} className="w-full h-full object-contain" />
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[3rem] p-10 max-w-md w-full text-center shadow-2xl">
                            <div className="w-20 h-20 bg-red-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-pulse"><AlertCircle className="h-10 w-10 text-red-600" /></div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-4">Hapus {deleteConfirmId === "bulk" ? `${selectedIds.size} Aset` : "Aset Ini"}?</h2>
                            <p className="text-xs font-bold text-gray-500 leading-relaxed mb-10 px-4">Tindakan ini permanen. File akan dihapus dari arsip dan pusat data Cloudinary.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setDeleteConfirmId(null)} className="py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all">Batal</button>
                                <button
                                    onClick={() => deleteConfirmId === "bulk" ? handleBulkDelete() : handleDelete(deleteConfirmId)}
                                    className="py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest bg-red-600 text-white shadow-xl shadow-red-200"
                                >
                                    {(isDeleting || isBulkDeleting) ? "Menghapus..." : "Ya, Hapus"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Folder Modal */}
            <AnimatePresence>
                {showCreateFolderModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4" onClick={() => setShowCreateFolderModal(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="p-10 space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Folder Baru</h2>
                                    <button onClick={() => setShowCreateFolderModal(false)} className="p-3 hover:bg-gray-50 rounded-xl transition-all"><X className="h-5 w-5 text-gray-300" /></button>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Folder</label>
                                        <input
                                            type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                                            placeholder="Nama folder..."
                                            autoFocus
                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-red-500/5 focus:border-red-500 focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Keterangan</label>
                                        <textarea
                                            value={newFolderDescription} onChange={e => setNewFolderDescription(e.target.value)}
                                            placeholder="Detail singkat..." rows={3}
                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-red-500/5 focus:border-red-500 focus:outline-none transition-all resize-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleCreateFolder}
                                        disabled={!newFolderName || isCreatingFolder}
                                        className="w-full py-5 bg-gray-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl hover:bg-black disabled:bg-gray-200 transition-all flex items-center justify-center gap-3"
                                    >
                                        {isCreatingFolder ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
                                        Buat Folder
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Resumable Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <ResumableUploadModal
                        key={uploadModalKey}
                        onClose={() => setShowUploadModal(false)}
                        onComplete={async (uploads) => {
                            // Silent refresh to prevent flicker
                            invalidateCache("/api/archive"); // Clear cache after success
                            await fetchArchive({ silent: true });
                        }}
                        uploaderId={currentUser?.nip || ''}
                        currentFolderId={currentFolderId}
                    />
                )}
            </AnimatePresence>

            {/* Folder Delete Confirmation Modal */}
            <AnimatePresence>
                {folderToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={() => !isDeletingFolder && setFolderToDelete(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Warning Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-3xl flex items-center justify-center shadow-lg shadow-red-100">
                                    <Trash2 className="h-10 w-10 text-red-500" />
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-black text-center text-gray-900 mb-2">
                                Hapus Folder?
                            </h3>

                            {/* Folder Info Card */}
                            <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Folder className="h-6 w-6 text-red-600 fill-red-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 truncate">{folderToDelete.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {folderToDelete._count?.resources || 0} file • {folderToDelete._count?.subFolders || 0} subfolder
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Warning Message */}
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-8">
                                <div className="flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-amber-800">
                                        <p className="font-bold mb-1">Perhatian!</p>
                                        <p className="text-amber-700">
                                            Semua file dan subfolder di dalam folder ini akan <span className="font-bold">dihapus permanen</span> dan tidak dapat dikembalikan.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setFolderToDelete(null)}
                                    disabled={isDeletingFolder}
                                    className="flex-1 py-4 px-6 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => handleDeleteFolder(true)}
                                    disabled={isDeletingFolder}
                                    className="flex-1 py-4 px-6 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeletingFolder ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Menghapus...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            Ya, Hapus
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}

// --- Sub-components with Gallery Style Selection ---

function FileCard({ file, selected, isCurrentActive, onSelect, onToggleSelect, onPreview }: { file: ArchiveFile, selected: boolean, isCurrentActive: boolean, onSelect: () => void, onToggleSelect: (e: React.MouseEvent) => void, onPreview: () => void }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
            onClick={onSelect}
            className={`group relative aspect-square rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-700 border ${selected ? "border-red-600 ring-4 ring-red-500/10 shadow-2xl scale-95" : isCurrentActive ? "border-red-400 shadow-lg" : "border-gray-100 hover:border-red-200 shadow-sm hover:shadow-md"
                } bg-white`}
        >
            <div className="absolute inset-0 z-10 transition-transform duration-1000 group-hover:scale-110">
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
                            <div className="w-14 h-18 bg-white rounded-lg shadow-lg border border-slate-200/50 flex flex-col items-center justify-center relative overflow-hidden p-2">
                                <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-br from-slate-200 to-slate-100 rounded-bl-md" />
                                <FileText className="h-6 w-6 text-red-500" strokeWidth={1.5} />
                            </div>
                            {/* Extension Badge */}
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-red-600 text-white text-[6px] font-black uppercase tracking-wider rounded-full shadow-md">
                                {file.title?.split('.').pop()?.toUpperCase().slice(0, 4) || 'DOC'}
                            </div>
                        </div>

                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest text-center mt-4">Dokumen</p>
                    </div>
                ) : (
                    <img src={file.thumbnail || "/api/placeholder/400/300"} alt={file.title} className="w-full h-full object-cover" />
                )}
            </div>

            {/* Selection Checkbox Overlay */}
            <div className={`absolute top-4 left-4 z-[30] transition-all duration-300 ${selected ? "scale-100" : "scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100"}`}>
                <button
                    onClick={onToggleSelect}
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center border-2 transition-all ${selected ? "bg-red-600 border-red-600 text-white shadow-lg" : "bg-gray-900/40 border-white/40 text-white hover:bg-gray-900/60 backdrop-blur-md"
                        }`}
                >
                    <Check className="h-5 w-5" strokeWidth={4} />
                </button>
            </div>

            {/* Preview Button */}
            <div className="absolute top-4 right-4 z-[30]">
                <button
                    onClick={(e) => { e.stopPropagation(); onPreview(); }}
                    className="w-9 h-9 rounded-2xl bg-gray-900/40 hover:bg-gray-900/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                >
                    <Eye className="h-4 w-4" />
                </button>
            </div>

            {/* Bottom Info Bar - Always Visible with Glassmorphism */}
            <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="relative p-5 pt-10">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="text-white/80">
                            {file.fileType === "VIDEO" ? <Play className="h-3 w-3" fill="currentColor" /> :
                                file.fileType === "IMAGE" ? <ImageIcon className="h-3 w-3" /> :
                                    <FileText className="h-3 w-3" />}
                        </div>
                        <h3 className="text-[11px] font-black text-white uppercase truncate tracking-tight flex-1">
                            {file.title}
                        </h3>
                    </div>
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest pl-5">
                        {formatFileSizeHelper(file.fileSize)}
                    </p>
                </div>
            </div>

        </motion.div>
    );
}

function FileListItem({ file, selected, isCurrentActive, onSelect, onToggleSelect, onPreview }: { file: ArchiveFile, selected: boolean, isCurrentActive: boolean, onSelect: () => void, onToggleSelect: (e: React.MouseEvent) => void, onPreview: () => void }) {
    return (
        <motion.div
            layout
            onClick={onSelect}
            className={`flex items-center gap-6 px-8 py-5 rounded-2xl cursor-pointer transition-all duration-300 border ${selected ? "bg-red-50 border-red-100 shadow-md translate-x-1" : isCurrentActive ? "bg-red-50/30 border-red-50 shadow-sm" : "bg-white border-gray-100 hover:border-red-100 shadow-sm hover:shadow-md"
                }`}
        >
            <div className="flex-shrink-0" onClick={onToggleSelect}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${selected ? "bg-red-600 border-red-600 text-white" : "border-gray-100 text-transparent hover:border-red-200"
                    }`}>
                    <Check className="h-3 w-3" strokeWidth={4} />
                </div>
            </div>
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                <img src={file.thumbnail || "/api/placeholder/100/100"} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
                <h3 className={`text-xs font-black uppercase tracking-tight truncate ${selected ? "text-red-700 font-black" : "text-gray-900"}`}>{file.title}</h3>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Uploader: {file.author}</p>
            </div>
            <div className="text-[10px] font-bold text-gray-300 uppercase w-32 hidden md:block">{new Date(file.createdAt).toLocaleDateString()}</div>
            <div className="text-[10px] font-black text-gray-400 uppercase w-20 text-right">{formatFileSizeHelper(file.fileSize)}</div>
            <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); onPreview(); }} className="p-2.5 hover:bg-white rounded-xl text-gray-400 hover:text-red-600 hover:shadow-sm transition-all"><Eye className="h-4 w-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); onDownload(file); }} className="p-2.5 hover:bg-white rounded-xl text-gray-400 hover:text-red-600 hover:shadow-sm transition-all"><Download className="h-4 w-4" /></button>
            </div>
        </motion.div>
    );
}

function onDownload(file: any) {
    window.open(file.fileUrl, '_blank');
}

// --- Upload Modal Component with Folder logic ---

function UploadBahanModal({ onClose, onSuccess, uploaderId }: { onClose: () => void, onSuccess: (files: File[], desc: string, group: boolean, name?: string) => void, uploaderId: string }) {
    const [files, setFiles] = useState<File[]>([]);
    const [description, setDescription] = useState("");
    const [groupIntoFolder, setGroupIntoFolder] = useState(false);
    const [folderName, setFolderName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">Multiplex Upload</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Dukung folderisasi otomatis & bulk-action</p>
                        </div>
                        <button onClick={onClose} className="p-4 hover:bg-gray-50 rounded-2xl transition-all"><X className="h-6 w-6 text-gray-400" /></button>
                    </div>

                    <div onClick={() => fileInputRef.current?.click()} className={`relative border-4 border-dashed rounded-[2.5rem] p-8 flex flex-col items-center justify-center transition-all cursor-pointer group ${files.length > 0 ? 'border-emerald-100 bg-emerald-50/20' : 'border-gray-50 bg-gray-50/20 hover:border-red-100 hover:bg-white'}`}>
                        <input type="file" ref={fileInputRef} onChange={(e) => setFiles(Array.from(e.target.files || []))} className="hidden" multiple />
                        <Upload className={`h-8 w-8 mb-4 transition-all ${files.length > 0 ? 'text-emerald-500 scale-110' : 'text-red-400 group-hover:scale-110'}`} />
                        <p className="text-xs font-black text-gray-900 uppercase">{files.length > 0 ? `${files.length} File Terpilih` : 'Pilih File atau Seret Kesini'}</p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                            <button
                                onClick={() => {
                                    setGroupIntoFolder(!groupIntoFolder);
                                    if (!groupIntoFolder && !folderName) setFolderName(`Project ${new Date().toLocaleDateString()}`);
                                }}
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${groupIntoFolder ? 'bg-red-600 border-red-600 text-white' : 'border-gray-300 bg-white'}`}
                            >
                                {groupIntoFolder && <Check className="h-4 w-4" strokeWidth={4} />}
                            </button>
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase text-gray-700">Gabung Menjadi 1 Folder</p>
                                <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">Kelompokkan semua file ini dalam satu kontainer</p>
                            </div>
                        </div>

                        <AnimatePresence>
                            {groupIntoFolder && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 overflow-hidden">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Folder</label>
                                    <input
                                        type="text" value={folderName} onChange={(e) => setFolderName(e.target.value)}
                                        placeholder="Contoh: Liputan Event Tahunan..."
                                        className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-red-500/5 focus:border-red-500 focus:outline-none transition-all"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Keterangan Publik</label>
                            <textarea
                                value={description} onChange={(e) => setDescription(e.target.value)}
                                placeholder="Opsional: Detail untuk semua file ini..." rows={2}
                                className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-red-500/5 focus:border-red-500 focus:outline-none transition-all resize-none"
                            />
                        </div>

                        <button
                            onClick={() => onSuccess(files, description, groupIntoFolder, folderName)}
                            disabled={files.length === 0 || (groupIntoFolder && !folderName)}
                            className="w-full py-5 bg-red-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-red-200 hover:scale-[1.02] active:scale-95 disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none transition-all flex items-center justify-center gap-3"
                        >
                            <Play className="h-4 w-4" fill="currentColor" /> MULAI UNGGAH
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
