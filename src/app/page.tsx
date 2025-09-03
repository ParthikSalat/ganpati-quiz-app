"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/participant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          throw new Error('Failed to create participant');
        }

        const data = await response.json();

        // Store the new participant's ID in local storage for the quiz
        localStorage.setItem('participantId', data.id);
        localStorage.setItem('participantName', data.name);

        router.push('/quiz');
      } catch (err) {
        setError("Something went wrong. Please try again.");
        console.error(err);
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-400 to-red-500">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md mx-auto transform transition-all hover:scale-105 duration-300">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-800 mb-2 font-['Inter']">
            Ganpati Quiz
          </h1>
          <p className="text-xl text-gray-500 mb-6 font-['Inter']">
            Test your knowledge, win big!
          </p>
        </div>
        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label htmlFor="name" className="sr-only">
              Enter Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Your Name"
              required
              disabled={loading}
              className="w-full px-5 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-lg transition-colors duration-200"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-4 rounded-lg text-xl font-bold uppercase tracking-wider hover:bg-orange-700 transition-colors duration-200 shadow-md transform hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining...' : 'Join Quiz'}
          </button>
          {error && (
            <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
