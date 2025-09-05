import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
    try {
        // Get all questions in order
        const allQuestions = await prisma.question.findMany({
            orderBy: { createdAt: "asc" },
        });

        if (allQuestions.length === 0) {
            return NextResponse.json(
                { message: "No questions available to display." },
                { status: 404 }
            );
        }

        // Get or create quiz state
        let quizState = await prisma.quizState.findFirst();
        if (!quizState) {
            quizState = await prisma.quizState.create({
                data: { currentQuestionId: null, quizStarted: true },
            });
        }

        const currentQuestionId = quizState.currentQuestionId;
        const currentIndex = allQuestions.findIndex((q) => q.id === currentQuestionId);

        // Move to next question (or first if none yet)
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % allQuestions.length;
        const nextQuestionId = allQuestions[nextIndex].id;

        await prisma.quizState.update({
            where: { id: quizState.id },
            data: {
                currentQuestionId: nextQuestionId,
                questionStartTime: new Date(),
                answerReceived: false,
                quizStarted: true, // ensure flag is set
            },
        });

        return NextResponse.json({
            message: "✅ Quiz advanced to the next question.",
            questionId: nextQuestionId,
        });
    } catch (error) {
        console.error("Error advancing question:", error);
        return NextResponse.json(
            { message: "❌ Failed to advance quiz." },
            { status: 500 }
        );
    }
}
