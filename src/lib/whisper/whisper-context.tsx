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
// Constants
// ============================================================================

const STORAGE_KEY = 'jarre-whisper-enabled';

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

  // Refs for DOM-level tracking (avoid re-renders on hover/key)
  const blocksRef = useRef<Element[]>([]);
  const cursorIndexRef = useRef<number>(-1);
  const currentIndexRef = useRef<number>(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const speakIdRef = useRef(0);

  // ---- P8: Restore preference from localStorage on mount ----
  useEffect(() => {
    if (activeStep === 'learn' && localStorage.getItem(STORAGE_KEY) === 'true') {
      setIsEnabled(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Auto-disable when leaving learn step ----
  useEffect(() => {
    if (activeStep !== 'learn' && isEnabled) {
      engine.cancel();
      setIsEnabled(false);
    }
  }, [activeStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- P1: Query blocks when enabled + MutationObserver for DOM changes ----
  useEffect(() => {
    if (!isEnabled) {
      blocksRef.current = [];
      cursorIndexRef.current = -1;
      currentIndexRef.current = -1;
      return;
    }

    const queryBlocks = () => {
      blocksRef.current = Array.from(
        document.querySelectorAll('[data-whisper="block"]')
      );
    };

    queryBlocks();

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Re-query when DOM changes (section transitions, quiz expand/collapse).
    // Debounced to avoid excessive re-queries during React batch updates.
    let debounceTimer: ReturnType<typeof setTimeout>;
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(queryBlocks, 100);
    });
    observer.observe(wrapper, { childList: true, subtree: true });

    return () => {
      clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, [isEnabled]);

  // ---- Clear active attribute from all blocks ----
  const clearActiveAttr = useCallback(() => {
    for (const el of blocksRef.current) {
      el.removeAttribute('data-whisper-active');
    }
  }, []);

  // ---- P2+F3: Speak from a given block index ----
  // Iterative empty-block skip (P2) + speakId guard against stale callbacks (F3)
  const speakFrom = useCallback(
    (index: number) => {
      const id = ++speakIdRef.current;

      // P2: Skip empty blocks iteratively instead of recursing
      let targetIndex = index;
      while (targetIndex < blocksRef.current.length) {
        const text = blocksRef.current[targetIndex].textContent?.trim();
        if (text) break;
        targetIndex++;
      }

      if (targetIndex >= blocksRef.current.length) {
        engine.cancel();
        clearActiveAttr();
        currentIndexRef.current = -1;
        return;
      }

      const block = blocksRef.current[targetIndex];
      // Strip parenthesized content — typically English terms, citations, or
      // asides that break the reading flow when spoken aloud.
      const text = block.textContent!.trim().replace(/\s*\([^)]*\)/g, '');

      clearActiveAttr();
      block.setAttribute('data-whisper-active', 'true');
      currentIndexRef.current = targetIndex;
      block.scrollIntoView({ behavior: 'smooth', block: 'center' });

      engine.speak(text, () => {
        // F3: If a newer speakFrom was called, this callback is stale — ignore
        if (id !== speakIdRef.current) return;

        // Auto-advance to next block continuously until content ends
        speakFrom(targetIndex + 1);
      });
    },
    [engine, clearActiveAttr]
  );

  // ---- Keyboard: Space toggles play/stop, Escape disables ----
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        engine.cancel();
        clearActiveAttr();
        currentIndexRef.current = -1;
        setIsEnabled(false);
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      if (e.key !== ' ' && e.code !== 'Space') return;

      const target = e.target as HTMLElement;
      if (['TEXTAREA', 'INPUT'].includes(target.tagName)) return;
      if (target.closest('button')) return;
      if (target.isContentEditable) return;

      e.preventDefault();

      // Paused → resume from where we left off
      if (engine.isPaused) {
        engine.resume();
        return;
      }

      // Speaking → pause (keep position for resume)
      if (engine.isSpeaking) {
        engine.pause();
        return;
      }

      // Not speaking — start from saved position or cursor
      const startIndex = currentIndexRef.current >= 0
        ? currentIndexRef.current
        : cursorIndexRef.current;
      if (startIndex >= 0) {
        speakFrom(startIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, engine, speakFrom, clearActiveAttr]);

  // ---- P5: Hover updates cursor only; click jumps during speech ----
  useEffect(() => {
    if (!isEnabled) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const findBlockIndex = (e: Event): number => {
      const target = (e.target as HTMLElement).closest('[data-whisper="block"]');
      if (!target) return -1;
      return blocksRef.current.indexOf(target);
    };

    // Hover: only update cursor position, never interrupt speech
    const handleMouseOver = (e: MouseEvent) => {
      const index = findBlockIndex(e);
      if (index !== -1) cursorIndexRef.current = index;
    };

    // Click: jump to block if currently speaking a different block
    const handleClick = (e: MouseEvent) => {
      const index = findBlockIndex(e);
      if (index === -1) return;

      if (engine.isSpeaking && currentIndexRef.current !== index) {
        speakFrom(index);
      }
    };

    wrapper.addEventListener('mouseover', handleMouseOver);
    wrapper.addEventListener('click', handleClick);
    return () => {
      wrapper.removeEventListener('mouseover', handleMouseOver);
      wrapper.removeEventListener('click', handleClick);
    };
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

  // ---- Toggle with localStorage persistence (P8) ----
  const toggle = useCallback(() => {
    if (isEnabled) {
      engine.cancel();
      clearActiveAttr();
      setIsEnabled(false);
      localStorage.removeItem(STORAGE_KEY);
    } else {
      setIsEnabled(true);
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }, [isEnabled, engine, clearActiveAttr]);

  // ---- Cancel (for external use, e.g. phase transitions) ----
  const cancel = useCallback(() => {
    engine.cancel();
    clearActiveAttr();
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
