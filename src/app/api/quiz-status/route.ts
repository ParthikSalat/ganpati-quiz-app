import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Fetch the quiz state. Assuming there is only one state record.
        const quizState = await prisma.quizState.findFirst({
            select: { quizEnded: true },
        });

        // If no state record exists, assume the quiz is not ended.
        const quizEnded = quizState?.quizEnded || false;

        return NextResponse.json({ quizEnded }, { status: 200 });
    } catch (error) {
        console.error("Error fetching quiz state:", error);
        return NextResponse.json(
            { message: '❌ Failed to fetch quiz state.' },
            { status: 500 }
        );
    }
}
