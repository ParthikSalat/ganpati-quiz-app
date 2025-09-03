"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    LiveblocksProvider,
    RoomProvider,
    useEventListener,
    ClientSideSuspense,
} from "@liveblocks/react";
import { JsonObject } from "@liveblocks/client";

interface Question {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
}

interface LeaderboardItem {
    id: string;
    name: string;
    score: number;
}

const QUIZ_ROOM_ID = "ganpati-quiz-room";

function QuizContent() {
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [participantName, setParticipantName] = useState<string | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timer, setTimer] = useState(15);
    const [answerSubmitted, setAnswerSubmitted] = useState(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
    const router = useRouter();

    const fetchQuestion = useCallback(async () => {
        setLoading(true);
        setAnswerSubmitted(false);
        setTimer(15);

        try {
            const response = await fetch("/api/questions");
            if (!response.ok) {
                throw new Error("Failed to fetch question");
            }
            const data = await response.json();

            if ("message" in data) {
                setCurrentQuestion(null);
                setError(data.message);
            } else {
                setCurrentQuestion(data.question);
                setCurrentQuestionIndex(data.index);
                setError(null);
            }
        } catch (err) {
            setError("Could not load quiz questions. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateLeaderboard = useCallback(async () => {
        try {
            const response = await fetch("/api/leaderboard");
            if (!response.ok) {
                throw new Error("Failed to fetch leaderboard");
            }
            const data: LeaderboardItem[] = await response.json();
            setLeaderboard(data);
        } catch (err) {
            console.error("Error fetching leaderboard:", err);
        }
    }, []);

    useEffect(() => {
        const id = localStorage.getItem("participantId");
        const name = localStorage.getItem("participantName");

        if (!id || !name) {
            router.push("/");
        } else {
            setParticipantId(id);
            setParticipantName(name);
            fetchQuestion();
            updateLeaderboard();
        }
    }, [router, fetchQuestion, updateLeaderboard]);

    useEffect(() => {
        if (timer > 0 && !answerSubmitted) {
            const countdown = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(countdown);
        }
    }, [timer, answerSubmitted]);

    // ✅ FIX: Properly typed event listener
    useEventListener(({ event }) => {
        if (!event) return;

        const e = event as JsonObject & { type?: string };

        if (e.type === "score_update") {
            updateLeaderboard();
        }
        if (e.type === "next_question_event") {
            fetchQuestion();
        }
        if (e.type === "quiz_restarted") {
            fetchQuestion(); // reset to first question
            updateLeaderboard();
        }
    });

    const handleSubmitAnswer = async (submittedAnswer: string) => {
        if (!participantId || !currentQuestion || answerSubmitted) return;

        setAnswerSubmitted(true);

        try {
            const response = await fetch("/api/submit-answer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    participantId,
                    questionId: currentQuestion.id,
                    submittedAnswer,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to submit answer");
            }
        } catch (err) {
            setError("Failed to submit answer. Please try again.");
            console.error(err);
        }
    };

    const getButtonClass = (option: string) => {
        if (!answerSubmitted) {
            return "w-full text-left py-3 px-6 rounded-lg text-lg bg-gray-200 text-gray-800 hover:bg-orange-200 transition-colors duration-200";
        }
        if (option === currentQuestion?.correctAnswer) {
            return "w-full text-left py-3 px-6 rounded-lg text-lg bg-green-500 text-white transition-colors duration-200";
        }
        return "w-full text-left py-3 px-6 rounded-lg text-lg bg-red-500 text-white transition-colors duration-200 opacity-50";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-xl font-medium text-gray-700">Loading quiz...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-red-100">
                <p className="text-xl font-medium text-red-700">{error}</p>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-xl font-medium text-gray-700">
                    The quiz has ended. Thank you for participating!
                </p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-orange-400 to-red-500 p-8">
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-extrabold text-gray-800">
                            Hello, {participantName}!
                        </h2>
                        <span className="text-lg font-semibold text-orange-600">
                            Question {currentQuestionIndex + 1}
                        </span>
                    </div>
                    <div className="relative p-6 rounded-lg bg-gray-50 border-gray-200 border-2">
                        <div className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md">
                            <span className="text-xl font-bold text-orange-600">{timer}s</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-6 text-gray-700">
                            {currentQuestion.questionText}
                        </h3>
                        <div className="space-y-4">
                            {currentQuestion.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSubmitAnswer(option)}
                                    disabled={answerSubmitted || timer === 0}
                                    className={getButtonClass(option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-1/4 bg-white p-6 rounded-xl shadow-2xl ml-8">
                <h3 className="text-2xl font-extrabold text-gray-800 mb-4 text-center">
                    Leaderboard
                </h3>
                <ul className="space-y-2">
                    {leaderboard.map((item, index) => (
                        <li
                            key={item.id}
                            className="flex justify-between items-center bg-gray-100 p-3 rounded-lg"
                        >
                            <span className="font-bold text-lg text-gray-700">
                                {index + 1}. {item.name}
                            </span>
                            <span className="text-lg font-bold text-orange-600">
                                {item.score}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <LiveblocksProvider
            publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY as string}
        >
            <ClientSideSuspense fallback={<div>Loading Liveblocks...</div>}>
                {() => (
                    <RoomProvider id={QUIZ_ROOM_ID}>
                        <QuizContent />
                    </RoomProvider>
                )}
            </ClientSideSuspense>
        </LiveblocksProvider>
    );
}
