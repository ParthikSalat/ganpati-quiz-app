"use client";

import { useState, useEffect } from "react";
import NextQuestionButton from "../components/NextQuestionButtont";

interface Participant {
    id: string;
    name: string;
    score: number;
}

interface Question {
    id: string;
    questionText: string;
    options: string[];
}

export default function AdminPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [newParticipantName, setNewParticipantName] = useState("");
    const [registrationMessage, setRegistrationMessage] = useState("");
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [participantsLoading, setParticipantsLoading] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [questionText, setQuestionText] = useState("");
    const [options, setOptions] = useState<string[]>(["", "", "", ""]);
    const [correctAnswer, setCorrectAnswer] = useState("");
    const [points, setPoints] = useState(10);
    const [questionMessage, setQuestionMessage] = useState("");
    const [quizEnded, setQuizEnded] = useState(false);
    const [quizStarted, setQuizStarted] = useState(false);

    // Fetch participants
    const fetchParticipants = async () => {
        setParticipantsLoading(true);
        try {
            const res = await fetch("/api/participants");
            const data = await res.json();
            setParticipants(data.participants);
        } catch (err) {
            console.error("Error fetching participants:", err);
        } finally {
            setParticipantsLoading(false);
        }
    };

    // Fetch current quiz state & question
    const fetchQuizState = async () => {
        try {
            const res = await fetch("/api/current-question");
            const data = await res.json();
            setQuizEnded(data.quizEnded);
            setQuizStarted(data.quizStarted);
            setCurrentQuestion(data.question || null);
        } catch (err) {
            console.error("Error fetching quiz state:", err);
        }
    };

    // Auto-refresh participants & quiz state every 5 seconds
    useEffect(() => {
        fetchParticipants();
        fetchQuizState();
        const interval = setInterval(() => {
            fetchParticipants();
            fetchQuizState();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Start quiz
    const handleStartQuiz = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/start-quiz", { method: "POST" });
            const data = await res.json();
            setMessage(data.message);
            setQuizStarted(true);
        } catch (err) {
            setMessage("❌ Failed to start quiz.");
        } finally {
            setLoading(false);
        }
    };

    // Restart quiz
    const handleRestart = async () => {
        setLoading(true);
        setMessage("");
        try {
            const res = await fetch("/api/restart-quiz", { method: "POST" });
            const data = await res.json();
            setMessage(data.message);
            setQuizEnded(false);
            setQuizStarted(false);
            setCurrentQuestion(null);
            fetchParticipants();
        } catch (err) {
            setMessage("❌ Failed to restart quiz");
        } finally {
            setLoading(false);
        }
    };

    // End quiz
    const handleEndQuiz = async () => {
        setLoading(true);
        setMessage("");
        try {
            const res = await fetch("/api/end-quiz", { method: "POST" });
            const data = await res.json();
            setMessage(data.message);
            setQuizEnded(true);
            fetchParticipants();
        } catch (err) {
            setMessage("❌ Failed to end quiz.");
        } finally {
            setLoading(false);
        }
    };

    // Register new participant
    const handleRegister = async () => {
        if (!newParticipantName) {
            setRegistrationMessage("Please enter a name.");
            return;
        }
        setLoading(true);
        setRegistrationMessage("");
        try {
            const res = await fetch("/api/register-participant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newParticipantName }),
            });
            const data = await res.json();
            setRegistrationMessage(data.message);
            setNewParticipantName("");
            fetchParticipants();
        } catch (err) {
            setRegistrationMessage("❌ Failed to register participant");
        } finally {
            setLoading(false);
        }
    };

    // Add new question
    const handleAddQuestion = async () => {
        setLoading(true);
        setQuestionMessage("");
        try {
            const res = await fetch("/api/questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionText, options, correctAnswer, points }),
            });
            const data = await res.json();
            setQuestionMessage(data.message);
            setQuestionText("");
            setOptions(["", "", "", ""]);
            setCorrectAnswer("");
            setPoints(10);
        } catch (err) {
            setQuestionMessage("❌ Failed to add question");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-black p-4">
            <div className="bg-gray-900 p-8 rounded-xl shadow-lg text-center w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-white">Quiz Admin Panel</h1>

                {/* Start / End / Restart Quiz */}
                {!quizStarted && (
                    <button
                        onClick={handleStartQuiz}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:bg-green-300 mb-4"
                    >
                        {loading ? "Starting..." : "Start Quiz"}
                    </button>
                )}

                {quizStarted && !quizEnded && (
                    <>
                        <NextQuestionButton onNext={() => {
                            fetchParticipants();
                            fetchQuizState();
                        }} />


                        <button
                            onClick={handleEndQuiz}
                            disabled={loading}
                            className="mt-6 w-full px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition disabled:bg-red-300"
                        >
                            {loading ? "Ending..." : "End Quiz"}
                        </button>
                    </>
                )}

                {quizEnded && (
                    <button
                        onClick={handleRestart}
                        disabled={loading}
                        className="mt-6 w-full px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:bg-green-300"
                    >
                        {loading ? "Restarting..." : "Restart Quiz"}
                    </button>
                )}

                {message && (
                    <p className="mt-4 text-gray-200 font-medium">{message}</p>
                )}

                {/* Current Question */}
                {currentQuestion && (
                    <div className="my-4 p-4 bg-gray-800 rounded-lg text-white text-left">
                        <h3 className="font-bold mb-2">Current Question:</h3>
                        <p>{currentQuestion.questionText}</p>
                        <ul className="list-disc ml-5 mt-2">
                            {currentQuestion.options.map((opt, i) => (
                                <li key={i}>{opt}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <hr className="my-8 border-gray-700" />

                {/* Add Question */}
                <div className="text-left">
                    <h2 className="text-xl font-bold mb-4 text-white">Add a New Question</h2>
                    <input
                        type="text"
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Enter question text"
                        className="w-full px-4 py-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-800 text-white border-gray-700"
                    />
                    {options.map((option, index) => (
                        <input
                            key={index}
                            type="text"
                            value={option}
                            onChange={(e) => {
                                const newOptions = [...options];
                                newOptions[index] = e.target.value;
                                setOptions(newOptions);
                            }}
                            placeholder={`Option ${index + 1}`}
                            className="w-full px-4 py-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-800 text-white border-gray-700"
                        />
                    ))}
                    <input
                        type="text"
                        value={correctAnswer}
                        onChange={(e) => setCorrectAnswer(e.target.value)}
                        placeholder="Correct Answer (must match an option)"
                        className="w-full px-4 py-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-800 text-white border-gray-700"
                    />
                    <input
                        type="number"
                        value={points}
                        onChange={(e) => setPoints(parseInt(e.target.value))}
                        placeholder="Points"
                        className="w-full px-4 py-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-800 text-white border-gray-700"
                    />
                    <button
                        onClick={handleAddQuestion}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition disabled:bg-purple-300"
                    >
                        {loading ? "Adding..." : "Add Question"}
                    </button>
                    {questionMessage && (
                        <p className="mt-2 text-gray-200 font-medium">{questionMessage}</p>
                    )}
                </div>

                <hr className="my-8 border-gray-700" />

                {/* Register Participant */}
                <div className="text-left">
                    <h2 className="text-xl font-bold mb-4 text-white">Register Participant</h2>
                    <input
                        type="text"
                        value={newParticipantName}
                        onChange={(e) => setNewParticipantName(e.target.value)}
                        placeholder="Enter participant name"
                        className="w-full px-4 py-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white border-gray-700"
                    />
                    <button
                        onClick={handleRegister}
                        disabled={loading || !newParticipantName}
                        className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition disabled:bg-blue-300"
                    >
                        {loading ? "Registering..." : "Register Participant"}
                    </button>
                    {registrationMessage && (
                        <p className="mt-2 text-gray-200 font-medium">{registrationMessage}</p>
                    )}
                </div>

                <hr className="my-8 border-gray-700" />

                {/* Participants & Scores */}
                <div className="text-left">
                    <h2 className="text-xl font-bold mb-4 text-white">Participants & Scores</h2>
                    {participantsLoading ? (
                        <p className="text-gray-500">Loading participants...</p>
                    ) : (
                        <ul className="divide-y divide-gray-700 max-h-60 overflow-y-auto">
                            {participants.length > 0 ? (
                                participants.map((p) => (
                                    <li key={p.id} className="py-2 flex justify-between items-center text-gray-200">
                                        <span className="font-semibold">{p.name}</span>
                                        <span className="font-bold">{p.score}</span>
                                    </li>
                                ))
                            ) : (
                                <p className="text-gray-500">No participants registered yet.</p>
                            )}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
