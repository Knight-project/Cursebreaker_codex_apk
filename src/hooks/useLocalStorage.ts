
import { useState, useEffect } from 'react';
import type {Dispatch, SetStateAction} from 'react';

type SetValue<T> = Dispatch<SetStateAction<T>>;

// CAPACITOR_NOTE: When building for native with Capacitor,
// consider using the Capacitor Storage plugin (@capacitor/storage)
// instead of window.localStorage. It offers a more robust key-value store
// that uses native storage mechanisms (SharedPreferences on Android, UserDefaults on iOS).
// This hook would need to be refactored to use the Storage plugin's API (async get, set, remove).

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    // CAPACITOR_NOTE: window.localStorage will work in a WebView, but Capacitor Storage is preferred for native.
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // useEffect to update local storage when the state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          typeof storedValue === 'function'
            ? storedValue(storedValue)
            : storedValue;
        // Save state
        // CAPACITOR_NOTE: This is where you'd call Capacitor Storage's set() method.
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        // A more advanced implementation would handle the error case
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;

