// This file contains the implementation guide for adding physics-based metaballs
// following the Metaballs-with-Physics reference repository.

/**
 * Step 1: Install Rapier physics engine
 * ```
 * npm install @dimforge/rapier3d-compat
 * ```
 */

/**
 * Step 2: Create MetaBody utility (src/utils/MetaBody.ts)
 * 
 * The MetaBody class represents a physical metaball with Rapier physics.
 * Each metaball has a rigid body, a position, and methods to update its state.
 * 
 * Sample implementation:
 * ```typescript
 * import * as THREE from 'three';
 * import * as RAPIER from '@dimforge/rapier3d-compat';
 * 
 * const sceneMiddle = new THREE.Vector3(0, 0, 0);
 * const metaOffset = new THREE.Vector3(0.5, 0.5, 0.5);
 * 
 * export class MetaBody {
 *   color: THREE.Color;
 *   rigid: RAPIER.RigidBody;
 *   // ...constructor and other properties...
 * 
 *   update() {
 *     this.rigid.resetForces(true);
 *     let { x, y, z } = this.rigid.translation();
 *     let pos = new THREE.Vector3(x, y, z);
 *     
 *     // Add attraction force to center
 *     let dir = pos.clone().sub(sceneMiddle).normalize();
 *     this.rigid.addForce(dir.multiplyScalar(-0.5), true);
 *     
 *     // Scale and offset position for metaball system
 *     pos.multiplyScalar(0.1).add(metaOffset);
 *     return pos;
 *   }
 * }
 * ```
 */

/**
 * Step 3: Create MouseInteractor utility (src/utils/MouseInteractor.ts)
 * 
 * The MouseInteractor class creates a kinematic physics body that follows
 * the mouse cursor, allowing for physics-based interaction with metaballs.
 * 
 * Sample implementation:
 * ```typescript
 * export class MouseInteractor {
 *   world: RAPIER.World;
 *   rigid: RAPIER.RigidBody;
 *   mousePos: THREE.Vector2;
 *   
 *   // ...constructor...
 *   
 *   setMousePosition(x: number, y: number) {
 *     this.mousePos.set(x, y);
 *     this.update(x * 4, y * 4, 0); // Scale mouse movement for better interaction
 *   }
 * }
 * ```
 */

/**
 * Step 4: Update OrbeElement component to use physics-based metaballs
 * 
 * Key differences from the current implementation:
 * 1. Initialize Rapier physics world with zero gravity
 * 2. Create metaballs as physical bodies using the MetaBody class
 * 3. Create a mouse interactor for physics-based mouse interaction
 * 4. Update the metaballs in the animation loop based on physics simulation
 * 5. Use higher resolution (96) for MarchingCubes like the reference
 * 
 * Implementation details:
 * ```typescript
 * // Initialize physics
 * useEffect(() => {
 *   const initPhysics = async () => {
 *     await RAPIER.init();
 *     const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
 *     worldRef.current = world;
 *     setPhysicsReady(true);
 *   };
 *   initPhysics();
 * }, []);
 * 
 * // Create MarchingCubes with higher resolution
 * const metaballs = new MarchingCubes(96, material, true, true, 90000);
 * metaballs.scale.setScalar(5);
 * metaballs.isolation = 1000;
 * 
 * // Create physical metaballs
 * const bodies = createMetaBodies(20, worldRef.current);
 * 
 * // Update in animation loop
 * const animate = () => {
 *   worldRef.current?.step();
 *   metaballs.reset();
 *   
 *   bodies.forEach(body => {
 *     const pos = body.update();
 *     metaballs.addBall(pos.x, pos.y, pos.z, 0.5, 10, body.color.getHex());
 *   });
 *   
 *   metaballs.update();
 *   renderer.render(scene, camera);
 * };
 * ```
 */

/**
 * Step 5: Load matcap texture for the glossy appearance
 * 
 * The reference uses a matcap material for the glossy black appearance.
 * 
 * ```typescript
 * const textureLoader = new THREE.TextureLoader();
 * const matcap = textureLoader.load("/assets/black-n-shiney.jpg");
 * const material = new THREE.MeshMatcapMaterial({
 *   matcap,
 *   vertexColors: true
 * });
 * ```
 */

/**
 * Design considerations:
 * 
 * 1. Physics performance: Adjust the number of metaballs based on device performance
 * 2. Visual quality: Higher resolution MarchingCubes (96) provides smoother metaballs
 * 3. Interactivity: The MouseInteractor creates realistic physical interactions
 * 4. Custom forces: Add custom forces to create interesting behavior like orbiting, pulsing, etc.
 */
