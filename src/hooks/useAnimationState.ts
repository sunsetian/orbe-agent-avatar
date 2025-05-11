import { useState, useCallback, useEffect } from 'react';
import { AnimationState } from '../utils/types';

interface AnimationStateHook {
  currentState: AnimationState;
  previousState: AnimationState | null;
  setAnimationState: (state: AnimationState) => void;
  isAnimating: boolean;
}

export const useAnimationState = (initialState: AnimationState = 'idle'): AnimationStateHook => {
  const [currentState, setCurrentState] = useState<AnimationState>(initialState);
  const [previousState, setPreviousState] = useState<AnimationState | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  
  // Set the animation state
  const setAnimationState = useCallback((state: AnimationState) => {
    if (state !== currentState) {
      setPreviousState(currentState);
      setCurrentState(state);
      setIsTransitioning(true);
    }
  }, [currentState]);

  // Handle animation timing and transitions
  useEffect(() => {
    if (isTransitioning) {
      // Start with transition animation
      setIsAnimating(true);
      
      // After transition is complete, continue with regular animation
      const transitionTimer = setTimeout(() => {
        setIsTransitioning(false);
      }, 500); // Transition takes 500ms
      
      return () => clearTimeout(transitionTimer);
    }
  }, [isTransitioning]);
  
  return {
    currentState,
    previousState,
    setAnimationState,
    isAnimating
  };

  return {
    currentState,
    previousState,
    setAnimationState,
    isAnimating
  };
};
