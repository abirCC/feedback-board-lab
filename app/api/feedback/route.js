import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readAll, writeAll } from '../../../lib/store';

const feedbackSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  text: z.string().trim().min(1, 'Feedback is required').max(2000, 'Feedback must be 2000 characters or less'),
});

function getAdminKey() {
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) {
    throw new Error('ADMIN_KEY environment variable is required');
  }

  return adminKey;
}

function getBearerToken(request) {
  const header = request.headers.get('authorization') || '';
  const [scheme, token] = header.split(' ');

  return scheme?.toLowerCase() === 'bearer' ? token : null;
}

export async function GET() {
  const items = readAll();

  return NextResponse.json(items);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = feedbackSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid feedback', issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const items = readAll();
    const newItem = {
      id: Date.now().toString(),
      ...result.data,
      createdAt: new Date().toISOString(),
    };

    items.push(newItem);
    writeAll(items);

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Failed to save feedback:', error);

    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const adminKey = getAdminKey();
    const token = getBearerToken(request);

    if (token !== adminKey) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json({ error: 'Feedback id is required' }, { status: 400 });
    }

    const items = readAll();
    const updated = items.filter((item) => item.id !== body.id);

    writeAll(updated);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete feedback:', error);

    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 });
  }
}
