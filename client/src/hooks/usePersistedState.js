import { useEffect, useState } from 'react';

function usePersistedState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const storedValue = window.localStorage.getItem(key);

      return storedValue ? JSON.parse(storedValue) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignore storage failures in private/incognito sessions.
    }
  }, [key, state]);

  return [state, setState];
}

export default usePersistedState;
