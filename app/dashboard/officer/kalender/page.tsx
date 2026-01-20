"use client";

import React, { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Plus, X, ChevronDown, Edit2, Trash2, Calendar, MapPin, Users as UsersIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DashboardLayout } from "@/app/components/dashboard/layout/DashboardLayout";

interface Event {
    id: string;
    title: string;
    description: string;
    date: string; // ISO string from API
    location: string;
    pic: string[]; // Array of NIPs (user IDs)
    color: "GREEN" | "YELLOW" | "RED" | "BLUE";
}

interface User {
    nip: string;
    firstName: string;
    lastName: string;
}

export default function KalenderPage() {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [newEvent, setNewEvent] = useState({
        title: "",
        description: "",
        date: new Date(),
        location: "",
        pic: [] as string[], // Array of NIPs
        color: "GREEN" as "GREEN" | "YELLOW" | "RED" | "BLUE",
    });

    const [showPicDropdown, setShowPicDropdown] = useState(false);
    const [showColorDropdown, setShowColorDropdown] = useState(false);
    const picDropdownRef = useRef<HTMLDivElement>(null);
    const colorDropdownRef = useRef<HTMLDivElement>(null);

    // Click outside handler for dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (picDropdownRef.current && !picDropdownRef.current.contains(event.target as Node)) {
                setShowPicDropdown(false);
            }
            if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
                setShowColorDropdown(false);
            }
        };

        if (showPicDropdown || showColorDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showPicDropdown, showColorDropdown]);

    // Fetch events from API
    useEffect(() => {
        fetchEvents();
        fetchUsers();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await fetch('/api/events');
            if (response.ok) {
                const data = await response.json();
                console.log("Events fetched:", data); // Debug
                setEvents(data);
            } else {
                console.error("Failed to fetch events:", response.status);
            }
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users?role=STAFF&verified=true');
            if (response.ok) {
                const data = await response.json();
                console.log("Users fetched:", data); // Debug
                setUsers(data);
            } else {
                console.error("Failed to fetch users:", response.status);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    // Auto-update selected event when events list changes (Reactive Details)
    useEffect(() => {
        if (selectedEvent) {
            const updatedEvent = events.find(e => e.id === selectedEvent.id);
            if (updatedEvent && JSON.stringify(updatedEvent) !== JSON.stringify(selectedEvent)) {
                setSelectedEvent(updatedEvent);
            }
        }
    }, [events, selectedEvent]);

    // Helper: Convert NIP to full name
    const getNamesFromNips = (nips: string[]): string[] => {
        if (!nips || nips.length === 0) return [];
        if (users.length === 0) return nips; // Return NIPs if users not loaded yet

        return nips.map(nip => {
            const user = users.find(u => u.nip === nip);
            return user ? `${user.firstName} ${user.lastName}` : nip;
        });
    };

    // Get day class name for calendar highlighting
    const getDayClassName = (date: Date) => {
        const eventsOnDate = getEventsForDate(date);
        if (eventsOnDate.length === 0) return '';

        // Get the first event's color for the day
        const eventColor = eventsOnDate[0].color;
        return `event-day-${eventColor.toLowerCase()}`;
    };

    // Get events for a specific date
    const getEventsForDate = (date: Date) => {
        return events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === date.toDateString();
        });
    };

    // Priority map for sorting (Low to High)
    const colorPriority = {
        BLUE: 1,
        GREEN: 2,
        YELLOW: 3,
        RED: 4
    };

    // Group events by date
    const groupEventsByDate = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Ensure today starts from midnight
        const futureEvents = events.filter(event => new Date(event.date).getTime() >= today.getTime());

        const grouped: { [key: string]: Event[] } = {};
        futureEvents.forEach(event => {
            const dateKey = new Date(event.date).toDateString();
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(event);
        });

        // Sort events within each date by priority (Low to High)
        Object.keys(grouped).forEach(dateKey => {
            grouped[dateKey].sort((a, b) => colorPriority[a.color] - colorPriority[b.color]);
        });

        // Sort groups by date
        return Object.fromEntries(
            Object.entries(grouped).sort((a, b) =>
                new Date(a[0]).getTime() - new Date(b[0]).getTime()
            )
        );
    };

    const handleSubmitEvent = async () => {
        if (!newEvent.title || !newEvent.description || !newEvent.location || newEvent.pic.length === 0) {
            alert("Mohon lengkapi semua field!");
            return;
        }

        setSubmitting(true);
        try {
            const url = isEditing ? `/api/events/${selectedEvent?.id}` : '/api/events';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newEvent.title,
                    description: newEvent.description,
                    date: newEvent.date.toISOString(),
                    location: newEvent.location,
                    pic: newEvent.pic,
                    color: newEvent.color
                })
            });

            if (response.ok) {
                await fetchEvents(); // Refresh events
                setShowAddModal(false);
                setIsEditing(false);
                setShowPicDropdown(false);
                setShowColorDropdown(false);
                setNewEvent({
                    title: "",
                    description: "",
                    date: new Date(),
                    location: "",
                    pic: [],
                    color: "GREEN",
                });
            } else {
                alert(`Gagal ${isEditing ? 'memperbarui' : 'menambahkan'} event`);
            }
        } catch (error) {
            console.error(`Error ${isEditing ? 'updating' : 'adding'} event:`, error);
            alert(`Terjadi kesalahan saat ${isEditing ? 'memperbarui' : 'menambahkan'} event`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (event: Event) => {
        setIsEditing(true);
        setNewEvent({
            title: event.title,
            description: event.description,
            date: new Date(event.date),
            location: event.location,
            pic: event.pic,
            color: event.color,
        });
        setShowAddModal(true);
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;

        setSubmitting(true);
        try {
            const response = await fetch(`/api/events/${selectedEvent.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchEvents(); // Refresh events
                setSelectedEvent(null);
                setShowDeleteModal(false);
            } else {
                alert("Gagal menghapus event");
            }
        } catch (error) {
            console.error("Error deleting event:", error);
            alert("Terjadi kesalahan saat menghapus event");
        } finally {
            setSubmitting(false);
        }
    };

    const colorClasses = {
        BLUE: "bg-blue-50 border-blue-100 text-blue-800",
        GREEN: "bg-emerald-50 border-emerald-100 text-emerald-800",
        YELLOW: "bg-amber-50 border-amber-100 text-amber-800",
        RED: "bg-red-50 border-red-100 text-red-800"
    };

    const colorAccents = {
        BLUE: "bg-blue-500",
        GREEN: "bg-emerald-500",
        YELLOW: "bg-amber-500",
        RED: "bg-red-600"
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const formatDateShort = (dateString: string) => {
        const date = new Date(dateString);
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        return `${date.getDate()} ${months[date.getMonth()]}`;
    };

    if (loading) {
        return (
            <DashboardLayout role="OFFICER">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Memuat data...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="OFFICER">
            <div className="space-y-6">
                {/* Header */}
                {/* Header Section - Responsive Layout */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 sm:px-0">
                    <div className="text-center sm:text-left">
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                            Kalender Tim Digital
                        </h1>
                        <p className="mt-1.5 text-xs sm:text-sm text-gray-500 font-medium">
                            Monitoring status jadwal dan deadline konten tim secara real-time.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setIsEditing(false);
                            setNewEvent({
                                title: "",
                                description: "",
                                date: new Date(),
                                location: "",
                                pic: [],
                                color: "GREEN",
                            });
                            setShowAddModal(true);
                        }}
                        className="flex items-center justify-center gap-2.5 w-full sm:w-auto px-6 py-3.5 bg-red-600 text-white rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-500/10 active:scale-[0.98] group"
                    >
                        <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                        <span>Tambah Event Baru</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    {/* Left Column - Calendar and Detail (Main flow for mobile) */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        {/* Calendar Card */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.08),0_10px_20px_-5px_rgba(0,0,0,0.04)] p-7">
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Calendar</h2>
                            </div>

                            <div className="calendar-container w-full">
                                <DatePicker
                                    selected={selectedEvent ? new Date(selectedEvent.date) : null}
                                    onChange={(date: Date | null) => {
                                        if (date) {
                                            const eventsOnDate = getEventsForDate(date);
                                            if (eventsOnDate.length > 0) {
                                                // Sort by priority (Highest at index 0)
                                                const sorted = [...eventsOnDate].sort((a, b) =>
                                                    colorPriority[b.color as keyof typeof colorPriority] -
                                                    colorPriority[a.color as keyof typeof colorPriority]
                                                );
                                                setSelectedEvent(sorted[0]);
                                            } else {
                                                setSelectedEvent(null);
                                            }
                                        }
                                    }}
                                    inline
                                    renderCustomHeader={({
                                        date,
                                        decreaseMonth,
                                        increaseMonth,
                                        prevMonthButtonDisabled,
                                        nextMonthButtonDisabled,
                                    }) => (
                                        <div className="flex items-center justify-between px-2 mb-8 bg-gray-50/50 p-2 rounded-2xl border border-gray-200">
                                            <button
                                                onClick={decreaseMonth}
                                                disabled={prevMonthButtonDisabled}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white text-gray-400 hover:text-gray-900 transition-all"
                                            >
                                                <span className="text-lg">←</span>
                                            </button>
                                            <span className="text-sm font-bold text-gray-900 tracking-tight">
                                                {date.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                                            </span>
                                            <button
                                                onClick={increaseMonth}
                                                disabled={nextMonthButtonDisabled}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white text-gray-400 hover:text-gray-900 transition-all"
                                            >
                                                <span className="text-lg">→</span>
                                            </button>
                                        </div>
                                    )}
                                    dayClassName={(date: Date) => {
                                        const eventsOnDate = getEventsForDate(date);
                                        const classes = [];
                                        if (eventsOnDate.length > 0) {
                                            // Show highest priority color on calendar dot
                                            const sortedByPriority = [...eventsOnDate].sort((a, b) =>
                                                colorPriority[b.color as keyof typeof colorPriority] -
                                                colorPriority[a.color as keyof typeof colorPriority]
                                            );
                                            classes.push(`event-dot-${sortedByPriority[0].color.toLowerCase()}`);
                                        }
                                        return classes.join(' ');
                                    }}
                                />
                            </div>
                        </div>

                        {/* Detail Kegiatan Card */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.08),0_10px_20px_-5px_rgba(0,0,0,0.04)] p-6 flex flex-col flex-1 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-5 relative z-10">
                                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Detail Kegiatan</h2>
                                {selectedEvent && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditClick(selectedEvent)}
                                            className="w-9 h-9 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                                        >
                                            <Edit2 className="h-4 w-4 text-gray-400 group-hover:text-gray-900" />
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteModal(true)}
                                            className="w-9 h-9 flex items-center justify-center bg-red-50 hover:bg-red-600 rounded-lg transition-colors group"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500 group-hover:text-white" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 relative z-10">
                                {selectedEvent ? (
                                    <div className="space-y-5 animate-in fade-in duration-500">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">
                                                {selectedEvent.title}
                                            </h3>
                                            <p className="text-gray-500 text-[13px] font-medium leading-relaxed">
                                                {selectedEvent.description}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Waktu</span>
                                                </div>
                                                <p className="text-[13px] font-bold text-gray-800">{formatDate(selectedEvent.date)}</p>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Lokasi</span>
                                                </div>
                                                <p className="text-[13px] font-bold text-gray-800">{selectedEvent.location}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Penanggung Jawab</span>
                                            </div>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {getNamesFromNips(selectedEvent.pic).map((person, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-[11px] font-bold flex items-center gap-2 border border-gray-200"
                                                    >
                                                        {person}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
                                        <div className="w-24 h-24 rounded-[2.5rem] bg-gray-50 flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-50" />
                                            <Calendar className="w-10 h-10 text-gray-200" />
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Belum Ada Event Dipilih</p>
                                        <p className="text-xs text-gray-400 font-medium">Klik pada tanggal yang ditandai dot warna di kalender untuk melihat detail kegiatannya.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Upcoming Events */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.08),0_10px_20px_-5px_rgba(0,0,0,0.04)] p-7 flex flex-col h-[750px] relative overflow-hidden">

                            <div className="mb-8 flex items-end justify-between relative z-10">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Upcoming Events</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Jadwal Mendatang</p>
                                </div>
                                <div className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        {Object.keys(groupEventsByDate()).length} Hari Terdaftar
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-8 overflow-y-auto pr-4 custom-scrollbar relative z-10">
                                {Object.entries(groupEventsByDate()).map(([dateKey, dateEvents]) => (
                                    <div key={dateKey} className="relative">
                                        <div className="sticky top-0 bg-white/95 backdrop-blur-sm py-3 mb-4 z-20 flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${new Date(dateKey).toDateString() === new Date().toDateString() ? 'bg-red-600 animate-pulse' : 'bg-gray-300'}`} />
                                            <div>
                                                <h3 className="text-base font-bold text-gray-900 tracking-tight uppercase">
                                                    {new Date(dateKey).toDateString() === new Date().toDateString() ? "Hari Ini" : new Date(dateKey).toLocaleString('id-ID', { weekday: 'long' })}
                                                </h3>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5">
                                                    {formatDate(dateEvents[0].date)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pl-4 border-l-2 border-gray-200 ml-6">
                                            {dateEvents.map((event) => (
                                                <motion.div
                                                    key={event.id}
                                                    whileHover={{ x: 6, y: -2 }}
                                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                                    onClick={() => setSelectedEvent(event)}
                                                    className={`${colorClasses[event.color]} p-5 rounded-2xl cursor-pointer transition-all duration-150 border-2 border-transparent hover:border-white hover:shadow-xl hover:shadow-gray-200/50 group relative overflow-hidden`}
                                                >
                                                    <div className="relative z-10">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 text-lg leading-tight pr-8 tracking-tight mb-2">
                                                                    {event.title}
                                                                </h4>
                                                                <p className="text-gray-500 text-[13px] font-bold">
                                                                    {formatDate(event.date)}
                                                                </p>
                                                            </div>
                                                            <div className={`w-2.5 h-2.5 rounded-full ${colorAccents[event.color]} border-2 border-white shadow-sm mt-1.5`} />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Event Modal */}
                <AnimatePresence>
                    {showAddModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            onClick={() => setShowAddModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {isEditing ? "Edit Detail Event" : "Tambah Event Baru"}
                                    </h2>
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    {/* Judul */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Judul Event
                                        </label>
                                        <input
                                            type="text"
                                            value={newEvent.title}
                                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                            placeholder="Masukkan judul event"
                                        />
                                    </div>

                                    {/* Deskripsi */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Deskripsi
                                        </label>
                                        <textarea
                                            value={newEvent.description}
                                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                                            rows={3}
                                            placeholder="Masukkan deskripsi event"
                                        />
                                    </div>

                                    {/* Tanggal - DatePicker */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Tanggal
                                        </label>
                                        <DatePicker
                                            selected={newEvent.date}
                                            onChange={(date: Date | null) => date && setNewEvent({ ...newEvent, date })}
                                            dateFormat="dd/MM/yyyy"
                                            minDate={new Date()}
                                            popperPlacement="bottom-start"
                                            portalId="datepicker-portal"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                            wrapperClassName="w-full block"
                                            customInput={
                                                <button
                                                    type="button"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                                                >
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {newEvent.date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    </span>
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                </button>
                                            }
                                        />
                                    </div>

                                    {/* Lokasi */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Lokasi
                                        </label>
                                        <input
                                            type="text"
                                            value={newEvent.location}
                                            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                            placeholder="Masukkan lokasi event"
                                        />
                                    </div>

                                    {/* PIC - Dropdown Multi-select (max 2) */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            PIC (Maksimal 2 orang)
                                        </label>
                                        <div className="relative" ref={picDropdownRef}>
                                            <button
                                                type="button"
                                                onClick={() => setShowPicDropdown(!showPicDropdown)}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-left flex items-center justify-between hover:border-gray-300"
                                            >
                                                <span className={newEvent.pic.length === 0 ? "text-gray-400" : "text-gray-900"}>
                                                    {newEvent.pic.length === 0
                                                        ? "Pilih PIC"
                                                        : getNamesFromNips(newEvent.pic).join(", ")}
                                                </span>
                                                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showPicDropdown ? 'rotate-180' : ''}`} />
                                            </button>

                                            {showPicDropdown && (
                                                <div className="absolute z-[10000] w-full mt-2 bg-white border-2 border-gray-100 rounded-2xl shadow-2xl max-h-72 overflow-hidden">
                                                    <div className="overflow-y-auto max-h-72 custom-scrollbar">
                                                        {users.length > 0 ? (
                                                            <div className="divide-y divide-gray-50 uppercase text-[10px] font-bold">
                                                                {users.map((user) => {
                                                                    const fullName = `${user.firstName} ${user.lastName}`;
                                                                    const isSelected = newEvent.pic.includes(user.nip);
                                                                    const isDisabled = !isSelected && newEvent.pic.length >= 2;
                                                                    const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

                                                                    return (
                                                                        <div
                                                                            key={user.nip}
                                                                            onClick={() => {
                                                                                if (isDisabled) return;
                                                                                if (isSelected) {
                                                                                    setNewEvent({ ...newEvent, pic: newEvent.pic.filter(id => id !== user.nip) });
                                                                                } else {
                                                                                    setNewEvent({ ...newEvent, pic: [...newEvent.pic, user.nip] });
                                                                                }
                                                                            }}
                                                                            className={`flex items-center gap-4 px-5 py-4 transition-all duration-200 cursor-pointer
                                                                                ${isSelected ? 'bg-red-50 border-l-4 border-red-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}
                                                                                ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                                        >
                                                                            {/* Avatar */}
                                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                                                                                ${isSelected ? 'bg-red-500' : 'bg-gray-400'} transition-colors duration-300`}
                                                                            >
                                                                                {initials}
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <p className={`text-xs ${isSelected ? 'text-red-700' : 'text-gray-900'}`}>
                                                                                    {fullName}
                                                                                </p>
                                                                                <p className="text-[10px] text-gray-400 normal-case font-medium">NIP: {user.nip}</p>
                                                                            </div>
                                                                            {isSelected && (
                                                                                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                                    </svg>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="px-5 py-8 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                                                                Tidak ada staff tersedia
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {newEvent.pic.length > 0 && (
                                            <p className="mt-2 text-xs text-gray-500">
                                                {newEvent.pic.length}/2 PIC dipilih
                                            </p>
                                        )}
                                    </div>

                                    {/* Warna Event - Custom Premium Dropdown */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Prioritas Event
                                        </label>
                                        <div className="relative" ref={colorDropdownRef}>
                                            <button
                                                type="button"
                                                onClick={() => setShowColorDropdown(!showColorDropdown)}
                                                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-left flex items-center justify-between hover:border-gray-300 bg-white group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3.5 h-3.5 rounded-full ${colorAccents[newEvent.color]} shadow-sm`} />
                                                    <span className="text-sm font-medium text-gray-900 group-hover:text-gray-950">
                                                        {newEvent.color === "BLUE" && "Biru (Rendah)"}
                                                        {newEvent.color === "GREEN" && "Hijau (Normal)"}
                                                        {newEvent.color === "YELLOW" && "Kuning (Sedang)"}
                                                        {newEvent.color === "RED" && "Merah (Tinggi)"}
                                                    </span>
                                                </div>
                                                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${showColorDropdown ? 'rotate-180 text-red-500' : ''}`} />
                                            </button>

                                            <AnimatePresence>
                                                {showColorDropdown && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                                        className="absolute z-[10001] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden p-1.5"
                                                    >
                                                        {(["BLUE", "GREEN", "YELLOW", "RED"] as const).map((color) => (
                                                            <button
                                                                key={color}
                                                                type="button"
                                                                onClick={() => {
                                                                    setNewEvent({ ...newEvent, color });
                                                                    setShowColorDropdown(false);
                                                                }}
                                                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                                                                    ${newEvent.color === color ? 'bg-gray-50' : 'hover:bg-gray-50/80'}`}
                                                            >
                                                                <div className={`w-3 h-3 rounded-full ${colorAccents[color]} shadow-sm shadow-black/5`} />
                                                                <div className="flex-1 text-left">
                                                                    <p className={`text-[13px] font-bold ${newEvent.color === color ? 'text-gray-900' : 'text-gray-600'}`}>
                                                                        {color === "BLUE" && "Biru (Rendah)"}
                                                                        {color === "GREEN" && "Hijau (Normal)"}
                                                                        {color === "YELLOW" && "Kuning (Sedang)"}
                                                                        {color === "RED" && "Merah (Tinggi)"}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-400 font-medium">
                                                                        {color === "BLUE" && "Tingkat prioritas rendah"}
                                                                        {color === "GREEN" && "Kegiatan standar/rutin"}
                                                                        {color === "YELLOW" && "Memerlukan perhatian khusus"}
                                                                        {color === "RED" && "Prioritas tinggi / mendesak"}
                                                                    </p>
                                                                </div>
                                                                {newEvent.color === color && (
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-3 pt-4 pb-20">
                                        <button
                                            onClick={() => {
                                                setShowAddModal(false);
                                                setShowPicDropdown(false);
                                                setShowColorDropdown(false);
                                            }}
                                            className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                                            disabled={submitting}
                                        >
                                            Batal
                                        </button>
                                        <button
                                            onClick={handleSubmitEvent}
                                            disabled={submitting}
                                            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {submitting ? "Menyimpan..." : (isEditing ? "Simpan Perubahan" : "Tambah Event")}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Delete Confirmation Modal - Modern Vibrant Red Style */}
                <AnimatePresence>
                    {showDeleteModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-gray-950/70 backdrop-blur-md flex items-center justify-center z-[1000] p-4"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-[3.5rem] shadow-[0_30px_100px_-20px_rgba(225,29,72,0.15)] border border-rose-50 p-10 max-w-[420px] w-full text-center relative overflow-hidden"
                            >
                                {/* Top Accent - Modern Gradient Line */}
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 shadow-sm" />

                                {/* Modern Soft Red Glows */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 rounded-full blur-[80px] -mr-20 -mt-20" />
                                <div className="absolute bottom-0 left-0 w-40 h-40 bg-red-600/5 rounded-full blur-[80px] -ml-20 -mb-20" />

                                {/* Icon Section with Enhanced Heartbeat Animation */}
                                <div className="relative mb-10 group">
                                    <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                                        {/* Heartbeat Rings - More Vibrant Modern Red */}
                                        <div className="absolute inset-0 bg-rose-200 rounded-full animate-ping opacity-30 scale-125 duration-1000" />
                                        <div className="absolute inset-0 bg-rose-100 rounded-full animate-ping opacity-50 [animation-delay:0.4s] duration-1000" />

                                        {/* Main Icon Container - Modern Rose Red */}
                                        <div className="relative w-20 h-20 bg-gradient-to-br from-white to-rose-50 rounded-[2.2rem] shadow-[0_10px_30px_-5px_rgba(225,29,72,0.2)] flex items-center justify-center z-10 border border-rose-100/50 group-hover:scale-105 transition-transform duration-500">
                                            <Trash2 className="h-9 w-9 text-rose-600 animate-pulse" />
                                        </div>
                                    </div>

                                    {/* Small Floating Particles */}
                                    <motion.div
                                        animate={{ y: [0, -8, 0], scale: [1, 1.2, 1] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute top-0 right-[30%] w-2 h-2 bg-rose-400 rounded-full blur-[0.5px]"
                                    />
                                    <motion.div
                                        animate={{ y: [0, 8, 0], scale: [1, 0.8, 1] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                        className="absolute bottom-4 left-[30%] w-1.5 h-1.5 bg-red-300 rounded-full blur-[0.5px] opacity-60"
                                    />
                                </div>

                                <div className="space-y-4 mb-8">
                                    <h3 className="text-3xl font-[1000] text-gray-950 tracking-tighter">
                                        Hapus Event?
                                    </h3>
                                    <div className="bg-rose-50/30 rounded-[2rem] p-7 border border-rose-100/50 relative group transition-all hover:bg-rose-50/60 hover:shadow-inner">
                                        <p className="text-rose-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3 text-left opacity-80">Judul Event :</p>
                                        <p className="text-gray-950 font-black text-base leading-snug text-left border-l-4 border-rose-500 pl-5 py-0.5">
                                            "{selectedEvent?.title}"
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] px-4 opacity-70">
                                        Data akan dihapus dari server
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleDeleteEvent}
                                        disabled={submitting}
                                        className="w-full py-5 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-2xl hover:from-rose-700 hover:to-red-700 transition-all duration-500 font-black text-sm tracking-widest uppercase shadow-[0_15px_45px_-10px_rgba(225,29,72,0.45)] active:scale-[0.96] disabled:opacity-50 flex items-center justify-center gap-3 group relative overflow-hidden"
                                    >
                                        {/* Modern Sweep Shine */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />

                                        {submitting ? (
                                            <div className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span>Eksekusi Hapus</span>
                                                <Trash2 className="h-5 w-5 opacity-80 group-hover:rotate-6 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="w-full py-2 text-gray-400 hover:text-rose-600 transition-all duration-300 font-black text-[11px] tracking-[0.3em] uppercase hover:underline underline-offset-8 decoration-rose-500/30"
                                        disabled={submitting}
                                    >
                                        Batalkan
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <style jsx global>{`
                /* Shared Styles */
                .react-datepicker-popper {
                    z-index: 100000 !important;
                }

                .react-datepicker-popper .react-datepicker {
                    background-color: white !important;
                    border: none !important;
                    border-radius: 1.75rem !important;
                    box-shadow: 0 20px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05) !important;
                    padding: 0 !important;
                    width: 380px !important;
                    overflow: hidden !important;
                }

                /* Force DatePicker wrapper to be full width in modal */
                .react-datepicker-wrapper {
                    width: 100% !important;
                    display: block !important;
                }

                .react-datepicker__input-container {
                    width: 100% !important;
                    display: block !important;
                }

                /* Modern Header with Gradient */
                .react-datepicker-popper .react-datepicker__header {
                    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
                    border-bottom: none !important;
                    padding: 1.25rem 1rem 1rem !important;
                    border-radius: 0 !important;
                }

                .react-datepicker-popper .react-datepicker__current-month {
                    color: white !important;
                    font-weight: 800 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.1em !important;
                    font-size: 0.8rem !important;
                    margin-bottom: 0.875rem !important;
                }

                /* Navigation Arrows */
                .react-datepicker-popper .react-datepicker__navigation {
                    top: 1.25rem !important;
                    width: 30px !important;
                    height: 30px !important;
                    border-radius: 10px !important;
                    background: rgba(255, 255, 255, 0.15) !important;
                    backdrop-filter: blur(10px) !important;
                    transition: all 0.2s ease !important;
                }

                .react-datepicker-popper .react-datepicker__navigation:hover {
                    background: rgba(255, 255, 255, 0.25) !important;
                    transform: scale(1.05) !important;
                }

                .react-datepicker-popper .react-datepicker__navigation--previous {
                    left: 0.875rem !important;
                }

                .react-datepicker-popper .react-datepicker__navigation--next {
                    right: 0.875rem !important;
                }

                .react-datepicker-popper .react-datepicker__navigation-icon::before {
                    border-color: white !important;
                    border-width: 2px 2px 0 0 !important;
                    width: 7px !important;
                    height: 7px !important;
                }

                /* Day Names */
                .react-datepicker-popper .react-datepicker__day-names {
                    background: #f9fafb !important;
                    margin: 0 !important;
                    padding: 0.625rem 1rem !important;
                    border-bottom: 1px solid #f3f4f6 !important;
                }

                .react-datepicker-popper .react-datepicker__day-name {
                    color: #6b7280 !important;
                    font-weight: 700 !important;
                    font-size: 0.65rem !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    width: 2.25rem !important;
                    line-height: 1.75rem !important;
                    margin: 0 !important;
                }

                /* Month Container */
                .react-datepicker-popper .react-datepicker__month {
                    margin: 0 !important;
                    padding: 1rem !important;
                }

                /* Days */
                .react-datepicker-popper .react-datepicker__day {
                    width: 2.25rem !important;
                    height: 2.25rem !important;
                    line-height: 2.25rem !important;
                    margin: 0.15rem !important;
                    border-radius: 11px !important;
                    color: #374151 !important;
                    font-weight: 600 !important;
                    font-size: 0.8125rem !important;
                    transition: all 0.15s ease !important;
                    position: relative !important;
                }

                .react-datepicker-popper .react-datepicker__day:hover {
                    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%) !important;
                    color: #dc2626 !important;
                    transform: scale(1.05) !important;
                    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15) !important;
                }

                /* Selected Day */
                .react-datepicker-popper .react-datepicker__day--selected,
                .react-datepicker-popper .react-datepicker__day--keyboard-selected {
                    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
                    color: white !important;
                    font-weight: 700 !important;
                    box-shadow: 0 4px 16px rgba(220, 38, 38, 0.4) !important;
                    transform: scale(1.05) !important;
                }

                .react-datepicker-popper .react-datepicker__day--selected:hover {
                    background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%) !important;
                }

                /* Today */
                .react-datepicker-popper .react-datepicker__day--today {
                    background: white !important;
                    color: #dc2626 !important;
                    font-weight: 700 !important;
                    border: 2px solid #dc2626 !important;
                    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1) !important;
                }

                /* Outside Month */
                .react-datepicker-popper .react-datepicker__day--outside-month {
                    color: #d1d5db !important;
                    opacity: 0.5 !important;
                }

                /* Disabled Days (Past Dates) */
                .react-datepicker-popper .react-datepicker__day--disabled {
                    color: #73767aff !important;
                    cursor: not-allowed !important;
                    opacity: 0.6 !important;
                    font-weight: 500 !important;
                }

                .react-datepicker-popper .react-datepicker__day--disabled:hover {
                    background: transparent !important;
                    transform: none !important;
                    box-shadow: none !important;
                }

                /* Dashboard Inline Calendar Only */
                .calendar-container .react-datepicker {
                    border: none !important;
                    font-family: inherit !important;
                    width: 100% !important;
                    display: flex !important;
                    justify-content: center !important;
                    margin-left: -4px !important;
                }

                .react-datepicker__month-container {
                    width: 100% !important;
                }

                .calendar-container .react-datepicker__header {
                    background-color: transparent !important;
                    background: transparent !important;
                    border-bottom: none !important;
                    padding: 0.5rem 0 !important;
                }

                .react-datepicker__header {
                    background-color: transparent !important;
                    border-bottom: none !important;
                    padding: 0.5rem 0 !important;
                }

                .react-datepicker__day-names {
                    display: grid !important;
                    grid-template-columns: repeat(7, 1fr) !important;
                    margin-bottom: 1rem !important;
                }

                .react-datepicker__day-name {
                    color: #9ca3af !important;
                    font-weight: 700 !important;
                    font-size: 0.65rem !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.1em !important;
                    margin: 0 !important;
                    width: auto !important;
                }

                .react-datepicker__month {
                    margin: 0 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 0.5rem !important;
                }

                .react-datepicker__week {
                    display: grid !important;
                    grid-template-columns: repeat(7, 1fr) !important;
                }

                .react-datepicker__day {
                    width: auto !important;
                    height: 2.5rem !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    margin: 2px !important;
                    border-radius: 12px !important;
                    color: #4b5563 !important;
                    font-size: 0.85rem !important;
                    font-weight: 600 !important;
                    cursor: pointer !important;
                    position: relative !important;
                    transition: all 0.1s ease-out !important;
                }

                .react-datepicker__day:hover {
                    background-color: #f9fafb !important;
                    color: #111827 !important;
                }

                .react-datepicker-popper .react-datepicker__day--selected,
                .react-datepicker-popper .react-datepicker__day--keyboard-selected {
                    background-color: #dc2626 !important;
                    color: white !important;
                    border-radius: 12px !important;
                }

                .calendar-container .react-datepicker__day--selected,
                .calendar-container .react-datepicker__day--keyboard-selected {
                    background: none !important;
                    border: none !important;
                    color: inherit !important;
                }

                .react-datepicker__day--today {
                    background: none;
                    border: none !important;
                    color: inherit;
                }

                /* Highlighted Event Days - High Specificity with Enhanced Colors */
                .calendar-container .react-datepicker__day.event-dot-blue {
                    background-color: #dbeafe !important;
                    color: #1d4ed8 !important;
                    font-weight: 700 !important;
                }
                .calendar-container .react-datepicker__day.event-dot-green {
                    background-color: #d1fae5 !important;
                    color: #047857 !important;
                    font-weight: 700 !important;
                }
                .calendar-container .react-datepicker__day.event-dot-yellow {
                    background-color: #fef3c7 !important;
                    color: #b45309 !important;
                    font-weight: 700 !important;
                }
                .calendar-container .react-datepicker__day.event-dot-red {
                    background-color: #fee2e2 !important;
                    color: #b91c1c !important;
                    font-weight: 700 !important;
                }

                /* Hide default elements ONLY for the inline dashboard calendar */
                .calendar-container .react-datepicker__navigation {
                    display: none !important;
                }
                .calendar-container .react-datepicker__current-month {
                    display: none !important;
                }

                /* Custom scrollbar */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f3f4f6;
                    border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
            `}</style>
            </div>
        </DashboardLayout >
    );
}
