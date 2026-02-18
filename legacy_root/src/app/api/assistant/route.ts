import { NextResponse } from 'next/server';
import { AssistantResponse, IntelType } from '@/lib/types';

function inferType(message: string): IntelType | undefined {
  const lower = message.toLowerCase();
  if (lower.includes('policy') || lower.includes('regulation')) return 'policy';
  if (lower.includes('funding') || lower.includes('capital')) return 'funding';
  if (lower.includes('research') || lower.includes('paper')) return 'research';
  if (lower.includes('github') || lower.includes('open source')) return 'github';
  if (lower.includes('news')) return 'news';
  return undefined;
}

function inferWatchlist(message: string): string | undefined {
  const lower = message.toLowerCase();
  if (lower.includes('policy')) return 'public-policy';
  if (lower.includes('health')) return 'healthcare-ai';
  if (lower.includes('startup') || lower.includes('funding')) return 'startup-capital';
  if (lower.includes('model') || lower.includes('llm')) return 'foundation-models';
  return undefined;
}

function buildResponse(message: string): AssistantResponse {
  const type = inferType(message);
  const watchlist = inferWatchlist(message);
  const lower = message.toLowerCase();
  const filters: AssistantResponse['filters'] = {};
  if (type) filters.type = type;
  if (watchlist) filters.watchlist = watchlist;

  if (lower.includes('ontario') || lower.includes('toronto') || lower.includes('waterloo')) filters.region = 'Ontario';
  if (lower.includes('quebec') || lower.includes('montreal')) filters.region = 'Quebec';
  if (lower.includes('alberta') || lower.includes('edmonton') || lower.includes('calgary')) filters.region = 'Alberta';
  if (lower.includes('vancouver') || lower.includes('british columbia') || lower.includes('bc')) {
    filters.region = 'British Columbia';
  }

  if (Object.keys(filters).length === 0) {
    return {
      reply:
        'No direct filter match found. Try requests like "show policy risk in Ontario" or "funding signals this week".',
      suggestion: 'Use watchlist/public-policy or type/policy filters for fastest insight.',
    };
  }

  return {
    reply: 'I parsed your request and prepared filters for the dashboard.',
    filters,
    suggestion: 'Apply these filters and review the top nudges and event clusters first.',
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: string };
    const message = (body.message || '').trim();
    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required.' }, { status: 400 });
    }
    const response = buildResponse(message);
    return NextResponse.json({ success: true, response });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
