"use client";

import React from "react";
import Link from "next/link";
import { FileQuestion, Home, LogIn, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 flex items-center justify-center p-4">
      <div className="max-w-xl w-full text-center">
        {/* 404 Large Text */}
        <div className="relative mb-8">
          <h1 className="text-[150px] font-black text-gray-100 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <FileQuestion className="w-20 h-20 text-red-600 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-lg text-gray-600 mb-10 max-w-sm mx-auto leading-relaxed">
          Maaf, sepertinya Anda tersesat. Halaman yang Anda cari tidak ada atau dalam tahap pengembangan.
        </p>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/dashboard/officer"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-bold hover:from-red-700 hover:to-red-800 transition-all shadow-xl shadow-red-500/20 active:scale-95"
          >
            <Home className="h-5 w-5" />
            Dashboard Utama
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
            Kembali Saja
          </button>
        </div>

        {/* System Info */}
        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col items-center gap-4">
          <p className="text-sm text-gray-400 font-medium">
            © 2026 Syntel DigiFlow System - Telkom Indonesia
          </p>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse delay-75"></div>
            <div className="w-2 h-2 rounded-full bg-red-200 animate-pulse delay-150"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
