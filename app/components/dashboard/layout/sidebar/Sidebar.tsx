"use client";

import React, { useState, createContext, useContext } from "react";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
    LayoutDashboard,
    FilePlus,
    Archive,
    Users,
    MessageSquare,
    PenTool,
    Video,
    LogOut,
    UserCheck,
    FileText,
    Calendar,
    BarChart3
} from "lucide-react";
import { cn } from "@/app/lib/utils";

// --- Base Sidebar Components (Internal) ---

interface SidebarContextProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

const useSidebarContext = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
};

const SidebarProvider = ({
    children,
    open: openProp,
    setOpen: setOpenProp,
    animate = true,
}: {
    children: React.ReactNode;
    open?: boolean;
    setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
    animate?: boolean;
}) => {
    const [openState, setOpenState] = useState(false);
    const open = openProp !== undefined ? openProp : openState;
    const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

    return (
        <SidebarContext.Provider value={{ open, setOpen, animate }}>
            {children}
        </SidebarContext.Provider>
    );
};

const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
    return (
        <>
            <DesktopSidebar {...props} />
            <MobileSidebar {...(props as React.ComponentProps<"div">)} />
        </>
    );
};

const DesktopSidebar = ({
    className,
    children,
    ...props
}: React.ComponentProps<typeof motion.div>) => {
    const { open, setOpen, animate } = useSidebarContext();
    return (
        <motion.div
            className={cn(
                "h-full px-4 py-4 hidden md:flex md:flex-col bg-white border-r border-gray-200 w-[260px] shrink-0",
                className
            )}
            animate={{
                width: animate ? (open ? "260px" : "80px") : "260px",
            }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            {...props}
        >
            {children}
        </motion.div>
    );
};

const MobileSidebar = ({
    className,
    children,
    ...props
}: React.ComponentProps<"div">) => {
    const { open, setOpen } = useSidebarContext();
    return (
        <div className="md:hidden">
            <div
                className={cn(
                    "h-16 px-6 flex flex-row items-center justify-between bg-white w-full border-b border-gray-100"
                )}
                {...props}
            >
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white font-black text-lg shadow-lg shadow-red-200">
                        S
                    </div>
                    <span className="text-lg font-black tracking-tight text-gray-900">Syntel</span>
                </div>

                <button
                    onClick={() => setOpen(!open)}
                    className="p-2 rounded-xl bg-gray-50 text-gray-900 hover:bg-gray-100 transition-all active:scale-95"
                >
                    <IconMenu2 size={24} stroke={2.5} />
                </button>
            </div>

            <AnimatePresence mode="wait">
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 200,
                            }}
                            className={cn(
                                "fixed inset-0 h-screen w-80 bg-white p-8 z-[100] flex flex-col justify-between shadow-2xl",
                                className
                            )}
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white font-black text-xl">
                                        S
                                    </div>
                                    <span className="text-2xl font-black tracking-tight text-gray-900">Syntel</span>
                                </div>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-3 rounded-2xl bg-gray-50 text-gray-900 hover:bg-gray-100 transition-all active:scale-90"
                                >
                                    <IconX size={24} stroke={2.5} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                {children}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

const InternalSidebarLink = ({
    link,
    className,
    ...props
}: {
    link: { label: string; href: string; icon: React.ReactNode };
    className?: string;
} & any) => {
    const { open, animate } = useSidebarContext();
    return (
        <Link
            href={link.href}
            className={cn(
                "flex items-center justify-start gap-2 group/sidebar py-2 px-2 rounded-xl transition-colors hover:bg-gray-50",
                className
            )}
            {...props}
        >
            {link.icon}
            <motion.span
                animate={{
                    display: animate ? (open ? "inline-block" : "none") : "inline-block",
                    opacity: animate ? (open ? 1 : 0) : 1,
                }}
                className="text-gray-600 text-sm group-hover/sidebar:text-red-600 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
            >
                {link.label}
            </motion.span>
        </Link>
    );
};

// --- Application Implementation ---

const staffMenuItems = [
    { label: "Dashboard Staff", icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0" />, href: "/dashboard/staff" },
    { label: "Pengajuan Konten", icon: <FilePlus className="h-5 w-5 flex-shrink-0" />, href: "/dashboard/staff/pengajuan" },
    { label: "Arsip Konten", icon: <Archive className="h-5 w-5 flex-shrink-0" />, href: "/dashboard/staff/arsip" },
];

const officerMenuItems = [
    { label: "Dashboard Officer", icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0" />, href: "/dashboard/officer" },
    { label: "Verifikasi Akun", icon: <UserCheck className="h-5 w-5 flex-shrink-0" />, href: "/dashboard/officer/verification" },
    { label: "Manajemen Event", icon: <Calendar className="h-5 w-5 flex-shrink-0" />, href: "/dashboard/officer/kalender" },
    { label: "Manajemen Instruksi", icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: "/dashboard/officer/instruksi" },
    { label: "Manajemen User", icon: <Users className="h-5 w-5 flex-shrink-0" />, href: "/dashboard/officer/users" },
    { label: "Laporan Konten", icon: <BarChart3 className="h-5 w-5 flex-shrink-0" />, href: "/dashboard/officer/laporan" },
];


export function Sidebar({ role = "STAFF" }: { role?: "STAFF" | "OFFICER" }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const [userName, setUserName] = useState("User");
    const [userInitials, setUserInitials] = useState("U");

    const menuItems = role === "OFFICER" ? officerMenuItems : staffMenuItems;

    // Get user data from localStorage
    React.useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
                setUserName(fullName || user.username || "User");

                // Generate initials
                const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";
                setUserInitials(initials);
            } catch (e) {
                console.error("Failed to parse user data");
            }
        }
    }, []);

    return (
        <SidebarProvider open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-10">
                <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                    {/* Logo Section */}
                    {open ? (
                        <div className="mb-10 px-2 flex items-center justify-between">
                            <Link href="/dashboard/officer" className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white font-bold text-xl">
                                    S
                                </div>
                                <span className="text-xl font-bold tracking-tight text-gray-900">Syntel</span>
                            </Link>
                            <div className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                role === "OFFICER" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                            )}>
                                {role}
                            </div>
                        </div>
                    ) : (
                        <div className="mb-10 flex justify-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white font-bold text-xl">
                                S
                            </div>
                        </div>
                    )}

                    {/* Navigation Links */}
                    <div className="mt-8 flex flex-col gap-2">
                        {menuItems.map((link, idx) => (
                            <InternalSidebarLink
                                key={idx}
                                link={link}
                                className={cn(
                                    pathname === link.href && "bg-red-50 text-red-600 rounded-xl"
                                )}
                            />
                        ))}
                    </div>

                </div>

                {/* User Profile Footer */}
                <div>
                    <InternalSidebarLink
                        link={{
                            label: userName,
                            href: "#",
                            icon: (
                                <div className="h-7 w-7 flex-shrink-0 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-[10px]">
                                    {userInitials}
                                </div>
                            ),
                        }}
                    />
                    <div onClick={() => {
                        localStorage.removeItem("user");
                        window.location.href = "/login";
                    }}>
                        <InternalSidebarLink
                            link={{
                                label: "Keluar Sesi",
                                href: "#",
                                icon: <LogOut className="h-5 w-5 text-gray-500" />,
                            }}
                        />
                    </div>
                </div>
            </SidebarBody>
        </SidebarProvider>
    );
}
