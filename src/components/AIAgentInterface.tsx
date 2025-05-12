import React, { useRef, useState, useEffect } from 'react';
// Import our fixed version instead of the original
import OrbeHDRI, { OrbeHDRIHandle } from './OrbeElement/OrbeHDRIFixed';
import { AnimationState } from '../utils/types';
import { MaterialType } from '../utils/ShapeFactory';
import { HDRIEnvironment } from '../utils/EnvironmentManager';
import './AIAgentInterface.css';

const AIAgentInterface: React.FC = () => {
  // Create a ref to control the orbe
  const orbeRef = useRef<OrbeHDRIHandle>(null);
  const [currentState, setCurrentState] = useState<AnimationState>('idle');
  const [isVisible, setIsVisible] = useState<boolean>(true);
  
  // Set default material and environment
  const materialType = MaterialType.MIRROR;
  const environmentMap = HDRIEnvironment.NEON;

  // Change orbe state
  const changeState = (state: AnimationState) => {
    if (!orbeRef.current) return;
    
    orbeRef.current.changeState(state);
    setCurrentState(state);
  };
  
  // Toggle visibility
  const toggleVisibility = () => {
    if (!orbeRef.current) return;
    
    orbeRef.current.toggleVisibility();
    setIsVisible(prev => !prev);
  };
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Force re-render on window resize
      setCurrentState(prev => prev);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Initialize visibility state
  useEffect(() => {
    // After component mount, sync visibility state with orbe
    if (orbeRef.current) {
      setIsVisible(orbeRef.current.isVisible());
    }
  }, []);

  return (
    <div className="agent-interface">
      <div className="orbe-fullscreen">
        <OrbeHDRI 
          ref={orbeRef} 
          initialState="idle" 
          materialType={materialType}
          environmentMap={environmentMap}
          useComplexShapes={true}
        />
      </div>
      
      {/* Minimalist title in top left */}
      <div className="title-container">
        <h1>AI Agent</h1>
      </div>
      
      <div className="control-panel">
        <button 
          className={currentState === 'idle' ? 'active' : ''} 
          onClick={() => changeState('idle')}
        >
          Idle
        </button>
        <button 
          className={currentState === 'listening' ? 'active' : ''} 
          onClick={() => changeState('listening')}
        >
          Listening
        </button>
        <button 
          className={currentState === 'thinking' ? 'active' : ''} 
          onClick={() => changeState('thinking')}
        >
          Thinking
        </button>
        <button 
          className={currentState === 'talking' ? 'active' : ''} 
          onClick={() => changeState('talking')}
        >
          Talking
        </button>
        <button 
          className={`toggle-button ${isVisible ? 'on' : 'off'}`}
          onClick={toggleVisibility}
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
};

export default AIAgentInterface;
