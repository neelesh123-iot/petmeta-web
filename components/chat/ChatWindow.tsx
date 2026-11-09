'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type Message = { role: 'user' | 'assistant'; content: string };
type DogMood = 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy' | 'error';

const dogPhotos: Record<DogMood, string> = {
  idle: '/assistant/petmeta-dog.png',
  listening: '/assistant/petmeta-dog.png',
  thinking: '/assistant/petmeta-dog-thinking.png',
  speaking: '/assistant/petmeta-dog-speaking.png',
  happy: '/assistant/petmeta-dog-happy.png',
  error: '/assistant/petmeta-dog-thinking.png',
};

function DogPortrait({ mood, compact = false }: { mood: DogMood; compact?: boolean }) {
  return (
    <div className={`dog-portrait dog-${mood}${compact ? ' dog-compact' : ''}`} data-dog-mood={mood}>
      <span className="dog-halo" aria-hidden="true" />
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          className="dog-pose-frame"
          key={dogPhotos[mood]}
          initial={{ opacity: 0, scale: .94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: .28, ease: 'easeOut' }}
        >
          <Image src={dogPhotos[mood]} alt="PetMeta's friendly golden retriever assistant" width={360} height={440} priority={!compact} unoptimized />
        </motion.div>
      </AnimatePresence>
      <span className="dog-sparkle dog-sparkle-one" aria-hidden="true">✦</span>
      <span className="dog-sparkle dog-sparkle-two" aria-hidden="true">✧</span>
    </div>
  );
}

function TypedAnswer({ text, complete, onFinished }: { text: string; complete: boolean; onFinished: () => void }) {
  const [visible, setVisible] = useState(0);
  const finished = useRef(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(text.length);
      return;
    }
    if (visible >= text.length) return;
    const delay = window.setTimeout(
      () => setVisible((current) => Math.min(text.length, current + 2)),
      28,
    );
    return () => window.clearTimeout(delay);
  }, [text, visible]);

  useEffect(() => {
    if (complete && text.length > 0 && visible >= text.length && !finished.current) {
      finished.current = true;
      onFinished();
    }
  }, [complete, onFinished, text.length, visible]);

  const lines = text.slice(0, visible).split('\n');
  return (
    <span className="dog-typed-answer" aria-label={text}>
      {lines.map((line, index) => (
        <span className="dog-typed-line" aria-hidden="true" key={index}>{line || '\u00a0'}</span>
      ))}
      {visible < text.length && <span className="dog-cursor" aria-hidden="true" />}
    </span>
  );
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [streamDone, setStreamDone] = useState(false);
  const [mood, setMood] = useState<DogMood>('idle');
  const [error, setError] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);
  const inFlight = useRef(false);
  const moodTimer = useRef<number | null>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, mood]);
  useEffect(() => () => {
    controller.current?.abort();
    if (moodTimer.current) window.clearTimeout(moodTimer.current);
  }, []);
  useEffect(() => {
    Object.values(dogPhotos).forEach((source) => {
      const image = new window.Image();
      image.src = source;
    });
  }, []);

  async function send(text = input) {
    const question = text.trim();
    if (!question || inFlight.current) return;
    const next: Message[] = [
      ...messages.filter((message) => message.content).slice(-18),
      { role: 'user', content: question },
    ];
    inFlight.current = true;
    if (moodTimer.current) window.clearTimeout(moodTimer.current);
    setMessages(next);
    setInput('');
    setError('');
    setBusy(true);
    setStreamDone(false);
    setMood('listening');
    moodTimer.current = window.setTimeout(() => {
      if (inFlight.current) setMood((current) => current === 'listening' ? 'thinking' : current);
    }, 420);
    controller.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.current.signal,
        body: JSON.stringify({ messages: next }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw Error(result.error || 'The dog assistant could not answer. Please try again.');
      }
      if (!response.body) throw Error('No reply was received. Please try again.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let answer = '';
      const consume = (line: string) => {
        if (!line.startsWith('data: ') || line.trim() === 'data: [DONE]') return;
        try {
          const fragment = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content;
          if (typeof fragment !== 'string' || !fragment) return;
          answer += fragment;
          if (moodTimer.current) window.clearTimeout(moodTimer.current);
          setMood('speaking');
          setMessages([...next, { role: 'assistant', content: answer }]);
        } catch {
          // Ignore malformed or non-content stream events.
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';
        lines.forEach(consume);
        if (done) {
          if (buffer) consume(buffer);
          break;
        }
      }
      if (!answer.trim()) throw Error('The dog assistant did not return an answer. Please try again.');
      setStreamDone(true);
    } catch (cause) {
      if ((cause as Error).name !== 'AbortError') {
        setError((cause as Error).message);
        setMood('error');
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function finishReply() {
    setMood('happy');
    moodTimer.current = window.setTimeout(() => setMood('idle'), 3600);
  }

  return (
    <div className="chat-window dog-chat-window">
      <div className="chat-heading dog-chat-heading">
        <DogPortrait mood={mood} compact />
        <div>
          <h3>Ask PetMeta Dog</h3>
          <p>{mood === 'listening' ? 'Question received' : mood === 'thinking' ? 'Waiting for a helpful reply…' : mood === 'speaking' ? 'Writing your answer…' : mood === 'happy' ? 'All done — happy to help!' : 'Your friendly pet-care companion'}</p>
        </div>
        <span className="dog-online"><span /> Here to help</span>
      </div>

      {mood !== 'idle' && mood !== 'error' && (
        <div className="dog-process" role="status" aria-live="polite">
          <span className={mood === 'listening' ? 'active' : 'done'}>1 <b>Question received</b></span>
          <span className={mood === 'thinking' ? 'active' : mood === 'listening' ? '' : 'done'}>2 <b>Waiting for reply</b></span>
          <span className={mood === 'speaking' ? 'active' : mood === 'happy' ? 'done' : ''}>3 <b>Writing answer</b></span>
        </div>
      )}

      <div className="messages dog-messages" aria-live="polite">
        {!messages.length && (
          <div className="chat-welcome dog-chat-welcome">
            <DogPortrait mood={mood} />
            <div className="dog-welcome-copy">
              <span className="dog-eyebrow">A HELPFUL PAW IS HERE</span>
              <h2>Hi! What can I help your pet with?</h2>
              <p>Ask about play, routines, grooming, and everyday care.</p>
              <div className="suggestions dog-suggestions">
                {[
                  'Help me plan a puppy routine',
                  'How can I keep my dog entertained?',
                  'What should I bring to a vet visit?',
                ].map((suggestion) => (
                  <motion.button key={suggestion} whileHover={{ y: -3 }} whileTap={{ scale: .97 }} onClick={() => send(suggestion)}>
                    {suggestion}<ArrowUpRight size={16} />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .25 }}
            className={`dog-message-row ${message.role}`}
            key={index}
          >
            {message.role === 'assistant' && <DogPortrait mood={mood} compact />}
            <div className={`message ${message.role}`}>
              {message.role === 'assistant'
                ? <TypedAnswer text={message.content} complete={streamDone && !busy && index === messages.length - 1} onFinished={finishReply} />
                : message.content}
            </div>
          </motion.div>
        ))}

        {(mood === 'listening' || mood === 'thinking') && (
          <div className="dog-thinking-row" role="status">
            <DogPortrait mood={mood} />
            <span>{mood === 'listening' ? 'I heard your question!' : 'Thinking with all four paws'}<span className="thinking-dots">…</span></span>
          </div>
        )}
        {error && <div className="inline-notice" role="alert">{error}</div>}
        <div ref={bottom} />
      </div>

      <form className="chat-input dog-chat-input" onSubmit={(event) => { event.preventDefault(); send(); }}>
        <input aria-label="Your message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} placeholder="Ask PetMeta Dog a question…" />
        <motion.button whileTap={{ scale: .88 }} aria-label="Send message" disabled={busy || !input.trim()}><Send size={20} /></motion.button>
      </form>
      <p className="chat-disclaimer">For health concerns, speak with a veterinarian. This assistant gives general guidance.</p>
    </div>
  );
}
