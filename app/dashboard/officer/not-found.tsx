"use client";

import React from "react";
import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* 404 Illustration */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-red-50 mb-6">
                        <FileQuestion className="w-16 h-16 text-red-600" />
                    </div>

                    <h1 className="text-6xl font-extrabold text-gray-900 mb-2">404</h1>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">
                        Halaman Tidak Ditemukan
                    </h2>
                    <p className="text-gray-600 mb-8">
                        Maaf, halaman yang Anda cari tidak tersedia atau sedang dalam pengembangan.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Link
                        href="/dashboard/officer"
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-500/25"
                    >
                        <Home className="h-5 w-5" />
                        Kembali ke Dashboard
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Kembali ke Halaman Sebelumnya
                    </button>
                </div>

                {/* Help Text */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800">
                        <strong>💡 Tips:</strong> Jika Anda yakin halaman ini seharusnya ada,
                        silakan hubungi administrator sistem.
                    </p>
                </div>
            </div>
        </div>
    );
}
