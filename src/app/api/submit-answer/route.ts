import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { kv } from "@vercel/kv";
import { Liveblocks } from "@liveblocks/node";

const prisma = new PrismaClient();

const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
});

interface SubmitAnswerRequest {
    participantId: string;
    questionId: string;
    submittedAnswer: string;
}

export async function POST(req: Request) {
    const { participantId, questionId, submittedAnswer } =
        (await req.json()) as SubmitAnswerRequest;

    if (!participantId || !questionId || !submittedAnswer) {
        return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    try {
        const question = await prisma.question.findUnique({
            where: { id: questionId },
        });

        if (!question) {
            return NextResponse.json({ message: "Question not found" }, { status: 404 });
        }

        let scoreIncrease = 0;
        let correct = false;

        if (submittedAnswer === question.correctAnswer) {
            correct = true;
            scoreIncrease = question.points;

            // Bonus for fastest
            const fastestAnswerKey = `fastest_answer:${questionId}`;
            const isFastest = !(await kv.exists(fastestAnswerKey));

            if (isFastest) {
                await kv.set(fastestAnswerKey, participantId);
                scoreIncrease += 5;
            }

            const updatedParticipant = await prisma.participant.update({
                where: { id: participantId },
                data: { score: { increment: scoreIncrease } },
            });

            // ✅ Broadcast score update
            await liveblocks.broadcastEvent("ganpati-quiz-room", {
                type: "score_update",
                payload: {
                    id: updatedParticipant.id,
                    name: updatedParticipant.name,
                    score: updatedParticipant.score,
                },
            });
        }

        // ✅ Auto-advance to next question after 3 seconds
        setTimeout(async () => {
            const currentIndex = (await kv.get<number>("current_question_index")) ?? 0;
            await kv.set("current_question_index", currentIndex + 1);

            await liveblocks.broadcastEvent("ganpati-quiz-room", {
                type: "next_question_event",
            });
        }, 3000);

        return NextResponse.json({
            correct,
            message: correct ? "Correct answer!" : "Incorrect answer.",
            scoreIncrease: correct ? scoreIncrease : 0,
        });
    } catch (error) {
        console.error("Error submitting answer:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
