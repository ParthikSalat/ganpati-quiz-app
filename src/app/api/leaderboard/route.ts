import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const participants = await prisma.participant.findMany({
            orderBy: { score: "desc" },
            take: 10, // Top 10
            select: {
                id: true,
                name: true,
                score: true,
                createdAt: true,
            },
        });

        return NextResponse.json({
            message: "✅ Leaderboard fetched successfully.",
            participants,
        });
    } catch (err) {
        console.error("Error fetching leaderboard:", err);
        return NextResponse.json(
            { message: "❌ Internal server error" },
            { status: 500 }
        );
    }
}
