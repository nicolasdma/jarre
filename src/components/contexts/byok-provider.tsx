'use client';

/**
 * Jarre - BYOK Context Provider
 *
 * Loads encrypted API keys from localStorage on mount (managed mode only).
 * In self-hosted mode, this is a passthrough that renders children directly.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { IS_MANAGED } from '@/lib/config';
import { loadKeys, storeKeys, clearKeys, hasStoredKeys, type ByokKeys } from '@/lib/byok/key-store';

interface ByokContextValue {
  keys: ByokKeys;
  hasKeys: boolean;
  loading: boolean;
  saveKeys: (keys: ByokKeys) => Promise<void>;
  removeKeys: () => void;
}

const ByokContext = createContext<ByokContextValue>({
  keys: {},
  hasKeys: false,
  loading: false,
  saveKeys: async () => {},
  removeKeys: () => {},
});

export function useByok() {
  return useContext(ByokContext);
}

export function ByokProvider({
  children,
  userId,
  sessionToken,
}: {
  children: React.ReactNode;
  userId?: string;
  sessionToken?: string;
}) {
  const [keys, setKeys] = useState<ByokKeys>({});
  const [loading, setLoading] = useState(IS_MANAGED);

  useEffect(() => {
    if (!IS_MANAGED || !userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: skip loading when not managed
      setLoading(false);
      return;
    }

    loadKeys(userId, sessionToken).then((loaded) => {
      if (loaded) setKeys(loaded);
      setLoading(false);
    });
  }, [userId, sessionToken]);

  const saveKeysHandler = useCallback(async (newKeys: ByokKeys) => {
    if (!userId) return;
    await storeKeys(newKeys, userId);
    setKeys(newKeys);
  }, [userId]);

  const removeKeysHandler = useCallback(() => {
    clearKeys();
    setKeys({});
  }, []);

  return (
    <ByokContext.Provider
      value={{
        keys,
        hasKeys: hasStoredKeys(),
        loading,
        saveKeys: saveKeysHandler,
        removeKeys: removeKeysHandler,
      }}
    >
      {children}
    </ByokContext.Provider>
  );
}
