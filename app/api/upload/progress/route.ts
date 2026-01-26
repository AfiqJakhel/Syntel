import { NextRequest, NextResponse } from 'next/server';
import { getProgress, getAllProgress } from '@/lib/upload-progress-store';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('fileId');

    if (fileId) {
        const progress = getProgress(fileId);
        return NextResponse.json({ progress });
    }

    // Return all progress if no specific fileId
    const allProgress = getAllProgress();
    return NextResponse.json({ progress: allProgress });
}
