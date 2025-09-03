import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { kv } from "@vercel/kv";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const currentQuestionIndex =
            (await kv.get<number>("current_question_index")) ?? 0;

        const totalQuestions = await prisma.question.count();

        // ❌ Block late joiners if quiz already started
        if (currentQuestionIndex >= totalQuestions) {
            return NextResponse.json({ message: "Quiz is over!" }, { status: 200 });
        }

        // ✅ Fetch current question
        const question = await prisma.question.findFirst({
            skip: currentQuestionIndex,
            take: 1,
            orderBy: { createdAt: "asc" },
        });

        if (!question) {
            return NextResponse.json(
                { message: "No question found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                ...question,
                questionNumber: currentQuestionIndex + 1, // 👈 Add question number
                totalQuestions,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching question:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
