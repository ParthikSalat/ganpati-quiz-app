'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// --- Interfaces & Types ---
interface QuizState {
    quizStarted: boolean;
    quizEnded: boolean;
}

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

// --- Main Participant Page Component ---
export default function ParticipantPage() {
    // --- State Variables ---
    const [quizState, setQuizState] = useState<QuizState | null>(null);
    const [participant, setParticipant] = useState<Participant | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
    const [timer, setTimer] = useState(10); // A 10-second timer
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

    const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
    const questionPollingRef = useRef<NodeJS.Timeout | null>(null);

    // --- API Call Functions ---
    const fetchQuizAndParticipantData = useCallback(async () => {
        try {
            // Fetch quiz state and current question
            const quizRes = await fetch('/api/current-question');
            if (!quizRes.ok) throw new Error('Failed to fetch quiz state.');
            const quizData = await quizRes.json();
            setQuizState({
                quizStarted: quizData.quizStarted || false,
                quizEnded: quizData.quizEnded || false,
            });

            // If quiz is ended, fetch leaderboard
            if (quizData.quizEnded) {
                const leaderboardRes = await fetch('/api/participants');
                const leaderboardData = await leaderboardRes.json();
                setLeaderboard(leaderboardData.participants);
            }

            // Set current question if it exists and is new
            if (quizData.question) {
                const newQuestionId = quizData.question.id;
                // Only update if it's a new question to prevent flicker
                if (currentQuestion?.id !== newQuestionId) {
                    setCurrentQuestion(quizData.question);
                    setTimer(10); // Reset timer for new question
                    setSelectedOption(null);
                    setIsAnswerSubmitted(false);
                    setSubmissionMessage(null); // Clear submission message for new question
                }
            } else {
                // Clear question if no question is available
                setCurrentQuestion(null);
            }

            // Fetch participant's own data
            const participantId = sessionStorage.getItem("participantId");
            if (participantId) {
                const participantRes = await fetch("/api/participant-info", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ participantId }),
                });
                if (participantRes.ok) {
                    const participantData = await participantRes.json();
                    setParticipant(participantData.participant);
                }
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }, [currentQuestion?.id]);


    const submitAnswer = useCallback(async () => {
        if (isAnswerSubmitted || isSubmitting || !selectedOption || !participant || !currentQuestion) {
            return;
        }

        setIsAnswerSubmitted(true);
        setIsSubmitting(true);
        // Clear the timer immediately after submitting the answer
        if (questionTimerRef.current) {
            clearInterval(questionTimerRef.current);
        }

        try {
            const res = await fetch('/api/submit-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participantId: participant.id,
                    questionId: currentQuestion.id,
                    selectedAnswer: selectedOption,
                }),
            });
            const data = await res.json();
            console.log(data); // Log the response for debugging
            setSubmissionMessage("Answer submitted successfully.");
            // We now wait for the next polling interval to update the score
        } catch (error) {
            console.error("Failed to submit answer:", error);
            setSubmissionMessage("Failed to submit answer.");
        } finally {
            setIsSubmitting(false);
        }
    }, [isAnswerSubmitted, isSubmitting, selectedOption, participant, currentQuestion]);


    // --- Effects ---

    // Effect for the quiz timer
    useEffect(() => {
        if (quizState?.quizStarted && !quizState.quizEnded && currentQuestion && !isAnswerSubmitted) {
            if (questionTimerRef.current) clearInterval(questionTimerRef.current);

            questionTimerRef.current = setInterval(() => {
                setTimer(prevTimer => {
                    if (prevTimer <= 1) {
                        if (questionTimerRef.current) clearInterval(questionTimerRef.current);
                        submitAnswer(); // Auto-submit if time runs out
                        return 0;
                    }
                    return prevTimer - 1;
                });
            }, 1000);
        }

        return () => {
            if (questionTimerRef.current) {
                clearInterval(questionTimerRef.current);
            }
        };
    }, [quizState, currentQuestion, isAnswerSubmitted, submitAnswer]);


    // Polling for quiz state and question updates
    useEffect(() => {
        // Initial fetch
        fetchQuizAndParticipantData();

        // Start polling every 5 seconds
        questionPollingRef.current = setInterval(fetchQuizAndParticipantData, 5000);

        return () => {
            if (questionPollingRef.current) {
                clearInterval(questionPollingRef.current);
            }
        };
    }, [fetchQuizAndParticipantData]);

    // --- Render Logic ---
    if (loading || !quizState) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-orange-100">
                <div className="text-xl font-semibold text-orange-700">Loading...</div>
            </div>
        );
    }

    if (!participant) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-orange-100">
                <div className="p-8 bg-white rounded-lg shadow-lg text-center">
                    <p className="text-xl font-semibold">Please log in to participate.</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        if (quizState.quizEnded) {
            return (
                <div className="w-full max-w-2xl p-6 bg-white rounded-xl shadow-lg">
                    <h2 className="text-4xl font-bold text-center text-orange-600 mb-6 flex items-center justify-center gap-2">
                        <span className="text-3xl">✨</span> Final Results <span className="text-3xl">✨</span>
                    </h2>
                    <ul className="space-y-4">
                        {leaderboard.sort((a, b) => b.score - a.score).map((p, index) => (
                            <li key={p.id} className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                                <span className="font-bold text-xl text-orange-800 flex items-center gap-2">
                                    {index === 0 && <span className="text-2xl">🏆</span>}
                                    {index + 1}. {p.name}
                                </span>
                                <span className="text-2xl font-extrabold text-orange-600">{p.score}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        } else if (quizState.quizStarted && currentQuestion) {
            return (
                <div className="w-full max-w-2xl p-8 bg-white rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-lg font-medium text-gray-600">Time Left: </span>
                        <div className={`text-4xl font-bold rounded-full w-16 h-16 flex items-center justify-center transition-all duration-300 ${timer <= 3 ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-500 text-white'}`}>
                            {timer}
                        </div>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">{currentQuestion.questionText}</h2>
                    <div className="space-y-4">
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedOption(option)}
                                disabled={isAnswerSubmitted}
                                className={`w-full text-left p-4 rounded-lg font-medium transition-colors duration-300
                                    ${selectedOption === option ? 'bg-orange-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}
                                    ${isAnswerSubmitted ? 'cursor-not-allowed' : ''}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={submitAnswer}
                        disabled={isAnswerSubmitted || isSubmitting || !selectedOption}
                        className="w-full mt-8 p-4 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Answer"}
                    </button>
                    {submissionMessage && (
                        <p className="mt-4 text-center font-bold text-green-600">{submissionMessage}</p>
                    )}
                </div>
            );
        } else {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="p-8 bg-white rounded-xl shadow-lg text-center">
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
                            <span className="text-2xl">🌸</span> Welcome, {participant.name}! <span className="text-2xl">🌸</span>
                        </h1>
                        <p className="mt-4 text-xl text-gray-600">The quiz will begin shortly. Please wait for the admin to start it.</p>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-orange-100 p-4">
            <div className="w-full max-w-2xl flex justify-between items-center p-4 bg-white rounded-xl shadow-md mb-6 border-b-4 border-orange-500">
                <div className="text-lg font-semibold text-gray-700">
                    <span className="font-bold text-gray-900">User:</span> {participant?.name || 'Guest'}
                </div>
                <div className="text-lg font-semibold text-gray-700">
                    <span className="font-bold text-gray-900">Score:</span> {participant?.score || 0}
                </div>
            </div>

            {renderContent()}
        </div>
    );
}
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// --- Interfaces & Types ---
interface QuizState {
    quizStarted: boolean;
    quizEnded: boolean;
}

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

// --- Main Participant Page Component ---
export default function ParticipantPage() {
    // --- State Variables ---
    const [quizState, setQuizState] = useState<QuizState | null>(null);
    const [participant, setParticipant] = useState<Participant | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
    const [timer, setTimer] = useState(10); // A 10-second timer
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

    const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
    const questionPollingRef = useRef<NodeJS.Timeout | null>(null);

    // --- API Call Functions ---
    const fetchQuizAndParticipantData = useCallback(async () => {
        try {
            // Fetch quiz state and current question
            const quizRes = await fetch('/api/current-question');
            if (!quizRes.ok) throw new Error('Failed to fetch quiz state.');
            const quizData = await quizRes.json();
            setQuizState({
                quizStarted: quizData.quizStarted || false,
                quizEnded: quizData.quizEnded || false,
            });

            // If quiz is ended, fetch leaderboard
            if (quizData.quizEnded) {
                const leaderboardRes = await fetch('/api/participants');
                const leaderboardData = await leaderboardRes.json();
                setLeaderboard(leaderboardData.participants);
            }

            // Set current question if it exists and is new
            if (quizData.question) {
                const newQuestionId = quizData.question.id;
                // Only update if it's a new question to prevent flicker
                if (currentQuestion?.id !== newQuestionId) {
                    setCurrentQuestion(quizData.question);
                    setTimer(10); // Reset timer for new question
                    setSelectedOption(null);
                    setIsAnswerSubmitted(false);
                    setSubmissionMessage(null); // Clear submission message for new question
                }
            } else {
                // Clear question if no question is available
                setCurrentQuestion(null);
            }

            // Fetch participant's own data
            const participantId = sessionStorage.getItem("participantId");
            if (participantId) {
                const participantRes = await fetch("/api/participant-info", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ participantId }),
                });
                if (participantRes.ok) {
                    const participantData = await participantRes.json();
                    setParticipant(participantData.participant);
                }
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }, [currentQuestion?.id]);


    const submitAnswer = useCallback(async () => {
        if (isAnswerSubmitted || isSubmitting || !selectedOption || !participant || !currentQuestion) {
            return;
        }

        setIsAnswerSubmitted(true);
        setIsSubmitting(true);
        // Clear the timer immediately after submitting the answer
        if (questionTimerRef.current) {
            clearInterval(questionTimerRef.current);
        }

        try {
            const res = await fetch('/api/submit-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participantId: participant.id,
                    questionId: currentQuestion.id,
                    selectedAnswer: selectedOption,
                }),
            });
            const data = await res.json();
            console.log(data); // Log the response for debugging
            setSubmissionMessage("Answer submitted successfully.");
            // We now wait for the next polling interval to update the score
        } catch (error) {
            console.error("Failed to submit answer:", error);
            setSubmissionMessage("Failed to submit answer.");
        } finally {
            setIsSubmitting(false);
        }
    }, [isAnswerSubmitted, isSubmitting, selectedOption, participant, currentQuestion]);


    // --- Effects ---

    // Effect for the quiz timer
    useEffect(() => {
        if (quizState?.quizStarted && !quizState.quizEnded && currentQuestion && !isAnswerSubmitted) {
            if (questionTimerRef.current) clearInterval(questionTimerRef.current);

            questionTimerRef.current = setInterval(() => {
                setTimer(prevTimer => {
                    if (prevTimer <= 1) {
                        if (questionTimerRef.current) clearInterval(questionTimerRef.current);
                        submitAnswer(); // Auto-submit if time runs out
                        return 0;
                    }
                    return prevTimer - 1;
                });
            }, 1000);
        }

        return () => {
            if (questionTimerRef.current) {
                clearInterval(questionTimerRef.current);
            }
        };
    }, [quizState, currentQuestion, isAnswerSubmitted, submitAnswer]);


    // Polling for quiz state and question updates
    useEffect(() => {
        // Initial fetch
        fetchQuizAndParticipantData();

        // Start polling every 5 seconds
        questionPollingRef.current = setInterval(fetchQuizAndParticipantData, 5000);

        return () => {
            if (questionPollingRef.current) {
                clearInterval(questionPollingRef.current);
            }
        };
    }, [fetchQuizAndParticipantData]);

    // --- Render Logic ---
    if (loading || !quizState) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-orange-100">
                <div className="text-xl font-semibold text-orange-700">Loading...</div>
            </div>
        );
    }

    if (!participant) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-orange-100">
                <div className="p-8 bg-white rounded-lg shadow-lg text-center">
                    <p className="text-xl font-semibold">Please log in to participate.</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        if (quizState.quizEnded) {
            return (
                <div className="w-full max-w-2xl p-6 bg-white rounded-xl shadow-lg">
                    <h2 className="text-4xl font-bold text-center text-orange-600 mb-6 flex items-center justify-center gap-2">
                        <span className="text-3xl">✨</span> Final Results <span className="text-3xl">✨</span>
                    </h2>
                    <ul className="space-y-4">
                        {leaderboard.sort((a, b) => b.score - a.score).map((p, index) => (
                            <li key={p.id} className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                                <span className="font-bold text-xl text-orange-800 flex items-center gap-2">
                                    {index === 0 && <span className="text-2xl">🏆</span>}
                                    {index + 1}. {p.name}
                                </span>
                                <span className="text-2xl font-extrabold text-orange-600">{p.score}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        } else if (quizState.quizStarted && currentQuestion) {
            return (
                <div className="w-full max-w-2xl p-8 bg-white rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-lg font-medium text-gray-600">Time Left: </span>
                        <div className={`text-4xl font-bold rounded-full w-16 h-16 flex items-center justify-center transition-all duration-300 ${timer <= 3 ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-500 text-white'}`}>
                            {timer}
                        </div>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">{currentQuestion.questionText}</h2>
                    <div className="space-y-4">
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedOption(option)}
                                disabled={isAnswerSubmitted}
                                className={`w-full text-left p-4 rounded-lg font-medium transition-colors duration-300
                                    ${selectedOption === option ? 'bg-orange-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}
                                    ${isAnswerSubmitted ? 'cursor-not-allowed' : ''}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={submitAnswer}
                        disabled={isAnswerSubmitted || isSubmitting || !selectedOption}
                        className="w-full mt-8 p-4 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Answer"}
                    </button>
                    {submissionMessage && (
                        <p className="mt-4 text-center font-bold text-green-600">{submissionMessage}</p>
                    )}
                </div>
            );
        } else {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="p-8 bg-white rounded-xl shadow-lg text-center">
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
                            <span className="text-2xl">🌸</span> Welcome, {participant.name}! <span className="text-2xl">🌸</span>
                        </h1>
                        <p className="mt-4 text-xl text-gray-600">The quiz will begin shortly. Please wait for the admin to start it.</p>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-orange-100 p-4">
            <div className="w-full max-w-2xl flex justify-between items-center p-4 bg-white rounded-xl shadow-md mb-6 border-b-4 border-orange-500">
                <div className="text-lg font-semibold text-gray-700">
                    <span className="font-bold text-gray-900">User:</span> {participant?.name || 'Guest'}
                </div>
                <div className="text-lg font-semibold text-gray-700">
                    <span className="font-bold text-gray-900">Score:</span> {participant?.score || 0}
                </div>
            </div>

            {renderContent()}
        </div>
    );
}
