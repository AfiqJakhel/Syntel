"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to console for debugging
        console.error("Dashboard Error:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Error Illustration */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-orange-50 mb-6">
                        <AlertTriangle className="w-16 h-16 text-orange-600" />
                    </div>

                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                        Terjadi Kesalahan
                    </h1>
                    <h2 className="text-xl font-bold text-gray-800 mb-3">
                        Oops! Ada yang tidak beres
                    </h2>
                    <p className="text-gray-600 mb-2">
                        Aplikasi mengalami masalah saat memuat halaman ini.
                    </p>

                    {/* Error Details (for development) */}
                    {process.env.NODE_ENV === "development" && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-left">
                            <p className="text-xs font-mono text-red-800 break-all">
                                <strong>Error:</strong> {error.message}
                            </p>
                            {error.digest && (
                                <p className="text-xs font-mono text-red-600 mt-2">
                                    <strong>Digest:</strong> {error.digest}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={reset}
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-500/25"
                    >
                        <RefreshCw className="h-5 w-5" />
                        Coba Lagi
                    </button>

                    <Link
                        href="/dashboard/officer"
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                    >
                        <Home className="h-5 w-5" />
                        Kembali ke Dashboard
                    </Link>
                </div>

                {/* Help Text */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800">
                        <strong>💡 Saran:</strong> Jika masalah terus berlanjut, coba refresh halaman
                        atau hubungi tim support.
                    </p>
                </div>
            </div>
        </div>
    );
}
