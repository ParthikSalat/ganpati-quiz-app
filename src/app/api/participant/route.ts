import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const { name } = await req.json();

    if (!name) {
        return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    try {
        const newParticipant = await prisma.participant.create({
            data: {
                name,
            },
        });

        return NextResponse.json(newParticipant, { status: 201 });
    } catch (error) {
        console.error('Error creating participant:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
