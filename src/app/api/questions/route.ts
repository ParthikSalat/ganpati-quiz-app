// ganpati-quiz-app/app/api/add-question/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { questionText, options, correctAnswer, points } = await request.json();

        // Basic validation
        if (!questionText || !options || !correctAnswer) {
            return NextResponse.json(
                { message: 'Question text, options, and correct answer are required.' },
                { status: 400 }
            );
        }

        // Ensure points is a number
        const parsedPoints = parseInt(points, 10) || 10;

        const newQuestion = await prisma.question.create({
            data: {
                questionText,
                options,
                correctAnswer,
                points: parsedPoints,
            },
        });

        return NextResponse.json(
            { message: '✅ Question added successfully!', question: newQuestion },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error adding question:", error);
        return NextResponse.json(
            { message: '❌ Failed to add question.' },
            { status: 500 }
        );
    }
}
