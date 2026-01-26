"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Uppy, UppyFile } from '@uppy/core';
import Tus from '@uppy/tus';
import { motion, AnimatePresence } from 'motion/react';
import {
    X, Check, Upload as UploadIcon, FolderPlus,
    File, Trash2, Loader2, ChevronDown, ChevronUp,
    AlertCircle, Sparkles, Plus, WifiOff, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ResumableUploadModalProps {
    onClose: () => void;
    onComplete: (uploadedFiles: any[]) => void;
    uploaderId: string;
}

interface ProcessingState {
    [key: string]: 'waiting' | 'uploading' | 'processing' | 'done' | 'error';
}

interface FileItem {
    id: string;
    name: string;
    size: number;
    errorMessage?: string;
}

export function ResumableUploadModal({ onClose, onComplete, uploaderId }: ResumableUploadModalProps) {
    // --- States ---
    const [viewMode, setViewMode] = useState<'MODAL' | 'WIDGET'>('MODAL');
    const [groupIntoFolder, setGroupIntoFolder] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [processingStatus, setProcessingStatus] = useState<ProcessingState>({});
    const [isUploading, setIsUploading] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    // Override States
    const [duplicates, setDuplicates] = useState<string[]>([]);
    const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);
    const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

    // --- Refs (to avoid stale closures) ---
    const uppyRef = useRef<Uppy | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderIdRef = useRef<string | null>(null);
    const descriptionRef = useRef<string>('');
    const onCompleteRef = useRef(onComplete);
    const uploaderIdRef = useRef(uploaderId);

    // Keep refs in sync
    useEffect(() => { descriptionRef.current = description; }, [description]);
    useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
    useEffect(() => { uploaderIdRef.current = uploaderId; }, [uploaderId]);

    // --- Initialize Uppy ONCE on mount ---
    useEffect(() => {
        console.log('🔄 Initializing Uppy...');

        const uppy = new Uppy({
            id: 'resumable-uploader',
            autoProceed: false,
            restrictions: {
                maxFileSize: 10 * 1024 * 1024 * 1024,
                allowedFileTypes: null,
            },
        });

        uppy.use(Tus, {
            endpoint: 'http://localhost:3001/api/upload/tus',
            chunkSize: 256 * 1024, // 256KB chunks for smoother progress
            retryDelays: [0, 1000, 3000, 5000],
            removeFingerprintOnSuccess: true,
            storeFingerprintForResuming: false,
        });

        uppy.on('file-added', (file) => {
            console.log('📁 File added:', file.name);
            setFiles(prev => [...prev, { id: file.id, name: file.name, size: file.size || 0 }]);
            setProcessingStatus(prev => ({ ...prev, [file.id]: 'waiting' }));
        });

        uppy.on('file-removed', (file) => {
            console.log('🗑️ File removed:', file.name);
            setFiles(prev => prev.filter(f => f.id !== file.id));
            setProcessingStatus(prev => {
                const next = { ...prev };
                delete next[file.id];
                return next;
            });
        });

        // Set uploading status immediately when upload starts
        uppy.on('upload-start', (files) => {
            console.log('🚀 Upload started for', files.length, 'files');
            files.forEach(file => {
                setProcessingStatus(prev => ({ ...prev, [file.id]: 'uploading' }));
                setUploadProgress(prev => ({ ...prev, [file.id]: 0 }));
            });
        });

        uppy.on('upload-progress', (file, progress) => {
            if (file && typeof progress.bytesTotal === 'number' && progress.bytesTotal > 0) {
                const percentage = (progress.bytesUploaded / progress.bytesTotal) * 100;
                setUploadProgress(prev => ({ ...prev, [file.id]: percentage }));
                if (percentage < 100) {
                    setProcessingStatus(prev => ({ ...prev, [file.id]: 'uploading' }));
                }
            }
        });

        uppy.on('upload-success', async (file, response) => {
            if (!file) return;
            console.log('✅ TUS upload success:', file.name);
            setProcessingStatus(prev => ({ ...prev, [file.id]: 'processing' }));

            try {
                const tusUrl = response.uploadURL;
                const tusFileId = tusUrl?.split('/').pop();
                if (!tusFileId) throw new Error('No Tus ID');

                console.log('📤 Processing file:', tusFileId);

                // Start polling for progress
                const pollInterval = setInterval(async () => {
                    try {
                        const progressRes = await fetch(`/api/upload/progress?fileId=${tusFileId}`);
                        const progressData = await progressRes.json();
                        if (progressData.progress) {
                            const { progress, stage, message } = progressData.progress;
                            console.log(`📊 Progress: ${progress}% - ${message}`);
                            // Update progress (scale: TUS upload was 0-30%, processing is 30-100%)
                            const scaledProgress = 30 + (progress * 0.7);
                            setUploadProgress(prev => ({ ...prev, [file.id]: scaledProgress }));

                            if (stage === 'done' || stage === 'error') {
                                clearInterval(pollInterval);
                            }
                        }
                    } catch (e) {
                        // Ignore polling errors
                    }
                }, 300);

                // Set initial processing progress
                setUploadProgress(prev => ({ ...prev, [file.id]: 30 }));

                const res = await fetch('/api/upload/process-tus', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tusFilePath: tusFileId,
                        fileName: file.name,
                        uploaderId: uploaderIdRef.current,
                        description: descriptionRef.current,
                        folderId: folderIdRef.current,
                    }),
                });

                // Stop polling
                clearInterval(pollInterval);

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Process failed');
                }

                const data = await res.json();
                console.log('✅ File processed:', data.resource?.id);
                setUploadProgress(prev => ({ ...prev, [file.id]: 100 }));
                setProcessingStatus(prev => ({ ...prev, [file.id]: 'done' }));
                onCompleteRef.current([data.resource]);
            } catch (err: any) {
                console.error('❌ Process error:', err.message);
                const errorMsg = err.message || 'Gagal memproses file';
                setProcessingStatus(prev => ({ ...prev, [file.id]: 'error' }));
                setFiles(prev => prev.map(f => f.id === file.id ? { ...f, errorMessage: errorMsg } : f));
                toast.error(`Gagal upload "${file.name}": ${errorMsg}`, { duration: 6000 });
            }
        });

        uppy.on('upload-error', (file, error) => {
            console.error('❌ Upload error:', file?.name, error);
            if (file) {
                const errorMsg = error?.message || 'Koneksi terputus';
                setProcessingStatus(prev => ({ ...prev, [file.id]: 'error' }));
                setFiles(prev => prev.map(f => f.id === file.id ? { ...f, errorMessage: errorMsg } : f));
                toast.error(`Upload gagal "${file.name}": ${errorMsg}`, { duration: 6000 });
            }
        });

        uppy.on('complete', () => {
            console.log('🏁 All uploads complete');
            setIsUploading(false);
        });

        uppyRef.current = uppy;

        return () => {
            console.log('🧹 Destroying Uppy...');
            uppy.destroy();
        };
    }, []); // Empty dependency - only run once!

    // --- Actions ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && uppyRef.current) {
            Array.from(e.target.files).forEach(file => {
                try {
                    uppyRef.current?.addFile({ name: file.name, type: file.type, data: file, source: 'Local' });
                } catch (err) {
                    console.warn('File already exists or error:', err);
                }
            });
        }
        // Reset input so same file can be selected again
        if (e.target) e.target.value = '';
    };

    const removeFile = (fileId: string) => {
        uppyRef.current?.removeFile(fileId);
    };

    const handlePreUploadCheck = async () => {
        if (files.length === 0) return;

        setIsCheckingDuplicates(true);
        try {
            // If grouping into a new folder, skip duplicate check (new folder is empty)
            if (groupIntoFolder) {
                proceedAfterCheck();
                return;
            }

            const response = await fetch('/api/upload/check-duplicates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileNames: files.map(f => f.name),
                    folderId: null,
                }),
            });

            const data = await response.json();
            if (data.duplicates && data.duplicates.length > 0) {
                setDuplicates(data.duplicates);
                setShowOverrideConfirm(true);
            } else {
                proceedAfterCheck();
            }
        } catch (error) {
            console.error('Check failed', error);
            proceedAfterCheck();
        } finally {
            setIsCheckingDuplicates(false);
        }
    };

    const proceedAfterCheck = async () => {
        setShowOverrideConfirm(false);
        setIsUploading(true);
        setViewMode('WIDGET');

        if (groupIntoFolder && folderName) {
            try {
                const folderRes = await fetch('/api/archive/folders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: folderName, description, uploaderId }),
                });
                if (folderRes.ok) {
                    const folderData = await folderRes.json();
                    folderIdRef.current = folderData.folder.id;
                }
            } catch (err) {
                console.error(err);
            }
        }

        console.log('🚀 Starting upload with', files.length, 'files');
        uppyRef.current?.upload();
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const completedCount = files.filter(f => processingStatus[f.id] === 'done').length;

    return (
        <>
            {/* 1. Main Preparation Modal */}
            <AnimatePresence>
                {viewMode === 'MODAL' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[250] flex items-center justify-center p-4" onClick={onClose}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                            {/* Header */}
                            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                                        <UploadIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Siapkan Unggahan</h2>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Resumable Upload</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-xl transition-all"><X className="h-5 w-5" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {/* Upload Area */}
                                <div onClick={() => fileInputRef.current?.click()}
                                    className={`border-4 border-dashed rounded-[2.5rem] p-10 flex flex-col items-center justify-center transition-all cursor-pointer group ${files.length > 0 ? 'border-red-100 bg-red-50/10' : 'border-gray-50 bg-gray-50/30 hover:border-red-500 hover:bg-red-50/50'}`}>
                                    <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform">
                                        <Plus className="h-8 w-8 text-red-600" />
                                    </div>
                                    <p className="text-xs font-black text-gray-900 uppercase tracking-widest">
                                        {files.length > 0 ? `${files.length} File Dipilih` : 'Pilih File untuk Diunggah'}
                                    </p>
                                </div>

                                {/* File List Preview */}
                                {files.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {files.map(file => (
                                            <div key={file.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3">
                                                <File className="h-4 w-4 text-gray-400" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold text-gray-900 truncate">{file.name}</p>
                                                    <p className="text-[8px] font-black text-gray-400 uppercase">{formatSize(file.size)}</p>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); removeFile(file.id); }} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Folder Grouping Toggle */}
                                <div className="space-y-6 pt-4">
                                    <div onClick={() => {
                                        setGroupIntoFolder(!groupIntoFolder);
                                        if (!groupIntoFolder && !folderName) setFolderName(`Batch ${new Date().toLocaleDateString('id-ID')}`);
                                    }} className={`p-6 rounded-[2rem] border-2 flex items-center gap-6 cursor-pointer transition-all ${groupIntoFolder ? 'bg-red-600 border-red-600 shadow-xl' : 'bg-gray-50/50 border-gray-100'}`}>
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${groupIntoFolder ? 'bg-white text-red-600' : 'bg-white text-gray-400 border border-gray-100'}`}>
                                            <FolderPlus className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className={`text-[12px] font-black uppercase tracking-wider ${groupIntoFolder ? 'text-white' : 'text-gray-900'}`}>Gabung Semua File Jadi 1 Folder</p>
                                            <p className={`text-[9px] font-bold uppercase ${groupIntoFolder ? 'text-red-100' : 'text-gray-400'}`}>Aktifkan untuk mengelompokkan hasil upload dalam satu kontainer folder</p>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${groupIntoFolder ? 'bg-white border-white' : 'border-gray-200'}`}>
                                            {groupIntoFolder && <Check className="h-5 w-5 text-red-600" strokeWidth={4} />}
                                        </div>
                                    </div>

                                    {groupIntoFolder && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Nama Folder Baru</label>
                                            <input value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="Nama folder..."
                                                className="w-full px-8 py-5 bg-white border border-gray-200 rounded-[1.8rem] text-sm font-bold focus:border-red-600 outline-none" />
                                        </motion.div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Keterangan Publik</label>
                                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Detail tambahan..."
                                            className="w-full px-8 py-5 bg-gray-50/50 border border-gray-200 rounded-[1.8rem] text-sm font-bold focus:border-red-600 outline-none resize-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-8 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-red-500" />
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sistem Override Otomatis Aktif</p>
                                </div>
                                <button onClick={handlePreUploadCheck} disabled={files.length === 0 || isCheckingDuplicates}
                                    className="px-12 py-4 bg-gray-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all disabled:bg-gray-200 flex items-center gap-2">
                                    {isCheckingDuplicates ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    {isCheckingDuplicates ? 'Memeriksa...' : 'Mulai Upload Sekarang'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* OVERRIDE CONFIRMATION DIALOG */}
            <AnimatePresence>
                {showOverrideConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl overflow-hidden relative">
                            <div className="w-20 h-20 bg-amber-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                                <AlertCircle className="h-10 w-10 text-amber-600" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter text-center mb-4">Deteksi Conflict!</h2>
                            <p className="text-xs font-bold text-gray-500 text-center leading-relaxed mb-8">
                                Beberapa file berikut sudah ada di database. Apakah Anda ingin <strong>menimpa (override)</strong> file lama?
                            </p>

                            <div className="bg-gray-50 rounded-2xl p-4 max-h-[150px] overflow-y-auto mb-10 space-y-2 border border-gray-100 custom-scrollbar">
                                {duplicates.map((name, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-tight truncate">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                        {name}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setShowOverrideConfirm(false)} className="py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all">Batalkan</button>
                                <button onClick={proceedAfterCheck} className="py-5 bg-amber-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-amber-200 hover:bg-amber-700 transition-all">Ya, Timpa File</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. Google Drive Style Widget - Docked to Bottom */}
            <div className="fixed bottom-0 right-8 z-[300] flex flex-col items-end pointer-events-none">
                <AnimatePresence>
                    {viewMode === 'WIDGET' && !isMinimized && (
                        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                            className="w-[380px] bg-gray-900 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] overflow-hidden pointer-events-auto border-x border-t border-white/5 flex flex-col">

                            {/* Header */}
                            <div className="bg-gray-800/80 backdrop-blur-md p-6 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <Loader2 className={`h-4 w-4 text-white ${isUploading ? 'animate-spin' : ''}`} />
                                    </div>
                                    <h3 className="text-[11px] font-black text-white uppercase tracking-widest">
                                        {completedCount} dari {files.length} Selesai
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setIsMinimized(true)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><ChevronDown className="h-4 w-4" /></button>
                                    {!isUploading && <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><X className="h-4 w-4" /></button>}
                                </div>
                            </div>

                            {/* File List */}
                            <div className="max-h-[300px] overflow-y-auto p-4 space-y-2 custom-scrollbar-dark">
                                {files.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 text-xs">Tidak ada file</div>
                                ) : (
                                    files.map(file => {
                                        const progress = Math.round(uploadProgress[file.id] || 0);
                                        const status = processingStatus[file.id];

                                        return (
                                            <div key={file.id} className={`p-4 rounded-xl ${status === 'error' ? 'bg-red-950/50 border border-red-500/30' : 'bg-white/5'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-[10px] font-bold text-gray-300 truncate pr-2">{file.name}</p>
                                                            {status === 'done' ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[10px] font-black text-emerald-400">Selesai</span>
                                                                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" strokeWidth={3} />
                                                                </div>
                                                            ) : status === 'processing' ? (
                                                                <div className="flex items-center gap-1.5 bg-amber-500/20 px-2 py-0.5 rounded-full">
                                                                    <span className="text-[12px] font-black text-amber-400 tabular-nums">{progress}%</span>
                                                                    <Loader2 className="h-3 w-3 text-amber-400 animate-spin flex-shrink-0" />
                                                                </div>
                                                            ) : status === 'error' ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[10px] font-black text-red-400">Gagal</span>
                                                                    <WifiOff className="h-4 w-4 text-red-400 flex-shrink-0" />
                                                                </div>
                                                            ) : status === 'uploading' ? (
                                                                <div className="flex items-center gap-1.5 bg-cyan-500/20 px-2 py-0.5 rounded-full">
                                                                    <span className="text-[12px] font-black text-cyan-400 tabular-nums">{progress}%</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] font-black text-gray-500">Menunggu...</span>
                                                            )}
                                                        </div>
                                                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                                            <motion.div
                                                                className={`h-full ${status === 'done' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : status === 'processing' ? 'bg-amber-500' : status === 'uploading' ? 'bg-cyan-500' : 'bg-gray-600'}`}
                                                                animate={{ width: `${status === 'error' ? 100 : progress}%` }}
                                                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                                            />
                                                        </div>
                                                        {/* Error Message */}
                                                        {status === 'error' && file.errorMessage && (
                                                            <p className="text-[8px] text-red-400 mt-2 flex items-center gap-1">
                                                                <AlertCircle className="h-3 w-3" />
                                                                {file.errorMessage}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-gray-800/50 text-center border-t border-white/5">
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Sinkronisasi Real-Time Aktif</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Minimized Button */}
                {viewMode === 'WIDGET' && isMinimized && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        onClick={() => setIsMinimized(false)}
                        className="pointer-events-auto w-16 h-16 bg-red-600 rounded-full mb-8 mr-2 shadow-2xl border-4 border-white/10 flex items-center justify-center text-white hover:scale-105 transition-all relative"
                    >
                        <UploadIcon className="h-6 w-6" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-gray-900 rounded-full flex items-center justify-center text-[10px] font-black">
                            {completedCount}
                        </div>
                    </motion.button>
                )}

                {/* Expand handle when widget is open */}
                {viewMode === 'WIDGET' && !isMinimized && (
                    <div className="w-[380px] h-6 bg-gray-800 pointer-events-auto flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-all" onClick={() => setIsMinimized(true)}>
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                    </div>
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
                .custom-scrollbar-dark::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </>
    );
}
