import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fileNames, folderId } = body;

        console.log('🔍 Checking duplicates for:', fileNames);

        if (!fileNames || !Array.isArray(fileNames)) {
            return NextResponse.json({ error: 'Invalid filenames' }, { status: 400 });
        }

        // Check by full filename (title in database stores full filename)
        const existingFiles = await prisma.archiveResource.findMany({
            where: {
                title: { in: fileNames },
                folderId: folderId || null,
            },
            select: {
                title: true,
            },
        });

        const duplicateTitles = existingFiles.map(f => f.title);
        console.log('⚠️ Found duplicates:', duplicateTitles);

        return NextResponse.json({
            duplicates: duplicateTitles,
        });
    } catch (error) {
        console.error('Check duplicates error:', error);
        return NextResponse.json({ error: 'Failed to check duplicates' }, { status: 500 });
    }
}
