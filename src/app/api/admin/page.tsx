"use client";

import { useState } from "react";
import NextQuestionButton from "@/app/components/NextQuestionButtont";

export default function AdminPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleRestart = async () => {
        setLoading(true);
        setMessage("");
        try {
            const res = await fetch("/api/restart-quiz", { method: "POST" });
            const data = await res.json();
            setMessage(data.message);
        } catch (err) {
            setMessage("❌ Failed to restart quiz");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center w-96">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Quiz Admin Panel</h1>

                {/* ✅ Next Question */}
                <NextQuestionButton />

                {/* ✅ Restart Quiz */}
                <button
                    onClick={handleRestart}
                    disabled={loading}
                    className="mt-6 w-full px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
                >
                    {loading ? "Restarting..." : "Restart Quiz"}
                </button>

                {message && (
                    <p className="mt-4 text-gray-700 font-medium">{message}</p>
                )}
            </div>
        </div>
    );
}
