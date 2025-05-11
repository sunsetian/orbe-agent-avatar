# Code Samples for Physics-Based Metaballs

This document provides specific code samples for key parts of implementing physics-based metaballs using Rapier in the interactive-orbe project.

## Physics Initialization

```typescript
import * as RAPIER from "@dimforge/rapier3d-compat";

const worldRef = useRef<RAPIER.World | null>(null);
const [physicsReady, setPhysicsReady] = useState<boolean>(false);

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
      setPhysicsReady(true);
    } catch (error) {
      console.error("Failed to initialize physics:", error);
    }
  };

  initPhysics();
}, []);
```

## Physics-Based Animation Loop

```typescript
// Animation loop with physics
const animate = () => {
  // Increment time for animations
  timeRef.current += 0.01;

  // Step the physics world
  if (worldRef.current && !isPaused) {
    worldRef.current.step();

    // Update metaballs from physics bodies
    if (metaballsRef.current) {
      metaballsRef.current.reset();

      // Get current state modulation values
      const modulation = STATE_MODULATIONS[currentState];
      const strength = modulation.strength;
      const subtract = modulation.subtract;

      // Update each metaball based on physics
      bodiesRef.current.forEach((body) => {
        const pos = body.update();

        // Add the ball to the marching cubes
        metaballsRef.current.addBall(
          pos.x,
          pos.y,
          pos.z,
          strength,
          subtract,
          body.color.getHex()
        );
      });

      // Update the metaballs geometry
      metaballsRef.current.update();
    }
  }

  // Render the scene
  if (rendererRef.current && sceneRef.current && cameraRef.current) {
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }

  frameId.current = requestAnimationFrame(animate);
};
```

## MetaBall Creation

```typescript
// Initialize meta bodies based on current state
const initializeMetaBodies = (state: AnimationState) => {
  if (!worldRef.current) return;

  // Clear existing bodies if any
  bodiesRef.current.forEach((body) => {
    if (body.mesh && sceneRef.current) {
      sceneRef.current.remove(body.mesh);
    }
  });
  bodiesRef.current = [];

  // Create new bodies based on current state
  const modulation = STATE_MODULATIONS[state];
  const bodies = createMetaBodies(
    modulation.bodyCount,
    worldRef.current,
    false
  );

  // Add debug meshes to scene if they exist
  bodies.forEach((body) => {
    if (body.mesh && sceneRef.current) {
      sceneRef.current.add(body.mesh);
    }
  });

  bodiesRef.current = bodies;
};
```

## Mouse Physics Interaction

```typescript
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

window.addEventListener("mousemove", handleMouseMove);
```

## MarchingCubes Setup

```typescript
// Create MarchingCubes instance like the reference
const resolution = 96; // Match reference's resolution of 96

// Create material with metaball-like appearance
const textureLoader = new THREE.TextureLoader();
const matcap = textureLoader.load("/assets/black-n-shiney.jpg");
const material = new THREE.MeshMatcapMaterial({
  matcap,
  vertexColors: true,
});

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
scene.add(metaballs);
```

## Custom Forces for Interesting Effects

```typescript
// In MetaBody.update()
update() {
  this.rigid.resetForces(true);
  let { x, y, z } = this.rigid.translation();
  let pos = new THREE.Vector3(x, y, z);

  // Basic attraction to center
  let dir = pos.clone().sub(sceneMiddle).normalize();
  this.rigid.addForce(dir.multiplyScalar(-0.5), true);

  // Add circular motion force (optional)
  const perpForce = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(0.2);
  this.rigid.addForce(perpForce, true);

  // Add pulsing force based on time (optional)
  const time = Date.now() * 0.001;
  const pulseForce = dir.clone().multiplyScalar(Math.sin(time) * 0.1);
  this.rigid.addForce(pulseForce, true);

  // Scale and offset position for metaball system
  pos.multiplyScalar(0.1).add(metaOffset);
  return pos;
}
```
