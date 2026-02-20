'use client';

import { useEffect, useRef, useState } from 'react';

interface TutorDialogProps {
  messages?: string[];
}

const TYPEWRITER_SPEED = 35; // ms per character

export function TutorDialog({ messages = [] }: TutorDialogProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const lastMessage = messages[messages.length - 1] ?? '';
  const prevMessageRef = useRef('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Typewriter effect when the last message changes
  useEffect(() => {
    if (lastMessage === prevMessageRef.current) return;
    prevMessageRef.current = lastMessage;

    if (!lastMessage) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setDisplayedText('');
    let i = 0;

    const interval = setInterval(() => {
      i++;
      setDisplayedText(lastMessage.slice(0, i));
      if (i >= lastMessage.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, TYPEWRITER_SPEED);

    return () => clearInterval(interval);
  }, [lastMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedText]);

  if (messages.length === 0) return null;

  // Previous messages (all except last)
  const history = messages.slice(0, -1);

  return (
    <div className="font-mono text-sm leading-relaxed">
      {/* Top border with label */}
      <div className="flex items-center">
        <span className="text-j-accent/40">╭</span>
        <span className="text-j-success font-bold text-xs px-1 -my-px">
          tutor
        </span>
        <span className="flex-1 text-j-accent/40 overflow-hidden">
          {'─'.repeat(60)}
        </span>
        <span className="text-j-accent/40">╮</span>
      </div>

      {/* Content area */}
      <div className="flex">
        {/* Left border */}
        <span className="text-j-accent/40 select-none">│</span>

        {/* Message content */}
        <div
          ref={scrollRef}
          className="flex-1 px-2 py-1.5 max-h-[120px] overflow-y-auto scrollbar-none"
        >
          {/* History (dimmed) */}
          {history.map((msg, i) => (
            <p key={i} className="text-j-text-tertiary mb-1">
              {msg}
            </p>
          ))}

          {/* Current message with cursor */}
          <p className="text-j-text-body">
            {displayedText}
            <span
              className={`inline-block w-[0.55em] h-[1.1em] align-text-bottom ml-px ${
                isTyping
                  ? 'bg-j-accent'
                  : 'animate-[cursor-blink_1s_step-end_infinite] bg-j-accent'
              }`}
            />
          </p>
        </div>

        {/* Right border */}
        <span className="text-j-accent/40 select-none">│</span>
      </div>

      {/* Bottom border */}
      <div className="flex items-center">
        <span className="text-j-accent/40">╰</span>
        <span className="flex-1 text-j-accent/40 overflow-hidden">
          {'─'.repeat(60)}
        </span>
        <span className="text-j-accent/40">╯</span>
      </div>
    </div>
  );
}
