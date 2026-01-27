"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Calendar, User } from "lucide-react";

interface Assignment {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    assignedBy: string;
    deadline: string;
    status: "pending" | "revision" | "approved";
    feedback?: string;
    contentType?: string;
}

interface AssignmentCardProps {
    assignment: Assignment;
    onRefresh: () => void;
}

export default function AssignmentCard({ assignment, onRefresh }: AssignmentCardProps) {
    const router = useRouter();

    const getStatusBadge = () => {
        if (assignment.status === "revision") {
            return (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Revisi
                </div>
            );
        }
        return null;
    };

    const getContentTypeBadge = () => {
        if (assignment.contentType) {
            return (
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-md text-xs font-bold uppercase shadow-md">
                    {assignment.contentType}
                </div>
            );
        }
        return null;
    };

    const handleCardClick = () => {
        // Navigate to detail or upload page
        router.push(`/dashboard/staff/pengajuan/${assignment.id}`);
    };

    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
            {/* Thumbnail */}
            <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                {getContentTypeBadge()}
                {getStatusBadge()}
                <img
                    src={assignment.thumbnail}
                    alt={assignment.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
            </div>

            {/* Content */}
            <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                    {assignment.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {assignment.description}
                </p>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>Assigned by {assignment.assignedBy}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{assignment.deadline}</span>
                    </div>
                </div>

                {/* Feedback (if revision) */}
                {assignment.status === "revision" && assignment.feedback && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-semibold text-red-700 mb-1">
                            Feedback Revisi :
                        </p>
                        <p className="text-xs text-red-600 italic">
                            &quot;{assignment.feedback}&quot;
                        </p>
                    </div>
                )}

                {/* Action Button */}
                <button
                    onClick={handleCardClick}
                    className={`w-full py-3 rounded-lg font-semibold text-sm transition-all active:scale-95 ${assignment.status === "revision"
                            ? "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg"
                            : "bg-white text-red-600 border-2 border-red-600 hover:bg-red-50"
                        }`}
                >
                    {assignment.status === "revision"
                        ? "Upload Revisi"
                        : "Ambil & Upload Konten"}
                </button>
            </div>
        </div>
    );
}
