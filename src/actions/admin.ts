'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ArtworkSchema = z.object({
    title: z.string().min(1),
    artist: z.string().min(1),
    year: z.string().optional().nullable(),
    medium: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    imagePath: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    height: z.string().optional().nullable(),
    width: z.string().optional().nullable(),
    depth: z.string().optional().nullable(),
    appraisalValue: z.string().optional().nullable(),
    purchasePrice: z.string().optional().nullable(),
});

async function checkAdmin() {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Unauthorized');
    }
}

export async function updateArtwork(id: string, formData: FormData) {
    await checkAdmin();

    const data = {
        title: formData.get('title') as string,
        artist: formData.get('artist') as string,
        year: formData.get('year') as string | null,
        medium: formData.get('medium') as string | null,
        category: formData.get('category') as string | null,
        imagePath: formData.get('imagePath') as string | null,
        notes: formData.get('notes') as string | null,
        height: formData.get('height') as string | null,
        width: formData.get('width') as string | null,
        depth: formData.get('depth') as string | null,
        appraisalValue: formData.get('appraisalValue') as string | null,
        purchasePrice: formData.get('purchasePrice') as string | null,
    };

    // Validate
    const validated = ArtworkSchema.parse(data);

    await prisma.artwork.update({
        where: { id },
        data: validated,
    });

    revalidatePath('/');
    return { success: true };
}

export async function deleteArtwork(id: string) {
    await checkAdmin();

    await prisma.artwork.delete({
        where: { id },
    });

    revalidatePath('/');
    return { success: true };
}

export async function createArtwork(formData: FormData) {
    await checkAdmin();

    const data = {
        title: formData.get('title') as string,
        artist: formData.get('artist') as string,
        year: formData.get('year') as string | null,
        medium: formData.get('medium') as string | null,
        category: formData.get('category') as string | null,
        imagePath: formData.get('imagePath') as string | null,
        notes: formData.get('notes') as string | null,
        height: formData.get('height') as string | null,
        width: formData.get('width') as string | null,
        depth: formData.get('depth') as string | null,
        originalId: `temp-${Date.now()}`, // Temporary ID logic, assumes we migrate to auto-increment or UUID properly later
        appraisalValue: formData.get('appraisalValue') as string | null,
        purchasePrice: formData.get('purchasePrice') as string | null,
    };

    // Validate
    const validated = ArtworkSchema.parse(data);

    await prisma.artwork.create({
        data: {
            ...validated,
            originalId: `new-${Date.now()}` // Ensure unique
        },
    });

    revalidatePath('/');
    return { success: true };
}
