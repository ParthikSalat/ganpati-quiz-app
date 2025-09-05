import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const { name } = await req.json();

    if (!name) {
        return NextResponse.json({ message: "Name is required." }, { status: 400 });
    }

    try {
        const existingParticipant = await prisma.participant.findUnique({
            where: { name },
        });

        if (existingParticipant) {
            return NextResponse.json({ message: "A participant with this name already exists." }, { status: 409 });
        }

        const participant = await prisma.participant.create({ data: { name } });
        return NextResponse.json(participant, { status: 201 });
    } catch (err) {
        console.error("Error adding participant:", err);
        return NextResponse.json({ message: "Failed to add participant." }, { status: 500 });
    }
}
