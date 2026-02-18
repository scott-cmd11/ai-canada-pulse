import { NextResponse } from 'next/server';
import { addCollaborationNote, getCollaborationNotes } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType') as 'entity' | 'cluster' | null;
    const targetId = searchParams.get('targetId');
    const notes = await getCollaborationNotes(targetType || undefined, targetId || undefined);
    return NextResponse.json({ success: true, notes });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      targetType?: 'entity' | 'cluster';
      targetId?: string;
      text?: string;
    };

    if (!body.targetType || !body.targetId || !body.text) {
      return NextResponse.json({ success: false, error: 'targetType, targetId and text are required.' }, { status: 400 });
    }

    const note = await addCollaborationNote({
      targetType: body.targetType,
      targetId: body.targetId,
      text: body.text,
    });

    return NextResponse.json({ success: true, note });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
