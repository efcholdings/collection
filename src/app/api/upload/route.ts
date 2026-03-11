import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
        return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN is completely missing from process.env on Vercel Edge' }, { status: 500 });
    }

    const blob = await put(filename, request.body!, {
      access: 'public',
      token: token,
      addRandomSuffix: true,
    });

    return NextResponse.json(blob);
  } catch (error: any) {
    console.error('Error uploading to Vercel Blob:', error);
    return NextResponse.json({ error: 'Failed to upload', details: error?.message || String(error) }, { status: 500 });
  }
}
