// ganpati-quiz-app/app/api/restart-quiz/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
    try {
        // Reset all participants' scores to 0
        await prisma.participant.updateMany({
            data: { score: 0 },
        });

        // Reset the current quiz state
        const quizState = await prisma.quizState.findFirst();

        if (quizState) {
            await prisma.quizState.update({
                where: { id: quizState.id },
                data: {
                    currentQuestionId: null,
                    questionStartTime: null,
                    answerReceived: false,
                    quizEnded: false,
                    quizStarted: false, // optional: reset quizStarted flag
                },
            });
        }

        return NextResponse.json({
            message: '✅ Quiz restarted. All scores have been reset.',
        });
    } catch (error) {
        console.error("Error restarting quiz:", error);
        return NextResponse.json(
            { message: '❌ Failed to restart quiz.' },
            { status: 500 }
        );
    }
}
