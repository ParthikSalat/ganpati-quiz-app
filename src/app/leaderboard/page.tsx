"use client";

import { useState, useEffect } from "react";

interface Participant {
    id: string;
    name: string;
    score: number;
}

export default function LeaderboardPage() {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/leaderboard"); // Make sure this API returns top participants
            const data = await res.json();
            setParticipants(data);
        } catch (err) {
            console.error("Error fetching leaderboard:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 5000); // refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-black p-4">
            <div className="bg-gray-900 p-8 rounded-xl shadow-lg text-center w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-white">Leaderboard</h1>

                {loading && <p className="text-gray-400 mb-4">Loading leaderboard...</p>}

                <ul className="divide-y divide-gray-700 max-h-80 overflow-y-auto text-left">
                    {participants.length > 0 ? (
                        participants.map((p, index) => (
                            <li
                                key={p.id}
                                className="py-3 flex justify-between items-center text-gray-200"
                            >
                                <span className="font-semibold">
                                    {index + 1}. {p.name}
                                </span>
                                <span className="font-bold">{p.score}</span>
                            </li>
                        ))
                    ) : (
                        <p className="text-gray-500">No participants yet.</p>
                    )}
                </ul>
            </div>
        </div>
    );
}
