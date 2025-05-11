import React, { useRef, useEffect } from 'react';
import OrbeElement, { OrbeElementHandle } from '../OrbeElement/OrbeElement';
import { AnimationState } from '../../utils/types';
import './Example.css';

const Example: React.FC = () => {
  // Create a ref to control the orbe
  const orbeRef = useRef<OrbeElementHandle>(null);
  
  // Example of controlling the orbe with voice commands
  const simulateVoiceCommand = (command: string) => {
    if (!orbeRef.current) return;
    
    switch(command) {
      case 'listen':
        orbeRef.current.changeState('listening');
        break;
      case 'think':
        orbeRef.current.changeState('thinking');
        break;
      case 'speak':
        orbeRef.current.changeState('talking');
        break;
      case 'idle':
        orbeRef.current.changeState('idle');
        break;
      case 'toggle':
        orbeRef.current.toggleVisibility();
        break;
    }
  };
  
  // Auto-demonstration
  useEffect(() => {
    const demoSequence = async () => {
      // Wait for component to be fully mounted
      await new Promise(r => setTimeout(r, 1000));
      
      if (!orbeRef.current) return;
      
      // Start in idle state
      orbeRef.current.changeState('idle');
      await new Promise(r => setTimeout(r, 2000));
      
      // Demo listening state
      orbeRef.current.changeState('listening');
      await new Promise(r => setTimeout(r, 3000));
      
      // Demo thinking state
      orbeRef.current.changeState('thinking');
      await new Promise(r => setTimeout(r, 3000));
      
      // Demo talking state
      orbeRef.current.changeState('talking');
      await new Promise(r => setTimeout(r, 3000));
      
      // Back to idle
      orbeRef.current.changeState('idle');
    };
    
    demoSequence();
  }, []);
  
  return (
    <div className="example-container">
      <div className="orbe-wrapper">
        <OrbeElement ref={orbeRef} initialState="idle" />
      </div>
      
      <div className="example-controls">
        <h2>Voice Commands Demo</h2>
        <div className="button-container">
          <button onClick={() => simulateVoiceCommand('listen')}>
            Simulate "Listen" Command
          </button>
          <button onClick={() => simulateVoiceCommand('think')}>
            Simulate "Think" Command
          </button>
          <button onClick={() => simulateVoiceCommand('speak')}>
            Simulate "Speak" Command
          </button>
          <button onClick={() => simulateVoiceCommand('idle')}>
            Simulate "Idle" Command
          </button>
          <button onClick={() => simulateVoiceCommand('toggle')}>
            Toggle Visibility
          </button>
        </div>
      </div>
    </div>
  );
};

export default Example;
