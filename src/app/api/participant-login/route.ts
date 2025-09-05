import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { name } = await request.json();

        if (!name) {
            return NextResponse.json(
                { message: "Name is required." },
                { status: 400 }
            );
        }

        const normalizedName = name.toLowerCase();

        // Find participant by name (case-insensitive) or throw an error
        const participant = await prisma.participant.findUniqueOrThrow({
            where: { name: normalizedName },
        });

        // Return participantId to the frontend
        return NextResponse.json({
            message: "✅ Login successful",
            participantId: participant.id,
            name: participant.name,
        });
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json(
                { message: "Participant not found." },
                { status: 404 }
            );
        }
        console.error("Error logging in:", error);
        return NextResponse.json(
            { message: "❌ Failed to login" },
            { status: 500 }
        );
    }
}
