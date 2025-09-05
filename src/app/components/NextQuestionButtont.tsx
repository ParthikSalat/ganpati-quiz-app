'use client';

import { useState } from 'react';

interface NextQuestionButtonProps {
    onNext?: () => void; // optional callback
}

export default function NextQuestionButton({ onNext }: NextQuestionButtonProps) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleNextQuestion = async () => {
        setLoading(true);
        setMessage("");
        try {
            const res = await fetch("/api/next-question", { method: "POST" });
            if (!res.ok) {
                // Read the text of the error response instead of trying to parse it as JSON
                const errorText = await res.text();
                throw new Error(errorText || 'Failed to load next question.');
            }
            const data = await res.json();
            setMessage(data.message);

            // Call the onNext callback after fetching next question
            if (onNext) onNext();
        } catch (err: any) {
            console.error(err);
            setMessage(err.message || "❌ Failed to load next question");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                onClick={handleNextQuestion}
                disabled={loading}
                className="w-full px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:bg-green-300"
            >
                {loading ? "Loading..." : "Next Question"}
            </button>
            {message && (
                <p className="mt-4 text-gray-700 font-medium">{message}</p>
            )}
        </div>
    );
}
