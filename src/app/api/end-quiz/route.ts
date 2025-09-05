// ganpati-quiz-app/app/api/end-quiz/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
    try {
        const quizState = await prisma.quizState.findFirst();

        if (!quizState) {
            return NextResponse.json(
                { message: "Quiz state not found." },
                { status: 404 }
            );
        }

        if (quizState.quizEnded) {
            return NextResponse.json(
                { message: "⚠️ Quiz is already ended." },
                { status: 200 }
            );
        }

        // Mark quiz as ended
        await prisma.quizState.update({
            where: { id: quizState.id },
            data: { quizEnded: true },
        });

        // Get participants sorted by score (highest first)
        const participants = await prisma.participant.findMany({
            orderBy: { score: "desc" },
        });

        return NextResponse.json({
            message: "✅ Quiz has ended.",
            quizEnded: true,
            participants,
        });
    } catch (error) {
        console.error("Error ending quiz:", error);
        return NextResponse.json(
            { message: "❌ Failed to end quiz." },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
