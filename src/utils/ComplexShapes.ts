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
  
  // Create crystal ball shell
  const crystalBallGeometry = new THREE.SphereGeometry(1.2, 48, 48);
  
  // Create a highly reflective, completely translucent material for the crystal ball
  const crystalMaterial = material.clone();
  
  // If we're working with standard materials, we can adjust some properties
  if (crystalMaterial instanceof THREE.MeshStandardMaterial || 
      crystalMaterial instanceof THREE.MeshPhysicalMaterial) {
    // Maximize reflectivity and make it completely transparent
    crystalMaterial.metalness = 0.9;
    crystalMaterial.roughness = 0.05;
    crystalMaterial.envMapIntensity = 2.0;
    
    // Make it fully translucent
    crystalMaterial.transparent = true;
    crystalMaterial.opacity = 0.15;
    
    // Add extra properties if it's a physical material
    if (crystalMaterial instanceof THREE.MeshPhysicalMaterial) {
      crystalMaterial.transmission = 0.95;
      crystalMaterial.clearcoat = 1.0;
      crystalMaterial.clearcoatRoughness = 0.02;
      crystalMaterial.ior = 2.33; // Diamond-like refraction
    }
  }
  
  // Create the crystal ball
  const crystalBall = new THREE.Mesh(crystalBallGeometry, crystalMaterial);
  group.add(crystalBall);
  
  // Create 6 organic disks that will float and undulate inside the crystal ball
  // Using colors that match better with the main material, more blue-tinted since idle state spheres are bluish
  const diskColors = [
    0x4a9ff5, // main color - matching idle state spheres
    0x4a8cf5, // slight variant
    0x3a85e5,
    0x357ad5,
    0x42a2ff,
    0x3080c5
  ];
  
  // Create a container for all disks to keep them centered
  const diskContainer = new THREE.Group();
  group.add(diskContainer);
  
  // Create 3D tori (rings) with different orientations but all centered at origin
  for (let i = 0; i < 3; i++) {
    // Create actual 3D tori instead of flat rings
    // params: radius, tube radius, radial segments, tubular segments
    const diskGeometry = new THREE.TorusGeometry(0.6, 0.5, 16, 32);

    diskGeometry.scale(1, 1, 0.1); // Flatten the torus to make it more disk-like
    
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
      diskMaterial.emissiveIntensity = 0.5; // Increased emissive intensity
      
      // Make the disks more reflective
      diskMaterial.metalness = 0.7;
      diskMaterial.roughness = 0.02;
      diskMaterial.envMapIntensity = 1.2;
    }
    
    const disk = new THREE.Mesh(diskGeometry, diskMaterial);
    
    // Distribute the 3 disks evenly in different orientations but all centered
    switch (i) {
      case 0: // Top disk (XY plane)
        disk.rotation.set(0, 0, 0); // Keep flat on XY plane
        break;
      case 1: // Side disk (YZ plane)
        disk.rotation.set(0, Math.PI/2, 0); // Rotate to YZ plane
        break;
      case 2: // Angled disk (at 45 degrees)
        disk.rotation.set(Math.PI/4, Math.PI/4, 0); // Set at 45 degree angle for interesting effect
        break;
    }
    
    // Enhanced data for independent disc animation with more distinctive parameters
    disk.userData = {
      originalPositions: originalPositions,
      discIndex: i, // Store disc index for reference
      animationData: {
        phaseOffset: i * (Math.PI / 3 * 2), // More widely distributed phases
        frequency: 0.4 + (i * 0.2), // More difference in frequencies
        amplitude: 0.15 + (i * 0.05), // More difference in amplitudes
        noiseScale: 0.7 + (i * 0.15), // Enhanced scale for noise function
        noiseSpeed: 0.3 + (i * 0.12), // More difference in animation speeds
        noiseSeed: i * 100, // More widely spaced seeds for more distinct patterns
        
        // Enhanced movement pattern data for more independent motion
        moveRadius: 0.4 + (i * 0.15), // Different orbital radius for each disc
        moveSpeed: 0.25 + (i * 0.12), // More distinct speeds
        movePhase: i * (Math.PI * 2/3), // Evenly distributed across a circle
        
        // Unique pattern type for each disc
        patternType: i, // 0: figure-8, 1: spiral, 2: trefoil knot
        
        // Special parameters for each pattern type
        figure8Scale: 0.8 + (i % 3) * 0.2, // For pattern type 0
        spiralGrowth: 0.05 + (i % 3) * 0.02, // For pattern type 1
        knotScale: 0.6 + (i % 3) * 0.15, // For pattern type 2
      },
      rotationSpeed: {
        // Distinct rotation speeds for truly independent rotation
        x: [0.008, 0.003, 0.011][i], // Completely different values for each disc
        y: [0.002, 0.009, 0.005][i], // Completely different values for each disc
        z: [0.015, 0.007, 0.013][i]  // Completely different values for each disc
      },
      // Storage for dynamic animation parameters that change over time
      dynamicParams: {
        currentRotation: { x: 0, y: 0, z: 0 },
        lastPosition: { x: 0, y: 0, z: 0 },
        oscillators: {
          speed: 0,
          radius: 0,
          direction: 1
        }
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
  time: number,
  mousePosition?: {x: number, y: number}
) => {
  // Log mouse data when in listening state, only every 10 frames to avoid spam
 /* if (currentState === 'listening' && Math.floor(time * 10) % 10 === 0) {
    console.log('In updateComplexShapeAnimations:', {
      state: currentState,
      time: time.toFixed(2),
      hasMousePosition: mousePosition !== undefined,
      mousePosition: mousePosition ? `x:${mousePosition.x.toFixed(2)} y:${mousePosition.y.toFixed(2)}` : 'none'
    });
  }*/
  // Add performance measurement and always-visible indicators
  //console.time('animation-frame');
  
  // Check if this function is being called at all
  //console.warn('📣 ANIMATION FRAME CALLED 📣', currentState, time.toFixed(2));
  
  // Get the current active shape
  const activeShape = shapes[currentState];
  
  // Always log the current animation frame (will be noisy)
  /*console.log('ANIMATION FRAME:', {
    state: currentState,
    time: time.toFixed(2),
    isListening: currentState === 'listening'
  });*/
  
  // Apply animations based on the current state
  switch (currentState) {
    case 'idle':
      // Subtle rotation for the overall shape
      activeShape.rotation.y += 0.005;
      
      // Get the disk container (should be child index 1)
      const diskContainer = activeShape.children[1];
      
      if (diskContainer && diskContainer instanceof THREE.Group) {
        // Make each disc rotate independently in idle state
        for (let i = 0; i < Math.min(diskContainer.children.length, 3); i++) {
          const disk = diskContainer.children[i];
          
          if (disk instanceof THREE.Mesh) {
            // Rotate each disc differently
            switch (i) {
              case 0:
                // First disc: Steady XY rotation
                disk.rotation.z += 0.012;
                break;
              case 1:
                // Second disc: Oscillating YZ rotation
                disk.rotation.x += 0.008 * Math.sin(time * 0.5);
                disk.rotation.y += 0.01;
                break;
              case 2:
                // Third disc: Complex rotation
                disk.rotation.x += 0.007 * Math.cos(time * 0.3);
                disk.rotation.z -= 0.009;
                break;
            }
            
            // Calculate position for truly independent orbital movements with complex paths
            // Each disc now follows a unique mathematical path
            const diskSpeed = 0.15 + (i * 0.08); // More distinct speeds
            const angle = time * diskSpeed;
            const secondaryAngle = time * (diskSpeed * 0.7); // Secondary angle for compound movements
            
            // Different orbital patterns for each disc
            switch (i) {
              case 0: // Disc 0: Epitrochoid curve in 3D space
                // Epitrochoid parameters
                const R = 0.5; // Fixed circle radius
                const r = 0.2; // Moving circle radius
                const d = 0.3; // Distance from center of moving circle
                
                // Epitrochoid formula
                const epX = (R + r) * Math.cos(angle) - d * Math.cos(((R + r) / r) * angle);
                const epY = (R + r) * Math.sin(angle) - d * Math.sin(((R + r) / r) * angle);
                
                // Add 3D element with Z oscillation
                disk.position.x = epX * 0.7; // Scale to appropriate size
                disk.position.y = epY * 0.7; // Scale to appropriate size
                disk.position.z = Math.sin(time * 0.4) * 0.25; // Z oscillation
                
                // Add dynamic rotation based on position
                disk.rotation.x += 0.005 * Math.sin(angle);
                disk.rotation.y += 0.003;
                disk.rotation.z += 0.01 * (1 + Math.sin(time * 0.3) * 0.3);
                break;
                
              case 1: // Disc 1: Lissajous curve with phase variation
                // Lissajous parameters - different frequencies for X, Y, Z
                const freqX = 1.0;
                const freqY = 2.0;
                const freqZ = 1.5;
                const phase = time * 0.1; // Slowly changing phase
                
                // Calculate position on Lissajous curve
                disk.position.x = Math.sin(angle * freqX + phase) * 0.6;
                disk.position.y = Math.sin(angle * freqY) * 0.5;
                disk.position.z = Math.sin(angle * freqZ + phase * 2) * 0.4;
                
                // Dynamic rotation that follows curve direction
                const rotX = Math.cos(angle * freqY) * 0.01;
                const rotY = Math.cos(angle * freqX + phase) * 0.01;
                const rotZ = Math.cos(angle * freqZ + phase * 2) * 0.02;
                
                disk.rotation.x += rotX;
                disk.rotation.y += rotY;
                disk.rotation.z += rotZ;
                break;
                
              case 2: // Disc 2: Rose curve (rhodonea) in 3D
                // Rose curve parameters
                const k = 5/4; // Ratio of frequencies determines number of petals
                const roseRadius = 0.7 + Math.sin(secondaryAngle) * 0.1; // Breathing effect
                
                // Rose curve formula with 3D component
                disk.position.x = roseRadius * Math.cos(k * angle) * Math.cos(angle);
                disk.position.y = roseRadius * Math.cos(k * angle) * Math.sin(angle);
                disk.position.z = roseRadius * Math.sin(k * angle) * 0.4; // Scaled for Z dimension
                
                // Dynamic rotation that creates a more organic movement
                const baseSpeed = 0.01;
                disk.rotation.x += baseSpeed * Math.sin(time * 0.25);
                disk.rotation.y += baseSpeed * 1.5;
                disk.rotation.z -= baseSpeed * (1 + Math.cos(time * 0.33) * 0.5);
                break;
            }
            
            // Apply subtle scale variation for breathing effect
            const scaleBase = 1.0;
            const scalePulse = 0.05;
            const scaleFactor = scaleBase + Math.sin(time * 0.3 + i * Math.PI/2) * scalePulse;
            disk.scale.set(scaleFactor, scaleFactor, scaleFactor * 0.5); // Maintain flattened Z scale
            
            // Apply wave deformation effect to each disc
            if (disk.geometry.attributes.position && disk.userData?.originalPositions) {
              const positionAttribute = disk.geometry.attributes.position;
              const originalPositions = disk.userData.originalPositions;
              const animData = disk.userData.animationData;
              
              if (originalPositions && animData) {
                // Apply wave deformation based on idle animation phase
                const phaseOffset = animData.phaseOffset || 0;
                const frequency = animData.frequency || 0.5;
                const amplitude = animData.amplitude || 0.1;
                
                for (let j = 0; j < positionAttribute.count; j++) {
                  const origPos = originalPositions[j];
                  
                  // Create normal-based displacement like in the listening state
                  const normalDir = new THREE.Vector3(origPos.x, origPos.y, origPos.z).normalize();
                  
                  // Simpler wave pattern for idle state
                  const wave = Math.sin(time * frequency + phaseOffset + 
                                        Math.atan2(origPos.y, origPos.x) * 3) * amplitude;
                  
                  // Apply displacement along the normal direction (less intense than listening state)
                  positionAttribute.setX(j, origPos.x + normalDir.x * wave * 0.03);
                  positionAttribute.setY(j, origPos.y + normalDir.y * wave * 0.03);
                  positionAttribute.setZ(j, origPos.z + normalDir.z * wave * 0.03);
                }
                
                // Update the geometry
                positionAttribute.needsUpdate = true;
              }
            }
          }
        }
      }
      break;
      
    case 'listening':
      // Check if we have mouse interaction data
      const hasMouseInteraction = mousePosition !== undefined;
      
      // Subtle rotation for the crystal ball
      if (activeShape.children[0]) {
        const crystalBall = activeShape.children[0];
        crystalBall.rotation.y += 0.002;
        crystalBall.rotation.x += 0.001;
        
        // Apply mouse-influenced rotation if mouse is active
        if (hasMouseInteraction) {
          // Add subtle tilt based on mouse position (x and y coordinates between -1 and 1)
          crystalBall.rotation.x += mousePosition!.y * 0.001;
          crystalBall.rotation.y += mousePosition!.x * 0.001;
          
          // Modify crystal ball material properties based on mouse position
          if (crystalBall instanceof THREE.Mesh && 
              crystalBall.material instanceof THREE.MeshPhysicalMaterial) {
            
            // Change opacity based on mouse Y position - more translucent when mouse is higher
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
      
      // Get the disk container (child index 1)
      if (activeShape.children[1] && activeShape.children[1] instanceof THREE.Group) {
        const diskContainer = activeShape.children[1];
        
        // Initialize tracking variables if needed
        if (!activeShape.userData.prevPositions) {
          activeShape.userData.prevPositions = [];
          activeShape.userData.lastLogTime = 0;
        }
        
        // Remove rotation from the container to allow independent disc rotations
        // Keep the container centered but allow it to subtly move with mouse
        
        // Apply mouse-controlled movement to the container if mouse is active
        if (hasMouseInteraction) {
          // Move container based on mouse position with dampening (reduced effect)
          // This creates a subtle overall movement while allowing discs to move independently
          const targetX = mousePosition!.x * 0.15;  // Reduced from 0.4 to 0.15
          const targetY = mousePosition!.y * 0.15;  // Reduced from 0.4 to 0.15
          
          // Smooth movement - interpolate toward target position
          diskContainer.position.x += (targetX - diskContainer.position.x) * 0.03;
          diskContainer.position.y += (targetY - diskContainer.position.y) * 0.03;
        } else {
          // Very subtle default movement without mouse
          diskContainer.position.x = Math.sin(time * 0.2) * 0.05;
          diskContainer.position.y = Math.cos(time * 0.15) * 0.05;
          diskContainer.position.z = 0;
        }
        
        // Animate each disk with water-like wave effects and mouse interaction
        for (let i = 0; i < diskContainer.children.length; i++) {
          const disk = diskContainer.children[i];
          
          if (disk instanceof THREE.Mesh && disk.userData) {
            const userData = disk.userData;
            const animData = userData.animationData;
            const rotSpeed = userData.rotationSpeed;
            const originalPositions = userData.originalPositions;
            
            if (!animData || !originalPositions) continue;
            
            // Base rotation speeds
            let rotXSpeed = rotSpeed.x;
            let rotYSpeed = rotSpeed.y;
            let rotZSpeed = rotSpeed.z;
            
            // Modify rotation speeds based on mouse position if available
            if (hasMouseInteraction) {
              // Increase or decrease rotation based on mouse position
              rotXSpeed += mousePosition!.y * 0.01;
              rotYSpeed += mousePosition!.x * 0.01;
              rotZSpeed += (Math.abs(mousePosition!.x) + Math.abs(mousePosition!.y)) * 0.005;
            }
            
            // Apply enhanced independent rotation with or without mouse influence
            // Each disc now rotates more distinctively on different axes
            disk.rotation.x += rotXSpeed * (1 + i * 0.2); // Scale up for more difference between discs
            disk.rotation.y += rotYSpeed * (1 + Math.sin(time * 0.3 + i) * 0.5); // Add sinusoidal variance
            disk.rotation.z += rotZSpeed * (1 + (i * 0.15)); // Slightly different for each disc
            
            // Define movement parameters with enhanced independence between discs
            // Each disc now has a uniquely scaled radius and speed
            let moveRadius = 0.5 + (i * 0.15); // Different radius for each disc
            let moveSpeed = 0.4 + (i * 0.12);  // Different speed for each disc
            const movePhase = animData.movePhase || 0;
            
            // Calculate the angle for motion with more variation
            // Each disc now uses a different time multiplier
            const angle = time * moveSpeed + i * Math.PI * (2/3); // Distribute evenly in a full circle
            
            // Base position calculations
            let posX = 0, posY = 0, posZ = 0;
            
            // Enhanced independent movement patterns for each of the 3 discs
            // Each disc now has a completely distinct orbit and behavior
            switch (i) {
              case 0:
                // Disc 0: XY plane orbital movement with figure-8 pattern
                if (hasMouseInteraction) {
                  // Mouse-responsive figure-8 movement in XY plane
                  const lemniscateA = 0.8 + (Math.abs(mousePosition!.y) * 0.4); // Size affected by mouse Y
                  const lemniscateB = 0.8 + (Math.abs(mousePosition!.x) * 0.4); // Size affected by mouse X
                  // Figure-8 (lemniscate) formula
                  const factor = 1 / (1 + Math.pow(Math.sin(angle), 2));
                  posX = factor * Math.cos(angle) * lemniscateA;
                  posY = factor * Math.sin(angle) * Math.cos(angle) * lemniscateB;
                  posZ = (Math.sin(time * 1.2) * 0.3) + (Math.abs(mousePosition!.x * mousePosition!.y) * 0.25);
                } else {
                  // Default figure-8 (lemniscate) pattern in XY plane
                  const factor = 1 / (1 + Math.pow(Math.sin(angle), 2));
                  posX = factor * Math.cos(angle) * 0.8;
                  posY = factor * Math.sin(angle) * Math.cos(angle) * 0.8;
                  posZ = Math.sin(time * 1.2) * 0.3;
                }
                break;
                
              case 1:
                // Disc 1: Spiraling orbital movement in YZ plane
                if (hasMouseInteraction) {
                  // Mouse affects spiral shape and position
                  const spiralGrowth = 0.1 + (Math.abs(mousePosition!.x) * 0.05); // Spiral tightness
                  const spiralRadius = 0.3 + Math.sin(angle * 3) * 0.2; // Pulsating spiral
                  // Spiral formula with mouse influence
                  posX = mousePosition!.x * 0.3; // X position affected by mouse
                  // Logarithmic spiral in YZ plane
                  const spiralFactor = Math.exp(spiralGrowth * angle);
                  posY = Math.cos(angle) * spiralRadius * spiralFactor;
                  posZ = Math.sin(angle) * spiralRadius * spiralFactor;
                  // Constrain max distance to keep it visible
                  const dist = Math.sqrt(posY*posY + posZ*posZ);
                  if (dist > 1.2) {
                    const scale = 1.2/dist;
                    posY *= scale;
                    posZ *= scale;
                  }
                } else {
                  // Default spiral pattern in YZ plane
                  posX = Math.sin(time * 0.3) * 0.2; // Gentle X oscillation
                  // Spiral with varying radius for more dynamic movement
                  const baseRadius = 0.6 + Math.sin(time * 0.2) * 0.1;
                  posY = Math.cos(angle) * baseRadius;
                  posZ = Math.sin(angle) * baseRadius;
                }
                break;
                
              case 2:
                // Disc 2: Complex 3D knot trajectory
                if (hasMouseInteraction) {
                  // Mouse affects the knot shape and movement speed
                  const t = angle * (1 + Math.abs(mousePosition!.y) * 0.3); // Time parameter affected by mouse Y
                  const scale = 0.7 + Math.abs(mousePosition!.x) * 0.3; // Size affected by mouse X
                  
                  // Trefoil knot formula with mouse influence
                  posX = scale * (Math.sin(t) + 2 * Math.sin(2 * t));
                  posY = scale * (Math.cos(t) - 2 * Math.cos(2 * t));
                  posZ = scale * (-Math.sin(3 * t) * 0.5);
                  
                  // Constrain max distance to keep it visible
                  const dist = Math.sqrt(posX*posX + posY*posY + posZ*posZ);
                  if (dist > 1.2) {
                    const scaleFactor = 1.2/dist;
                    posX *= scaleFactor;
                    posY *= scaleFactor;
                    posZ *= scaleFactor;
                  }
                } else {
                  // Default 3D knot trajectory (simplified trefoil knot)
                  const t = angle;
                  const scale = 0.7 + Math.sin(time * 0.2) * 0.1; // Breathing effect
                  
                  // Trefoil knot formula
                  posX = scale * (Math.sin(t) + 2 * Math.sin(2 * t));
                  posY = scale * (Math.cos(t) - 2 * Math.cos(2 * t));
                  posZ = scale * (-Math.sin(3 * t) * 0.5);
                }
                break;
            }
            
            // Apply the calculated position
            disk.position.set(posX, posY, posZ);
            
            // Track position for animation
            if (i === 0) {
              if (!activeShape.userData.prevPositions[i]) {
                activeShape.userData.prevPositions[i] = {
                  x: disk.position.x,
                  y: disk.position.y,
                  z: disk.position.z,
                  time: time
                };
              } else if (time - activeShape.userData.lastLogTime > 1) {
                // Update previous position without logging
                activeShape.userData.prevPositions[i] = {
                  x: disk.position.x,
                  y: disk.position.y,
                  z: disk.position.z,
                  time: time
                };
                activeShape.userData.lastLogTime = time;
              }
            }
            
      // Apply deformation and animation to the 3D torus
      if (disk.geometry.attributes.position) {
        const positionAttribute = disk.geometry.attributes.position;
        
        // Current time with offset for this specific disk
        const currentTime = time + animData.phaseOffset;
        
        // Modify animation properties based on mouse position if available
        let amplitude = animData.amplitude;
        let frequency = animData.frequency; 
        let noiseScale = animData.noiseScale;
        let noiseSpeed = animData.noiseSpeed;
        
        if (hasMouseInteraction) {
          // Increase amplitude when mouse is more active (further from center)
          const mouseDist = Math.sqrt(mousePosition!.x * mousePosition!.x + mousePosition!.y * mousePosition!.y);
          amplitude *= (1 + mouseDist * 0.6); // Up to 60% increase in wave height
          
          // Adjust frequency based on horizontal mouse position
          frequency *= (1 + mousePosition!.x * 0.3); // -30% to +30% frequency change
          
          // Adjust noise scale based on vertical mouse position
          noiseScale *= (1 + mousePosition!.y * 0.4); // -40% to +40% noise scale change
          
          // Speed up waves when mouse is active
          noiseSpeed *= (1 + mouseDist * 0.5); // Up to 50% increase in animation speed
        }

        // Apply wave deformation to each vertex
        for (let j = 0; j < positionAttribute.count; j++) {
          const origPos = originalPositions[j];
          
          // Calculate the position on the torus for this vertex
          // In a torus, points are distributed around the ring
          const vertexAngle = Math.atan2(origPos.y, origPos.x);
          const vertexRadius = Math.sqrt(origPos.x * origPos.x + origPos.y * origPos.y);
          
          // Calculate normalized position in the torus tube
          // For directional effects and noise
          const normX = Math.cos(vertexAngle);
          const normY = Math.sin(vertexAngle);
          const normZ = origPos.z / Math.max(0.0001, vertexRadius);
          
          // Get 3D noise samples for more complex waves that wrap around the torus
          const noise1 = noise3D(
            normX * noiseScale, 
            normY * noiseScale,
            normZ * noiseScale + currentTime * 0.1,
            currentTime * noiseSpeed + animData.noiseSeed
          ) * 2 - 1; // Range -1 to 1
          
          const noise2 = noise3D(
            normX * noiseScale * 2, 
            normY * noiseScale * 2,
            normZ * noiseScale * 1.5 + currentTime * 0.2,
            currentTime * noiseSpeed * 1.5 + animData.noiseSeed + 100
          ) * 2 - 1; // Range -1 to 1
          
          // Add mouse influence to specific vertices if mouse is active
          let mouseInfluence = 0;
          if (hasMouseInteraction) {
            // Create a directional wave that follows mouse movement
            // This makes waves appear to emanate from the direction of mouse movement
            const mouseAngle = Math.atan2(mousePosition!.y, mousePosition!.x);
            const angleDiff = Math.abs(mouseAngle - vertexAngle);
            const wrappedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
            
            // Vertices pointing toward mouse direction get enhanced waves
            if (wrappedDiff < 1.0) {
              const mouseDist = Math.sqrt(mousePosition!.x * mousePosition!.x + mousePosition!.y * mousePosition!.y);
              mouseInfluence = (1 - wrappedDiff/1.0) * mouseDist * 0.2;
            }
          }
          
          // Combine noise samples with different weights for more organic appearance
          const noiseValue = (noise1 * 0.6 + noise2 * 0.4) * amplitude;
          
          // Add radial waves that travel around the torus
          const radialWave = Math.sin(vertexAngle * 6 + currentTime * frequency) * amplitude * 0.5;
          
          // Add tube waves that travel along the tube of the torus
          const tubeWave = Math.cos(normZ * 10 + currentTime * frequency * 0.7) * amplitude * 0.3;
          
          // Combine all wave effects
          const totalDisplacement = noiseValue + radialWave + tubeWave + mouseInfluence;
          
          // Calculate the direction of displacement (normal to the torus surface)
          // For a torus, the normal points from the center of the tube outward
          const normalDir = new THREE.Vector3(origPos.x, origPos.y, origPos.z).normalize();
          
          // Apply displacement along the normal direction
          positionAttribute.setX(j, origPos.x + normalDir.x * totalDisplacement * 0.05);
          positionAttribute.setY(j, origPos.y + normalDir.y * totalDisplacement * 0.05);
          positionAttribute.setZ(j, origPos.z + normalDir.z * totalDisplacement * 0.05);
        }
        
        // Update the geometry
        positionAttribute.needsUpdate = true;
            }
            
            // Enhanced pulse emission intensity for a more dramatic glowing effect
            // Plus scale pulsing based on position for additional visual effect
            if (disk.material instanceof THREE.MeshStandardMaterial || 
                disk.material instanceof THREE.MeshPhysicalMaterial) {
              
              // Calculate distance from origin for intensity modulation
              const distanceFromCenter = Math.sqrt(
                disk.position.x * disk.position.x + 
                disk.position.y * disk.position.y + 
                disk.position.z * disk.position.z
              );
              
              // Base position factor - glow more when further out
              let positionFactor = 1.0 + distanceFromCenter * 0.6;
              
              // Mouse interaction enhancements for emission
              if (hasMouseInteraction) {
                // Calculate how close the mouse is to this disc's normalized position
                // This creates a "spotlight" effect - discs glow more when mouse is nearby
                const diskScreenX = disk.position.x / 1.2; // Normalizing to approx. -1 to 1
                const diskScreenY = disk.position.y / 1.2; // Normalizing to approx. -1 to 1
                
                // Distance between mouse and disc in screen space
                const mouseDiscDistance = Math.sqrt(
                  Math.pow(mousePosition!.x - diskScreenX, 2) + 
                  Math.pow(mousePosition!.y - diskScreenY, 2)
                );
                
                // Discs closer to mouse position glow more intensely
                // Create a glow spotlight effect that follows the mouse
                if (mouseDiscDistance < 0.8) {
                  // Exponential falloff for a more dramatic spotlight effect
                  const spotlight = Math.pow(1 - (mouseDiscDistance / 0.8), 2) * 1.5;
                  positionFactor += spotlight;
                  
                  // Also modify the disc's color based on mouse position - makes it more interactive
                  const mouseHue = ((Math.atan2(mousePosition!.y, mousePosition!.x) / Math.PI) + 1) * 0.5;
                  const color = new THREE.Color().setHSL(mouseHue, 0.8, 0.6);
                  
                  // Blend between original and mouse-influenced color
                  disk.material.emissive.lerp(color, 0.3);
                }
              }
              
              // Complex multi-wave pulsing effect
              const primaryPulse = Math.sin(time * animData.frequency + animData.phaseOffset) * 0.35;
              const secondaryPulse = Math.sin(time * animData.frequency * 1.3 + animData.phaseOffset * 1.5) * 0.15;
              
              // Apply the combined glow effect
              disk.material.emissiveIntensity = 0.5 + (primaryPulse + secondaryPulse) * positionFactor;
                
              // Also pulse the envMapIntensity for additional reflective effects
              disk.material.envMapIntensity = 
                1.2 + Math.sin(time * animData.frequency * 0.7 + animData.phaseOffset) * 0.5 * positionFactor;
              
              // Add subtle scale pulsing for additional dynamic effect
              // Enhanced by mouse interaction
              let scaleFactor = 1 + Math.sin(time * animData.frequency * 0.5 + animData.phaseOffset) * 0.05;
              
              // Make discs pulse larger when mouse is nearby
              if (hasMouseInteraction) {
                const diskScreenX = disk.position.x / 1.2;
                const diskScreenY = disk.position.y / 1.2;
                const mouseDiscDistance = Math.sqrt(
                  Math.pow(mousePosition!.x - diskScreenX, 2) + 
                  Math.pow(mousePosition!.y - diskScreenY, 2)
                );
                
                if (mouseDiscDistance < 0.8) {
                  // Additional pulse for mouse-adjacent discs
                  const mousePulse = 0.1 * (1 - mouseDiscDistance/0.8) * 
                                    Math.sin(time * 5 + i); // Fast pulsing
                  scaleFactor += mousePulse;
                }
              }
              
              disk.scale.set(scaleFactor, scaleFactor, 1);
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
      
      // Check if we have a talkingDisksContainer in talking state
      // It might be in a different index than in listening state
      let talkingDisksContainer = null;
      
      // Find the disk container (which is a THREE.Group containing the 3 discs)
      for (let i = 0; i < activeShape.children.length; i++) {
        if (activeShape.children[i] instanceof THREE.Group && 
            activeShape.children[i].children.length === 3) {
          talkingDisksContainer = activeShape.children[i];
          break;
        }
      }
      
      // If we found the disk container, animate each disc independently
      if (talkingDisksContainer) {
        // For talking state, make the discs react to sound in distinctively different ways
        for (let i = 0; i < talkingDisksContainer.children.length; i++) {
          const disk = talkingDisksContainer.children[i];
          
          if (disk instanceof THREE.Mesh && disk.userData) {
            // Each disc has a unique sound-reactive animation
            const pulseFreq = 1.5 + i * 0.7; // Different pulse frequency for each disc
            
            switch (i) {
              case 0: // First disc: Pulsing size with rotation
                // Pulsing scale effect - most reactive disc
                const pulseScale = 1 + Math.sin(time * pulseFreq * 1.2) * 0.15;
                disk.scale.set(pulseScale, pulseScale, pulseScale * 0.5); // Less scale in Z to maintain flat appearance
                
                // Accelerating/decelerating rotation based on pulse
                const rotSpeed = 0.01 + Math.abs(Math.sin(time * pulseFreq)) * 0.03;
                disk.rotation.z += rotSpeed;
                
                // Position oscillation - bouncy effect
                disk.position.x = Math.sin(time * 0.8) * 0.3;
                disk.position.y = Math.cos(time * 0.6) * 0.3;
                disk.position.z = Math.sin(time * 1.2) * 0.2;
                break;
                
              case 1: // Second disc: Wave-like oscillations
                // Wave-like movement
                disk.position.x = Math.sin(time * 1.2) * 0.4;
                disk.position.y = Math.sin(time * 0.7) * 0.3;
                disk.position.z = Math.cos(time * 0.9) * 0.3;
                
                // Tilt based on position
                disk.rotation.x = Math.sin(time * 0.5) * 0.3;
                disk.rotation.y = Math.sin(time * 0.7) * 0.3;
                disk.rotation.z += 0.01;
                
                // Subtle pulsing scale
                const waveScale = 1 + Math.sin(time * pulseFreq * 0.8) * 0.1;
                disk.scale.set(waveScale, waveScale, waveScale * 0.5);
                break;
                
              case 2: // Third disc: Orbital with tilt changes
                // Orbital pattern
                const orbitRadius = 0.5;
                const orbitSpeed = 0.5;
                disk.position.x = Math.cos(time * orbitSpeed) * orbitRadius;
                disk.position.z = Math.sin(time * orbitSpeed) * orbitRadius;
                disk.position.y = Math.sin(time * pulseFreq) * 0.3;
                
                // Constantly changing tilt/orientation - most dramatic movement
                disk.rotation.x = Math.sin(time * 0.3) * 0.5;
                disk.rotation.z = Math.cos(time * 0.4) * 0.3;
                disk.rotation.y += 0.02;
                
                // Rhythmic scale pulsing
                const rhythmScale = 1 + Math.sin(time * pulseFreq * 1.5) * 0.12;
                disk.scale.set(rhythmScale, rhythmScale, rhythmScale * 0.5);
                break;
            }
            
            // Apply wave deformation to vertices for sound ripple effect
            if (disk.geometry.attributes.position && disk.userData?.originalPositions) {
              const positionAttribute = disk.geometry.attributes.position;
              const originalPositions = disk.userData.originalPositions;
              
              // Different wave pattern for each disc
              const waveFreq = 2 + i * 1.2; // Frequency
              const waveAmp = 0.05 + i * 0.02; // Amplitude
              
              for (let j = 0; j < positionAttribute.count; j++) {
                const origPos = originalPositions[j];
                
                // Normal-based displacement
                const normalDir = new THREE.Vector3(origPos.x, origPos.y, origPos.z).normalize();
                
                // Create ripple patterns that simulate sound waves
                const angle = Math.atan2(origPos.y, origPos.x);
                const distance = Math.sqrt(origPos.x * origPos.x + origPos.y * origPos.y);
                
                // Sound ripples emanating from center - different for each disc
                let wave = 0; // Initialize with default value
                switch (i) {
                  case 0: // Concentric ripples
                    wave = Math.sin(distance * 15 - time * waveFreq) * waveAmp;
                    break;
                  case 1: // Spiral ripples
                    wave = Math.sin(distance * 10 + angle * 5 - time * waveFreq) * waveAmp;
                    break;
                  case 2: // Beat-driven pulses
                    wave = Math.sin(time * waveFreq) * Math.cos(distance * 8) * waveAmp;
                    break;
                  default:
                    wave = Math.sin(distance * 12 - time * waveFreq) * waveAmp * 0.5;
                    break;
                }
                
                // Apply displacement along the normal direction
                positionAttribute.setX(j, origPos.x + normalDir.x * wave);
                positionAttribute.setY(j, origPos.y + normalDir.y * wave);
                positionAttribute.setZ(j, origPos.z + normalDir.z * wave);
              }
              
              // Update the geometry
              positionAttribute.needsUpdate = true;
            }
          }
        }
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
  
  // End performance measurement
  //console.timeEnd('animation-frame');
};
