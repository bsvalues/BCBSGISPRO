import { useState, useCallback } from 'react';

/**
 * A simple hook for managing a boolean toggle state
 * 
 * @param initialValue - Initial toggle state (default: false)
 * @returns [state, toggleFunction, setState]
 */
export function useToggle(initialValue = false): [boolean, () => void, React.Dispatch<React.SetStateAction<boolean>>] {
  const [state, setState] = useState<boolean>(initialValue);
  
  const toggle = useCallback(() => {
    setState(prevState => !prevState);
  }, []);
  
  return [state, toggle, setState];
}