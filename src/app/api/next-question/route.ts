import { NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
});

export async function POST() {
    try {
        // ✅ Correct API call
        await liveblocks.broadcastEvent("ganpati-quiz-room", {
            type: "next_question_event",
        });

        return NextResponse.json({ message: "Next question broadcasted!" });
    } catch (error) {
        console.error("Error broadcasting next question:", error);
        return NextResponse.json(
            { message: "Failed to trigger next question" },
            { status: 500 }
        );
    }
}
