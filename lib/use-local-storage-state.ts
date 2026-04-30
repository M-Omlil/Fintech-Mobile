import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useLocalStorageState<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const readyRef = useRef(false);
  const skipFirstSaveRef = useRef(true);

  // 1. ASYNC READ
  useEffect(() => {
    const loadStoredValue = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(key);
        if (storedValue !== null) {
          setValue(JSON.parse(storedValue) as T);
        }
      } catch {
        // Ignore malformed storage values and keep defaults.
      } finally {
        readyRef.current = true;
        skipFirstSaveRef.current = true;
      }
    };

    loadStoredValue();
  }, [key]);

  // 2. ASYNC WRITE
  useEffect(() => {
    if (!readyRef.current) return;
    if (skipFirstSaveRef.current) {
      skipFirstSaveRef.current = false;
      return;
    }

    const saveValue = async () => {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Ignore storage access errors.
      }
    };

    saveValue();
  }, [key, value]);

  return [value, setValue];
}