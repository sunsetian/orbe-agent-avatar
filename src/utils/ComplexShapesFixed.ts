// Modified ComplexShapes.ts with improved mouse handling
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
 * Helper function to make sure mouse data is valid
 * This addresses potential null/undefined issues
 */
const validateMousePosition = (mousePosition?: {x: number, y: number}): {x: number, y: number} | undefined => {
  if (!mousePosition) return undefined;
  
  // Check for NaN values which can break animations
  if (isNaN(mousePosition.x) || isNaN(mousePosition.y)) {
    console.warn('Invalid mouse position detected:', mousePosition);
    return undefined;
  }
  
  // Ensure values are in range -1 to 1
  const x = Math.max(-1, Math.min(1, mousePosition.x));
  const y = Math.max(-1, Math.min(1, mousePosition.y));
  
  return { x, y };
}

/**
 * Update animations for complex shapes
 * @param shapes Object containing all shape groups
 * @param currentState Current animation state
 * @param time Animation time value 
 * @param mousePosition Optional mouse position for interactive effects
 */
export const updateComplexShapeAnimations = (
  shapes: Record<AnimationState, THREE.Group>,
  currentState: AnimationState,
  time: number,
  mousePosition?: {x: number, y: number}
) => {
  // Validate mouse position to prevent errors
  const validMousePosition = validateMousePosition(mousePosition);
  const hasMouseInteraction = validMousePosition !== undefined;
  
  // Always log when in listening state to help debug
  if (currentState === 'listening' && Math.floor(time) % 2 === 0) {
    console.info('Mouse interaction status:', {
      state: currentState,
      time: time.toFixed(2),
      hasMouseInteraction,
      mouseData: validMousePosition 
        ? `x:${validMousePosition.x.toFixed(2)} y:${validMousePosition.y.toFixed(2)}`
        : 'none'
    });
  }
  
  // Add performance measurement
  console.time('animation-frame');
  
  // Get the current active shape
  const activeShape = shapes[currentState];
  
  // Track frame - helps with debugging
  console.log('ANIMATION FRAME:', {
    state: currentState,
    time: time.toFixed(2),
    mouseActive: hasMouseInteraction
  });
  
  // Apply animations based on the current state
  switch (currentState) {
    case 'listening':
      // Special handling for listening state with mouse interaction
      animateListeningShape(activeShape, time, validMousePosition, hasMouseInteraction);
      break;
      
    case 'idle':
      // Basic idle animations
      animateIdleShape(activeShape, time);
      break;
      
    case 'thinking':
      // Thinking animations
      animateThinkingShape(activeShape, time, validMousePosition);
      break;
      
    case 'talking':
      // Talking animations
      animateTalkingShape(activeShape, time, validMousePosition);
      break;
  }
  
  console.timeEnd('animation-frame');
};

/**
 * Enhanced animation for the listening state shape
 */
const animateListeningShape = (
  activeShape: THREE.Group, 
  time: number, 
  mousePosition?: {x: number, y: number},
  hasMouseInteraction: boolean = false
) => {
  // Force log mouse data to verify it's reaching this point
  console.warn('LISTENING ANIMATION:', {
    time: time.toFixed(2),
    mouseData: mousePosition ? `x:${mousePosition.x.toFixed(2)} y:${mousePosition.y.toFixed(2)}` : 'none'
  });
  
  // Initialize tracking data if needed
  if (!activeShape.userData.prevPositions) {
    activeShape.userData.prevPositions = [];
    activeShape.userData.lastLogTime = time;
  }
  
  // Subtle rotation for the crystal ball
  if (activeShape.children[0]) {
    const crystalBall = activeShape.children[0];
    
    // Base rotation
    crystalBall.rotation.y += 0.002;
    crystalBall.rotation.x += 0.001;
    
    // Apply mouse-influenced rotation if mouse is active
    if (hasMouseInteraction) {
      // Enhanced tilt based on mouse position
      crystalBall.rotation.x += mousePosition!.y * 0.002; // Doubled for more visibility
      crystalBall.rotation.y += mousePosition!.x * 0.002; 
      
      // Modify crystal ball material properties based on mouse position
      if (crystalBall instanceof THREE.Mesh && 
          crystalBall.material instanceof THREE.MeshPhysicalMaterial) {
        
        // Change opacity based on mouse Y position
        const baseOpacity = 0.15;
        crystalBall.material.opacity = baseOpacity - (mousePosition!.y * 0.05);
        
        // Change reflectiveness based on mouse X position
        const baseMetalness = 0.9;
        crystalBall.material.metalness = baseMetalness + (mousePosition!.x * 0.05);
        
        // Change transmission based on mouse distance from center
        const mouseDistance = Math.sqrt(mousePosition!.x * mousePosition!.x + mousePosition!.y * mousePosition!.y);
        crystalBall.material.transmission = 0.95 - (mouseDistance * 0.05);
      }
    }
  }
  
  // Get the disk container
  if (activeShape.children.length > 1 && activeShape.children[1] instanceof THREE.Group) {
    const diskContainer = activeShape.children[1];
    
    // Adding rotation to the overall disk container for more dynamic movement
    diskContainer.rotation.x += 0.001;
    diskContainer.rotation.z += 0.001;
    
    // Apply mouse-based position offset to the container
    if (hasMouseInteraction) {
      const targetX = mousePosition!.x * 0.2; // Reduced for subtle movement
      const targetY = mousePosition!.y * 0.2;
      
      // Smooth transition to target position
      const smoothFactor = 0.05;
      diskContainer.position.x += (targetX - diskContainer.position.x) * smoothFactor;
      diskContainer.position.y += (targetY - diskContainer.position.y) * smoothFactor;
    }
    
    // Animate each disk in the container
    for (let i = 0; i < diskContainer.children.length; i++) {
      const disk = diskContainer.children[i];
      if (!(disk instanceof THREE.Mesh)) continue;
      
      // Get animation data for this disk
      const userData = disk.userData;
      if (!userData || !userData.originalPositions) continue;
      
      const originalPositions = userData.originalPositions;
      const animData = userData.animationData;
      const rotationSpeed = userData.rotationSpeed;
      
      // Apply rotation
      disk.rotation.x += rotationSpeed.x;
      disk.rotation.y += rotationSpeed.y;
      disk.rotation.z += rotationSpeed.z;
      
      // Apply movement animation
      const moveSpeed = animData.moveSpeed;
      const moveRadius = animData.moveRadius;
      const movePhase = animData.movePhase;
      const movePattern = animData.movePattern;
      
      // Calculate time with phase offset for this disk
      const angle = time * moveSpeed + movePhase;
      
      // Variables for position
      let posX = 0, posY = 0, posZ = 0;
      
      // Apply different movement patterns
      switch (movePattern) {
        case 0:
          // Disc 0: Moves in figure-8 pattern, highly responsive to mouse
          if (hasMouseInteraction) {
            // Enhanced figure-8 with mouse influence
            posX = Math.sin(angle * 2) * moveRadius * (0.8 + Math.abs(mousePosition!.x) * 0.4);
            posY = Math.cos(angle) * Math.sin(angle) * moveRadius * (0.8 + Math.abs(mousePosition!.y) * 0.4);
            posZ = mousePosition!.x * mousePosition!.y * 0.2; // Creates Z-movement based on mouse diagonal
          } else {
            // Default figure-8 pattern
            posX = Math.sin(angle * 2) * moveRadius;
            posY = Math.cos(angle) * Math.sin(angle) * moveRadius;
            posZ = 0;
          }
          break;
          
        case 1:
          // Disc 1: Circular orbit around center, with mouse influencing height
          if (hasMouseInteraction) {
            posX = Math.sin(angle) * moveRadius;
            // Y position now more strongly influenced by mouse Y position
            posY = Math.cos(angle) * moveRadius * 0.3 + (mousePosition!.y * 0.4); 
            posZ = Math.cos(angle) * moveRadius;
          } else {
            // Default circular orbit
            posX = Math.sin(angle) * moveRadius;
            posY = Math.cos(angle) * moveRadius * 0.3;
            posZ = Math.cos(angle) * moveRadius;
          }
          break;
          
        case 2:
          // Disc 2: Orbit with mouse influence on orbit shape
          if (hasMouseInteraction) {
            // Mouse affects orbit shape - makes it more elliptical
            const xRadius = moveRadius * (1 + Math.abs(mousePosition!.x) * 0.7); // Increased influence
            const zRadius = moveRadius * (1 + Math.abs(mousePosition!.y) * 0.7);
            posX = Math.sin(angle) * xRadius;
            posY = mousePosition!.y * 0.3; // Increased Y movement with mouse
            posZ = Math.cos(angle) * zRadius;
          } else {
            // Default XZ plane orbit
            posX = Math.sin(angle) * moveRadius;
            posY = 0;
            posZ = Math.cos(angle) * moveRadius;
          }
          break;
          
        case 3:
          // Disc 3: Complex motion pattern, moderately affected by mouse
          if (hasMouseInteraction) {
            const intensity = Math.sqrt(mousePosition!.x * mousePosition!.x + mousePosition!.y * mousePosition!.y);
            const adjustedSpeed = 0.5 + (intensity * 0.4); // Increased speed influence
            const adjustedAngle = time * adjustedSpeed + i * (Math.PI / 3);
            
            // More pronounced mouse influence
            posX = Math.sin(adjustedAngle) * moveRadius * (1 + mousePosition!.x * 0.4);
            posY = Math.cos(adjustedAngle) * moveRadius * (1 + mousePosition!.y * 0.4);
            posZ = Math.sin(adjustedAngle * 0.7) * moveRadius * 0.6;
          } else {
            // Default diagonal motion
            posX = Math.sin(angle) * moveRadius;
            posY = Math.cos(angle) * moveRadius;
            posZ = Math.sin(angle) * moveRadius * 0.5;
          }
          break;
          
        case 4:
          // Disc 4: Up and down motion with mouse influence on positioning
          if (hasMouseInteraction) {
            posX = Math.sin(angle) * moveRadius * 0.5 + (mousePosition!.x * 0.4); // Increased influence
            posY = Math.cos(angle) * moveRadius + (mousePosition!.y * 0.7); // Stronger vertical influence
            posZ = mousePosition!.x * mousePosition!.y * 0.4; // Enhanced depth effect
          } else {
            // Default up/down pattern
            posX = Math.sin(angle) * moveRadius * 0.5;
            posY = Math.cos(angle) * moveRadius;
            posZ = 0;
          }
          break;
          
        case 5:
          // Disc 5: Side to side motion with reactive motion to mouse movements
          if (hasMouseInteraction) {
            const reactivity = 0.5 + (Math.cos(time) * 0.5); // Oscillating reactivity
            posX = Math.cos(angle) * moveRadius + (mousePosition!.x * reactivity * 1.3); // Enhanced reactivity
            posY = mousePosition!.y * 0.5; // Increased vertical influence
            posZ = Math.sin(angle) * moveRadius * 0.5 + (Math.abs(mousePosition!.x) * 0.3);
          } else {
            // Default side-to-side pattern
            posX = Math.cos(angle) * moveRadius;
            posY = 0;
            posZ = Math.sin(angle) * moveRadius * 0.5;
          }
          break;
      }
      
      // Apply the calculated position
      disk.position.set(posX, posY, posZ);
      
      // Apply perlin-like noise to create water wave effect on vertices
      if (disk.geometry.attributes.position) {
        const positionAttribute = disk.geometry.attributes.position;
        
        // Current time with offset for this specific disk
        const currentTime = time + animData.phaseOffset;
        
        // Modify wave properties based on mouse position if available
        let amplitude = animData.amplitude;
        let frequency = animData.frequency; 
        let noiseScale = animData.noiseScale;
        let noiseSpeed = animData.noiseSpeed;
        
        if (hasMouseInteraction) {
          // Increase amplitude when mouse is more active (further from center)
          const mouseDist = Math.sqrt(mousePosition!.x * mousePosition!.x + mousePosition!.y * mousePosition!.y);
          amplitude *= (1 + mouseDist * 0.7); // Increased to 70% for more dramatic effect
          
          // Adjust frequency based on horizontal mouse position - more pronounced
          frequency *= (1 + mousePosition!.x * 0.3);
          
          // Adjust noise scale based on vertical mouse position - more pronounced
          noiseScale *= (1 + mousePosition!.y * 0.4);
          
          // Speed up waves when mouse is active - more pronounced
          noiseSpeed *= (1 + mouseDist * 0.5);
        }

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
          
          // Get noise samples at different frequencies for more complex waves
          const noise1 = noise2D(
            normX * noiseScale, 
            normY * noiseScale, 
            currentTime * noiseSpeed + animData.noiseSeed
          ) * 2 - 1; // Range -1 to 1
          
          const noise2 = noise2D(
            normX * noiseScale * 2, 
            normY * noiseScale * 2, 
            currentTime * noiseSpeed * 1.5 + animData.noiseSeed + 100
          ) * 2 - 1; // Range -1 to 1
          
          // Add mouse influence to specific vertices
          let mouseInfluence = 0;
          if (hasMouseInteraction) {
            // Create a directional wave that follows mouse movement
            // This makes waves appear to emanate from the direction of mouse movement
            const mouseAngle = Math.atan2(mousePosition!.y, mousePosition!.x);
            const vertexAngle = Math.atan2(normY, normX);
            const angleDiff = Math.abs(mouseAngle - vertexAngle);
            
            // Vertices pointing toward mouse direction get enhanced waves
            if (angleDiff < 0.8) {
              const mouseDist = Math.sqrt(mousePosition!.x * mousePosition!.x + mousePosition!.y * mousePosition!.y);
              // Increased influence factor from 0.15 to 0.2
              mouseInfluence = (1 - angleDiff/0.8) * mouseDist * 0.2;
            }
          }
          
          // Combine noise samples
          const noiseValue = (noise1 * 0.7 + noise2 * 0.3) * amplitude;
          
          // Add radial waves, enhanced by mouse influence 
          const radialWave = Math.sin(distance * 8 - currentTime * frequency) * 
                           amplitude * 0.5 * (distance / 0.5);
          
          // Combine all wave effects
          const totalDisplacement = noiseValue + radialWave + mouseInfluence;
          
          // Apply displacement along normal (z-axis for a circle)
          positionAttribute.setZ(j, origPos.z + totalDisplacement);
        }
        
        // Update geometry after modifying vertices
        positionAttribute.needsUpdate = true;
      }
    }
  }
};

/**
 * Animation for the idle state shape
 */
const animateIdleShape = (activeShape: THREE.Group, time: number) => {
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
};

/**
 * Animation for thinking state shape
 */
const animateThinkingShape = (
  activeShape: THREE.Group, 
  time: number,
  mousePosition?: {x: number, y: number}
) => {
  // Base rotation for dodecahedron
  if (activeShape.children[0]) {
    activeShape.children[0].rotation.y += 0.01;
    activeShape.children[0].rotation.x += 0.005;
  }
  
  // Animate thought bubbles
  const spiralCount = Math.min(10, activeShape.children.length - 2); // Subtracting main shape and cap
  for (let i = 1; i <= spiralCount; i++) {
    const bubble = activeShape.children[i];
    if (!bubble) continue;
    
    const baseSpeed = 0.3 + (i * 0.15); // Faster for outer bubbles
    const angle = time * (0.1 + i * 0.02) + i;
    const baseRadius = 0.9 + i * 0.12;
    const baseHeight = 0.8 + i * 0.15;
    
    // Add orbital motion
    let radius = baseRadius;
    let height = baseHeight;
    
    // Add mouse influence if available
    if (mousePosition) {
      // Mouse X makes the spiral wider/narrower
      radius *= (1 + mousePosition.x * 0.1);
      // Mouse Y makes the spiral taller/shorter
      height += mousePosition.y * 0.1;
    }
    
    // New position in spiral pattern
    const x = Math.cos(angle) * radius;
    const y = height + Math.sin(time * baseSpeed + i) * 0.05; // Add slight bobbing
    const z = Math.sin(angle) * radius;
    
    // Update position
    bubble.position.set(x, y, z);
    
    // Add slight rotation to each bubble
    bubble.rotation.x += 0.01;
    bubble.rotation.z += 0.01;
    
    // Pulse scale slightly
    const scale = 1 - i * 0.07; // Base scale (smaller for outer bubbles)
    const pulse = scale + Math.sin(time * 3 + i) * 0.03; // Add pulsing
    bubble.scale.set(pulse, pulse, pulse);
  }
  
  // Animate the thinking cap
  if (activeShape.children[activeShape.children.length - 1]) {
    const cap = activeShape.children[activeShape.children.length - 1];
    // Make it wobble slightly
    cap.rotation.z = Math.PI * 0.05 + Math.sin(time * 2) * 0.05;
  }
};

/**
 * Animation for talking state shape
 */
const animateTalkingShape = (
  activeShape: THREE.Group, 
  time: number,
  mousePosition?: {x: number, y: number}
) => {
  // Rotate the main torus
  if (activeShape.children[0]) {
    activeShape.children[0].rotation.y += 0.01;
  }
  
  // Find the sound wave rings
  const waveCount = 4;
  for (let i = 1; i <= waveCount; i++) {
    if (!activeShape.children[i]) continue;
    
    const ring = activeShape.children[i];
    
    // Make the rings pulse
    const baseScale = 0.8 + i * 0.25;
    let scale = baseScale + Math.sin(time * 3 + i * 0.7) * 0.1;
    
    // Add mouse influence
    if (mousePosition) {
      // More rapid pulsing when mouse is active
      const mouseDist = Math.sqrt(mousePosition.x * mousePosition.x + mousePosition.y * mousePosition.y);
      scale += Math.sin(time * (5 + mouseDist * 3) + i) * 0.05;
    }
    
    ring.scale.set(scale, scale, scale);
    
    // Make outer rings more transparent when mouse is at edges
    // First check if the ring is a Mesh (which has the material property)
    if (ring instanceof THREE.Mesh && 
        ring.material instanceof THREE.MeshStandardMaterial && 
        mousePosition && i > 1) {
      const baseOpacity = 1 - (i - 1) * 0.25; // Original opacity calculation
      
      // Increase transparency when mouse is at the edges (higher magnitude)
      const mouseDist = Math.sqrt(mousePosition.x * mousePosition.x + mousePosition.y * mousePosition.y);
      const adjustedOpacity = baseOpacity * (1 - mouseDist * 0.2);
      
      // Apply with limits
      ring.material.opacity = Math.max(0.1, Math.min(1, adjustedOpacity));
    }
  }
  
  // Animate the sound direction cones
  const coneStartIndex = waveCount + 1;
  const coneCount = Math.max(0, activeShape.children.length - coneStartIndex);
  
  for (let i = 0; i < coneCount; i++) {
    const coneIndex = coneStartIndex + i;
    if (!activeShape.children[coneIndex]) continue;
    
    const cone = activeShape.children[coneIndex];
    
    // Base pulsing movement
    const pulseAmp = 0.05 + Math.sin(time + i) * 0.02;
    const pulseFreq = 3 + i * 0.2;
    const pulse = Math.sin(time * pulseFreq + i) * pulseAmp;
    
    // Get original position
    const angle = (i / coneCount) * Math.PI * 2;
    const baseRad = 0.8; // Torus radius
    const baseDist = 0.25; // Torus thickness
    
    let rad = baseRad + baseDist + pulse;
    
    // Add mouse influence
    if (mousePosition) {
      // Calculate angle to mouse position
      const mouseAngle = Math.atan2(mousePosition.y, mousePosition.x);
      const angleDiff = Math.abs(angle - mouseAngle);
      const wrappedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
      
      // Cones closer to mouse direction extend further
      if (wrappedDiff < Math.PI / 2) {
        const factor = 1 - (wrappedDiff / (Math.PI / 2)); // 1 when aligned, 0 when perpendicular
        rad += factor * 0.2;
      }
    }
    
    // Position around torus
    const x = Math.cos(angle) * rad;
    const y = 0;
    const z = Math.sin(angle) * rad;
    cone.position.set(x, y, z);
    
    // Point outward from center
    cone.lookAt(x * 2, y, z * 2);
  }
};

// Re-export any existing functions that are used elsewhere
export {
  createIdleShape, 
  createListeningShape, 
  createThinkingShape, 
  createTalkingShape
} from './ComplexShapes';
