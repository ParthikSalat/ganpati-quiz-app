"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ParticipantLoginPage() {
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async () => {
        if (!name) return setError("Please enter your name.");

        try {
            const res = await fetch("/api/participant-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (!res.ok) {
                const errData = await res.json();
                setError(errData.message);
                return;
            }

            const data = await res.json();

            // Save participantId in sessionStorage
            sessionStorage.setItem("participantId", data.participantId);
            sessionStorage.setItem("participantName", data.name);

            // Redirect to participant page
            router.push("/participant");
        } catch (err) {
            setError("Failed to login.");
            console.error(err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Participant Login</h1>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={handleLogin}
                    className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
                >
                    Login
                </button>
                {error && <p className="mt-2 text-red-500">{error}</p>}
            </div>
        </div>
    );
}
