'use server';

import { prisma } from '@/lib/prisma';
import { Artwork } from '@prisma/client';

export async function getFilters() {
    const categories = await prisma.artwork.findMany({
        select: { category: true },
        distinct: ['category'],
        // Category is nullable (String?), so we must exclude nulls and empty strings
        where: {
            AND: [
                { category: { not: null } },
                { category: { not: '' } }
            ]
        },
        orderBy: { category: 'asc' },
    });

    const artists = await prisma.artwork.findMany({
        select: { artist: true },
        distinct: ['artist'],
        // Artist is required (String), so we only exclude empty strings
        where: { artist: { not: '' } },
        orderBy: { artist: 'asc' },
    });

    return {
        categories: categories.map((c: { category: string | null }) => c.category).filter((c): c is string => !!c),
        artists: artists.map((a: { artist: string }) => a.artist).filter((a): a is string => !!a),
    };
}

export async function getArtworks(formData?: FormData) {
    // Basic search filtering if needed later
    // For now we just return all or filtered by args if I add them
    // But page.tsx does the initial load.
    // This action might be for load more or dynamic filtering if I move to client-side fetching
    return [];
}
