import * as THREE from 'three';
import { AnimationState } from './types';

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

/**
 * Creates a more complex idle shape - a geometric sphere with wavy segments and decorative elements
 * @param material The material to use for the shape
 * @returns A THREE.Group containing the shape and its decorative elements
 */
export const createIdleShape = (material: THREE.Material): THREE.Group => {
  const group = new THREE.Group();
  
  // Main sphere with higher segment count for smoother appearance
  const sphereGeometry = new THREE.SphereGeometry(0.85, 32, 32);
  const sphere = new THREE.Mesh(sphereGeometry, material);
  group.add(sphere);
  
  // Add orbital rings around the sphere
  const ringGeometry = new THREE.TorusGeometry(1.2, 0.05, 16, 48);
  const ring = new THREE.Mesh(ringGeometry, material);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  
  const ring2Geometry = new THREE.TorusGeometry(1.1, 0.03, 16, 48);
  const ring2 = new THREE.Mesh(ring2Geometry, material);
  ring2.rotation.x = Math.PI / 4;
  ring2.rotation.y = Math.PI / 4;
  group.add(ring2);
  
  // Add small satellite spheres
  const smallSphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
  
  // First satellite
  const satellite1 = new THREE.Mesh(smallSphereGeometry, material);
  satellite1.position.set(1.2, 0, 0);
  group.add(satellite1);
  
  // Second satellite
  const satellite2 = new THREE.Mesh(smallSphereGeometry, material);
  satellite2.position.set(0, 1.1, 0);
  group.add(satellite2);
  
  // Third satellite
  const satellite3 = new THREE.Mesh(smallSphereGeometry, material);
  satellite3.position.set(0, 0, 1.2);
  group.add(satellite3);
  
  return group;
};

/**
 * Creates a more complex listening shape - organic disks inside a crystal ball
 * @param material The material to use for the inner disks
 * @returns A THREE.Group containing the crystal ball and undulating disks
 */
export const createListeningShape = (material: THREE.Material): THREE.Group => {
  const group = new THREE.Group();
  
  // Create crystal ball shell with a specialized glass material
  const crystalBallGeometry = new THREE.SphereGeometry(1.2, 48, 48);
  
  // Create special crystal material that's highly reflective and translucent
  const crystalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.95, // Highly transparent
    transparent: true,
    envMapIntensity: 1.8, // Strong reflections
    clearcoat: 1.0, // Maximum clearcoat
    clearcoatRoughness: 0.1,
    ior: 1.5, // Glass IOR
    reflectivity: 0.8,
    thickness: 0.5
  });
  
  // Create the crystal ball
  const crystalBall = new THREE.Mesh(crystalBallGeometry, crystalMaterial);
  group.add(crystalBall);
  
  // Create 6 organic disks that will float and undulate inside the crystal ball
  const diskColors = [
    0x4af5a2, // main color
    0x4af5c2, // slight variant
    0x3ae592,
    0x35d583,
    0x42ffaa,
    0x30c580
  ];
  
  // Create a container for all disks to keep them centered
  const diskContainer = new THREE.Group();
  group.add(diskContainer);
  
  // Create disks with different orientations but all centered at origin
  for (let i = 0; i < 6; i++) {
    // Create a disk with more vertices for smoother waves
    const diskGeometry = new THREE.CircleGeometry(0.5, 64);
    
    // Store the original vertex positions for wave animation
    const positionAttribute = diskGeometry.attributes.position;
    const originalPositions = [];
    
    for (let j = 0; j < positionAttribute.count; j++) {
      originalPositions.push({
        x: positionAttribute.getX(j),
        y: positionAttribute.getY(j),
        z: positionAttribute.getZ(j)
      });
    }
    
    // Use the provided material but with some customization
    const diskMaterial = material.clone();
    if (diskMaterial instanceof THREE.MeshStandardMaterial || 
        diskMaterial instanceof THREE.MeshPhysicalMaterial) {
      // Apply a unique color from our palette
      diskMaterial.color.setHex(diskColors[i]);
      diskMaterial.emissive.setHex(diskColors[i]);
      diskMaterial.emissiveIntensity = 0.3;
    }
    
    const disk = new THREE.Mesh(diskGeometry, diskMaterial);
    
    // Distribute the disks evenly in different orientations but all centered
    switch (i) {
      case 0: // Top disk (XY plane)
        disk.rotation.set(0, 0, 0);
        break;
      case 1: // Bottom disk (XY plane)
        disk.rotation.set(Math.PI, 0, 0);
        break;
      case 2: // Front disk (YZ plane)
        disk.rotation.set(0, Math.PI/2, 0);
        break;
      case 3: // Back disk (YZ plane)
        disk.rotation.set(0, -Math.PI/2, 0);
        break;
      case 4: // Left disk (XZ plane)
        disk.rotation.set(Math.PI/2, 0, 0);
        break;
      case 5: // Right disk (XZ plane)
        disk.rotation.set(-Math.PI/2, 0, 0);
        break;
    }
    
    // Store data for animation including original vertex positions
    disk.userData = {
      originalPositions: originalPositions,
      animationData: {
        phaseOffset: i * (Math.PI / 3), // Evenly distributed phases
        frequency: 0.3 + (i * 0.12), // Different frequencies
        amplitude: 0.08 + (i * 0.01), // Slightly different amplitudes
        noiseScale: 0.6 + (i * 0.05), // Scale for noise function
        noiseSpeed: 0.2 + (i * 0.05), // Speed of noise animation
        noiseSeed: i * 42 // Different seed for each disk
      },
      rotationSpeed: {
        x: 0,
        y: 0,
        z: 0.005 + (i * 0.003) // Slight rotation, different for each disk
      }
    };
    
    diskContainer.add(disk);
  }
  
  return group;
};

/**
 * Creates a more complex thinking shape - a dodecahedron with orbiting particles
 * @param material The material to use for the shape
 * @returns A THREE.Group containing the shape and its decorative elements
 */
export const createThinkingShape = (material: THREE.Material): THREE.Group => {
  const group = new THREE.Group();
  
  // Main dodecahedron shape
  const dodecahedronGeometry = new THREE.DodecahedronGeometry(0.8, 0);
  const dodecahedron = new THREE.Mesh(dodecahedronGeometry, material);
  group.add(dodecahedron);
  
  // "Thought bubbles" - small spheres in a spiral pattern
  const smallSphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
  
  // Create a spiral of small spheres
  const spiralCount = 10;
  for (let i = 0; i < spiralCount; i++) {
    const sphere = new THREE.Mesh(smallSphereGeometry, material);
    
    // Create a spiral pattern
    const angle = i * 0.5;
    const radius = 0.9 + i * 0.12;
    const height = 0.8 + i * 0.15;
    
    sphere.position.set(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );
    
    // Make spheres smaller as they go up
    const scale = 1 - i * 0.07;
    sphere.scale.set(scale, scale, scale);
    
    group.add(sphere);
  }
  
  // Add a "thinking cap" - flattened cone on top
  const capGeometry = new THREE.ConeGeometry(0.3, 0.2, 16);
  const cap = new THREE.Mesh(capGeometry, material);
  cap.position.set(0, 1.1, 0);
  cap.rotation.z = Math.PI * 0.05; // Tilt slightly for effect
  group.add(cap);
  
  return group;
};

/**
 * Creates a more complex talking shape - a torus with emanating wave elements
 * @param material The material to use for the shape
 * @returns A THREE.Group containing the shape and its decorative elements
 */
export const createTalkingShape = (material: THREE.Material): THREE.Group => {
  const group = new THREE.Group();
  
  // Main torus
  const torusGeometry = new THREE.TorusGeometry(0.8, 0.25, 16, 48);
  const torus = new THREE.Mesh(torusGeometry, material);
  torus.rotation.x = Math.PI / 2;
  group.add(torus);
  
  // Add "sound wave" circular rings emanating from the center
  const waveCount = 4;
  for (let i = 1; i <= waveCount; i++) {
    const ringGeometry = new THREE.TorusGeometry(0.8 + i * 0.25, 0.03, 8, 36);
    const ring = new THREE.Mesh(ringGeometry, material);
    ring.rotation.x = Math.PI / 2;
    
    // Make outer rings slightly transparent
    if (i > 1 && material instanceof THREE.MeshStandardMaterial) {
      // Create a new material that inherits from the original but has transparency
      const ringMaterial = material.clone();
      ringMaterial.transparent = true;
      ringMaterial.opacity = 1 - (i - 1) * 0.25; // Decrease opacity for outer rings
      ring.material = ringMaterial;
    }
    
    group.add(ring);
  }
  
  // Add decorative elements representing sound direction
  const coneGeometry = new THREE.ConeGeometry(0.15, 0.3, 16);
  
  // Create cones at regular intervals around the torus
  const coneCount = 8;
  for (let i = 0; i < coneCount; i++) {
    const cone = new THREE.Mesh(coneGeometry, material);
    const angle = (i / coneCount) * Math.PI * 2;
    
    // Position cones around the torus
    cone.position.set(
      Math.cos(angle) * 0.8,
      0.5, // Slight offset in Y
      Math.sin(angle) * 0.8
    );
    
    // Point outward from the center
    cone.lookAt(
      Math.cos(angle) * 2,
      0.5,
      Math.sin(angle) * 2
    );
    
    group.add(cone);
  }
  
  return group;
};

/**
 * Creates all complex shapes for different animation states
 * @param material The material to use for all shapes
 * @returns An object containing all shapes organized by animation state
 */
export const createComplexShapes = (material: THREE.Material): Record<AnimationState, THREE.Group> => {
  return {
    idle: createIdleShape(material),
    listening: createListeningShape(material),
    thinking: createThinkingShape(material),
    talking: createTalkingShape(material)
  };
};

/**
 * Update animations for complex shapes
 * @param shapes Object containing all shape groups
 * @param currentState Current animation state
 * @param time Animation time value 
 */
export const updateComplexShapeAnimations = (
  shapes: Record<AnimationState, THREE.Group>,
  currentState: AnimationState,
  time: number
) => {
  // Get the current active shape
  const activeShape = shapes[currentState];
  
  // Apply animations based on the current state
  switch (currentState) {
    case 'idle':
      // Rotate the main shape
      activeShape.rotation.y += 0.01;
      
      // Rotate the rings in opposite directions
      if (activeShape.children[1]) activeShape.children[1].rotation.z += 0.005;
      if (activeShape.children[2]) activeShape.children[2].rotation.z -= 0.008;
      
      // Make the satellites orbit
      for (let i = 3; i < 6; i++) {
        if (activeShape.children[i]) {
          // Get the current position
          const child = activeShape.children[i];
          const pos = child.position;
          
          // Calculate new position in orbital path
          const speed = 0.02 * (i - 2); // Different speeds for each satellite
          const angle = time * speed;
          let x, y, z;
          
          // Create different orbital planes for each satellite
          if (i === 3) {
            x = Math.cos(angle) * 1.2;
            y = Math.sin(angle) * 0.3;
            z = Math.sin(angle) * 1.2;
          } else if (i === 4) {
            x = Math.sin(angle) * 0.3;
            y = Math.cos(angle) * 1.1;
            z = Math.sin(angle) * 1.1;
          } else {
            x = Math.cos(angle) * 0.9;
            y = Math.sin(angle) * 0.9;
            z = Math.cos(angle * 0.7) * 1.2;
          }
          
          // Update position
          child.position.set(x, y, z);
        }
      }
      break;
      
    case 'listening':
      // Subtle rotation for the crystal ball
      if (activeShape.children[0]) {
        activeShape.children[0].rotation.y += 0.002;
        activeShape.children[0].rotation.x += 0.001;
      }
      
      // Get the disk container (child index 1)
      if (activeShape.children[1] && activeShape.children[1] instanceof THREE.Group) {
        const diskContainer = activeShape.children[1];
        
        // Subtle global rotation
        diskContainer.rotation.y += 0.001;
        
        // Animate each disk with water-like wave effects
        for (let i = 0; i < diskContainer.children.length; i++) {
          const disk = diskContainer.children[i];
          
          if (disk instanceof THREE.Mesh && disk.userData) {
            const userData = disk.userData;
            const animData = userData.animationData;
            const rotSpeed = userData.rotationSpeed;
            const originalPositions = userData.originalPositions;
            
            if (!animData || !originalPositions) continue;
            
            // Rotate the disk at its specific speed
            disk.rotation.z += rotSpeed.z;
            
            // Apply perlin-like noise to create water wave effect on vertices
            if (disk.geometry.attributes.position) {
              const positionAttribute = disk.geometry.attributes.position;
              
              // Current time with offset for this specific disk
              const currentTime = time + animData.phaseOffset;
              
              // Apply wave deformation to each vertex
              for (let j = 0; j < positionAttribute.count; j++) {
                const origPos = originalPositions[j];
                
                // Skip center vertex to maintain disk structure
                if (origPos.x === 0 && origPos.y === 0) {
                  continue;
                }
                
                // Get distance from center for radial waves
                const distance = Math.sqrt(origPos.x * origPos.x + origPos.y * origPos.y);
                
                // Skip if too close to center
                if (distance < 0.05) continue;
                
                // Calculate normalized position for noise
                const normX = origPos.x / distance;
                const normY = origPos.y / distance;
                
                // Get multiple noise samples at different frequencies for more complex waves
                const noise1 = noise2D(
                  normX * animData.noiseScale, 
                  normY * animData.noiseScale, 
                  currentTime * animData.noiseSpeed + animData.noiseSeed
                ) * 2 - 1; // Range -1 to 1
                
                const noise2 = noise2D(
                  normX * animData.noiseScale * 2, 
                  normY * animData.noiseScale * 2, 
                  currentTime * animData.noiseSpeed * 1.5 + animData.noiseSeed + 100
                ) * 2 - 1; // Range -1 to 1
                
                // Combine noise samples
                const noiseValue = (noise1 * 0.7 + noise2 * 0.3) * animData.amplitude;
                
                // Add radial waves 
                const radialWave = Math.sin(distance * 8 - currentTime * animData.frequency) * 
                                   animData.amplitude * 0.5 * (distance / 0.5);
                
                // Combine noise and waves
                const totalDisplacement = noiseValue + radialWave;
                
                // Apply displacement along normal (z-axis for a circle)
                positionAttribute.setZ(j, origPos.z + totalDisplacement);
              }
              
              // Update the geometry
              positionAttribute.needsUpdate = true;
            }
            
            // Pulse the emission intensity for a glowing effect
            if (disk.material instanceof THREE.MeshStandardMaterial || 
                disk.material instanceof THREE.MeshPhysicalMaterial) {
              disk.material.emissiveIntensity = 
                0.3 + Math.sin(time * animData.frequency + animData.phaseOffset) * 0.2;
            }
          }
        }
      }
      break;
      
    case 'thinking':
      // Rotate the main dodecahedron
      if (activeShape.children[0]) {
        activeShape.children[0].rotation.y += 0.01;
        activeShape.children[0].rotation.z += 0.005;
      }
      
      // Animate the thought bubble spirals
      for (let i = 1; i < 11; i++) {
        if (activeShape.children[i]) {
          const bubble = activeShape.children[i];
          const originalPos = bubble.position.clone();
          const angle = time * 0.3 + i * 0.5;
          
          // Add a small bobbing motion
          const bobAmount = 0.05;
          const bobSpeed = 2 + i * 0.2;
          bubble.position.y = originalPos.y + Math.sin(time * bobSpeed) * bobAmount;
          
          // Rotate around the spiral
          const radius = originalPos.length() - bobAmount;
          bubble.position.x = Math.cos(angle) * radius;
          bubble.position.z = Math.sin(angle) * radius;
        }
      }
      
      // Make the thinking cap wobble
      if (activeShape.children[activeShape.children.length - 1]) {
        const cap = activeShape.children[activeShape.children.length - 1];
        cap.rotation.z = Math.PI * 0.05 + Math.sin(time * 2) * 0.1;
      }
      break;
      
    case 'talking':
      // Rotate the main torus
      if (activeShape.children[0]) {
        activeShape.children[0].rotation.z += 0.02;
      }
      
      // Animate the sound wave rings
      for (let i = 1; i <= 4; i++) {
        if (activeShape.children[i]) {
          const ring = activeShape.children[i];
          
          // Pulsing scale effect
          const pulseSpeed = 1 + i * 0.2;
          const pulseBase = 1 + (i - 1) * 0.25; // Base scale for each ring
          const pulseAmount = 0.1;
          const scale = pulseBase + Math.sin(time * pulseSpeed) * pulseAmount;
          
          ring.scale.set(scale, scale, scale);
        }
      }
      
      // Animate the directional cones
      for (let i = 5; i < activeShape.children.length; i++) {
        if (activeShape.children[i]) {
          const cone = activeShape.children[i];
          const index = i - 5;
          
          // Pulsing movement outward
          const originalPos = cone.position.clone().normalize();
          const baseDistance = 0.8; // Base distance from center
          const pulseAmount = 0.15;
          const pulseSpeed = 1.5;
          
          // Calculate new distance with pulse (staggered by index)
          const newDist = baseDistance + Math.sin(time * pulseSpeed + index * 0.7) * pulseAmount;
          
          // Apply new position
          cone.position.copy(originalPos.multiplyScalar(newDist));
          cone.position.y = 0.5; // Maintain Y position
          
          // Keep pointing outward
          const targetPos = originalPos.multiplyScalar(newDist + 1);
          targetPos.y = 0.5;
          cone.lookAt(targetPos);
        }
      }
      break;
  }
};
