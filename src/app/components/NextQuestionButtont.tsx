"use client";

export default function NextQuestionButton() {
    const handleNext = async () => {
        try {
            const res = await fetch("/api/next-question", { method: "POST" });
            if (!res.ok) throw new Error("Failed to trigger next question");
            alert("✅ Next question sent to all participants!");
        } catch (err) {
            console.error(err);
            alert("❌ Error sending next question.");
        }
    };

    return (
        <button
            onClick={handleNext}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg shadow hover:bg-orange-700 transition"
        >
            Next Question →
        </button>
    );
}
