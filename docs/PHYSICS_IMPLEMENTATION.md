# Physics-Based Metaballs Implementation Guide

This document outlines how to implement the physics-based metaballs exactly like in the Metaballs-with-Physics repository.

## Overview

The Metaballs-with-Physics repository uses the following key components:

- Rapier 3D physics engine for metaball simulation
- THREE.js MarchingCubes for the metaballs rendering
- Physics-based forces for dynamic metaball behavior

## Implementation Steps

### 1. Install Required Dependencies

```bash
npm install @dimforge/rapier3d-compat
```

### 2. Create MetaBody Utility

Create a `MetaBody.ts` file that defines the physics-based metaball points:

```typescript
import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d-compat";

const sceneMiddle = new THREE.Vector3(0, 0, 0);
const metaOffset = new THREE.Vector3(0.5, 0.5, 0.5);

export interface MetaBodyProps {
  debug?: boolean;
  world: RAPIER.World;
  color?: THREE.Color;
  position?: THREE.Vector3;
  size?: number;
  density?: number;
}

export class MetaBody {
  color: THREE.Color;
  mesh?: THREE.Mesh;
  rigid: RAPIER.RigidBody;

  constructor({
    debug = false,
    world,
    color = new THREE.Color().setHSL(Math.random(), 1, 0.5),
    position,
    size = 0.2,
    density = 0.5,
  }: MetaBodyProps) {
    // Generate random position if none provided
    const range = 3;
    const x = position ? position.x : Math.random() * range - range * 0.5;
    const y = position ? position.y : Math.random() * range - range * 0.5 + 3;
    const z = position ? position.z : Math.random() * range - range * 0.5;

    // Create a dynamic rigid-body
    let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y, z)
      .setLinearDamping(2);
    this.rigid = world.createRigidBody(rigidBodyDesc);
    let colliderDesc = RAPIER.ColliderDesc.ball(size).setDensity(density);
    world.createCollider(colliderDesc, this.rigid);

    this.color = color;

    // Create debug mesh if needed
    if (debug === true) {
      const geometry = new THREE.IcosahedronGeometry(size, 3);
      const material = new THREE.MeshBasicMaterial({
        color: this.color,
      });
      this.mesh = new THREE.Mesh(geometry, material);
    }
  }

  update() {
    this.rigid.resetForces(true);
    let { x, y, z } = this.rigid.translation();
    let pos = new THREE.Vector3(x, y, z);

    // Add attraction force to center
    let dir = pos.clone().sub(sceneMiddle).normalize();
    this.rigid.addForce(dir.multiplyScalar(-0.5), true);

    // Update mesh if in debug mode
    if (this.mesh) {
      this.mesh.position.copy(pos);
    }

    // Scale and offset position for metaball system
    pos.multiplyScalar(0.1).add(metaOffset);
    return pos;
  }
}

export function createMetaBodies(
  count: number,
  world: RAPIER.World,
  debug: boolean = false
): MetaBody[] {
  const bodies: MetaBody[] = [];

  for (let i = 0; i < count; i++) {
    const body = new MetaBody({
      debug,
      world,
      color: new THREE.Color().setHSL(Math.random(), 1, 0.5),
    });
    bodies.push(body);
  }

  return bodies;
}
```

### 3. Create MouseInteractor Utility

Create a `MouseInteractor.ts` file for physics-based mouse interaction:

```typescript
import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d-compat";

export interface MouseInteractorProps {
  world: RAPIER.World;
  scene?: THREE.Scene;
  size?: number;
  color?: THREE.Color;
  addToScene?: boolean;
}

export class MouseInteractor {
  world: RAPIER.World;
  rigid: RAPIER.RigidBody;
  mesh?: THREE.Mesh;
  mousePos: THREE.Vector2;

  constructor({
    world,
    scene,
    size = 0.5,
    color = new THREE.Color(0xffffff),
    addToScene = false,
  }: MouseInteractorProps) {
    this.world = world;
    this.mousePos = new THREE.Vector2();

    // Create a kinematic rigid body for mouse interaction
    let bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
      0,
      0,
      0
    );
    this.rigid = world.createRigidBody(bodyDesc);
    let dynamicCollider = RAPIER.ColliderDesc.ball(size);
    world.createCollider(dynamicCollider, this.rigid);

    // Create visual representation if needed
    if (addToScene && scene) {
      const geometry = new THREE.IcosahedronGeometry(size * 0.7, 3);
      const material = new THREE.MeshBasicMaterial({ color });
      this.mesh = new THREE.Mesh(geometry, material);
      scene.add(this.mesh);
    }
  }

  update(x: number, y: number, z: number = 0) {
    // Update mouse position in physics world
    this.rigid.setTranslation({ x, y, z });

    // Update mesh position if it exists
    if (this.mesh) {
      const { x, y, z } = this.rigid.translation();
      this.mesh.position.set(x, y, z);
    }
  }

  setMousePosition(x: number, y: number) {
    this.mousePos.set(x, y);
    this.update(x * 4, y * 4, 0); // Scale mouse movement for better interaction
  }
}
```

### 4. Implement in OrbeElement component

Here's how to integrate physics-based metaballs into the OrbeElement:

```typescript
// In OrbeElement.tsx
import * as RAPIER from "@dimforge/rapier3d-compat";
import { MetaBody, createMetaBodies } from "../../utils/MetaBody";
import { MouseInteractor } from "../../utils/MouseInteractor";

// Add to component state/refs
const physicsInitializedRef = useRef<boolean>(false);
const worldRef = useRef<RAPIER.World | null>(null);
const bodiesRef = useRef<MetaBody[]>([]);
const mouseInteractorRef = useRef<MouseInteractor | null>(null);
const [physicsReady, setPhysicsReady] = useState<boolean>(false);

// Initialize physics in useEffect
useEffect(() => {
  const initPhysics = async () => {
    try {
      await RAPIER.init();
      const gravity = { x: 0, y: 0, z: 0 };
      const world = new RAPIER.World(gravity);
      worldRef.current = world;
      physicsInitializedRef.current = true;
      setPhysicsReady(true);
    } catch (error) {
      console.error("Failed to initialize physics:", error);
    }
  };

  initPhysics();
}, []);

// Setup bodies and interactions in scene init
useEffect(() => {
  if (!physicsReady) return;

  // Create MarchingCubes with higher resolution (96)
  const metaballs = new MarchingCubes(96, material, true, true, 90000);
  metaballs.scale.setScalar(5);
  metaballs.isolation = 1000;

  // Initialize meta bodies
  const modulation = STATE_MODULATIONS[currentState];
  const bodies = createMetaBodies(
    modulation.bodyCount,
    worldRef.current,
    false
  );
  bodiesRef.current = bodies;

  // Setup mouse interactor
  const mouseInteractor = new MouseInteractor({ world: worldRef.current });
  mouseInteractorRef.current = mouseInteractor;

  // In animation loop:
  const animate = () => {
    // Step physics world
    if (worldRef.current) {
      worldRef.current.step();

      // Update metaballs from physics bodies
      metaballs.reset();
      bodies.forEach((body) => {
        const pos = body.update();
        metaballs.addBall(
          pos.x,
          pos.y,
          pos.z,
          strength,
          subtract,
          body.color.getHex()
        );
      });
      metaballs.update();
    }

    // Render scene
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
}, [physicsReady]);
```

## Key Differences from Original Implementation

1. **Physics Integration**: The reference implementation uses Rapier instead of custom forces
2. **Resolution**: Uses higher resolution (96) for more detailed metaballs
3. **Isolation**: Uses isolation value of 1000 for surface threshold
4. **Colors**: Uses individual colors for each metaball
5. **Mouse Interaction**: Uses a physical rigid body for mouse interactivity

## Visual Appearance Tips

1. **Use MatCap material** for the glossy finish seen in the reference
2. **Scale the scene** by 5 units as in the reference
3. **Use collision forces** rather than direct position adjustments for more physical behavior
4. **Apply gentle centering forces** to keep metaballs within visible area

## Optimizations

1. Adjust bodyCount based on device performance
2. Lower the resolution for weaker devices
3. Use fewer metaballs with larger sizes for similar visual effect with better performance
