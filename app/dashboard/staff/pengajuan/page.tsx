"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter } from "lucide-react";
import { DashboardLayout } from "@/app/components/dashboard/layout/DashboardLayout";
import InstructionListItem from "./components/InstructionListItem";
import { cn } from "@/app/lib/utils";

interface Assignment {
    id: string;
    title: string;
    category: string;
    issuer: string;
    dueDate: Date;
    status: "pending" | "revision" | "approved" | "completed" | "rejected";
    isSubmitted: boolean;
    source: "INSTRUKSI" | "INISIATIF";
}

type TabType = "upcoming" | "pastdue" | "revision" | "inisiatif" | "completed";

export default function PengajuanPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("upcoming");
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) return;
            const user = JSON.parse(userStr);
            const nip = user.nip;

            const res = await fetch(`/api/staff/instructions?nip=${nip}`);
            if (!res.ok) throw new Error("Gagal fetch data");

            const data = await res.json();

            // Map API data to component state
            const mappedData: Assignment[] = data.map((item: any) => ({
                id: item.id,
                title: item.title,
                category: item.contentType || "GENERAL",
                issuer: item.issuer,
                dueDate: new Date(item.deadline),
                status: item.status.toLowerCase() as any, // PENDING, REVISION, APPROVED, REJECTED
                isSubmitted: item.isSubmitted,
                source: item.source
            }));

            setAssignments(mappedData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching assignments:", error);
            setLoading(false);
        }
    };

    const now = new Date();

    const filteredAssignments = assignments
        .filter((sub) => {
            if (activeTab === "completed") {
                return sub.isSubmitted && sub.status !== "revision" && sub.source !== "INISIATIF";
            }
            if (activeTab === "revision") {
                return sub.status === "revision";
            }
            if (activeTab === "inisiatif") {
                return sub.source === "INISIATIF";
            }

            const isPast = sub.dueDate < now;
            // For Upcoming and Past Due, we only show items that are NOT submitted AND not in revision
            const needsWork = !sub.isSubmitted && sub.status !== "revision";

            if (activeTab === "pastdue") return isPast && needsWork;
            if (activeTab === "upcoming") return !isPast && needsWork;

            return true;
        })
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    // Group by date - using Map to maintain order
    const groupedAssignmentsValues: { date: string, items: Assignment[] }[] = [];
    filteredAssignments.forEach((sub) => {
        const dateStr = sub.dueDate.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

        let group = groupedAssignmentsValues.find(g => g.date === dateStr);
        if (!group) {
            group = { date: dateStr, items: [] };
            groupedAssignmentsValues.push(group);
        }
        group.items.push(sub);
    });

    const getRelativeDateInfo = (date: Date) => {
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffMonths = Math.floor(diffDays / 30);

        if (diffMs < 0) return ""; // Future
        if (diffMonths > 0) return `Due ${diffMonths} months ago`;
        if (diffDays > 0) return `Due ${diffDays} days ago`;
        return "Due today";
    };

    return (
        <DashboardLayout role="STAFF">
            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <h1 className="text-2xl font-black text-gray-900 italic uppercase tracking-tighter">
                            Instruksi
                        </h1>

                        {/* Tabs */}
                        <div className="flex items-center gap-1">
                            {(["upcoming", "pastdue", "revision", "inisiatif", "completed"] as TabType[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-xl",
                                        activeTab === tab
                                            ? "bg-red-600 text-white shadow-lg shadow-red-200"
                                            : "text-gray-400 hover:text-gray-900 hover:bg-white"
                                    )}
                                >
                                    {tab === "pastdue" ? "Past Due" : tab === "inisiatif" ? "Inisiatif" : tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                            <Search size={20} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                            <Filter size={20} />
                        </button>
                        <button
                            onClick={() => router.push("/dashboard/staff/pengajuan/buat")}
                            className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl hover:-translate-y-1 active:scale-95"
                        >
                            <Plus size={16} />
                            Buat Pengajuan
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-8 pb-20">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
                        </div>
                    ) : filteredAssignments.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
                                Tidak ada instruksi {activeTab}
                            </p>
                        </div>
                    ) : (
                        groupedAssignmentsValues.map(({ date, items }) => (
                            <div key={date} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">
                                        {date}
                                    </h3>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {getRelativeDateInfo(items[0].dueDate)}
                                    </span>
                                </div>
                                <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                                    {items.map((sub: Assignment) => (
                                        <InstructionListItem
                                            key={sub.id}
                                            id={sub.id}
                                            title={sub.title}
                                            category={sub.category}
                                            issuer={sub.issuer}
                                            dueDate={date}
                                            dueTime={sub.dueDate.toLocaleTimeString("id-ID", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                            isPastDue={activeTab === "pastdue"}
                                            isCompleted={activeTab === "completed" || activeTab === "inisiatif"}
                                            isRevision={activeTab === "revision"}
                                            reviewStatus={sub.status}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
