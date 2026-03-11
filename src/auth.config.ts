import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    providers: [], // Add your providers here in auth.ts, not here!
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLogin = nextUrl.pathname.startsWith('/login');
            
            if (!isOnLogin) {
                if (isLoggedIn) return true;
                return false; // Redirect to /login
            } else if (isLoggedIn) {
                return Response.redirect(new URL('/', nextUrl)); // Don't let logged in users see the login page
            }
            return true;
        },
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
} satisfies NextAuthConfig;
