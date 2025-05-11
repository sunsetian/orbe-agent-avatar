import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';

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
    addToScene = false
  }: MouseInteractorProps) {
    this.world = world;
    this.mousePos = new THREE.Vector2();
    
    // Create a kinematic rigid body for mouse interaction
    let bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0, 0);
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
    // Use native Rapier Vector for the first argument
    const position = { x, y, z };
    this.rigid.setTranslation(position, true);
    
    // Update mesh position if it exists
    if (this.mesh) {
      const translation = this.rigid.translation();
      this.mesh.position.set(translation.x, translation.y, translation.z);
    }
  }
  
  setMousePosition(x: number, y: number) {
    this.mousePos.set(x, y);
    this.update(x * 4, y * 4, 0); // Scale mouse movement for better interaction
  }
}
