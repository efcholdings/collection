
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                console.log('Authorize called with:', credentials);
                const parsedCredentials = z
                    .object({ username: z.string(), password: z.string() })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { username, password } = parsedCredentials.data;
                    console.log('Checking against:', username, password);
                    // Hardcoded admin check as requested
                    if (username === 'admin' && password === 'admin123') {
                        console.log('Login successful');
                        return { id: '1', name: 'Admin', email: 'admin@example.com' };
                    }
                }
                console.log('Login failed');
                return null;
            },
        }),
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.id) {
                // @ts-ignore
                session.user.id = token.id as string;
            }
            return session;
        },
    },
});
