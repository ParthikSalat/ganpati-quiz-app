// ganpati-quiz-app/app/api/start-quiz/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
    try {
        // Fetch the existing quiz state
        let quizState = await prisma.quizState.findFirst();

        if (!quizState) {
            // Create a new quiz state if it doesn't exist
            quizState = await prisma.quizState.create({
                data: { quizStarted: true, quizEnded: false, currentQuestionId: null, answerReceived: false },
            });
        } else {
            // Update existing quiz state to start the quiz
            await prisma.quizState.update({
                where: { id: quizState.id },
                data: { quizStarted: true, quizEnded: false, currentQuestionId: null, answerReceived: false },
            });
        }

        return NextResponse.json({ message: '✅ Quiz has started!' });
    } catch (error) {
        console.error("Error starting quiz:", error);
        return NextResponse.json({ message: '❌ Failed to start quiz.' }, { status: 500 });
    }
}
