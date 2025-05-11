import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import './OrbeElement.css';
import { useAnimationState } from '../../hooks/useAnimationState';
import { AnimationState } from '../../utils/types';

interface OrbeElementProps {
  initialState?: AnimationState;
}

// Define the ref API
export interface OrbeElementHandle {
  changeState: (state: AnimationState) => void;
  toggleVisibility: () => void;
  getState: () => AnimationState;
  isVisible: () => boolean;
}

// Color maps for different states
const STATE_COLORS: Record<AnimationState, number> = {
  idle: 0x4a9ff5,
  listening: 0x4af5a2,
  thinking: 0xf5da4a,
  talking: 0xf54a4a
};

const STATE_EMISSIVE_COLORS: Record<AnimationState, number> = {
  idle: 0x1a4a8c,
  listening: 0x1a8c4a,
  thinking: 0x8c7a1a,
  talking: 0x8c1a1a
};

// Simple rotation speeds for different states
const STATE_ROTATION_SPEEDS: Record<AnimationState, {
  x: number;
  y: number;
  pulseFrequency: number;
}> = {
  idle: {
    x: 0.005,
    y: 0.01,
    pulseFrequency: 0.4
  },
  listening: {
    x: 0.01,
    y: 0.015,
    pulseFrequency: 1.0
  },
  thinking: {
    x: 0.008,
    y: 0.02,
    pulseFrequency: 0.7
  },
  talking: {
    x: 0.012,
    y: 0.025,
    pulseFrequency: 1.5
  }
};

const OrbeElement = forwardRef<OrbeElementHandle, OrbeElementProps>((props, ref) => {
  const { initialState = 'idle' } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const frameId = useRef<number | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const timeRef = useRef<number>(0);
  
  // Colored lights references
  const blueLightRef = useRef<THREE.PointLight | null>(null);
  const greenLightRef = useRef<THREE.PointLight | null>(null);
  const purpleLightRef = useRef<THREE.PointLight | null>(null);

  const { currentState, setAnimationState, isAnimating } = useAnimationState(initialState);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    changeState: (state: AnimationState) => {
      setAnimationState(state);
    },
    toggleVisibility: () => {
      setIsVisible(prev => !prev);
    },
    getState: () => {
      return currentState;
    },
    isVisible: () => {
      return isVisible;
    }
  }));

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera with adjusted position for better centering
    const camera = new THREE.PerspectiveCamera(
      45, // Field of view
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.z = 5; // Move camera back for better view
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create material with proper appearance
    const material = new THREE.MeshStandardMaterial({
      color: STATE_COLORS[currentState],
      metalness: 0.5,
      roughness: 0.2,
      emissive: STATE_EMISSIVE_COLORS[currentState],
      emissiveIntensity: 0.5
    });
    materialRef.current = material;
    
    // Create a simple cube for testing
    // Note: We'll use a BoxGeometry with rounded edges for more aesthetically pleasing look
    const geometry = new THREE.BoxGeometry(1, 1, 1, 4, 4, 4);
    
    // Create the mesh with the geometry and material
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cubeRef.current = cube;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light for shadows and highlights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // Add colored point lights for more dynamic appearance
    const blueLight = new THREE.PointLight(0x4a9ff5, 1, 10);
    blueLight.position.set(-2, 1, 3);
    scene.add(blueLight);
    blueLightRef.current = blueLight;
    
    const greenLight = new THREE.PointLight(0x4af5a2, 1, 10);
    greenLight.position.set(2, -1, 3);
    scene.add(greenLight);
    greenLightRef.current = greenLight;
    
    const purpleLight = new THREE.PointLight(0x8c1a8c, 1, 10);
    purpleLight.position.set(0, 2, 3);
    scene.add(purpleLight);
    purpleLightRef.current = purpleLight;
    
    // Start animation
    const animate = () => {
      timeRef.current += 0.01;
      
      if (cubeRef.current && isAnimating) {
        const rotationSpeeds = STATE_ROTATION_SPEEDS[currentState];
        
        // Apply rotation based on the current state
        cubeRef.current.rotation.x += rotationSpeeds.x;
        cubeRef.current.rotation.y += rotationSpeeds.y;
        
        // Add subtle pulse to emissive intensity for alive feeling
        if (materialRef.current) {
          const pulseValue = Math.sin(timeRef.current * rotationSpeeds.pulseFrequency) * 0.2 + 0.5;
          materialRef.current.emissiveIntensity = pulseValue;
        }
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      frameId.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (containerRef.current && cameraRef.current && rendererRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Show the cube by default
    setIsVisible(true);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameId.current !== null) {
        cancelAnimationFrame(frameId.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // Handle animation state changes
  useEffect(() => {
    if (!materialRef.current || !cubeRef.current) return;
    
    // Get color for the current state
    const stateColor = STATE_COLORS[currentState];
    const stateEmissiveColor = STATE_EMISSIVE_COLORS[currentState];
    
    // Create Three.js color objects
    const newColor = new THREE.Color(stateColor);
    const newEmissive = new THREE.Color(stateEmissiveColor);
    
    // Update point light colors based on state
    if (blueLightRef.current && greenLightRef.current && purpleLightRef.current) {
      // Set one of the lights to match the current state color
      switch(currentState) {
        case 'idle':
          blueLightRef.current.color.set(stateColor);
          break;
        case 'listening':
          greenLightRef.current.color.set(stateColor);
          break;
        case 'thinking':
          purpleLightRef.current.color.set(stateColor);
          break;
        case 'talking':
          // Set all lights to this color for more dramatic effect
          blueLightRef.current.color.set(stateColor);
          greenLightRef.current.color.set(stateEmissiveColor);
          purpleLightRef.current.color.set(stateColor);
          break;
      }
    }
    
    // Animate color change
    gsap.to(materialRef.current.color, {
      r: newColor.r,
      g: newColor.g,
      b: newColor.b,
      duration: 0.5
    });
    
    gsap.to(materialRef.current.emissive, {
      r: newEmissive.r,
      g: newEmissive.g,
      b: newEmissive.b,
      duration: 0.5
    });
    
    // Add a brief animation jolt when state changes
    if (cubeRef.current) {
      // Save original rotation
      const origRotation = {
        x: cubeRef.current.rotation.x,
        y: cubeRef.current.rotation.y,
        z: cubeRef.current.rotation.z
      };
      
      // Quick rotation jolt
      gsap.to(cubeRef.current.rotation, {
        x: origRotation.x + Math.PI * 0.1,
        y: origRotation.y + Math.PI * 0.1,
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
          // Return to normal rotation pattern
        }
      });
    }
  }, [currentState]);

  // Handle visibility transitions (turn on/off)
  useEffect(() => {
    if (!cubeRef.current) return;
    
    const cube = cubeRef.current;
    
    if (isVisible) {
      // Make object visible first
      cube.visible = true;
      
      // Scale up animation (turn on)
      gsap.fromTo(
        cube.scale, 
        { x: 0, y: 0, z: 0 }, 
        { 
          x: 1, 
          y: 1,
          z: 1,
          duration: 1.0, 
          ease: "elastic.out(1.2, 0.5)" // More fluid, organic animation
        }
      );
      
    } else {
      // Scale down animation (turn off)
      gsap.to(
        cube.scale, 
        { 
          x: 0, 
          y: 0, 
          z: 0, 
          duration: 0.6, 
          ease: "back.in(1.5)",
          onComplete: () => {
            // Hide the object once scaled to zero
            cube.visible = false;
          }
        }
      );
    }
  }, [isVisible]);

  // Public method to toggle visibility
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // Public methods to control the state
  const changeState = (newState: AnimationState) => {
    setAnimationState(newState);
  };

  return (
    <div className="orbe-container" data-testid="orbe-container">
      <div ref={containerRef} className="orbe-renderer"></div>
      <div className="orbe-controls">
        <button onClick={() => changeState('idle')}>Idle</button>
        <button onClick={() => changeState('listening')}>Listening</button>
        <button onClick={() => changeState('thinking')}>Thinking</button>
        <button onClick={() => changeState('talking')}>Talking</button>
        <button onClick={toggleVisibility}>{isVisible ? 'Turn Off' : 'Turn On'}</button>
      </div>
    </div>
  );
});

export default OrbeElement;
