
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string() })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    
                    const user = await prisma.user.findUnique({ where: { email } });
                    if (!user || user.hashedPassword === null) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.hashedPassword);

                    if (passwordsMatch) {
                        return { id: user.id, name: user.name, email: user.email, role: user.role };
                    }
                }
                return null;
            },
        }),
    ],
});
