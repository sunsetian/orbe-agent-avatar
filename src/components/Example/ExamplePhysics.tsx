import React, { useRef, useEffect } from 'react';
import OrbeElementPhysics, { OrbeElementHandle } from '../OrbeElement/OrbeElementPhysics';
import { AnimationState } from '../../utils/types';
import './Example.css';

const ExamplePhysics: React.FC = () => {
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

  // Automatic demonstration
  useEffect(() => {
    // Set up a sequence of state changes for demonstration
    const demoSequence = async () => {
      if (!orbeRef.current) return;
      
      // Wait for initial load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Listening state
      simulateVoiceCommand('listen');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Thinking state after receiving input
      simulateVoiceCommand('think');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Talking state to respond
      simulateVoiceCommand('speak');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Back to idle
      simulateVoiceCommand('idle');
    };
    
    // Run the demo sequence
    demoSequence();
    
    // Optionally, set up a repeating demo
    const interval = setInterval(() => {
      demoSequence();
    }, 15000); // Run the sequence every 15 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="example-container">
      <div className="orbe-wrapper">
        <OrbeElementPhysics ref={orbeRef} initialState="idle" />
      </div>
      <div className="controls">
        <h2>Voice Command Simulation</h2>
        <div className="button-group">
          <button onClick={() => simulateVoiceCommand('listen')}>
            "Hey AI, listen to me"
          </button>
          <button onClick={() => simulateVoiceCommand('think')}>
            "Let me think about that"
          </button>
          <button onClick={() => simulateVoiceCommand('speak')}>
            "Here's what I found"
          </button>
          <button onClick={() => simulateVoiceCommand('idle')}>
            "Go to sleep"
          </button>
          <button onClick={() => simulateVoiceCommand('toggle')}>
            "Toggle visibility"
          </button>
        </div>
        <div className="explanation">
          <h3>States</h3>
          <ul>
            <li><strong>Idle:</strong> Default resting state</li>
            <li><strong>Listening:</strong> Actively listening to user input</li>
            <li><strong>Thinking:</strong> Processing information</li>
            <li><strong>Talking:</strong> Responding to the user</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExamplePhysics;
