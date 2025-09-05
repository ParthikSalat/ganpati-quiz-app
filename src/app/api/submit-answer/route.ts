// ganpati-quiz-app/app/api/submit-answer/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { participantId, questionId, selectedAnswer } = await request.json();

        if (!participantId || !questionId || !selectedAnswer) {
            return NextResponse.json(
                { message: 'Participant ID, Question ID, and selected answer are required.' },
                { status: 400 }
            );
        }

        const quizState = await prisma.quizState.findFirst();
        if (!quizState || quizState.currentQuestionId !== questionId) {
            return NextResponse.json({ message: 'Quiz is not on this question.' }, { status: 400 });
        }

        const question = await prisma.question.findUnique({ where: { id: questionId } });
        if (!question) return NextResponse.json({ message: 'Question not found.' }, { status: 404 });

        const participant = await prisma.participant.findUnique({ where: { id: participantId } });
        if (!participant) return NextResponse.json({ message: 'Participant not found.' }, { status: 404 });

        let message = 'Incorrect answer.';
        if (selectedAnswer === question.correctAnswer) {
            let pointsAwarded = question.points;
            let bonusMessage = '';

            if (!quizState.answerReceived && quizState.questionStartTime) {
                const timeTakenSeconds = (new Date().getTime() - quizState.questionStartTime.getTime()) / 1000;

                if (timeTakenSeconds <= 5) {
                    pointsAwarded += 20;
                    bonusMessage = '🥇 Fastest correct answer! (+20 bonus points)';
                } else if (timeTakenSeconds <= 10) {
                    pointsAwarded += 10;
                    bonusMessage = '🥈 Correct answer! (+10 bonus points)';
                } else {
                    bonusMessage = 'Correct answer!';
                }

                await prisma.quizState.update({
                    where: { id: quizState.id },
                    data: { answerReceived: true },
                });
            } else {
                bonusMessage = 'Correct answer!';
            }

            // Update participant score
            await prisma.participant.update({
                where: { id: participantId },
                data: { score: participant.score + pointsAwarded },
            });

            message = bonusMessage;
        }

        return NextResponse.json({ message });
    } catch (error) {
        console.error('Error submitting answer:', error);
        return NextResponse.json({ message: '❌ Failed to submit answer.' }, { status: 500 });
    }
}
