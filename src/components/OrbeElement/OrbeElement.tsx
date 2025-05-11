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

// State-specific modulation values for metaball behavior - optimized for roundness
const STATE_MODULATIONS: Record<AnimationState, {
  noiseScale: number;
  noiseSpeed: number;
  pulseFrequency: number;
  pulseAmplitude: number;
  turbulence: number;
  rotationSpeed: number;
  bodyCount: number;
  strength: number;
  subtract: number;
}> = {
  idle: {
    noiseScale: 1.5,
    noiseSpeed: 0.15,
    pulseFrequency: 0.4,
    pulseAmplitude: 0.02,
    turbulence: 0.08,
    rotationSpeed: 0.001,
    bodyCount: 15,
    strength: 0.5,
    subtract: 10
  },
  listening: {
    noiseScale: 2.0,
    noiseSpeed: 0.25,
    pulseFrequency: 1.0,
    pulseAmplitude: 0.03,
    turbulence: 0.15,
    rotationSpeed: 0.002,
    bodyCount: 18,
    strength: 0.55,
    subtract: 9
  },
  thinking: {
    noiseScale: 1.8,
    noiseSpeed: 0.2,
    pulseFrequency: 0.7,
    pulseAmplitude: 0.025,
    turbulence: 0.12,
    rotationSpeed: 0.0025,
    bodyCount: 20,
    strength: 0.52,
    subtract: 9.5
  },
  talking: {
    noiseScale: 2.5,
    noiseSpeed: 0.35,
    pulseFrequency: 1.5,
    pulseAmplitude: 0.04,
    turbulence: 0.2,
    rotationSpeed: 0.003,
    bodyCount: 22,
    strength: 0.58,
    subtract: 8.5
  }
};

const OrbeElement = forwardRef<OrbeElementHandle, OrbeElementProps>((props, ref) => {
  const { initialState = 'idle' } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const frameId = useRef<number | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const timeRef = useRef<number>(0);
  
  // Physics system references
  const physicsInitializedRef = useRef<boolean>(false);
  const worldRef = useRef<RAPIER.World | null>(null);
  const bodiesRef = useRef<MetaBody[]>([]);
  const mouseInteractorRef = useRef<MouseInteractor | null>(null);
  
  const metaballsRef = useRef<MarchingCubes | null>(null);
  const mousePos = useRef<THREE.Vector2>(new THREE.Vector2());
  const metaNodesRef = useRef<THREE.Vector3[]>([]);
  const metaNodesVelocityRef = useRef<THREE.Vector3[]>([]);

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

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera with adjusted position for better centering
    const camera = new THREE.PerspectiveCamera(
      45, // Slightly narrower field of view for better focus
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.z = 5.5; // Move camera back slightly for better perspective
    camera.position.y = 0.1; // Slight vertical adjustment for visual centering
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

    // Create material with metaball-like appearance using MeshStandardMaterial for better lighting
    const material = new THREE.MeshStandardMaterial({
      color: STATE_COLORS[currentState],
      metalness: 0.5,
      roughness: 0.2,
      emissive: STATE_EMISSIVE_COLORS[currentState],
      emissiveIntensity: 0.5,
      flatShading: false,
      vertexColors: false,
    });
    materialRef.current = material;
    
    // Create MarchingCubes instance with higher resolution for smoother surface
    const resolution = 64; // Higher resolution for smoother, rounder shape
    const metaballs = new MarchingCubes(
      resolution,
      material,
      true, // Enable UVs
      false // Enable colors (set to false since we're using a single material color)
    );
    
    // Ensure perfect centering of the marching cubes volume
    metaballs.position.set(0, 0, 0);
    metaballs.scale.set(2, 2, 2); // Scale the effect
    
    // Adjust isolation for perfect spherical shape
    metaballs.isolation = 1.6; // Balanced value for smooth blending while maintaining shape
    metaballsRef.current = metaballs;
    
    scene.add(metaballs);
    
    // Add reference to the mesh for animations
    sphereRef.current = metaballs;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // Add point light for more dynamic lighting
    const pointLight = new THREE.PointLight(0xffffff, 1, 10);
    pointLight.position.set(-2, 1, 3);
    scene.add(pointLight);
    
    // Initialize meta nodes (physics points that will define metaballs)
    initializeMetaNodes(12); // Use more meta nodes for smoother, more bubble-like shape
    
    // Set up mouse interaction
    const handleMouseMove = (event: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        // Convert mouse coordinates to normalized device coordinates (-1 to +1)
        mousePos.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mousePos.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Initial update of the metaballs
    updateMetaballs(currentState);
    
    // Start animation
    const animate = () => {
      timeRef.current += 0.01;
      
      if (sphereRef.current && isAnimating) {
        const modulation = STATE_MODULATIONS[currentState];
        
        // Update meta nodes with physics
        updateMetaNodes(modulation);
        
        // Update the metaballs
        updateMetaballs(currentState);
        
        // Add gentle, continuous rotation centered on the origin
        if (sphereRef.current) {
          // Reset rotation to start from a centered position
          sphereRef.current.rotation.set(0, 0, 0);
          
          // Apply rotation around the global Y axis primarily
          sphereRef.current.rotateY(timeRef.current * modulation.rotationSpeed * 0.2);
          
          // Add very subtle tilt for organic feel, but keep mostly upright
          const tiltAmount = Math.sin(timeRef.current * 0.15) * 0.03;
          sphereRef.current.rotateX(tiltAmount);
        }
        
        // Add subtle pulse to emissive intensity for alive feeling
        if (materialRef.current) {
          const pulseValue = Math.sin(timeRef.current * modulation.pulseFrequency) * 0.2 + 0.5;
          materialRef.current.emissiveIntensity = pulseValue;
        }
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      frameId.current = requestAnimationFrame(animate);
    };
    
    animate();

    // Show the orbe with scale animation
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
  }, []);

  // Initialize meta nodes (physics points that define metaballs) with perfect spherical distribution
  const initializeMetaNodes = (count: number) => {
    metaNodesRef.current = [];
    metaNodesVelocityRef.current = [];
    
    // First, add a large central node at the exact origin
    metaNodesRef.current.push(new THREE.Vector3(0, 0, 0));
    metaNodesVelocityRef.current.push(new THREE.Vector3(0, 0, 0));
    
    // Fibonacci sphere algorithm for perfectly uniform sphere distribution
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle in radians
    
    for (let i = 0; i < count; i++) {
      // Create evenly distributed nodes on a perfect sphere
      const y = 1 - (i / (count - 1)) * 2; // Range from 1 to -1
      const radius = Math.sqrt(1 - y * y); // Radius at this y
      
      const theta = phi * i; // Golden angle increment
      
      // Use a fixed distance from center for all nodes to ensure perfect spherical shape
      const baseRadius = 0.33; // Consistent distance from center
      
      const x = Math.cos(theta) * radius * baseRadius;
      const z = Math.sin(theta) * radius * baseRadius;
      const yPos = y * baseRadius;
      
      metaNodesRef.current.push(new THREE.Vector3(x, yPos, z));
      
      // Initialize with very small and uniform velocities for stable orbit formation
      // Use deterministic pattern rather than random to prevent asymmetry
      const angle = (i / count) * Math.PI * 2;
      const speed = 0.003;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const vz = Math.cos(angle + Math.PI/2) * speed;
      
      metaNodesVelocityRef.current.push(new THREE.Vector3(vx, vy, vz));
    }
  };
  
  // Update meta nodes with physics-based behavior creating uniform orbits around center
  const updateMetaNodes = (modulation: typeof STATE_MODULATIONS[AnimationState]) => {
    const centerAttraction = 0.004; // Strong force pulling nodes to the exact center
    const mouseInfluence = 0.0005; // Very subtle mouse influence to maintain stability
    const bounceRegion = 0.38; // Even tighter boundary for perfect spherical shape
    const orbitStrength = 0.002; // Force causing nodes to orbit around center
    
    // Create a 3D mouse position for interaction
    const mouse3D = new THREE.Vector3(
      mousePos.current.x * 0.5,  // Scale down for subtle effect
      mousePos.current.y * 0.5,
      0
    );
    
    // Update each metaball's position based on physics
    for (let i = 0; i < metaNodesRef.current.length; i++) {
      // Keep central node fixed with slight movement - first node is the center
      if (i === 0) { // Central node is the first one
        const centralNode = metaNodesRef.current[i];
        centralNode.x = Math.sin(timeRef.current * 0.5) * 0.02;
        centralNode.y = Math.cos(timeRef.current * 0.4) * 0.02;
        centralNode.z = Math.sin(timeRef.current * 0.3) * 0.02;
        continue;
      }
      
      const node = metaNodesRef.current[i];
      const velocity = metaNodesVelocityRef.current[i];
      
      // Add state-specific turbulence
      velocity.x += (Math.random() - 0.5) * 0.002 * modulation.turbulence;
      velocity.y += (Math.random() - 0.5) * 0.002 * modulation.turbulence;
      velocity.z += (Math.random() - 0.5) * 0.002 * modulation.turbulence;
      
      // Center attraction force (pulls toward origin)
      const toCenter = node.clone().negate().normalize();
      toCenter.multiplyScalar(centerAttraction * (node.length() * 2)); // Stronger pull when further away
      velocity.add(toCenter);
      
      // Mouse interaction - attraction to mouse position
      const toMouse = mouse3D.clone().sub(node);
      const mouseDistance = toMouse.length();
      if (mouseDistance < 0.5) { // Only affect when mouse is close
        toMouse.normalize().multiplyScalar(mouseInfluence / Math.max(0.1, mouseDistance));
        velocity.add(toMouse);
      }
      
      // Apply velocity to position
      node.add(velocity);
      
      // Dampen velocity for stability (more damping = more viscous fluid)
      velocity.multiplyScalar(0.96);
      
      // Bounce if hitting boundaries
      const distance = node.length();
      if (distance > bounceRegion) {
        // Calculate reflection
        const normal = node.clone().normalize();
        const dot = velocity.dot(normal);
        velocity.sub(normal.multiplyScalar(2 * dot));
        
        // Push back inside boundary and add energy
        node.normalize().multiplyScalar(bounceRegion * 0.9);
        velocity.multiplyScalar(1.2 * modulation.turbulence);
      }
      
      // Apply orbital force perpendicular to the radial direction (creates circular orbit)
      // Calculate cross product of node position with up vector to get perpendicular force
      const upVector = new THREE.Vector3(0, 1, 0);
      const orbitForce = new THREE.Vector3().crossVectors(node, upVector);
      orbitForce.normalize().multiplyScalar(orbitStrength);
      velocity.add(orbitForce);
      
      // Add state-specific behavior - modified for centered orbits
      switch (currentState) {
        case 'idle':
          // Gentle circular movement in a balanced orbital plane
          const idleForce = new THREE.Vector3(-node.z * 0.0005, 0, node.x * 0.0005);
          velocity.add(idleForce);
          break;
          
        case 'talking':
          // Rhythmic pulsing - nodes move in/out from center like a breathing sphere
          const pulseForce = Math.sin(timeRef.current * modulation.pulseFrequency * 2) * 0.002;
          const direction = node.clone().normalize();
          const talkDir = direction.multiplyScalar(pulseForce);
          velocity.add(talkDir);
          break;
          
        case 'listening':
          // Responsive movements with balanced forces around all axes
          const listenForce = Math.sin(timeRef.current * 1.5 + i * 0.5) * 0.001;
          const listenDir = new THREE.Vector3(
            Math.sin(i * 0.8) * listenForce,
            Math.cos(i * 0.8) * listenForce,
            Math.sin(i * 0.8 + Math.PI/2) * listenForce
          );
          velocity.add(listenDir);
          break;
          
        case 'thinking':
          // Complex but balanced orbital patterns that maintain spherical shape
          const angle = i * (Math.PI * 2 / metaNodesRef.current.length) + timeRef.current * 0.2;
          const perpRadius = 0.0008 * modulation.turbulence;
          const perpX = Math.cos(angle) * perpRadius;
          const perpY = Math.sin(angle) * perpRadius;
          const perpZ = Math.cos(angle * 1.5) * perpRadius;
          velocity.add(new THREE.Vector3(perpX, perpY, perpZ));
          break;
      }
    }
  };

  // Function to update the metaballs based on current state and meta node positions
  const updateMetaballs = (state: AnimationState) => {
    if (!metaballsRef.current) return;
    
    const metaballs = metaballsRef.current;
    metaballs.reset();
    
    const modulation = STATE_MODULATIONS[state];
    
    // Get current color
    const stateColor = new THREE.Color(STATE_COLORS[state]);
    
    // Time-dependent variations
    const timeFrequency = Math.sin(timeRef.current * 0.1) * 0.5 + 1.0; // Oscillates between 0.5 and 1.5
    
    // Base strength and subtract values - adjusted for rounder shape
    let baseStrength = 1.8; // Slightly larger metaballs for smoother blending
    let baseSubtract = 10; // Lower subtract value for more merged, rounded surface
    
    // State-specific adjustments - optimized for rounder shape
    switch(state) {
      case 'idle':
        baseStrength *= 0.95; // Slightly larger for smoother surface
        baseSubtract *= 1.05; // More subtle effect on subtract for roundness
        break;
      case 'listening':
        // Gentler pulsation to maintain roundness
        baseStrength *= 1.05 + Math.sin(timeRef.current * 1.5) * 0.07;
        baseSubtract *= 0.95;
        break;
      case 'thinking':
        // More consistent shape while still showing activity
        baseStrength *= 1.0 + Math.sin(timeRef.current * 0.8) * 0.04;
        baseSubtract *= 1.0;
        break;
      case 'talking':
        // More controlled talking animation to maintain roundness
        baseStrength *= 1.1 + Math.sin(timeRef.current * 3) * 0.1;
        baseSubtract *= 0.9;
        break;
    }
    
    // Add metaballs from meta nodes
    metaNodesRef.current.forEach((node, index) => {
      // Vary ball size based on index and state
      let ballStrength = baseStrength;
      let ballSubtract = baseSubtract;
      
      // Make the central node larger for better spherical core
      if (index === 0) { // Central node is now first in the array
        ballStrength *= 2.0; // Larger central node for more roundness
        ballSubtract *= 0.85; // Lower subtract for smoother blending
      }
      
      // Add time-based fluctuations
      const fluctuation = simplex3D(
        node.x + timeRef.current * 0.2,
        node.y + timeRef.current * 0.3,
        node.z + timeRef.current * 0.1
      ) * 0.15;
      
      // Add the metaball to the MarchingCubes object
      metaballs.addBall(
        node.x,
        node.y,
        node.z,
        ballStrength * (1 + fluctuation * modulation.turbulence), // Size
        ballSubtract, // Surface threshold
        stateColor // Pass the color object directly, not getHex()
      );
    });
    
    // Add an extremely subtle mouse-influenced attraction force that doesn't disrupt the sphere
    const mouseStrength = 0.02; // Very subtle influence to maintain perfect bubble shape
    
    // Calculate distance from mouse to center to adjust influence
    const mouseDistanceToCenter = Math.sqrt(
      Math.pow(mousePos.current.x, 2) + 
      Math.pow(mousePos.current.y, 2)
    );
    
    // Only add mouse influence if it's close and apply it from the center outward
    if (mouseDistanceToCenter < 0.8) {
      // Calculate direction from center toward mouse
      const dirToMouse = new THREE.Vector3(
        mousePos.current.x * 0.25, 
        mousePos.current.y * 0.25, 
        0
      ).normalize();
      
      // Create ball slightly offset from center in the mouse direction
      // This maintains the spherical shape while creating subtle attraction
      metaballs.addBall(
        dirToMouse.x * 0.15, // Subtle offset from center toward mouse
        dirToMouse.y * 0.15,
        dirToMouse.z * 0.15,
        baseStrength * 0.5 * mouseStrength, // Very small influence
        baseSubtract * 1.15, // Higher subtract to minimize shape disruption
        stateColor // Pass the color object directly
      );
    }
    
    // Update the marching cubes algorithm to generate new geometry
    metaballs.update();
  };
  
  // Enhanced noise function for organic movement and patterns with improved animation
  const simplex3D = (x: number, y: number, z: number): number => {
    // Layer multiple sine waves at different frequencies and phases for more natural noise
    // Adding frequency variation creates more interesting patterns that evolve over time
    return Math.sin(x) * Math.cos(y) * Math.sin(z) * 0.5 + 
           Math.sin(x * 2.1 + 0.3) * Math.cos(y * 1.7 + 0.2) * Math.sin(z * 2.3 + 0.1) * 0.3 +
           Math.sin(x * 3.7 + 0.7) * Math.cos(y * 4.3 + 0.4) * Math.sin(z * 2.9 + 0.5) * 0.2 +
           Math.sin(x * 5.1 - 0.4) * Math.cos(y * 4.8 + 0.3) * Math.sin(z * 5.2 - 0.2) * 0.1;
  };

  // Handle animation state changes
  useEffect(() => {
    if (!materialRef.current || !sphereRef.current || !metaballsRef.current) return;
    
    // Get color for the current state
    const stateColor = STATE_COLORS[currentState];
    const stateEmissiveColor = STATE_EMISSIVE_COLORS[currentState];
    
    // Create Three.js color objects
    const newColor = new THREE.Color(stateColor);
    const newEmissive = new THREE.Color(stateEmissiveColor);
    
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
    
    // Add energy to metaball system when state changes
    metaNodesVelocityRef.current.forEach(velocity => {
      // Add stronger impulses for more dramatic state changes
      velocity.x += (Math.random() - 0.5) * 0.08;
      velocity.y += (Math.random() - 0.5) * 0.08;
      velocity.z += (Math.random() - 0.5) * 0.08;
    });
    
    // Adjust marching cubes settings based on state
    if (metaballsRef.current) {
      // Transition effect - briefly change isolation threshold
      const originalIsolation = metaballsRef.current.isolation;
      metaballsRef.current.isolation = 1.2;
      
      // Return to appropriate isolation level after a brief moment
      // Values are closely clustered to maintain consistent spherical shape across states
      setTimeout(() => {
        if (metaballsRef.current) {
          switch (currentState) {
            case 'idle':
              metaballsRef.current.isolation = 1.6; // Consistent base value
              break;
            case 'listening':
              metaballsRef.current.isolation = 1.55; // Slightly more merged
              break;
            case 'thinking':
              metaballsRef.current.isolation = 1.58; // Slightly more defined
              break;
            case 'talking':
              metaballsRef.current.isolation = 1.52; // More merged for active state
              break;
            default:
              metaballsRef.current.isolation = originalIsolation;
          }
        }
      }, 300);
    }
    
  }, [currentState]);

  // Handle visibility transitions (turn on/off)
  useEffect(() => {
    if (!sphereRef.current) return;
    
    const sphere = sphereRef.current;
    const metaballs = metaballsRef.current;
    
    if (isVisible) {
      // Make object visible first
      sphere.visible = true;
      
      // Scale up animation (turn on)
      gsap.fromTo(
        sphere.scale, 
        { x: 0, y: 0, z: 0 }, 
        { 
          x: 2, // Match the scale we set initially 
          y: 2,
          z: 2,
          duration: 1.0, 
          ease: "elastic.out(1.2, 0.5)", // More fluid, organic animation
          onStart: () => {
            // Add explosion energy to meta nodes when turning on
            metaNodesVelocityRef.current.forEach(velocity => {
              velocity.x += (Math.random() - 0.5) * 0.15;
              velocity.y += (Math.random() - 0.5) * 0.15;
              velocity.z += (Math.random() - 0.5) * 0.15;
            });
            
            // Reset metaballs isolation temporarily for a "bloom" effect
            if (metaballs) {
              const originalIsolation = metaballs.isolation;
              metaballs.isolation = 1.0; // More expanded surface
              
              setTimeout(() => {
                if (metaballs) {
                  metaballs.isolation = originalIsolation;
                }
              }, 300);
            }
          }
        }
      );
      
      // Add a subtle "jelly" effect with a second subtle scale bounce
      setTimeout(() => {
        if (sphere) {
          gsap.to(sphere.scale, {
            x: 1.9, // Slight undershoot
            y: 1.9,
            z: 1.9,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => {
              if (sphere) {
                gsap.to(sphere.scale, {
                  x: 2, 
                  y: 2,
                  z: 2,
                  duration: 0.2,
                  ease: "power1.out"
                });
              }
            }
          });
        }
      }, 1000); // After initial animation
      
    } else {
      // Scale down animation (turn off)
      gsap.to(
        sphere.scale, 
        { 
          x: 0, 
          y: 0, 
          z: 0, 
          duration: 0.6, 
          ease: "back.in(1.5)",
          onComplete: () => {
            // Hide the object once scaled to zero
            sphere.visible = false;
          }
        }
      );
      
      // Add imploding effect by adjusting metaballs isolation
      if (metaballs) {
        gsap.to(metaballs, {
          isolation: 3.0, // Higher value = smaller surface
          duration: 0.5,
          ease: "power2.in"
        });
      }
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
