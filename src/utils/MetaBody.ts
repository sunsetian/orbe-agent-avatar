// filepath: /Users/setian/Documents/Development/interactive-orbe/src/utils/MetaBody.ts
import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';

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
  debug: boolean;
  size: number;
  world: RAPIER.World;

  constructor({
    debug = false,
    world,
    color = new THREE.Color().setHSL(Math.random(), 1, 0.5),
    position,
    size = 0.2,
    density = 0.5
  }: MetaBodyProps) {
    this.debug = debug;
    this.size = size;
    this.world = world;
    this.color = color;

    // Generate random position if none provided
    const pos = position || new THREE.Vector3(
      Math.random() * 3 - 1.5, // Range: -1.5 to 1.5
      Math.random() * 3 - 1.5 + 3, // Range: 1.5 to 4.5
      Math.random() * 3 - 1.5  // Range: -1.5 to 1.5
    );

    // Create a dynamic rigid-body
    let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(pos.x, pos.y, pos.z)
      .setLinearDamping(2);
    this.rigid = world.createRigidBody(rigidBodyDesc);
    let colliderDesc = RAPIER.ColliderDesc.ball(size).setDensity(density);
    world.createCollider(colliderDesc, this.rigid);

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
    // Apply forces
    this.rigid.resetForces(true);
    let { x, y, z } = this.rigid.translation();
    let pos = new THREE.Vector3(x, y, z);
    
    // Attraction to center
    let dir = pos.clone().sub(sceneMiddle).normalize();
    this.rigid.addForce(dir.multiplyScalar(-0.5), true);
    
    // Update debug mesh if needed
    if (this.debug === true && this.mesh) {
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
      color: new THREE.Color().setHSL(Math.random(), 1, 0.5)
    });
    bodies.push(body);
  }
  
  return bodies;
}
