import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch all events
export async function GET() {
    try {
        const events = await prisma.event.findMany({
            orderBy: {
                date: 'asc'
            }
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error("Error fetching events:", error);
        return NextResponse.json(
            { error: "Failed to fetch events" },
            { status: 500 }
        );
    }
}

// POST - Create new event
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, description, date, location, pic, color } = body;

        // Validation
        if (!title || !description || !date || !location || !pic || !color) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Generate Custom ID: EVT-0001
        const lastEvent = await prisma.event.findFirst({
            orderBy: { id: 'desc' },
            where: { id: { startsWith: 'EVT-' } }
        });

        let nextId = "EVT-0001";
        if (lastEvent) {
            const lastIdNum = parseInt(lastEvent.id.split('-')[1]);
            nextId = `EVT-${String(lastIdNum + 1).padStart(4, '0')}`;
        }

        const event = await prisma.event.create({
            data: {
                id: nextId,
                title,
                description,
                date: new Date(date),
                location,
                pic,
                color
            }
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error("Error creating event:", error);
        return NextResponse.json(
            { error: "Failed to create event" },
            { status: 500 }
        );
    }
}
