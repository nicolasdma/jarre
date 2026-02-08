'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TutorPanelProps {
  playground: 'consensus' | 'replication' | 'partitioning' | 'latency';
  getState: () => unknown;
  accentColor: string;
  proactiveQuestion: string | null;
  onDismissProactive: () => void;
}

export function TutorPanel({
  playground,
  getState,
  accentColor,
  proactiveQuestion,
  onDismissProactive,
}: TutorPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(
    async (userText: string) => {
      const userMessage: Message = { role: 'user', content: userText };
      const currentMessages = [...messages, userMessage];
      setMessages(currentMessages);
      setIsStreaming(true);

      try {
        const response = await fetch('/api/playground/tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playground,
            state: getState(),
            history: messages,
            userMessage: userText,
          }),
        });

        if (!response.ok || !response.body) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Error al conectar con el tutor.' },
          ]);
          setIsStreaming(false);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        let buffer = '';

        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';

          for (const event of events) {
            const lines = event.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.chunk) {
                    assistantContent += parsed.chunk;
                    setMessages((prev) => {
                      const updated = [...prev];
                      updated[updated.length - 1] = {
                        role: 'assistant',
                        content: assistantContent,
                      };
                      return updated;
                    });
                  }
                } catch {
                  // Skip malformed JSON chunks
                }
              }
            }
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Error al conectar con el tutor.' },
        ]);
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, playground, getState],
  );

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput('');
    sendMessage(trimmed);
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleRespondProactive = useCallback(() => {
    if (!proactiveQuestion || isStreaming) return;
    const text = `Sobre tu pregunta: ${proactiveQuestion}`;
    onDismissProactive();
    sendMessage(text);
  }, [proactiveQuestion, isStreaming, onDismissProactive, sendMessage]);

  const handleClear = useCallback(() => {
    if (isStreaming) return;
    setMessages([]);
  }, [isStreaming]);

  const userBgColor = accentColor + '1a';
  const isEmpty = messages.length === 0 && !proactiveQuestion;

  return (
    <div className="flex flex-col h-full">
      {/* Message area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isEmpty ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs font-mono text-[#8a8780] text-center px-6">
              Interactua con la simulacion y preguntame lo que quieras
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-3">
            {/* Proactive question banner */}
            {proactiveQuestion && (
              <div className="bg-[#f5f3ee] border border-[#e8e6e0] rounded mx-3 mt-3 p-2.5">
                <p className="text-xs font-mono text-[#3a3935] mb-2">
                  {proactiveQuestion}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRespondProactive}
                    className="text-xs font-mono font-medium"
                    style={{ color: accentColor }}
                    disabled={isStreaming}
                  >
                    Responder
                  </button>
                  <button
                    onClick={onDismissProactive}
                    className="text-xs font-mono text-[#8a8780] hover:text-[#3a3935]"
                  >
                    &times;
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded px-3 py-2 text-xs font-mono ${
                    msg.role === 'assistant' ? 'bg-[#f5f3ee] text-[#3a3935]' : 'text-[#3a3935]'
                  }`}
                  style={
                    msg.role === 'user'
                      ? { backgroundColor: userBgColor }
                      : undefined
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-[#e8e6e0] p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta sobre la simulacion..."
            disabled={isStreaming}
            className={`flex-1 bg-[#f5f3ee] border border-[#e8e6e0] rounded px-3 py-2 text-xs font-mono text-[#3a3935] placeholder-[#8a8780] outline-none ${
              isStreaming ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming}
            className={`rounded px-3 py-2 text-xs font-mono font-medium text-white ${
              isStreaming ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ backgroundColor: accentColor }}
          >
            Enviar
          </button>
          <button
            onClick={handleClear}
            disabled={isStreaming}
            className="text-[#8a8780] hover:text-[#3a3935] text-xs font-mono"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
