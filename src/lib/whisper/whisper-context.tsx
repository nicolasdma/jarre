'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useSpeechEngine } from './use-speech-engine';

// ============================================================================
// Types
// ============================================================================

type Step = 'activate' | 'learn' | 'review' | 'practice-eval' | 'apply' | 'evaluate';

interface WhisperContextValue {
  isEnabled: boolean;
  isReady: boolean;
  isPlaying: boolean;
  toggle: () => void;
  cancel: () => void;
}

const WhisperContext = createContext<WhisperContextValue>({
  isEnabled: false,
  isReady: false,
  isPlaying: false,
  toggle: () => {},
  cancel: () => {},
});

// ============================================================================
// Provider
// ============================================================================

interface WhisperProviderProps {
  activeStep: Step;
  children: ReactNode;
}

export function WhisperProvider({ activeStep, children }: WhisperProviderProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const engine = useSpeechEngine();

  // Refs for DOM-level tracking (avoid re-renders on hover)
  const blocksRef = useRef<Element[]>([]);
  const cursorIndexRef = useRef<number>(-1);
  const currentIndexRef = useRef<number>(-1);
  const spaceHeldRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ---- Auto-disable when leaving learn step ----
  useEffect(() => {
    if (activeStep !== 'learn' && isEnabled) {
      engine.cancel();
      setIsEnabled(false);
    }
  }, [activeStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Query blocks when enabled ----
  useEffect(() => {
    if (isEnabled) {
      blocksRef.current = Array.from(
        document.querySelectorAll('[data-whisper="block"]')
      );
    } else {
      blocksRef.current = [];
      cursorIndexRef.current = -1;
      currentIndexRef.current = -1;
    }
  }, [isEnabled]);

  // ---- Clear active attribute from all blocks ----
  const clearActiveAttr = useCallback(() => {
    for (const el of blocksRef.current) {
      el.removeAttribute('data-whisper-active');
    }
  }, []);

  // ---- Speak from a given block index, auto-advancing ----
  const speakFrom = useCallback(
    (index: number) => {
      if (index < 0 || index >= blocksRef.current.length) {
        engine.cancel();
        clearActiveAttr();
        currentIndexRef.current = -1;
        return;
      }

      const block = blocksRef.current[index];
      const text = block.textContent?.trim();
      if (!text) {
        speakFrom(index + 1);
        return;
      }

      clearActiveAttr();
      block.setAttribute('data-whisper-active', 'true');
      currentIndexRef.current = index;

      block.scrollIntoView({ behavior: 'smooth', block: 'center' });


      engine.speak(text, () => {
        if (spaceHeldRef.current) {
          speakFrom(index + 1);
        } else {
          clearActiveAttr();
          currentIndexRef.current = -1;
        }
      });
    },
    [engine, clearActiveAttr]
  );

  // ---- Keyboard listeners ----
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        engine.cancel();
        clearActiveAttr();
        setIsEnabled(false);
        spaceHeldRef.current = false;
        return;
      }

      if (e.key !== ' ' && e.code !== 'Space') return;

      const target = e.target as HTMLElement;
      if (['TEXTAREA', 'INPUT'].includes(target.tagName)) return;
      if (target.closest('button')) return;
      if (target.isContentEditable) return;

      e.preventDefault();

      if (spaceHeldRef.current) return;
      spaceHeldRef.current = true;

      if (engine.isPaused) {
        engine.resume();
        return;
      }


      if (cursorIndexRef.current >= 0) {
        speakFrom(cursorIndexRef.current);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.code !== 'Space') return;
      spaceHeldRef.current = false;

      if (engine.isSpeaking && !engine.isPaused) {
        engine.pause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isEnabled, engine, speakFrom, clearActiveAttr]);

  // ---- Hover: delegated mouseover on wrapper ----
  useEffect(() => {
    if (!isEnabled) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-whisper="block"]');
      if (!target) return;

      const index = blocksRef.current.indexOf(target);
      if (index === -1) return;

      if (engine.isSpeaking && currentIndexRef.current !== index) {
        cursorIndexRef.current = index;
        speakFrom(index);
        return;
      }

      cursorIndexRef.current = index;
    };

    wrapper.addEventListener('mouseover', handleMouseOver);
    return () => wrapper.removeEventListener('mouseover', handleMouseOver);
  }, [isEnabled, engine, speakFrom]);

  // ---- Auto-pause on textarea/input focus ----
  useEffect(() => {
    if (!isEnabled) return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        if (engine.isSpeaking) {
          engine.pause();
        }
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [isEnabled, engine]);

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  // ---- Toggle ----
  const toggle = useCallback(() => {

    if (isEnabled) {
      engine.cancel();
      clearActiveAttr();
      setIsEnabled(false);
    } else {
      setIsEnabled(true);
    }
  }, [isEnabled, engine, clearActiveAttr]);

  // ---- Cancel (for external use, e.g. phase transitions) ----
  const cancel = useCallback(() => {
    engine.cancel();
    clearActiveAttr();
    spaceHeldRef.current = false;
    currentIndexRef.current = -1;
  }, [engine, clearActiveAttr]);

  const contextValue: WhisperContextValue = {
    isEnabled,
    isReady: engine.isReady,
    isPlaying: engine.isSpeaking && !engine.isPaused,
    toggle,
    cancel,
  };

  return (
    <WhisperContext.Provider value={contextValue}>
      <div ref={wrapperRef} data-whisper-mode={isEnabled || undefined}>
        {children}
      </div>
    </WhisperContext.Provider>
  );
}

// ============================================================================
// Consumer hook
// ============================================================================

export function useWhisper(): WhisperContextValue {
  return useContext(WhisperContext);
}
