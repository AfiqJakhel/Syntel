import express from 'express';
import cors from 'cors';
import { Server, Upload } from '@tus/server';
import { FileStore } from '@tus/file-store';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3001;

// Setup uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads', 'tus');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize Tus server with logging
const tusServer = new Server({
    path: '/api/upload/tus',
    datastore: new FileStore({ directory: uploadsDir }),
    respectForwardedHeaders: true,
    onUploadCreate: async (_req, upload) => {
        console.log('📤 TUS: New upload started -', upload.id);
        console.log('   Size:', upload.size, 'bytes');
        return { metadata: upload.metadata };
    },
    onUploadFinish: async (_req, upload) => {
        console.log('✅ TUS: Upload complete -', upload.id);
        return {};
    },
});

// CORS Middleware
app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    allowedHeaders: [
        'Authorization',
        'Content-Type',
        'Upload-Length',
        'Upload-Offset',
        'Tus-Resumable',
        'Upload-Metadata',
        'X-Requested-With',
        'X-HTTP-Method-Override',
        'Content-Disposition'
    ],
    exposedHeaders: [
        'Location',
        'Upload-Offset',
        'Upload-Length',
        'Tus-Resumable',
        'Upload-Metadata',
        'Upload-Expires',
        'Tus-Extension',
        'Tus-Max-Size'
    ],
    credentials: true,
}));

// Tus route - Let the server handle all requests
app.use((req, res) => {
    console.log('📥 TUS Request:', req.method, req.url);
    tusServer.handle(req, res);
});

app.listen(port, () => {
    console.log('🚀 Tus Upload Server running at http://localhost:' + port + '/api/upload/tus');
    console.log('📁 Uploads directory:', uploadsDir);
});
