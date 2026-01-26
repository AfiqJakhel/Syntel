// Simple in-memory store for upload progress tracking
// Format: { fileId: { progress: 0-100, stage: 'uploading' | 'cloudinary' | 'database' | 'done' | 'error', message?: string } }

type ProgressStage = 'uploading' | 'cloudinary' | 'database' | 'done' | 'error';

interface ProgressData {
    progress: number;
    stage: ProgressStage;
    message?: string;
}

const progressStore: Map<string, ProgressData> = new Map();

export function setProgress(fileId: string, progress: number, stage: ProgressStage, message?: string) {
    progressStore.set(fileId, { progress, stage, message });
}

export function getProgress(fileId: string): ProgressData | null {
    return progressStore.get(fileId) || null;
}

export function clearProgress(fileId: string) {
    progressStore.delete(fileId);
}

export function getAllProgress(): Record<string, ProgressData> {
    const result: Record<string, ProgressData> = {};
    progressStore.forEach((value, key) => {
        result[key] = value;
    });
    return result;
}
