import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Define the upload directory
        const uploadDir = join(process.cwd(), "public", "uploads");

        // Ensure the directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Directory might already exist
        }

        // Generate a unique filename to prevent collisions
        const uniqueId = crypto.randomUUID();
        const extension = file.name.split(".").pop();
        const fileName = `${uniqueId}.${extension}`;
        const path = join(uploadDir, fileName);

        // Save the file
        await writeFile(path, buffer);

        // Return the public URL
        const fileUrl = `/uploads/${fileName}`;

        return NextResponse.json({
            message: "Upload berhasil",
            fileUrl
        });

    } catch (error: any) {
        console.error("❌ UPLOAD ERROR:", error.message);
        return NextResponse.json(
            { error: "Gagal mengunggah file ke server." },
            { status: 500 }
        );
    }
}
