'use client';

import { signIn } from 'next-auth/react'; // Client-side import? No, v5 uses server actions or REST.
// Actually for v5 with Credentials, we often use a Server Action or a client form posting to /api/auth/callback/credentials.
// Let's use a simple client form that calls the signIn function from next-auth/react? 
// No, standard next-auth practice is often server actions now, but sticking to simple client form is easier for "interactive" feedback.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticate } from '@/actions/auth'; // We'll create this helper

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);

    // Note: We'll use a server action wrapper to call signIn

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-sm rounded-lg border bg-white p-6 shadow-sm">
                <h1 className="mb-6 text-center text-2xl font-bold">Admin Login</h1>
                <form action={async (formData) => {
                    const res = await authenticate(formData);
                    if (res?.error) setError(res.error);
                }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input type="text" name="username" className="mt-1 w-full rounded-md border p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" name="password" className="mt-1 w-full rounded-md border p-2" required />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button type="submit" className="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800">
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}
