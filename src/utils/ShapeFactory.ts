import * as THREE from 'three';
import { AnimationState } from './types';
import { 
  createComplexShapes,
  updateComplexShapeAnimations
} from './ComplexShapes';

// Color maps for different states
export const STATE_COLORS: Record<AnimationState, number> = {
  idle: 0x4a9ff5,
  listening: 0x4af5a2,
  thinking: 0xf5da4a,
  talking: 0xf54a4a
};

export const STATE_EMISSIVE_COLORS: Record<AnimationState, number> = {
  idle: 0x1a4a8c,
  listening: 0x1a8c4a,
  thinking: 0x8c7a1a,
  talking: 0x8c1a1a
};

// Rotation speeds for different states
export const STATE_ROTATION_SPEEDS: Record<AnimationState, {
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

// Define shape types for each animation state
export const STATE_SHAPES: Record<AnimationState, string> = {
  idle: 'sphere',
  listening: 'cube',
  thinking: 'cone',
  talking: 'torus'
};

export interface ShapeDefinition {
  geometry: THREE.BufferGeometry;
  initialSetup?: (mesh: THREE.Mesh) => void;
  updateAnimation?: (mesh: THREE.Mesh, rotationSpeeds: { x: number, y: number, pulseFrequency: number }) => void;
}

/**
 * Creates basic shapes for all animation states
 * @param material The material to use for all shapes
 * @returns An object containing all shape meshes
 */
export const createBasicShapes = (material: THREE.Material): Record<AnimationState, THREE.Mesh> => {
  // 1. Sphere for idle state
  const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
  const sphere = new THREE.Mesh(sphereGeometry, material);
  
  // 2. Cube for listening state
  const cubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5, 4, 4, 4);
  const cube = new THREE.Mesh(cubeGeometry, material);
  
  // 3. Cone for thinking state
  const coneGeometry = new THREE.ConeGeometry(1, 2, 32);
  const cone = new THREE.Mesh(coneGeometry, material);
  
  // 4. Torus for talking state
  const torusGeometry = new THREE.TorusGeometry(0.8, 0.4, 16, 100);
  const torus = new THREE.Mesh(torusGeometry, material);
  
  return {
    idle: sphere,
    listening: cube,
    thinking: cone,
    talking: torus
  };
};

/**
 * Creates shapes for all animation states
 * @param material The material to use for all shapes
 * @param useComplexShapes Whether to use complex shapes (true) or basic shapes (false)
 * @returns An object containing all shape meshes or groups
 */
export const createShapes = (
  material: THREE.Material, 
  useComplexShapes: boolean = true
): Record<AnimationState, THREE.Object3D> => {
  if (useComplexShapes) {
    return createComplexShapes(material);
  } else {
    return createBasicShapes(material);
  }
};

/**
 * Creates a shared material with proper appearance for the orbe
 * @param state Initial animation state
 * @returns MeshStandardMaterial configured for the orbe
 */
export const createOrbeMaterial = (state: AnimationState): THREE.MeshStandardMaterial => {
  return new THREE.MeshStandardMaterial({
    color: STATE_COLORS[state],
    metalness: 0.5,
    roughness: 0.2,
    emissive: STATE_EMISSIVE_COLORS[state],
    emissiveIntensity: 0.5
  });
};

/**
 * Creates lights for the orbe scene
 * @param scene The THREE.Scene to add lights to
 * @returns Object containing references to the created lights
 */
export const createLights = (scene: THREE.Scene) => {
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
  
  const greenLight = new THREE.PointLight(0x4af5a2, 1, 10);
  greenLight.position.set(2, -1, 3);
  scene.add(greenLight);
  
  const purpleLight = new THREE.PointLight(0x8c1a8c, 1, 10);
  purpleLight.position.set(0, 2, 3);
  scene.add(purpleLight);
  
  return { 
    ambientLight,
    directionalLight,
    blueLight,
    greenLight,
    purpleLight
  };
};

/**
 * Updates shape animations based on the current state
 * @param shapes Object containing all shape meshes or groups
 * @param currentState Current animation state
 * @param isAnimating Whether animation is currently active
 * @param time Current animation time value
 */
export const updateShapeAnimations = (
  shapes: Record<AnimationState, THREE.Object3D>, 
  currentState: AnimationState,
  objectGroup: THREE.Group,
  isAnimating: boolean,
  time: number,
  material: THREE.MeshStandardMaterial | null
) => {
  if (!isAnimating) return;
  
  const rotationSpeeds = STATE_ROTATION_SPEEDS[currentState];
  
  // Check if we're dealing with complex shapes (Groups) or basic shapes (Meshes)
  const isComplexShape = shapes[currentState] instanceof THREE.Group;
  
  if (isComplexShape) {
    // For complex shapes, use specialized animation function from ComplexShapes
    updateComplexShapeAnimations(
      shapes as Record<AnimationState, THREE.Group>,
      currentState,
      time
    );
    
    // Also apply basic object rotation
    objectGroup.rotation.x += rotationSpeeds.x * 0.5;
    objectGroup.rotation.y += rotationSpeeds.y * 0.5;
  } else {
    // For basic shapes, use standard rotation logic
    objectGroup.rotation.x += rotationSpeeds.x;
    objectGroup.rotation.y += rotationSpeeds.y;
    
    // Add different rotation for each shape
    if (shapes.idle.visible) {
      shapes.idle.rotation.y += rotationSpeeds.y * 0.5;
    }
    
    if (shapes.listening.visible) {
      shapes.listening.rotation.x += rotationSpeeds.x * 0.3;
      shapes.listening.rotation.y += rotationSpeeds.y * 0.3;
    }
    
    if (shapes.thinking.visible) {
      shapes.thinking.rotation.y += rotationSpeeds.y * 0.2;
    }
    
    if (shapes.talking.visible) {
      shapes.talking.rotation.x += rotationSpeeds.x * 0.3;
    }
  }
  
  // Add subtle pulse to emissive intensity for alive feeling
  if (material) {
    const pulseValue = Math.sin(time * rotationSpeeds.pulseFrequency) * 0.2 + 0.5;
    material.emissiveIntensity = pulseValue;
  }
};
