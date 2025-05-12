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
  createLights,
  updateShapeAnimations
} from '../../utils/ShapeFactory';

interface OrbeElementProps {
  initialState?: AnimationState;
  useComplexShapes?: boolean;
}

// Define the ref API
export interface OrbeElementHandle {
  changeState: (state: AnimationState) => void;
  toggleVisibility: () => void;
  getState: () => AnimationState;
  isVisible: () => boolean;
  toggleShapeComplexity: () => void;
}

// Constants are now imported from ShapeFactory

const OrbeElement = forwardRef<OrbeElementHandle, OrbeElementProps>((props, ref) => {
  const { initialState = 'idle', useComplexShapes = true } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const objectGroupRef = useRef<THREE.Group | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const timeRef = useRef<number>(0);
  const frameId = useRef<number | null>(null);
  const [useComplexMode, setUseComplexMode] = useState<boolean>(useComplexShapes);
  
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
    }
  }));

  // Initialize Three.js scene
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

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create shared material with proper appearance using the utility function
    const material = createOrbeMaterial(currentState);
    materialRef.current = material;
    
    // Create a group to hold all shapes
    const objectGroup = new THREE.Group();
    scene.add(objectGroup);
    objectGroupRef.current = objectGroup;
    
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

    // Create and add lights using the utility function
    const lights = createLights(scene);
    blueLightRef.current = lights.blueLight;
    greenLightRef.current = lights.greenLight;
    purpleLightRef.current = lights.purpleLight;
    
    // Start animation
    const animate = () => {
      timeRef.current += 0.01;
      
      if (objectGroupRef.current) {
        // Use the utility function to update all animations
        const shapes = {
          idle: sphereRef.current,
          listening: cubeRef.current,
          thinking: coneRef.current,
          talking: torusRef.current
        };
        
        if (sphereRef.current && cubeRef.current && coneRef.current && torusRef.current) {
          updateShapeAnimations(
            shapes as Record<AnimationState, THREE.Object3D>,
            currentState,
            objectGroupRef.current,
            isAnimating,
            timeRef.current,
            materialRef.current
          );
        }
      }
      
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
    
    // Show the object by default
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

  // Handle animation state changes
  useEffect(() => {
    if (!materialRef.current) return;
    if (previousState !== currentState) {
      // Color transition
      // Get color for the current state
      const stateColor = STATE_COLORS[currentState];
      const stateEmissiveColor = STATE_EMISSIVE_COLORS[currentState];
      
      // Create Three.js color objects
      const newColor = new THREE.Color(stateColor);
      const newEmissive = new THREE.Color(stateEmissiveColor);
      
      // Update point light colors based on state with animations
      if (blueLightRef.current && greenLightRef.current && purpleLightRef.current) {
        // First dim all lights before transition
        gsap.to(blueLightRef.current, { intensity: 0.5, duration: 0.2 });
        gsap.to(greenLightRef.current, { intensity: 0.5, duration: 0.2 });
        gsap.to(purpleLightRef.current, { intensity: 0.5, duration: 0.2 });
        
        // Then update colors and intensities based on state
        switch(currentState) {
          case 'idle': {
            const blueLight = blueLightRef.current;
            gsap.to(blueLight.color, { 
              r: newColor.r, g: newColor.g, b: newColor.b, duration: 0.5,
              onComplete: function() { 
                gsap.to(blueLight, { intensity: 1.2, duration: 0.3 });
              }
            });
            break;
          }
            
          case 'listening': {
            const greenLight = greenLightRef.current;
            gsap.to(greenLight.color, { 
              r: newColor.r, g: newColor.g, b: newColor.b, duration: 0.5,
              onComplete: function() {
                gsap.to(greenLight, { intensity: 1.2, duration: 0.3 });
              }
            });
            break;
          }
            
          case 'thinking': {
            const purpleLight = purpleLightRef.current;
            gsap.to(purpleLight.color, { 
              r: newColor.r, g: newColor.g, b: newColor.b, duration: 0.5,
              onComplete: function() {
                gsap.to(purpleLight, { intensity: 1.2, duration: 0.3 });
              }
            });
            break;
          }
            
          case 'talking': {
            // More dramatic effect with all lights
            gsap.to(blueLightRef.current.color, { r: newColor.r, g: newColor.g, b: newColor.b, duration: 0.5 });
            gsap.to(greenLightRef.current.color, { r: newEmissive.r, g: newEmissive.g, b: newEmissive.b, duration: 0.5 });
            gsap.to(purpleLightRef.current.color, { r: newColor.r, g: newColor.g, b: newColor.b, duration: 0.5 });
            
            // Pulse the lights
            gsap.to([blueLightRef.current, greenLightRef.current, purpleLightRef.current], {
              intensity: 1.5, duration: 0.5, yoyo: true, repeat: 1
            });
            break;
          }
        }
      }
      
      // Animate color change with a brief flash effect
      const material = materialRef.current;
      gsap.to(material, { 
        emissiveIntensity: 1.0,
        duration: 0.2,
        onComplete: function() {
          // Then transition to the target color
          gsap.to(material.color, {
            r: newColor.r,
            g: newColor.g,
            b: newColor.b,
            duration: 0.5
          });
          
          gsap.to(material.emissive, {
            r: newEmissive.r,
            g: newEmissive.g,
            b: newEmissive.b,
            duration: 0.5
          });
          
          gsap.to(material, {
            emissiveIntensity: 0.5,
            duration: 0.5
          });
        }
      });
      
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
  }, [currentState, previousState]);

  // Handle visibility transitions (turn on/off)
  useEffect(() => {
    if (!objectGroupRef.current) return;
    
    const objectGroup = objectGroupRef.current;
    
    if (isVisible) {
      // Make object visible first
      objectGroup.visible = true;
      
      // Get current active shape
      const currentShape = 
        (currentState === 'idle') ? sphereRef.current :
        (currentState === 'listening') ? cubeRef.current :
        (currentState === 'thinking') ? coneRef.current :
        torusRef.current;
      
      if (currentShape) {
        // Create a more dramatic appearance animation
        
        // First position the shape off-screen
        currentShape.visible = true;
        currentShape.scale.set(0, 0, 0);
        currentShape.position.y = -3; // Appear from below
        
        // Adjust camera to look at entry point
        if (cameraRef.current) {
          gsap.to(cameraRef.current.position, {
            y: -1, 
            duration: 0.5,
            onComplete: function() {
              // Then animate the shape coming in
              gsap.to(currentShape.position, {
                y: 0,
                duration: 0.8,
                ease: "power3.out"
              });
              
              // While also scaling up
              gsap.to(currentShape.scale, { 
                x: 1, 
                y: 1,
                z: 1,
                duration: 1.0, 
                ease: "elastic.out(1.2, 0.5)", // More fluid, organic animation
                onComplete: function() {
                  // Return camera to default position
                  if (cameraRef.current) {
                    gsap.to(cameraRef.current.position, {
                      y: 0,
                      duration: 0.5
                    });
                  }
                }
              });
              
              // Add rotation for more dynamic entry
              gsap.fromTo(
                currentShape.rotation,
                { x: Math.PI, y: 0, z: 0 },
                { x: 0, duration: 1.2, ease: "power2.out" }
              );
            }
          });
        }
      }
    } else {
      // Get current active shape
      const currentShape = 
        (currentState === 'idle') ? sphereRef.current :
        (currentState === 'listening') ? cubeRef.current :
        (currentState === 'thinking') ? coneRef.current :
        torusRef.current;
      
      if (currentShape && materialRef.current) {
        // More dramatic exit animation
        
        // First create a flash effect on the material
        gsap.to(materialRef.current, {
          emissiveIntensity: 1.5,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          onComplete: function() {
            // Then animate the shape rotating and scaling down
            gsap.to(currentShape.rotation, {
              z: Math.PI * 2,
              duration: 0.7
            });
            
            // While simultaneously moving down
            gsap.to(currentShape.position, {
              y: -3,
              duration: 0.7,
              ease: "power3.in"
            });
            
            // And scaling down
            gsap.to(currentShape.scale, { 
              x: 0, 
              y: 0, 
              z: 0, 
              duration: 0.6, 
              ease: "back.in(1.5)",
              onComplete: function() {
                // Hide the object once animation is complete
                objectGroup.visible = false;
                currentShape.visible = false;
                // Reset position for next appearance
                currentShape.position.set(0, 0, 0);
              }
            });
          }
        });
      }
    }
  }, [isVisible, currentState]);

  // Handle complexity mode changes
  useEffect(() => {
    if (!sceneRef.current || !objectGroupRef.current || !materialRef.current) return;
    
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
    
  }, [useComplexMode]);

  // Public method to toggle visibility
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  
  // Public method to toggle shape complexity
  const toggleShapeComplexity = () => {
    setUseComplexMode(!useComplexMode);
  };

  // Public methods to control the state
  const changeState = (newState: AnimationState) => {
    setAnimationState(newState);
  };

  return (
    <div className="orbe-container" data-testid="orbe-container">
      <div ref={containerRef} className="orbe-renderer"></div>
      <div className="orbe-controls">
        <button onClick={() => changeState('idle')}>Idle (Sphere)</button>
        <button onClick={() => changeState('listening')}>Listening (Cube)</button>
        <button onClick={() => changeState('thinking')}>Thinking (Cone)</button>
        <button onClick={() => changeState('talking')}>Talking (Torus)</button>
        <button onClick={toggleVisibility}>{isVisible ? 'Turn Off' : 'Turn On'}</button>
        <button onClick={toggleShapeComplexity}>
          {useComplexMode ? 'Simple Shapes' : 'Complex Shapes'}
        </button>
      </div>
    </div>
  );
});

export default OrbeElement;
