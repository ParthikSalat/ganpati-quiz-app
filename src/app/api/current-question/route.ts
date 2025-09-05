import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const quizState = await prisma.quizState.findFirst();

        if (!quizState || !quizState.quizStarted) {
            return NextResponse.json(
                {
                    message: "Quiz has not started.",
                    quizStarted: false,
                    quizEnded: quizState?.quizEnded || false,
                },
                { status: 200 }
            );
        }

        if (quizState.quizEnded) {
            const participants = await prisma.participant.findMany({
                orderBy: { score: "desc" },
            });
            return NextResponse.json({
                message: "Quiz has ended.",
                quizEnded: true,
                participants,
            });
        }

        if (!quizState.currentQuestionId) {
            return NextResponse.json(
                {
                    message: "No current question available.",
                    quizStarted: true,
                    quizEnded: false,
                },
                { status: 200 }
            );
        }

        const question = await prisma.question.findUnique({
            where: { id: quizState.currentQuestionId },
            select: {
                id: true,
                questionText: true,
                options: true,
            },
        });

        if (!question) {
            return NextResponse.json(
                {
                    message: "No current question found.",
                    quizStarted: true,
                    quizEnded: false,
                },
                { status: 200 }
            );
        }

        return NextResponse.json({
            question,
            quizStarted: true,
            quizEnded: false,
        });
    } catch (error) {
        console.error("Error fetching current question:", error);
        return NextResponse.json(
            { message: "❌ Failed to fetch current question." },
            { status: 500 }
        );
    }
}
