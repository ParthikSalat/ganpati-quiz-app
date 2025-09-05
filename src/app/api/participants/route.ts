// ganpati-quiz-app/app/api/participants/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Fetch all participants ordered by score descending
        const participants = await prisma.participant.findMany({
            orderBy: { score: 'desc' },
            select: { id: true, name: true, score: true },
        });

        return NextResponse.json({ participants }, { status: 200 });
    } catch (error) {
        console.error("Error fetching participants:", error);
        return NextResponse.json(
            { message: '❌ Failed to fetch participants.' },
            { status: 500 }
        );
    }
}
