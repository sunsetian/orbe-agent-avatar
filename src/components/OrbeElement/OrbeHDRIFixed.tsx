import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import './OrbeElement.css';
import { useAnimationState } from '../../hooks/useAnimationState';
import { AnimationState } from '../../utils/types';
import { 
  STATE_COLORS, 
  STATE_EMISSIVE_COLORS, 
  STATE_ROTATION_SPEEDS,
  STATE_SHAPES,
  createShapes,
  createOrbeMaterial,
  updateShapeAnimations,
  MaterialType
} from '../../utils/ShapeFactory';
import { updateComplexShapeAnimations } from '../../utils/ComplexShapes';
import {
  setupEnvironment,
  HDRIEnvironment,
  createGlassMaterial,
  createMirrorMaterial,
  createChromeMaterial
} from '../../utils/EnvironmentManager';

/**
 * SimplexNoise-like functions for pseudo-perlin noise
 * This is a simplified version that gives us a noise-like pattern
 */
const noise2D = (x: number, y: number, seed: number = 42): number => {
  // Create a simple but unpredictable hash from the inputs
  const dot = x * 12.9898 + y * 78.233 + seed;
  const sin = Math.sin(dot) * 43758.5453123;
  return sin - Math.floor(sin);
}

const noise3D = (x: number, y: number, z: number, seed: number = 42): number => {
  // Create a simple but unpredictable hash from the inputs
  const dot = x * 12.9898 + y * 78.233 + z * 37.719 + seed;
  const sin = Math.sin(dot) * 43758.5453123;
  return sin - Math.floor(sin);
}

interface OrbeHDRIProps {
  initialState?: AnimationState;
  useComplexShapes?: boolean;
  materialType?: MaterialType;
  environmentMap?: HDRIEnvironment;
}

// Define the ref API
export interface OrbeHDRIHandle {
  changeState: (state: AnimationState) => void;
  toggleVisibility: () => void;
  getState: () => AnimationState;
  isVisible: () => boolean;
  toggleShapeComplexity: () => void;
  changeMaterialType: (type: MaterialType) => void;
  changeEnvironment: (env: HDRIEnvironment) => void;
}

const OrbeHDRIFixed = forwardRef<OrbeHDRIHandle, OrbeHDRIProps>((props, ref) => {
  const { 
    initialState = 'idle', 
    useComplexShapes = true,
    materialType = MaterialType.MIRROR,
    environmentMap = HDRIEnvironment.NEON
  } = props;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const objectGroupRef = useRef<THREE.Group | null>(null);
  const materialRef = useRef<THREE.Material | null>(null);
  const timeRef = useRef<number>(0);
  const frameId = useRef<number | null>(null);
  
  // Mouse position tracking - IMPORTANT: Store as a ref for animation access
  const mousePositionRef = useRef<{x: number, y: number, normalized: {x: number, y: number}}>({
    x: 0, 
    y: 0, 
    normalized: {x: 0, y: 0}
  });
  const [isMouseInContainer, setIsMouseInContainer] = useState<boolean>(false);
  
  // Track the mouse in UI state for rendering overlays only
  const [mousePositionUI, setMousePositionUI] = useState<{x: number, y: number, normalized: {x: number, y: number}}>({
    x: 0, 
    y: 0, 
    normalized: {x: 0, y: 0}
  });
  
  const [useComplexMode, setUseComplexMode] = useState<boolean>(useComplexShapes);
  const [currentMaterialType, setCurrentMaterialType] = useState<MaterialType>(materialType);
  const [currentEnvironment, setCurrentEnvironment] = useState<HDRIEnvironment>(environmentMap);
  const [environmentLoaded, setEnvironmentLoaded] = useState<boolean>(false);
  
  // References for each shape - can be a mesh or group depending on complexity
  const sphereRef = useRef<THREE.Object3D | null>(null);
  const cubeRef = useRef<THREE.Object3D | null>(null);
  const coneRef = useRef<THREE.Object3D | null>(null);
  const torusRef = useRef<THREE.Object3D | null>(null);
  
  // Colored lights references
  const blueLightRef = useRef<THREE.PointLight | null>(null);
  const greenLightRef = useRef<THREE.PointLight | null>(null);
  const purpleLightRef = useRef<THREE.PointLight | null>(null);

  const { currentState, setAnimationState, isAnimating } = useAnimationState(initialState);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [previousState, setPreviousState] = useState<AnimationState>(initialState);
  
  // FPS counter state
  const [fps, setFps] = useState<number>(0);
  const frameTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(performance.now());
  
  // Toggle for direct vs. indirect mouse control - for debugging
  // Direct control is always enabled (UI toggle removed)
  const useDirectMouseControl = true;

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
    },
    toggleShapeComplexity: () => {
      setUseComplexMode(prev => !prev);
    },
    changeMaterialType: (type: MaterialType) => {
      setCurrentMaterialType(type);
    },
    changeEnvironment: (env: HDRIEnvironment) => {
      setCurrentEnvironment(env);
    }
  }));

  // Create and apply the appropriate material based on current settings
  const createAndApplyMaterial = () => {
    if (!sceneRef.current || !objectGroupRef.current) return null;
    
    // Create material based on the current type
    let newMaterial: THREE.Material;
    const stateColor = STATE_COLORS[currentState];
    
    switch (currentMaterialType) {
      case MaterialType.GLASS:
        const glassMaterial = createGlassMaterial();
        glassMaterial.color.setHex(stateColor);
        newMaterial = glassMaterial;
        break;
      
      case MaterialType.MIRROR:
        const mirrorMaterial = createMirrorMaterial();
        mirrorMaterial.color.setHex(stateColor);
        newMaterial = mirrorMaterial;
        break;
        
      case MaterialType.CHROME:
        newMaterial = createChromeMaterial(stateColor);
        break;
        
      case MaterialType.STANDARD:
      default:
        newMaterial = new THREE.MeshStandardMaterial({
          color: stateColor,
          metalness: 0.5,
          roughness: 0.2,
          emissive: STATE_EMISSIVE_COLORS[currentState],
          emissiveIntensity: 0.5
        });
        break;
    }
    
    materialRef.current = newMaterial;
    return newMaterial;
  };

  // Initialize Three.js scene with HDRI environment
  useEffect(() => {
    if (!containerRef.current) return;

    // Check if there's already a canvas in the container
    const existingCanvas = containerRef.current.querySelector('canvas');
    if (existingCanvas) {
      containerRef.current.removeChild(existingCanvas);
    }

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

    // Create renderer with advanced capabilities for PBR materials
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create a group to hold all shapes
    const objectGroup = new THREE.Group();
    scene.add(objectGroup);
    objectGroupRef.current = objectGroup;
    
    // Set up the HDRI environment map
    setupEnvironment(scene, renderer, currentEnvironment).then(() => {
      
      // Create material based on the specified type
      const material = createAndApplyMaterial();
      
      if (material) {
        // Create shapes based on the complexity mode
        const shapes = createShapes(material, useComplexMode);
        
        // Set up shapes and store references
        shapes.idle.visible = currentState === 'idle';
        objectGroup.add(shapes.idle);
        sphereRef.current = shapes.idle;
        
        shapes.listening.visible = currentState === 'listening';
        objectGroup.add(shapes.listening);
        cubeRef.current = shapes.listening;
        
        shapes.thinking.visible = currentState === 'thinking';
        objectGroup.add(shapes.thinking);
        coneRef.current = shapes.thinking;
        
        shapes.talking.visible = currentState === 'talking';
        objectGroup.add(shapes.talking);
        torusRef.current = shapes.talking;
      }
      
      // Add minimal lighting - less needed with HDRI
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
      scene.add(ambientLight);
      
      // Add a subtle directional light for highlights
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
      directionalLight.position.set(3, 5, 3);
      scene.add(directionalLight);
      
      // Show the object
      setIsVisible(true);
      setEnvironmentLoaded(true);
      
      // Start animation
      animateFn();
    });
    
    // Animation function - create with useRef to maintain access to current state values
    const animateFn = () => {
      // Calculate time delta and FPS
      const currentTime = performance.now();
      const deltaTime = currentTime - frameTimeRef.current;
      frameTimeRef.current = currentTime; // Update time reference for next frame
      
      // Count frames
      frameCountRef.current++;
      
      // Update FPS once per second
      if (currentTime - lastFpsUpdateRef.current >= 1000) {
        const elapsedSecs = (currentTime - lastFpsUpdateRef.current) / 1000;
        const newFps = Math.round(frameCountRef.current / elapsedSecs);
        setFps(newFps);
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = currentTime;
      }
      
      // Update time for animations (using deltaTime for frame-rate independence)
      // 0.01 is our base time increment for 60fps, scale it with deltaTime
      const timeIncrement = (deltaTime / 16.67) * 0.01; // 16.67ms is approximately 60fps
      timeRef.current += timeIncrement;

      // Get the current environment loaded state directly
      const isEnvLoaded = true; // Force true since we know it's been loaded by now
      
      if (objectGroupRef.current && isEnvLoaded) {
        // Use utility function to update all animations
        const shapes = {
          idle: sphereRef.current,
          listening: cubeRef.current,
          thinking: coneRef.current,
          talking: torusRef.current
        };
        
        if (sphereRef.current && cubeRef.current && coneRef.current && torusRef.current) {
          // Check if we're dealing with complex shapes (Groups) or basic shapes (Meshes)
          const isComplexShape = shapes[currentState] instanceof THREE.Group;
          
          
          if (isComplexShape) {
            // Always get fresh mouse position values from the ref
            // This ensures the animation gets the most current values
            const mouseData = isMouseInContainer ? {
              x: mousePositionRef.current.normalized.x,
              y: mousePositionRef.current.normalized.y
            } : undefined;
            
            // Apply different mouse control strategies based on toggle state
            if (useDirectMouseControl && currentState === 'listening') {
              // Apply direct control - bypassing the normal system
              applyDirectMouseControl();
            } else {
              // Use the default complex shape animation system with fresh mouse data
              updateComplexShapeAnimations(
                shapes as Record<AnimationState, THREE.Group>,
                currentState,
                timeRef.current,
                mouseData
              );
            }
            
            // Also apply basic object rotation
            const rotationSpeeds = STATE_ROTATION_SPEEDS[currentState];
            objectGroupRef.current.rotation.x += rotationSpeeds.x * 0.5;
            objectGroupRef.current.rotation.y += rotationSpeeds.y * 0.5;
          } else {
            // Use basic animation for simple shapes
            const rotationSpeeds = STATE_ROTATION_SPEEDS[currentState];
            
            // Apply rotation based on the current state
            objectGroupRef.current.rotation.x += rotationSpeeds.x * 0.5;
            objectGroupRef.current.rotation.y += rotationSpeeds.y * 0.5;
            
            // Apply specific animations based on current shape
            const activeShape = shapes[currentState];
            if (activeShape && activeShape.visible) {
              // Apply rotation to the active shape with proper type safety
              activeShape.rotation.y += rotationSpeeds.y * 0.3;
            }
          }
          
          // For PBR materials, adjust relevant properties based on material type
          if (materialRef.current) {
            // Get rotation speeds for the current state
            const materialRotationSpeeds = STATE_ROTATION_SPEEDS[currentState];
            
            if (materialRef.current instanceof THREE.MeshPhysicalMaterial) {
              // For glass, animate transmission and thickness
              if (currentMaterialType === MaterialType.GLASS) {
                materialRef.current.transmission = 0.7 + Math.sin(timeRef.current * materialRotationSpeeds.pulseFrequency) * 0.1;
                materialRef.current.thickness = 0.5 + Math.sin(timeRef.current * materialRotationSpeeds.pulseFrequency * 0.7) * 0.2;
              }
              // For mirror/chrome, animate metalness
              else if (currentMaterialType === MaterialType.MIRROR || currentMaterialType === MaterialType.CHROME) {
                materialRef.current.clearcoat = 0.8 + Math.sin(timeRef.current * materialRotationSpeeds.pulseFrequency) * 0.2;
              }
            }
            // For standard material, animate emissive intensity
            else if (materialRef.current instanceof THREE.MeshStandardMaterial) {
              materialRef.current.emissiveIntensity = 
                0.3 + Math.sin(timeRef.current * materialRotationSpeeds.pulseFrequency) * 0.2;
            }
          }
        }
      }
      
      // Render the scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        // Add a subtle camera movement for more dynamic feel
        if (isAnimating) {
          const cameraX = Math.sin(timeRef.current * 0.1) * 0.2;
          const cameraY = Math.cos(timeRef.current * 0.15) * 0.1;
          cameraRef.current.position.x = cameraX;
          cameraRef.current.position.y = cameraY;
          cameraRef.current.lookAt(0, 0, 0);
        }
        
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      frameId.current = requestAnimationFrame(animateFn);
    };
    
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
      if (frameId.current !== null) {
        cancelAnimationFrame(frameId.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [currentEnvironment]); // Only recreate when environment changes

  // Function to show the correct shape with morphing transition
  const transitionToShape = (newState: AnimationState) => {
    // Store references for easier access
    const shapes = {
      'idle': sphereRef.current,
      'listening': cubeRef.current,
      'thinking': coneRef.current,
      'talking': torusRef.current
    };
    
    // Exit if shapes aren't available
    if (!shapes[previousState] || !shapes[newState]) return;
    
    // Get current and target shapes
    const currentShape = shapes[previousState];
    const targetShape = shapes[newState];
    
    // Additional null check to make TypeScript happy
    if (!currentShape || !targetShape) return;
    
    // Make target shape visible but with scale 0
    targetShape.visible = true;
    targetShape.scale.set(0, 0, 0);
    
    // Create a more elaborate transition effect
    // First shrink the current shape with a spin
    gsap.to(currentShape.rotation, {
      y: currentShape.rotation.y + Math.PI * 2, // Full rotation
      duration: 0.4,
      ease: "power1.inOut"
    });
    
    gsap.to(currentShape.scale, {
      x: 0,
      y: 0, 
      z: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        // Hide current shape once scaled down
        currentShape.visible = false;
        
        // Then grow the target shape with a more dynamic animation
        gsap.fromTo(
          targetShape.rotation,
          { y: -Math.PI * 0.5 }, // Start rotated
          { y: 0, duration: 0.7, ease: "elastic.out(1, 0.5)" }
        );
        
        gsap.to(targetShape.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.6,
          ease: "elastic.out(1, 0.3)"
        });
      }
    });
  };

  // Handle animation state changes - CRITICAL HOOK THAT WAS MISSING
  useEffect(() => {
    if (previousState !== currentState && environmentLoaded) {
      // Update the material color based on the new state
      if (materialRef.current) {
        const stateColor = STATE_COLORS[currentState];
        
        // Check material type and update accordingly
        if (materialRef.current instanceof THREE.MeshStandardMaterial || 
            materialRef.current instanceof THREE.MeshPhysicalMaterial) {
          gsap.to(materialRef.current.color, {
            r: new THREE.Color(stateColor).r,
            g: new THREE.Color(stateColor).g,
            b: new THREE.Color(stateColor).b,
            duration: 0.5
          });
        }
      }
      
      // Shape transition
      transitionToShape(currentState);
      
      // Add a brief animation jolt when state changes
      if (objectGroupRef.current) {
        // Save original rotation
        const origRotation = {
          x: objectGroupRef.current.rotation.x,
          y: objectGroupRef.current.rotation.y,
          z: objectGroupRef.current.rotation.z
        };
        
        // Quick rotation jolt
        gsap.to(objectGroupRef.current.rotation, {
          x: origRotation.x + Math.PI * 0.05,
          y: origRotation.y + Math.PI * 0.05,
          duration: 0.3,
          ease: "power2.out"
        });
      }
      
      // Update previous state
      setPreviousState(currentState);
    }
  }, [currentState, previousState, environmentLoaded]);

  // Handle complexity mode changes - MISSING HOOK
  useEffect(() => {
    if (!sceneRef.current || !objectGroupRef.current || !materialRef.current || !environmentLoaded) return;
    
    // Clean up existing shapes
    if (objectGroupRef.current.children.length > 0) {
      // Remove all children from object group
      while (objectGroupRef.current.children.length > 0) {
        objectGroupRef.current.remove(objectGroupRef.current.children[0]);
      }
    }
    
    // Create new shapes with the current complexity setting
    const shapes = createShapes(materialRef.current, useComplexMode);
    
    // Set up shapes and store references
    shapes.idle.visible = currentState === 'idle';
    objectGroupRef.current.add(shapes.idle);
    sphereRef.current = shapes.idle;
    
    shapes.listening.visible = currentState === 'listening';
    objectGroupRef.current.add(shapes.listening);
    cubeRef.current = shapes.listening;
    
    shapes.thinking.visible = currentState === 'thinking';
    objectGroupRef.current.add(shapes.thinking);
    coneRef.current = shapes.thinking;
    
    shapes.talking.visible = currentState === 'talking';
    objectGroupRef.current.add(shapes.talking);
    torusRef.current = shapes.talking;
    
    // Add a nice animation for the shape appearance
    const currentShape = 
      (currentState === 'idle') ? shapes.idle :
      (currentState === 'listening') ? shapes.listening :
      (currentState === 'thinking') ? shapes.thinking :
      shapes.talking;
    
    currentShape.scale.set(0, 0, 0);
    gsap.to(currentShape.scale, {
      x: 1, y: 1, z: 1,
      duration: 0.8,
      ease: "elastic.out(1, 0.3)"
    });
    
  }, [useComplexMode, environmentLoaded, currentState]);

  // Handle visibility transitions - MISSING HOOK
  useEffect(() => {
    if (!objectGroupRef.current || !environmentLoaded) return;
    
    const objectGroup = objectGroupRef.current;
    
    if (isVisible) {
      objectGroup.visible = true;
      
      // Get current active shape
      const currentShape = 
        (currentState === 'idle') ? sphereRef.current :
        (currentState === 'listening') ? cubeRef.current :
        (currentState === 'thinking') ? coneRef.current :
        torusRef.current;
      
      if (currentShape) {
        currentShape.visible = true;
        currentShape.scale.set(0, 0, 0);
        
        // Scale up with a nice elastic effect
        gsap.to(currentShape.scale, {
          x: 1, y: 1, z: 1,
          duration: 0.8,
          ease: "elastic.out(1, 0.3)"
        });
      }
    } else {
      // Get current active shape
      const currentShape = 
        (currentState === 'idle') ? sphereRef.current :
        (currentState === 'listening') ? cubeRef.current :
        (currentState === 'thinking') ? coneRef.current :
        torusRef.current;
      
      if (currentShape) {
        // Scale down animation
        gsap.to(currentShape.scale, { 
          x: 0, y: 0, z: 0, 
          duration: 0.5, 
          ease: "back.in(1.5)",
          onComplete: () => {
            objectGroup.visible = false;
            currentShape.visible = false;
          }
        });
      }
    }
  }, [isVisible, currentState, environmentLoaded]);
  
  // Update material when material type changes - MISSING HOOK
  useEffect(() => {
    if (!sceneRef.current || !environmentLoaded) return;
    
    // Create new material based on current type
    const newMaterial = createAndApplyMaterial();
    
    // Update existing shapes with the new material
    if (newMaterial && sphereRef.current && cubeRef.current && coneRef.current && torusRef.current) {
      // Update material for each shape
      (sphereRef.current instanceof THREE.Mesh) && (sphereRef.current.material = newMaterial);
      (cubeRef.current instanceof THREE.Mesh) && (cubeRef.current.material = newMaterial);
      (coneRef.current instanceof THREE.Mesh) && (coneRef.current.material = newMaterial);
      (torusRef.current instanceof THREE.Mesh) && (torusRef.current.material = newMaterial);
      
      // For complex shapes (groups), update all child meshes
      const updateGroupMaterials = (group: THREE.Object3D) => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = newMaterial;
          }
        });
      };
      
      if (sphereRef.current instanceof THREE.Group) updateGroupMaterials(sphereRef.current);
      if (cubeRef.current instanceof THREE.Group) updateGroupMaterials(cubeRef.current);
      if (coneRef.current instanceof THREE.Group) updateGroupMaterials(coneRef.current);
      if (torusRef.current instanceof THREE.Group) updateGroupMaterials(torusRef.current);
    }
  }, [currentMaterialType, environmentLoaded]);

  // Direct mouse control function with perlin noise for wavy disc movements
  const applyDirectMouseControl = () => {
    if (currentState !== 'listening' || !cubeRef.current) return;
    
    const mousePos = mousePositionRef.current.normalized;
    
    if (cubeRef.current instanceof THREE.Group) {
      const listeningGroup = cubeRef.current;
      
      // Find the disk container (child index 1)
      if (listeningGroup.children.length > 1 && listeningGroup.children[1] instanceof THREE.Group) {
        const diskContainer = listeningGroup.children[1];
        
        // Apply direct positioning from mouse position with enhanced multiplier for visibility
        // Use a position even when mouse is not in container based on last known position
        const posX = mousePos.x * 0.7; // Increased multiplier
        const posY = mousePos.y * 0.7; // Increased multiplier
        
        // Apply with smooth transition for better visual effect
        const smoothingFactor = isMouseInContainer ? 0.15 : 0.05;
        diskContainer.position.x += (posX - diskContainer.position.x) * smoothingFactor;
        diskContainer.position.y += (posY - diskContainer.position.y) * smoothingFactor;
        
        // Rotate each disk with perlin noise influence for wavy movements
        for (let i = 0; i < diskContainer.children.length; i++) {
          const disk = diskContainer.children[i];
          if (disk instanceof THREE.Mesh) {
            // Calculate perlin noise values for this disk
            const time = timeRef.current;
            const diskIndex = i;
            const noiseSeed = i * 42; // Unique seed per disk
            
            // Set different noise parameters for each disk
            const noiseScale = 0.7 + (i * 0.08); // Different scale for each disk
            const noiseSpeed = 0.25 + (i * 0.07); // Different speed for each disk
            
            // Get noise-based positions with multiple frequencies
            // Using different frequencies creates more natural, wave-like motion
            const noise1 = noise2D(time * noiseSpeed, diskIndex * 0.3, noiseSeed) * 2 - 1;
            const noise2 = noise2D(time * noiseSpeed * 0.5, diskIndex * 0.7, noiseSeed + 100) * 2 - 1;
            const combinedNoise = (noise1 * 0.7 + noise2 * 0.3) * noiseScale;
            
            // Apply noise-based wavy movements
            // Calculate offset based on disk's distance from center
            const offsetFactor = (i + 1) / diskContainer.children.length;
            const offsetAmplitude = 0.2 + offsetFactor * 0.5; // Discs further out move more
            
            // Set position with wavy noise pattern
            disk.position.x = Math.sin(time + i * 0.5) * 0.2 * offsetFactor + combinedNoise * 0.3;
            disk.position.y = Math.cos(time * 0.7 + i * 0.5) * 0.2 * offsetFactor + combinedNoise * 0.3;
            disk.position.z = Math.sin(time * 0.5 + i) * 0.1 * offsetFactor;
            
            // Apply additional rotation with mouse influence
            disk.rotation.x += 0.01 + (Math.abs(mousePos.y) * 0.05);
            disk.rotation.y += 0.01 + (Math.abs(mousePos.x) * 0.05);
            disk.rotation.z += combinedNoise * 0.02; // Add slight z-rotation based on noise
            
            // Create a pulsing scale effect with perlin noise influence
            const noiseScale3 = noise2D(time * 0.2, i * 3, noiseSeed + 200) * 0.1 + 0.95;
            const pulseFactor = 1 + Math.sin(time * 3 + i) * 0.05 * noiseScale3;
            disk.scale.set(pulseFactor, pulseFactor, 1);
          }
        }
      }
      
      // Also tilt the crystal ball (child index 0) with subtle perlin noise influence
      if (listeningGroup.children.length > 0) {
        const crystalBall = listeningGroup.children[0];
        const time = timeRef.current;
        
        // Add subtle noise-based movement to the crystal ball
        const crystalNoise = noise3D(
          time * 0.1,
          time * 0.15, 
          time * 0.2,
          123 // Fixed seed for crystal ball
        ) * 2 - 1;
        
        // Smooth transition to target rotation with noise influence
        const targetRotX = mousePos.y * 0.3 + crystalNoise * 0.05;
        const targetRotY = mousePos.x * 0.3 + crystalNoise * 0.05;
        
        crystalBall.rotation.x += (targetRotX - crystalBall.rotation.x) * 0.1;
        crystalBall.rotation.y += (targetRotY - crystalBall.rotation.y) * 0.1;
        
        // Update material properties if available for visual feedback
        crystalBall.traverse(child => {
          if (child instanceof THREE.Mesh && 
              child.material instanceof THREE.MeshPhysicalMaterial) {
            // Adjust transparency based on mouse position and subtle noise
            child.material.opacity = 0.15 + Math.abs(mousePos.x * 0.1) + crystalNoise * 0.05;
            child.material.metalness = 0.9 + mousePos.y * 0.1 + crystalNoise * 0.05;
          }
        });
      }
    }
  };

  // Handle mouse movement over the container
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    // Calculate the container's boundaries
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to the container
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Normalize coordinates to range from -1 to 1
    const normalizedX = ((x / rect.width) * 2) - 1;
    const normalizedY = -(((y / rect.height) * 2) - 1); // Y is inverted in browser coordinates
    
    const newPosition = {
      x,
      y,
      normalized: {x: normalizedX, y: normalizedY}
    };
    
    // FIXED: Update both the ref (for animation) and the state (for UI)
    mousePositionRef.current = newPosition;
    setMousePositionUI(newPosition);
    
  };
  
  // Track when mouse enters/leaves container
  const handleMouseEnter = () => {
    setIsMouseInContainer(true);
  };
  
  const handleMouseLeave = () => {
    setIsMouseInContainer(false);
  };
  
  // Handle touch events for mobile interaction
  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || event.touches.length === 0) return;
    
    // Prevent scrolling when interacting with the orbe
    event.preventDefault();
    
    // Get the primary touch
    const touch = event.touches[0];
    
    // Calculate the container's boundaries
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate touch position relative to the container
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Normalize coordinates to range from -1 to 1
    const normalizedX = ((x / rect.width) * 2) - 1;
    const normalizedY = -(((y / rect.height) * 2) - 1); // Y is inverted in browser coordinates
    
    const newPosition = {
      x,
      y,
      normalized: {x: normalizedX, y: normalizedY}
    };
    
    // FIXED: Update both the ref and the state
    mousePositionRef.current = newPosition;
    setMousePositionUI(newPosition);
    
    setIsMouseInContainer(true);
  };
  
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    handleTouchMove(event);
    setIsMouseInContainer(true);
  };
  
  const handleTouchEnd = () => {
    setIsMouseInContainer(false);
  };

  // Render component with UI controls
  return (
    <div className="orbe-container" data-testid="orbe-container">
      <div 
        ref={containerRef} 
        className="orbe-renderer"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* FPS counter in the upper right corner */}
        <div className="fps-counter" style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: 4,
          fontSize: 14,
          fontFamily: 'monospace',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end'
        }}>
          <div style={{ fontWeight: 'bold' }}>FPS: {fps}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>State: {currentState}</div>
        </div>
        
        {/* Add mouse coordinates overlay when in listening state */}
        {isMouseInContainer && currentState === 'listening' && (
          <div className="mouse-position-overlay" style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: 4,
            fontSize: 12,
            fontFamily: 'monospace'
          }}>
            Mouse: X: {mousePositionUI.normalized.x.toFixed(2)} Y: {mousePositionUI.normalized.y.toFixed(2)}
          </div>
        )}
      </div>
      <div className="orbe-controls">
        <button onClick={() => setAnimationState('idle')}>Idle (Sphere)</button>
        <button onClick={() => setAnimationState('listening')}>Listening (Cube)</button>
        <button onClick={() => setAnimationState('thinking')}>Thinking (Cone)</button>
        <button onClick={() => setAnimationState('talking')}>Talking (Torus)</button>
        <button onClick={() => setIsVisible(!isVisible)}>{isVisible ? 'Turn Off' : 'Turn On'}</button>
        <button onClick={() => setUseComplexMode(!useComplexMode)}>
          {useComplexMode ? 'Simple Shapes' : 'Complex Shapes'}
        </button>
        
        {/* Material selection */}
        <div className="material-controls">
          <button 
            onClick={() => setCurrentMaterialType(MaterialType.GLASS)}
            className={currentMaterialType === MaterialType.GLASS ? 'active' : ''}
          >
            Glass
          </button>
          <button 
            onClick={() => setCurrentMaterialType(MaterialType.MIRROR)}
            className={currentMaterialType === MaterialType.MIRROR ? 'active' : ''}
          >
            Mirror
          </button>
          <button 
            onClick={() => setCurrentMaterialType(MaterialType.CHROME)}
            className={currentMaterialType === MaterialType.CHROME ? 'active' : ''}
          >
            Chrome
          </button>
          <button 
            onClick={() => setCurrentMaterialType(MaterialType.STANDARD)}
            className={currentMaterialType === MaterialType.STANDARD ? 'active' : ''}
          >
            Standard
          </button>
        </div>
        
        {/* Environment selection */}
        <div className="environment-controls">
          <button 
            onClick={() => setCurrentEnvironment(HDRIEnvironment.STUDIO)}
            className={currentEnvironment === HDRIEnvironment.STUDIO ? 'active' : ''}
          >
            Studio
          </button>
          <button 
            onClick={() => setCurrentEnvironment(HDRIEnvironment.OUTDOOR)}
            className={currentEnvironment === HDRIEnvironment.OUTDOOR ? 'active' : ''}
          >
            Outdoor
          </button>
          <button 
            onClick={() => setCurrentEnvironment(HDRIEnvironment.NEON)}
            className={currentEnvironment === HDRIEnvironment.NEON ? 'active' : ''}
          >
            Neon
          </button>
        </div>
      </div>
    </div>
  );
});

export default OrbeHDRIFixed;
