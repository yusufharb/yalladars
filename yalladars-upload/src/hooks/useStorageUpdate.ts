import { useState, useEffect } from 'react';
import { storage } from '../services/storage';

/**
 * Custom hook that subscribes to storage changes and triggers a re-render
 * whenever storage updates (e.g. from syncEngine or local storage operations).
 */
export function useStorageUpdate(): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  return tick;
}
