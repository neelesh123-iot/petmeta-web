export const runtime = 'nodejs';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const limits = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: Request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return Response.json(
      { error: 'The dog assistant is not connected yet.' },
      { status: 503 },
    );
  }

  const identity = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const now = Date.now();
  const limit = limits.get(identity);
  if (limit && limit.resetAt > now && limit.count >= 12) {
    return Response.json(
      { error: 'Please give the dog assistant a short break and try again.' },
      { status: 429 },
    );
  }

  let messages: ChatMessage[];
  try {
    const body = await req.json();
    messages = body.messages;
  } catch {
    return Response.json({ error: 'Could not read your message.' }, { status: 400 });
  }
  if (
    !Array.isArray(messages) ||
    messages.length < 1 ||
    messages.length > 20 ||
    messages.at(-1)?.role !== 'user' ||
    messages.some(
      (m) =>
        !m ||
        (m.role !== 'user' && m.role !== 'assistant') ||
        typeof m.content !== 'string' ||
        !m.content.trim() ||
        m.content.length > 2000,
    )
  ) {
    return Response.json(
      { error: 'Please send a shorter question.' },
      { status: 400 },
    );
  }

  limits.set(identity, {
    count: limit && limit.resetAt > now ? limit.count + 1 : 1,
    resetAt: limit && limit.resetAt > now ? limit.resetAt : now + 10 * 60_000,
  });

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        stream: true,
        max_tokens: 500,
        messages: [
          {
            role: 'system',
            content:
              'You are PetMeta Dog, a friendly pet-care assistant. Answer clearly in 2 to 5 short sentences. Put each sentence on its own line so it can appear one line at a time. Give practical general pet care advice. Do not diagnose, prescribe, invent local businesses, or claim a booking or order was placed. For urgent symptoms, advise immediate veterinary care. If unsure, say so.',
          },
          ...messages,
        ],
      }),
      signal: req.signal,
      cache: 'no-store',
    });
    if (!upstream.ok || !upstream.body) {
      return Response.json(
        { error: 'The dog assistant could not answer right now. Please try again.' },
        { status: 502 },
      );
    }
    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return Response.json(
      { error: 'The dog assistant could not connect. Please try again.' },
      { status: 502 },
    );
  }
}
