"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/app/components/dashboard/layout/sidebar";
import { DashboardNavbar } from "@/app/components/dashboard/layout/navbar";
import { Footer } from "@/app/components/dashboard/layout/footer";

export function DashboardLayout({
    children,
    role = "STAFF",
    showNavbar = false
}: {
    children: React.ReactNode;
    role?: "STAFF" | "OFFICER";
    showNavbar?: boolean;
}) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = React.useState(false);

    React.useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
            router.push("/login");
            return;
        }

        try {
            const user = JSON.parse(userStr);

            // Cek apakah role sesuai
            if (user.role !== role) {
                // Jika staff mencoba akses officer, lempar ke dashboard staff
                if (user.role === "STAFF" && role === "OFFICER") {
                    router.push("/dashboard/staff");
                    return;
                }
                // Jika officer mencoba akses staff, lempar ke dashboard officer
                if (user.role === "OFFICER" && role === "STAFF") {
                    router.push("/dashboard/officer");
                    return;
                }
            }

            setIsAuthorized(true);
        } catch (e) {
            router.push("/login");
        }
    }, [role, router]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/login");
    };

    if (!isAuthorized) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row bg-[#F8F9FA] w-full h-screen overflow-hidden">
            <Sidebar role={role} />

            <div className="flex flex-col flex-1 h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
                    {showNavbar && <DashboardNavbar onLogout={handleLogout} role={role} />}

                    {/* Content */}
                    <main className="p-4 md:p-12 lg:p-16 flex-1">
                        <div className="mx-auto w-full max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {children}
                        </div>
                    </main>
                </div>

                {/* Footer - Fixed at bottom */}
                <Footer />
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E5E7EB;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #D1D5DB;
                }
            `}</style>
        </div>
    );
}
