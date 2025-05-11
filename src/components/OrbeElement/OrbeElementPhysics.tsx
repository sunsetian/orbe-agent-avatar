import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import * as RAPIER from '@dimforge/rapier3d-compat';
import './OrbeElement.css';
import { useAnimationState } from '../../hooks/useAnimationState';
import { AnimationState } from '../../utils/types';
import { MarchingCubes } from '../../utils/MarchingCubes';
import { MetaBody, createMetaBodies } from '../../utils/MetaBody';
import { MouseInteractor } from '../../utils/MouseInteractor';

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

// State-specific modulation values for metaball behavior
const STATE_MODULATIONS: Record<AnimationState, {
  bodyCount: number;
  strength: number;
  subtract: number;
  turbulence: number;
  pulseFrequency: number;
  rotationSpeed: number;
}> = {
  idle: {
    bodyCount: 15,
    strength: 0.5,
    subtract: 10,
    turbulence: 0.08,
    pulseFrequency: 0.4,
    rotationSpeed: 0.001
  },
  listening: {
    bodyCount: 18,
    strength: 0.55,
    subtract: 9,
    turbulence: 0.15,
    pulseFrequency: 1.0,
    rotationSpeed: 0.002
  },
  thinking: {
    bodyCount: 20,
    strength: 0.52,
    subtract: 9.5,
    turbulence: 0.12,
    pulseFrequency: 0.7,
    rotationSpeed: 0.0025
  },
  talking: {
    bodyCount: 22,
    strength: 0.58,
    subtract: 8.5,
    turbulence: 0.2,
    pulseFrequency: 1.5,
    rotationSpeed: 0.003
  }
};

const OrbeElementPhysics = forwardRef<OrbeElementHandle, OrbeElementProps>((props, ref) => {
  const { initialState = 'idle' } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const metaballsRef = useRef<MarchingCubes | null>(null);
  const sphereRef = useRef<THREE.Object3D | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const frameId = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  
  // Physics system references
  const physicsInitializedRef = useRef<boolean>(false);
  const worldRef = useRef<RAPIER.World | null>(null);
  const bodiesRef = useRef<MetaBody[]>([]);
  const mouseInteractorRef = useRef<MouseInteractor | null>(null);
  const mousePos = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));

  const { currentState, setAnimationState, isAnimating } = useAnimationState(initialState);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [physicsReady, setPhysicsReady] = useState<boolean>(false);

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

  // Initialize Rapier physics
  useEffect(() => {
    const initPhysics = async () => {
      try {
        // Initialize RAPIER physics engine
        await RAPIER.init();
        
        // Create physics world with zero gravity
        const gravity = { x: 0, y: 0, z: 0 };
        const world = new RAPIER.World(gravity);
        worldRef.current = world;
        
        // Mark physics as initialized
        physicsInitializedRef.current = true;
        setPhysicsReady(true);
      } catch (error) {
        console.error("Failed to initialize physics:", error);
      }
    };
    
    initPhysics();
    
    return () => {
      // Clean up physics
      if (worldRef.current) {
        // No explicit cleanup needed for Rapier world
        worldRef.current = null;
        physicsInitializedRef.current = false;
      }
    };
  }, []);

  // Initialize Three.js scene and setup rendering
  useEffect(() => {
    if (!containerRef.current || !physicsReady) return;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75, // Match the reference implementation's 75 degree FOV
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5; // Match the reference implementation's camera position
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

    // Create MarchingCubes instance with higher resolution like the reference
    const resolution = 96; // Match reference's resolution of 96
    
    // Create material with metaball-like appearance
    const textureLoader = new THREE.TextureLoader();
    const matcap = textureLoader.load("/assets/black-n-shiney.jpg"); // Try to load matcap texture
    
    const material = new THREE.MeshStandardMaterial({
      color: STATE_COLORS[currentState],
      metalness: 0.8,
      roughness: 0.2,
      emissive: STATE_EMISSIVE_COLORS[currentState],
      emissiveIntensity: 0.5,
      vertexColors: true
    });
    
    materialRef.current = material;
    
    const metaballs = new MarchingCubes(
      resolution,
      material,
      true, // Enable UVs
      true, // Enable colors
      90000 // Max poly count like reference
    );
    
    metaballs.position.set(0, 0, 0);
    metaballs.scale.setScalar(5); // Scale exactly like reference implementation
    metaballs.isolation = 1000; // Same isolation value as reference
    metaballsRef.current = metaballs;
    scene.add(metaballs);
    
    // Add reference for animations
    sphereRef.current = metaballs;
    
    // Setup initial meta bodies
    initializeMetaBodies(currentState);
    
    // Setup mouse interactor for physics
    if (worldRef.current) {
      const mouseInteractor = new MouseInteractor({
        world: worldRef.current,
        scene: scene,
        addToScene: false // No visual representation needed
      });
      mouseInteractorRef.current = mouseInteractor;
    }
    
    // Set up mouse interaction
    const handleMouseMove = (event: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        // Convert mouse coordinates to normalized device coordinates
        const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        mousePos.current.set(mouseX, mouseY);
        
        // Update mouse interactor if it exists
        if (mouseInteractorRef.current) {
          mouseInteractorRef.current.setMousePosition(mouseX, mouseY);
        }
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Animation loop
    const animate = () => {
      timeRef.current += 0.01;
      
      // Step the physics world
      if (worldRef.current && isAnimating) {
        worldRef.current.step();
        
        // Update mouse interaction
        if (mouseInteractorRef.current) {
          mouseInteractorRef.current.update(
            mousePos.current.x * 4, // Scale like in reference
            mousePos.current.y * 4,
            0
          );
        }
        
        // Update the metaballs based on the current physics state
        updateMetaballs();
      }
      
      // Render the scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      frameId.current = requestAnimationFrame(animate);
    };
    
    animate();
    setIsVisible(true);
    
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
  }, [physicsReady]);

  // Initialize meta bodies based on current state
  const initializeMetaBodies = (state: AnimationState) => {
    if (!worldRef.current) return;
    
    // Clear existing bodies if any
    bodiesRef.current.forEach(body => {
      if (body.mesh && sceneRef.current) {
        sceneRef.current.remove(body.mesh);
      }
    });
    bodiesRef.current = [];
    
    // Create new bodies based on current state
    const modulation = STATE_MODULATIONS[state];
    const bodies = createMetaBodies(modulation.bodyCount, worldRef.current, false);
    
    // Add debug meshes to scene if they exist
    bodies.forEach(body => {
      if (body.mesh && sceneRef.current) {
        sceneRef.current.add(body.mesh);
      }
    });
    
    bodiesRef.current = bodies;
  };

  // Update metaballs based on physics bodies - exactly as in the reference
  const updateMetaballs = () => {
    if (!metaballsRef.current) return;
    
    const metaballs = metaballsRef.current;
    metaballs.reset();
    
    const modulation = STATE_MODULATIONS[currentState];
    const strength = modulation.strength;
    const subtract = modulation.subtract;
    
    // Update metaballs from physics bodies
    bodiesRef.current.forEach((body) => {
      const pos = body.update();        // Add the ball to the marching cubes - similar to reference implementation
        metaballs.addBall(
          pos.x, 
          pos.y, 
          pos.z, 
          strength, // Size
          subtract, // Surface threshold
          body.color // Use the color from the body as in reference
        );
    });
    
    // Update the metaballs geometry
    metaballs.update();
  };

  // Handle animation state changes
  useEffect(() => {
    if (!materialRef.current || !metaballsRef.current) return;
    
    // Adjust body count and physics behavior when state changes
    if (worldRef.current) {
      initializeMetaBodies(currentState);
    }
    
  }, [currentState]);

  // Handle visibility transitions
  useEffect(() => {
    if (!sphereRef.current) return;
    
    const sphere = sphereRef.current;
    
    if (isVisible) {
      // Show the orbe
      sphere.visible = true;
      
      // Scale up animation
      gsap.fromTo(
        sphere.scale, 
        { x: 0, y: 0, z: 0 }, 
        { 
          x: 5, 
          y: 5, 
          z: 5, 
          duration: 1.0, 
          ease: "elastic.out(1.2, 0.5)",
        }
      );
    } else {
      // Hide the orbe
      gsap.to(
        sphere.scale, 
        { 
          x: 0, 
          y: 0, 
          z: 0, 
          duration: 0.6, 
          ease: "back.in(1.5)",
          onComplete: () => {
            sphere.visible = false;
          }
        }
      );
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
