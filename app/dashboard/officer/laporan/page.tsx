"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/app/components/dashboard/layout/DashboardLayout";
import {
    Download,
    FileSpreadsheet,
    Filter,
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertCircle,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Search,
    Eye,
    Folder,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LaporanPage() {
    const [selectedPeriod, setSelectedPeriod] = useState("Bulanan");
    const [selectedComparison, setSelectedComparison] = useState("1 Bulan Terakhir");
    const [isPeriodOpen, setIsPeriodOpen] = useState(false);
    const [isComparisonOpen, setIsComparisonOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const [reportData, setReportData] = useState<any>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    // Dynamic options based on Period
    const comparisonOptions: Record<string, string[]> = {
        "Bulanan": ["1 Bulan Terakhir", "2 Bulan Terakhir", "3 Bulan Terakhir"],
        "Mingguan": ["1 Minggu Terakhir", "2 Minggu Terakhir", "3 Minggu Terakhir"],
        "Tahunan": ["1 Tahun Terakhir", "2 Tahun Terakhir", "3 Tahun Terakhir"]
    };

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/dashboard/officer/reports?period=${selectedPeriod}&comparison=${selectedComparison}`);
            const data = await res.json();
            setReportData(data);
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();

        // Polling every 30 seconds to keep it "real-time" like the dashboard
        const pollInterval = setInterval(fetchReports, 30000);
        return () => clearInterval(pollInterval);
    }, [selectedPeriod, selectedComparison]);

    // Reset page when searching
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    if (isLoading && !reportData) {
        return (
            <DashboardLayout role="OFFICER" showNavbar={false}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Memuat Laporan...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const summaryCards = [
        {
            label: "Total Konten",
            value: reportData?.summary[0]?.value || 0,
            comparisonValue: reportData?.summary[0]?.comparisonValue || 0,
            trend: reportData?.summary[0]?.trend || "0%",
            isPositive: reportData?.summary[0]?.isPositive,
            icon: <Folder className="h-6 w-6 text-blue-600" />,
            bgColor: "bg-blue-50"
        },
        {
            label: "Approved",
            value: reportData?.summary[1]?.value || 0,
            comparisonValue: reportData?.summary[1]?.comparisonValue || 0,
            trend: reportData?.summary[1]?.trend || "0%",
            isPositive: reportData?.summary[1]?.isPositive,
            icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
            bgColor: "bg-emerald-50"
        },
        {
            label: "Pending Review",
            value: reportData?.summary[2]?.value || 0,
            comparisonValue: reportData?.summary[2]?.comparisonValue || 0,
            trend: reportData?.summary[2]?.trend || "0%",
            isPositive: reportData?.summary[2]?.isPositive,
            icon: <Clock className="h-6 w-6 text-orange-600" />,
            bgColor: "bg-orange-50"
        },
        {
            label: "Perlu Revisi",
            value: reportData?.summary[3]?.value || 0,
            comparisonValue: reportData?.summary[3]?.comparisonValue || 0,
            trend: reportData?.summary[3]?.trend || "0%",
            isPositive: reportData?.summary[3]?.isPositive,
            icon: <AlertCircle className="h-6 w-6 text-red-600" />,
            bgColor: "bg-red-50"
        },
    ];

    const monthlyTrends = reportData?.monthlyTrends || [];
    const contentTypes = reportData?.contentTypes || [];
    const allActivities = reportData?.activities || [];
    const kpis = reportData?.kpis || { avgApprovalTime: "0", eventCount: 0, folderCount: 0 };

    // Activity Log Logic: Search & Pagination
    const filteredActivities = allActivities.filter((activity: any) =>
        activity.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.detail.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const itemsPerPage = 6;
    const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
    const paginatedActivities = filteredActivities.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getPageNumbers = () => {
        const pages: number[] = [];
        let start = currentPage - 2;
        let end = currentPage + 2;

        if (currentPage === 1) {
            start = 1;
            end = 3;
        } else if (currentPage === 2) {
            start = 1;
            end = 4;
        }

        if (start < 1) start = 1;
        if (end > totalPages) end = totalPages;

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true);

        try {
            // Create a new window for printing
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert('Popup blocked! Please allow popups for this site.');
                setIsGeneratingPDF(false);
                return;
            }

            const currentDate = new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            // Generate PDF content
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Laporan Konten - ${selectedPeriod} - ${selectedComparison}</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                            padding: 40px; 
                            color: #1f2937;
                            line-height: 1.6;
                        }
                        .header { 
                            text-align: center; 
                            margin-bottom: 40px; 
                            padding-bottom: 20px;
                            border-bottom: 3px solid #dc2626;
                        }
                        .header h1 { 
                            font-size: 28px; 
                            font-weight: 900; 
                            color: #1f2937;
                            margin-bottom: 8px;
                        }
                        .header .subtitle { 
                            font-size: 12px; 
                            color: #6b7280; 
                            text-transform: uppercase;
                            letter-spacing: 2px;
                        }
                        .header .period { 
                            font-size: 14px; 
                            color: #dc2626; 
                            font-weight: 700;
                            margin-top: 10px;
                        }
                        .summary-grid { 
                            display: grid; 
                            grid-template-columns: repeat(4, 1fr); 
                            gap: 16px; 
                            margin-bottom: 32px; 
                        }
                        .summary-card { 
                            background: #f9fafb; 
                            border: 1px solid #e5e7eb;
                            border-radius: 12px; 
                            padding: 20px; 
                            text-align: center;
                        }
                        .summary-card .value { 
                            font-size: 36px; 
                            font-weight: 900; 
                            color: #1f2937;
                        }
                        .summary-card .label { 
                            font-size: 11px; 
                            color: #6b7280; 
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            margin-top: 4px;
                        }
                        .summary-card .trend { 
                            font-size: 12px; 
                            font-weight: 700;
                            margin-top: 8px;
                            padding: 4px 8px;
                            border-radius: 20px;
                            display: inline-block;
                        }
                        .trend-up { background: #d1fae5; color: #059669; }
                        .trend-down { background: #fee2e2; color: #dc2626; }
                        .section { margin-bottom: 32px; }
                        .section-title { 
                            font-size: 18px; 
                            font-weight: 800; 
                            color: #1f2937;
                            margin-bottom: 16px;
                            padding-bottom: 8px;
                            border-bottom: 2px solid #e5e7eb;
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-top: 16px;
                        }
                        th, td { 
                            padding: 12px; 
                            text-align: left; 
                            border-bottom: 1px solid #e5e7eb;
                            font-size: 12px;
                        }
                        th { 
                            background: #f3f4f6; 
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            color: #6b7280;
                        }
                        .trend-bar { 
                            display: flex; 
                            align-items: center; 
                            margin: 8px 0;
                        }
                        .trend-bar .month { 
                            width: 60px; 
                            font-size: 11px; 
                            font-weight: 700;
                        }
                        .trend-bar .bar-container { 
                            flex: 1; 
                            height: 24px; 
                            background: #f3f4f6; 
                            border-radius: 4px;
                            display: flex;
                            overflow: hidden;
                        }
                        .bar-approved { background: #10b981; }
                        .bar-pending { background: #f59e0b; }
                        .bar-revision { background: #ef4444; }
                        .trend-bar .total { 
                            width: 60px; 
                            text-align: right; 
                            font-size: 12px; 
                            font-weight: 700;
                        }
                        .content-type-row { 
                            display: flex; 
                            justify-content: space-between; 
                            padding: 8px 0;
                            border-bottom: 1px solid #e5e7eb;
                        }
                        .footer { 
                            margin-top: 40px; 
                            padding-top: 20px; 
                            border-top: 1px solid #e5e7eb;
                            text-align: center;
                            font-size: 10px;
                            color: #9ca3af;
                        }
                        @media print {
                            body { padding: 20px; }
                            .summary-grid { grid-template-columns: repeat(4, 1fr); }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Laporan Konten</h1>
                        <div class="subtitle">Syntel - Creative Hub Content Management</div>
                        <div class="period">${selectedPeriod} • ${selectedComparison}</div>
                    </div>

                    <div class="summary-grid">
                        ${summaryCards.map(card => `
                            <div class="summary-card">
                                <div class="value">${card.value}</div>
                                <div class="label">${card.label}</div>
                                <div class="trend ${card.isPositive ? 'trend-up' : 'trend-down'}">${card.trend} vs prev</div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="section">
                        <div class="section-title">Tren Produksi Konten</div>
                        ${monthlyTrends.map((data: any) => `
                            <div class="trend-bar">
                                <div class="month">${data.month}</div>
                                <div class="bar-container">
                                    <div class="bar-approved" style="width: ${(data.approved / (reportData?.maxTrendValue || 100)) * 100}%"></div>
                                    <div class="bar-pending" style="width: ${(data.pending / (reportData?.maxTrendValue || 100)) * 100}%"></div>
                                    <div class="bar-revision" style="width: ${(data.revision / (reportData?.maxTrendValue || 100)) * 100}%"></div>
                                </div>
                                <div class="total">${data.total}</div>
                            </div>
                        `).join('')}
                        <div style="display: flex; gap: 20px; margin-top: 12px; font-size: 11px;">
                            <span style="color: #10b981;">● Approved</span>
                            <span style="color: #f59e0b;">● Pending</span>
                            <span style="color: #ef4444;">● Revision</span>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Distribusi Media</div>
                        ${contentTypes.map((type: any, idx: number) => `
                            <div class="content-type-row">
                                <span>${String(idx + 1).padStart(2, '0')}. ${type.name}</span>
                                <span><strong>${type.count}</strong> (${type.percentage}%)</span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="footer">
                        <p>Digenerate pada: ${currentDate} | Syntel - Portal Telkom Indonesia</p>
                    </div>
                </body>
                </html>
            `;

            printWindow.document.write(htmlContent);
            printWindow.document.close();

            // Wait for content to load then print
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                    setIsGeneratingPDF(false);
                }, 500);
            };

        } catch (error) {
            console.error('Error generating PDF:', error);
            setIsGeneratingPDF(false);
        }
    };


    return (
        <DashboardLayout role="OFFICER" showNavbar={false}>
            <div className={`space-y-8 pb-12 transition-all duration-700 ${isLoading ? 'opacity-40 scale-[0.99] grayscale' : 'opacity-100 scale-100'}`}>
                {/* Header Section - Glassmorphism & Gradient */}
                <div className="relative bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-red-500/5 p-8 md:p-12 mb-8">
                    {/* Background Clipping Wrapper */}
                    <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-red-600/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-red-600/5 rounded-full blur-2xl" />
                    </div>

                    <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-red-200">
                                    CREATIVE HUB
                                </span>
                                <div className="h-px w-12 bg-gray-200" />
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none">
                                Laporan <span className="text-red-600 italic">Konten</span>
                            </h1>
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                Real-time Analysis & Content Performance
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full md:w-auto">
                            <button
                                onClick={handleDownloadPDF}
                                disabled={isGeneratingPDF}
                                className="flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all hover:translate-y-[-2px] active:translate-y-0 shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGeneratingPDF ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                {isGeneratingPDF ? "Generating..." : "Download PDF"}
                            </button>
                        </div>
                    </div>

                    {/* Integrated Premium Filter Bar */}
                    <div className="mt-12 pt-10 border-t border-gray-100/60 flex flex-wrap items-end gap-6 md:gap-10">
                        <div className="flex-1 flex flex-wrap items-center gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Calendar className="h-3 w-3 text-red-600" />
                                    Range Periode
                                </label>
                                <div className="relative group/filter">
                                    <button
                                        onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                                        className={`flex items-center justify-between gap-6 min-w-[160px] px-6 py-4 bg-gray-50/50 border-2 rounded-2xl text-sm font-black text-gray-900 transition-all hover:bg-white group-hover/filter:border-red-600/30 ${isPeriodOpen ? 'border-red-600 bg-white ring-8 ring-red-600/5' : 'border-transparent'}`}
                                    >
                                        {selectedPeriod}
                                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-all ${isPeriodOpen ? 'rotate-180 text-red-600' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {isPeriodOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsPeriodOpen(false)} />
                                                <motion.div
                                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                                    className="absolute left-0 mt-3 w-56 bg-white border border-gray-100 rounded-[2rem] shadow-2xl p-3 z-50"
                                                >
                                                    <div className="mb-2 px-3 py-2 text-[9px] font-black text-gray-300 uppercase tracking-widest">Pilih Periode</div>
                                                    {Object.keys(comparisonOptions).map((option) => (
                                                        <button
                                                            key={option}
                                                            onClick={() => {
                                                                setSelectedPeriod(option);
                                                                setSelectedComparison(comparisonOptions[option as keyof typeof comparisonOptions][0]);
                                                                setIsPeriodOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group/item ${selectedPeriod === option ? 'bg-red-600 text-white' : 'text-gray-500 hover:bg-red-50 hover:text-red-600'}`}
                                                        >
                                                            {option}
                                                            {selectedPeriod === option && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="h-10 w-px bg-gray-100 hidden md:block" />

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <TrendingUp className="h-3 w-3 text-red-600" />
                                    Bandingkan Terhadap
                                </label>
                                <div className="relative group/filter">
                                    <button
                                        onClick={() => setIsComparisonOpen(!isComparisonOpen)}
                                        className={`flex items-center justify-between gap-6 min-w-[200px] px-6 py-4 bg-gray-50/50 border-2 rounded-2xl text-sm font-black text-gray-900 transition-all hover:bg-white group-hover/filter:border-red-600/30 ${isComparisonOpen ? 'border-red-600 bg-white ring-8 ring-red-600/5' : 'border-transparent'}`}
                                    >
                                        {selectedComparison}
                                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-all ${isComparisonOpen ? 'rotate-180 text-red-600' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {isComparisonOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsComparisonOpen(false)} />
                                                <motion.div
                                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                                    className="absolute left-0 mt-3 w-64 bg-white border border-gray-100 rounded-[2rem] shadow-2xl p-3 z-50"
                                                >
                                                    <div className="mb-2 px-3 py-2 text-[9px] font-black text-gray-300 uppercase tracking-widest">Pilih Perbandingan</div>
                                                    {comparisonOptions[selectedPeriod as keyof typeof comparisonOptions].map((option) => (
                                                        <button
                                                            key={option}
                                                            onClick={() => {
                                                                setSelectedComparison(option);
                                                                setIsComparisonOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${selectedComparison === option ? 'bg-red-600 text-white shadow-xl shadow-red-200' : 'text-gray-500 hover:bg-red-50 hover:text-red-600'}`}
                                                        >
                                                            {option}
                                                            {selectedComparison === option && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards Row - Clean & Clear */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {summaryCards.map((card, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={idx}
                            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 group hover:border-red-600/30 transition-all relative overflow-hidden"
                        >
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className={`p-4 ${card.bgColor} rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                                        {card.icon}
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black ${card.isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                                        <TrendingUp className={`h-3 w-3 ${!card.isPositive && 'rotate-180'}`} />
                                        {card.trend}
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <p className="text-6xl font-black text-gray-900 tracking-tighter">{card.value}</p>
                                    <span className="text-xs font-bold text-gray-300 uppercase tracking-widest italic font-serif">Items</span>
                                </div>
                                <div className="space-y-2 mt-4">
                                    <p className="text-[11px] font-black text-gray-900 uppercase tracking-[0.1em]">{card.label}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-gray-50 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${card.isPositive ? 'bg-emerald-500' : 'bg-red-500'} rounded-full transition-all duration-1000`}
                                                style={{ width: `${Math.min((card.value / (card.comparisonValue || 1)) * 50, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">
                                            Prev: <span className="text-gray-900">{card.comparisonValue}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Main Insight Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Monthly Trends - Bar Chart Glassmorphism */}
                    <div className="lg:col-span-12 xl:col-span-8 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
                            <div className="flex items-center gap-4">
                                <div className="w-2.5 h-10 bg-red-600 rounded-full shadow-lg shadow-red-100" />
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Tren Produksi Konten</h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aktivitas Tim Selama 7 Bulan Terakhir</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-6 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                                {[
                                    { label: "Approved", color: "bg-emerald-500" },
                                    { label: "Pending", color: "bg-orange-400" },
                                    { label: "Revision", color: "bg-red-500" },
                                ].map((legend, id) => (
                                    <div key={id} className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${legend.color} shadow-sm`} />
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{legend.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-8 relative">
                            {monthlyTrends.map((data: any, idx: number) => (
                                <div key={idx} className="group/bar relative grid grid-cols-12 items-center gap-6">
                                    {/* Month Label */}
                                    <div className="col-span-2 text-left">
                                        <p className="text-[11px] font-black text-gray-900 uppercase tracking-tighter group-hover/bar:text-red-600 transition-colors">{data.month}</p>
                                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">2026</p>
                                    </div>

                                    {/* Bar Container */}
                                    <div className="col-span-8 flex items-center h-12 bg-gray-50/50 rounded-2xl overflow-visible border-2 border-transparent group-hover/bar:border-red-600/5 group-hover/bar:bg-white transition-all duration-500 shadow-sm relative pr-20">

                                        {/* Approved Segment */}
                                        <div
                                            style={{ width: `${(data.approved / (reportData?.maxTrendValue || 100)) * 100}%` }}
                                            className="h-full bg-emerald-500 first:rounded-l-xl last:rounded-r-xl transition-all hover:brightness-110 relative group/seg cursor-pointer"
                                        >
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                                whileHover={{ opacity: 1, scale: 1, y: 0 }}
                                                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-3 py-1.5 rounded-lg z-[60] shadow-2xl pointer-events-none whitespace-nowrap flex items-center gap-2 border border-gray-700"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                {data.approved} APPROVED
                                            </motion.div>
                                        </div>

                                        {/* Pending Segment */}
                                        <div
                                            style={{ width: `${(data.pending / (reportData?.maxTrendValue || 100)) * 100}%` }}
                                            className="h-full bg-orange-400/90 transition-all hover:brightness-110 relative group/seg cursor-pointer"
                                        >
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                                whileHover={{ opacity: 1, scale: 1, y: 0 }}
                                                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-3 py-1.5 rounded-lg z-[60] shadow-2xl pointer-events-none whitespace-nowrap flex items-center gap-2 border border-gray-700"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-orange-400" />
                                                {data.pending} PENDING
                                            </motion.div>
                                        </div>

                                        {/* Revision Segment */}
                                        <div
                                            style={{ width: `${(data.revision / (reportData?.maxTrendValue || 100)) * 100}%` }}
                                            className="h-full bg-red-500/90 transition-all hover:brightness-110 relative group/seg cursor-pointer last:rounded-r-xl"
                                        >
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                                whileHover={{ opacity: 1, scale: 1, y: 0 }}
                                                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-3 py-1.5 rounded-lg z-[60] shadow-2xl pointer-events-none whitespace-nowrap flex items-center gap-2 border border-gray-700"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                                {data.revision} REVISI
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Total Counter on the right */}
                                    <div className="col-span-2 flex items-center justify-end pr-4">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[14px] font-black text-gray-900 tracking-tighter">{data.total}</span>
                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Konten</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content Distribution - Circular focus */}
                    <div className="lg:col-span-12 xl:col-span-4 bg-gray-900 p-10 rounded-[3rem] shadow-2xl shadow-gray-900/20 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -mt-20 -mr-20" />

                        <div className="relative z-10 space-y-12">
                            <div className="flex items-center gap-4">
                                <Search className="h-6 w-6 text-red-500" />
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight leading-none text-white">Distribusi Media</h2>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Platform Performance</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {contentTypes.map((type: any, idx: number) => (
                                    <div key={idx} className="group">
                                        <div className="flex items-center justify-between mb-3 px-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-red-600">{String(idx + 1).padStart(2, '0')}.</span>
                                                <p className="text-[11px] font-black uppercase tracking-widest text-gray-300 group-hover:text-white transition-colors">{type.name}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-black text-white">{type.count}</span>
                                                <div className="h-4 w-px bg-gray-700" />
                                                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">{type.percentage}%</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${type.percentage}%` }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>



                {/* Log Activity Table - Refined */}
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden">
                    <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/20">
                        <div className="flex items-center gap-5">
                            <div className="w-2.5 h-10 bg-red-600 rounded-full shadow-lg shadow-red-100" />
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Aktivitas Terbaru</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Log operasional system real-time</p>
                            </div>
                        </div>
                        <div className="relative group min-w-[320px]">
                            <Search className="h-4 w-4 absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari Log Operasional..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-8 py-4 bg-white border border-gray-200 rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-8 focus:ring-red-600/5 focus:border-red-600 transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">User & Akses</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aksi</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Detail Konten</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Waktu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedActivities.map((activity: any) => (
                                    <tr key={activity.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-5">
                                                <div className={`h-11 w-11 rounded-xl ${activity.color} shadow-lg flex items-center justify-center text-white font-black text-lg transition-all`}>
                                                    {activity.avatar}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-gray-900 leading-none">{activity.user}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-sm ${activity.action.includes('setuju') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                activity.action.includes('revisi') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>
                                                {activity.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <p className="text-sm font-bold text-gray-800 line-clamp-1 italic tracking-tight">"{activity.detail}"</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    <Clock className="h-3 w-3" />
                                                    {activity.timestamp}
                                                </div>
                                                <Link
                                                    href={`/dashboard/officer/instruksi?submissionId=${activity.id}`}
                                                    className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:bg-red-600 hover:text-white rounded-lg shadow-sm border border-gray-100"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    Preview
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mt-4 m-6">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Halaman {currentPage} dari {totalPages}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-10 h-10 flex items-center justify-center rounded-xl border border-red-600 text-red-600 hover:bg-red-50 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <div className="flex items-center gap-2 mx-1">
                                {getPageNumbers().map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === pageNum
                                            ? "bg-red-600 text-white shadow-lg shadow-red-200"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="w-10 h-10 flex items-center justify-center rounded-xl border border-red-600 text-red-600 hover:bg-red-50 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </DashboardLayout>
    );
}
