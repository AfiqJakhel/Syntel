import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - Update event
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, description, date, location, pic, color } = body;

        // Validate PIC array if provided (max 2)
        if (pic && (!Array.isArray(pic) || pic.length === 0 || pic.length > 2)) {
            return NextResponse.json(
                { error: "PIC must be an array with 1-2 names" },
                { status: 400 }
            );
        }

        const event = await prisma.event.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description && { description }),
                ...(date && { date: new Date(date) }),
                ...(location && { location }),
                ...(pic && { pic }),
                ...(color && { color })
            }
        });

        return NextResponse.json(event);
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json(
            { error: "Failed to update event" },
            { status: 500 }
        );
    }
}

// DELETE - Delete event
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.event.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        return NextResponse.json(
            { error: "Failed to delete event" },
            { status: 500 }
        );
    }
}
