// ganpati-quiz-app/app/api/get-score/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { participantId } = await request.json();

        if (!participantId) {
            return NextResponse.json(
                { message: "Participant ID is required." },
                { status: 400 }
            );
        }

        const participant = await prisma.participant.findUnique({
            where: { id: participantId },
            select: { score: true },
        });

        if (!participant) {
            return NextResponse.json(
                { message: "Participant not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "✅ Score fetched successfully.",
            score: participant.score,
        });
    } catch (error) {
        console.error("Error fetching score:", error);
        return NextResponse.json(
            { message: "❌ Failed to fetch score." },
            { status: 500 }
        );
    }
}
