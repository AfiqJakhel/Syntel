"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface InstructionListItemProps {
    id: string;
    title: string;
    category: string;
    dueDate: string;
    dueTime: string;
    issuer: string;
    isPastDue?: boolean;
    isCompleted?: boolean;
    isRevision?: boolean;
    reviewStatus?: "pending" | "revision" | "approved" | "completed" | "rejected";
}

export default function InstructionListItem({
    id,
    title,
    category,
    issuer,
    dueDate,
    dueTime,
    isPastDue,
    isCompleted,
    isRevision,
    reviewStatus,
}: InstructionListItemProps) {
    const router = useRouter();

    const getInitials = (text: string) => {
        return text
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };

    return (
        <div
            onClick={() => router.push(`/dashboard/staff/pengajuan/${id}`)}
            className="group flex items-center p-4 bg-white hover:bg-gray-50 border-b border-gray-100 transition-all cursor-pointer"
        >
            {/* Icon / Initials */}
            <div
                className={cn(
                    "flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform group-hover:scale-105",
                    isPastDue ? "bg-red-500" : isRevision ? "bg-orange-500" : isCompleted ? "bg-emerald-500" : "bg-blue-500"
                )}
            >
                {isCompleted ? <CheckCircle2 size={20} /> : isRevision ? <AlertCircle size={20} /> : getInitials(title)}
            </div>

            {/* Content */}
            <div className="ml-4 flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-red-600 transition-colors">
                    {title}
                </h4>
                <div className="flex items-center mt-0.5 gap-2 flex-wrap">
                    <p
                        className={cn(
                            "text-[11px] font-bold uppercase tracking-wider",
                            isPastDue ? "text-red-500" : "text-gray-400"
                        )}
                    >
                        Due at {dueTime}
                    </p>
                    <span className="text-gray-300">•</span>
                    <p className="text-[11px] font-medium text-gray-500">{category}</p>
                    <span className="text-gray-300">•</span>
                    <p className="text-[11px] font-medium text-gray-400 italic">By {issuer}</p>
                </div>
            </div>

            {/* Right side status */}
            <div className="ml-4 flex flex-col items-end">
                {isPastDue && (
                    <div className="flex items-center gap-1 text-red-500">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Past Due</span>
                    </div>
                )}
                {isCompleted && (
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 text-emerald-500">
                            <CheckCircle2 size={14} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Done</span>
                        </div>
                        {reviewStatus === "approved" ? (
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-tighter border border-emerald-100">Approved</span>
                        ) : reviewStatus === "rejected" ? (
                            <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded uppercase tracking-tighter border border-red-100">Rejected</span>
                        ) : (
                            <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-tighter border border-blue-100 italic">Review Pending</span>
                        )}
                    </div>
                )}
                {isRevision && (
                    <div className="flex items-center gap-1 text-orange-500">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Needs Revision</span>
                    </div>
                )}
                {!isPastDue && !isCompleted && !isRevision && (
                    <div className="flex items-center gap-1 text-blue-500">
                        <Clock size={14} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Upcoming</span>
                    </div>
                )}
            </div>
        </div>
    );
}
