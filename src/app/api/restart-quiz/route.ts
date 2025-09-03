import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function POST() {
    try {
        await kv.set("current_question_index", 0);

        return NextResponse.json({ message: "Quiz restarted successfully!" });
    } catch (error) {
        console.error("Error restarting quiz:", error);
        return NextResponse.json(
            { message: "Failed to restart quiz" },
            { status: 500 }
        );
    }
}
