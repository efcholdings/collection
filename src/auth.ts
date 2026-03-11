
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcrypt-ts';

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                try {
                    const parsedCredentials = z
                        .object({ email: z.string().email(), password: z.string() })
                        .safeParse(credentials);

                    if (parsedCredentials.success) {
                        const { email, password } = parsedCredentials.data;
                        
                        console.log(`[AUTH DEBUG] Searching for user: ${email}`);
                        const user = await prisma.user.findUnique({ where: { email } });
                        if (!user || user.hashedPassword === null) return null;

                        console.log(`[AUTH DEBUG] User found. Comparing passwords with bcryptjs...`);
                        const passwordsMatch = await bcrypt.compare(password, user.hashedPassword);

                        console.log(`[AUTH DEBUG] Password match result: ${passwordsMatch}`);
                        if (passwordsMatch) {
                            return { id: user.id, name: user.name, email: user.email, role: user.role };
                        }
                    }
                    return null;
                } catch (error) {
                    console.error('[AUTH DEBUG FAIL] Exception caught in authorize callback:', error);
                    return null;
                }
            },
        }),
    ],
});
