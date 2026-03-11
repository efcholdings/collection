import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const users = await prisma.user.findMany({ select: { id: true, email: true, role: true }});
        return NextResponse.json({ 
            success: true, 
            count: users.length, 
            users,
            db_url_exists: !!process.env.DATABASE_URL,
            db_url_start: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) : null
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message, db_url_exists: !!process.env.DATABASE_URL });
    }
}
