"use client";

import { useRouter } from "next/navigation";

export default function GanpatiQuizHome() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-orange-950 p-4 bg-[url('/ganpati-bg.png')] bg-cover bg-center">
      <div className="bg-yellow-900 bg-opacity-90 p-10 rounded-2xl shadow-2xl text-center w-full max-w-md animate-fade-in">
        <h1 className="text-4xl font-bold mb-6 text-white drop-shadow-lg">🌺 Ganpati Quiz 🌺</h1>
        <p className="text-yellow-100 mb-6 text-lg">Welcome! Select your role to start the quiz:</p>

        <div className="space-y-4">
          <button
            onClick={() => router.push("/admin")}
            className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition shadow-lg"
          >
            Admin
          </button>
          <button
            onClick={() => router.push("/login")}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg"
          >
            Participant
          </button>
        </div>

        <p className="mt-6 text-yellow-200 text-sm">
          Celebrate Ganpati with knowledge & fun! 🎉
        </p>
      </div>
    </div>
  );
}
