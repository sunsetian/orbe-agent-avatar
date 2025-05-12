import React, { useRef, useEffect, useState } from 'react';
import OrbeHDRI, { OrbeHDRIHandle } from '../OrbeElement/OrbeHDRI';
import { AnimationState } from '../../utils/types';
import { MaterialType } from '../../utils/ShapeFactory';
import { HDRIEnvironment } from '../../utils/EnvironmentManager';
import './Example.css';

const HDRIExample: React.FC = () => {
  // Create a ref to control the orbe
  const orbeRef = useRef<OrbeHDRIHandle>(null);
  
  // State for UI controls
  const [currentMaterial, setCurrentMaterial] = useState<MaterialType>(MaterialType.GLASS);
  const [currentEnvironment, setCurrentEnvironment] = useState<HDRIEnvironment>(HDRIEnvironment.NEON);
  const [useComplexShapes, setUseComplexShapes] = useState<boolean>(true);
  
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
  
  // Handle material change
  const handleMaterialChange = (material: MaterialType) => {
    if (!orbeRef.current) return;
    
    setCurrentMaterial(material);
    orbeRef.current.changeMaterialType(material);
  };
  
  // Handle environment change
  const handleEnvironmentChange = (env: HDRIEnvironment) => {
    if (!orbeRef.current) return;
    
    setCurrentEnvironment(env);
    orbeRef.current.changeEnvironment(env);
  };
  
  // Toggle shape complexity
  const toggleComplexity = () => {
    if (!orbeRef.current) return;
    
    orbeRef.current.toggleShapeComplexity();
    setUseComplexShapes(!useComplexShapes);
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
    <div className="example-container hdri-example">
      <div className="orbe-wrapper">
        <OrbeHDRI 
          ref={orbeRef} 
          initialState="idle" 
          materialType={currentMaterial}
          environmentMap={currentEnvironment}
          useComplexShapes={useComplexShapes}
        />
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
        
        <h2>Material Controls</h2>
        <div className="button-container">
          <button 
            onClick={() => handleMaterialChange(MaterialType.GLASS)}
            className={currentMaterial === MaterialType.GLASS ? 'active' : ''}
          >
            Glass Material
          </button>
          <button 
            onClick={() => handleMaterialChange(MaterialType.MIRROR)}
            className={currentMaterial === MaterialType.MIRROR ? 'active' : ''}
          >
            Mirror Material
          </button>
          <button 
            onClick={() => handleMaterialChange(MaterialType.CHROME)}
            className={currentMaterial === MaterialType.CHROME ? 'active' : ''}
          >
            Chrome Material
          </button>
          <button 
            onClick={() => handleMaterialChange(MaterialType.STANDARD)}
            className={currentMaterial === MaterialType.STANDARD ? 'active' : ''}
          >
            Standard Material
          </button>
        </div>
        
        <h2>Environment Controls</h2>
        <div className="button-container">
          <button 
            onClick={() => handleEnvironmentChange(HDRIEnvironment.STUDIO)}
            className={currentEnvironment === HDRIEnvironment.STUDIO ? 'active' : ''}
          >
            Studio Environment
          </button>
          <button 
            onClick={() => handleEnvironmentChange(HDRIEnvironment.OUTDOOR)}
            className={currentEnvironment === HDRIEnvironment.OUTDOOR ? 'active' : ''}
          >
            Outdoor Environment
          </button>
          <button 
            onClick={() => handleEnvironmentChange(HDRIEnvironment.NEON)}
            className={currentEnvironment === HDRIEnvironment.NEON ? 'active' : ''}
          >
            Neon Environment
          </button>
        </div>
        
        <h2>Shape Complexity</h2>
        <div className="button-container">
          <button onClick={toggleComplexity}>
            {useComplexShapes ? 'Use Simple Shapes' : 'Use Complex Shapes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HDRIExample;
