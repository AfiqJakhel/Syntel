import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

// Configure Cloudinary with longer timeout
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    timeout: 120000, // 120 seconds timeout
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tusFilePath, fileName, uploaderId, description, folderId } = body;

        console.log('📤 Processing TUS upload:', { tusFilePath, fileName, uploaderId });

        if (!tusFilePath || !fileName || !uploaderId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get the full path to the Tus uploaded file
        const fullPath = path.join(process.cwd(), 'uploads', 'tus', tusFilePath);
        console.log('📁 File path:', fullPath);

        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            console.error('❌ File not found at:', fullPath);
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        // Get file stats
        const stats = fs.statSync(fullPath);
        const fileSize = stats.size;
        console.log('📊 File size:', fileSize, 'bytes');

        // Determine file type and resource type for Cloudinary
        const ext = path.extname(fileName).toLowerCase();
        const title = fileName; // Store full filename as title
        let fileType: 'VIDEO' | 'IMAGE' | 'DOCUMENT' = 'DOCUMENT';
        let resourceType: 'video' | 'image' | 'raw' = 'raw';

        if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
            fileType = 'VIDEO';
            resourceType = 'video';
        } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
            fileType = 'IMAGE';
            resourceType = 'image';
        } else {
            // All documents (PDF, DOCX, etc.) use 'raw'
            fileType = 'DOCUMENT';
            resourceType = 'raw';
        }

        console.log('📝 File type:', fileType, '| Resource type:', resourceType);

        // --- CONFLICT RESOLUTION ---
        const existingFile = await prisma.archiveResource.findFirst({
            where: {
                title: title,
                folderId: folderId || null,
            }
        });

        if (existingFile) {
            console.log('⚠️ Existing file found, will override:', existingFile.id);
        }

        // Upload to Cloudinary with retry logic
        console.log('☁️ Uploading to Cloudinary...');

        let uploadResult;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                uploadResult = await new Promise<any>((resolve, reject) => {
                    const uploadOptions: any = {
                        resource_type: resourceType,
                        folder: 'syntel/archive',
                        use_filename: true,
                        unique_filename: !existingFile, // Only unique if not overriding
                        overwrite: !!existingFile,
                        timeout: 120000,
                    };

                    // If overriding, use the same public_id
                    if (existingFile?.cloudinaryId) {
                        uploadOptions.public_id = existingFile.cloudinaryId;
                        uploadOptions.invalidate = true;
                    }

                    cloudinary.uploader.upload(fullPath, uploadOptions, (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    });
                });

                console.log('✅ Cloudinary upload success:', uploadResult.public_id);
                break; // Success, exit retry loop

            } catch (cloudinaryError: any) {
                retryCount++;
                console.error(`❌ Cloudinary attempt ${retryCount} failed:`, cloudinaryError.message);

                if (retryCount >= maxRetries) {
                    return NextResponse.json(
                        { error: `Cloudinary error after ${maxRetries} attempts: ${cloudinaryError.message}` },
                        { status: 500 }
                    );
                }

                // Wait before retry (exponential backoff)
                await new Promise(r => setTimeout(r, 1000 * retryCount));
            }
        }

        // Save or Update in database
        let resource;
        if (existingFile) {
            resource = await prisma.archiveResource.update({
                where: { id: existingFile.id },
                data: {
                    fileUrl: uploadResult.secure_url,
                    thumbnail: fileType === 'DOCUMENT' ? null : (uploadResult.thumbnail_url || uploadResult.secure_url),
                    fileSize: fileSize,
                    cloudinaryId: uploadResult.public_id,
                    uploaderId: uploaderId,
                    updatedAt: new Date(),
                }
            });
            console.log('✅ Database updated:', resource.id);
        } else {
            resource = await prisma.archiveResource.create({
                data: {
                    title: title,
                    description: description || null,
                    fileUrl: uploadResult.secure_url,
                    thumbnail: fileType === 'DOCUMENT' ? null : (uploadResult.thumbnail_url || uploadResult.secure_url),
                    fileSize: fileSize,
                    duration: uploadResult.duration || null,
                    cloudinaryId: uploadResult.public_id,
                    folderId: folderId || null,
                    uploaderId: uploaderId,
                    contentType: 'DOKUMEN_INTERNAL',
                },
            });
            console.log('✅ Database created:', resource.id);
        }

        // Delete the Tus file after successful upload
        try {
            fs.unlinkSync(fullPath);
            const infoPath = fullPath + '.info';
            if (fs.existsSync(infoPath)) {
                fs.unlinkSync(infoPath);
            }
            console.log('🗑️ Tus files cleaned up');
        } catch (err) {
            console.error('⚠️ Error deleting Tus files:', err);
        }

        return NextResponse.json({
            success: true,
            resource,
            isUpdate: !!existingFile
        });
    } catch (error: any) {
        console.error('❌ TUS PROCESS ERROR:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process upload' },
            { status: 500 }
        );
    }
}
