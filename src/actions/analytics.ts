'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function getTokenAnalytics() {
    const session = await auth();
    // @ts-ignore
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                tokenUsage: {
                    select: {
                        tokens: true,
                        createdAt: true,
                        action: true
                    }
                }
            }
        });

        // Map and aggregate
        const analytics = users.map((user: any) => {
            const totalTokens = user.tokenUsage.reduce((acc: number, curr: any) => acc + curr.tokens, 0);
            const thisMonthTokens = user.tokenUsage
                .filter((t: any) => new Date(t.createdAt).getMonth() === new Date().getMonth() && new Date(t.createdAt).getFullYear() === new Date().getFullYear())
                .reduce((acc: number, curr: any) => acc + curr.tokens, 0);

            return {
                id: user.id,
                name: user.name || 'Unknown',
                email: user.email,
                totalTokens,
                thisMonthTokens,
                transactionCount: user.tokenUsage.length
            };
        }).filter((u: any) => u.totalTokens > 0) // Only show users who burned tokens
          .sort((a: any, b: any) => b.totalTokens - a.totalTokens);

        return { analytics };
    } catch (e: any) {
        console.error("Analytics fetch error:", e);
        return { error: 'Failed to fetch analytics' };
    }
}
