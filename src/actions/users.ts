'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import * as bcrypt from 'bcrypt-ts';
import { Role } from '@prisma/client';

export async function getUsers() {
    const session = await auth();
    // @ts-ignore
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: { id: true, email: true, name: true, role: true, createdAt: true }
        });
        return { success: true, users };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { success: false, error: 'Failed to fetch users' };
    }
}

export async function createUser(data: any) {
    const session = await auth();
    // @ts-ignore
    if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

    try {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        await prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                role: data.role as Role,
                hashedPassword
            }
        });
        revalidatePath('/admin');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateUser(id: string, data: any) {
    const session = await auth();
    // @ts-ignore
    if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

    try {
        const updateData: any = {
            email: data.email,
            name: data.name,
            role: data.role as Role
        };
        if (data.password) {
            updateData.hashedPassword = await bcrypt.hash(data.password, 10);
        }

        await prisma.user.update({
            where: { id },
            data: updateData
        });
        revalidatePath('/admin');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteUser(id: string) {
    const session = await auth();
    // @ts-ignore
    if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

    try {
        await prisma.user.delete({ where: { id } });
        revalidatePath('/admin');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
