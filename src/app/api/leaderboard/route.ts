import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const participants = await prisma.participant.findMany({
            orderBy: { score: "desc" },
            take: 10,
        });
        return NextResponse.json(participants);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
