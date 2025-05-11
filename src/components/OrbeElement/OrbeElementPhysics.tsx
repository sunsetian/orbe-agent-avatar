import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import './OrbeElement.css';
import { useAnimationState } from '../../hooks/useAnimationState';
import { AnimationState } from '../../utils/types';

interface OrbeElementProps {
  initialState?: AnimationState;
}

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

const OrbeElementPhysics = forwardRef<OrbeElementHandle, OrbeElementProps>((props, ref) => {
  const { initialState = 'idle' } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const frameId = useRef<number | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const timeRef = useRef<number>(0);
  const mousePos = useRef<THREE.Vector2>(new THREE.Vector2());
  
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

  // Initialize Three.js scene and setup rendering
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera with adjusted position for better centering
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Create renderer with standard settings
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create material with metaball-like appearance using MeshStandardMaterial
    const material = new THREE.MeshStandardMaterial({
      color: STATE_COLORS[currentState],
      metalness: 0.5,
      roughness: 0.2,
      emissive: STATE_EMISSIVE_COLORS[currentState],
      emissiveIntensity: 0.5
    });
    materialRef.current = material;
    
    // Create a simple cube with slightly rounded edges
    const geometry = new THREE.BoxGeometry(1, 1, 1, 4, 4, 4);
    
    // Create the mesh with the geometry and material
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cubeRef.current = cube;
    
    // Add ambient light for overall illumination
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
    
    // Set up mouse interaction
    const handleMouseMove = (event: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        mousePos.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mousePos.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Animation loop
    const animate = () => {
      timeRef.current += 0.01;
      
      if (cubeRef.current && isAnimating) {
        const rotationSpeeds = STATE_ROTATION_SPEEDS[currentState];
        
        // Apply rotation based on current state
        cubeRef.current.rotation.x += rotationSpeeds.x;
        cubeRef.current.rotation.y += rotationSpeeds.y;
        
        // Add subtle mouse influence to rotation
        if (Math.abs(mousePos.current.x) > 0.1 || Math.abs(mousePos.current.y) > 0.1) {
          cubeRef.current.rotation.x += mousePos.current.y * 0.001;
          cubeRef.current.rotation.y += mousePos.current.x * 0.001;
        }
        
        // Add subtle pulse to emissive intensity
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
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
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
    
    try {
      // Get color for the current state
      const stateColor = STATE_COLORS[currentState];
      const stateEmissiveColor = STATE_EMISSIVE_COLORS[currentState];
      
      // Create Three.js color objects
      const newColor = new THREE.Color(stateColor);
      const newEmissive = new THREE.Color(stateEmissiveColor);
      
      // Update point light colors based on state
      if (blueLightRef.current && greenLightRef.current && purpleLightRef.current) {
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
          ease: "power2.out"
        });
      }
    } catch (error) {
      console.error("Error handling state change:", error);
    }
  }, [currentState]);

  // Handle visibility transitions
  useEffect(() => {
    if (!cubeRef.current) return;
    
    const cube = cubeRef.current;
    
    try {
      if (isVisible) {
        // Show the orbe
        cube.visible = true;
        
        // Scale up animation
        gsap.fromTo(
          cube.scale, 
          { x: 0, y: 0, z: 0 }, 
          { 
            x: 1, 
            y: 1, 
            z: 1, 
            duration: 0.8,
            ease: "elastic.out(1.2, 0.5)"
          }
        );
      } else {
        // Hide the orbe
        gsap.to(
          cube.scale, 
          { 
            x: 0, 
            y: 0, 
            z: 0, 
            duration: 0.5,
            ease: "back.in(1.2)",
            onComplete: () => {
              cube.visible = false;
            }
          }
        );
      }
    } catch (error) {
      console.error("Error handling visibility change:", error);
    }
  }, [isVisible]);

  return (
    <div className="orbe-container" data-testid="orbe-container">
      <div ref={containerRef} className="orbe-renderer"></div>
      <div className="orbe-controls">
        <button onClick={() => setAnimationState('idle')}>Idle</button>
        <button onClick={() => setAnimationState('listening')}>Listening</button>
        <button onClick={() => setAnimationState('thinking')}>Thinking</button>
        <button onClick={() => setAnimationState('talking')}>Talking</button>
        <button onClick={() => setIsVisible(!isVisible)}>{isVisible ? 'Turn Off' : 'Turn On'}</button>
      </div>
    </div>
  );
});

export default OrbeElementPhysics;
