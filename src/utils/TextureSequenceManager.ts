import * as THREE from 'three';
import { AnimationState, TextureFrame } from './types';

// This class manages texture sequences for different animation states
export class TextureSequenceManager {
  private textureLoader: THREE.TextureLoader;
  private textureCache: Map<string, THREE.Texture>;
  private sequences: Map<AnimationState, TextureFrame[]>;
  private currentState: AnimationState;
  
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.textureCache = new Map();
    this.sequences = new Map();
    this.currentState = 'idle';
  }
  
  // Load a sequence of textures for a specific animation state
  public loadTextureSequence(state: AnimationState, baseUrl: string, frames: number, extension: string = 'png'): Promise<void> {
    const sequence: TextureFrame[] = [];
    const loadPromises: Promise<void>[] = [];
    
    // Generate texture URLs and preload them
    for (let i = 0; i < frames; i++) {
      const frameNumber = i.toString().padStart(4, '0');
      const url = `${baseUrl}${frameNumber}.${extension}`;
      
      sequence.push({ url, frame: i });
      
      // Preload the texture
      const loadPromise = new Promise<void>((resolve) => {
        this.textureLoader.load(url, (texture) => {
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          this.textureCache.set(url, texture);
          resolve();
        });
      });
      
      loadPromises.push(loadPromise);
    }
    
    this.sequences.set(state, sequence);
    
    // Return a promise that resolves when all textures are loaded
    return Promise.all(loadPromises).then(() => {});
  }
  
  // Get a texture for a specific animation state and frame
  public getTexture(state: AnimationState, frameIndex: number): THREE.Texture | null {
    const sequence = this.sequences.get(state);
    
    if (!sequence) return null;
    
    // Ensure the frame index is within bounds
    const normalizedFrameIndex = frameIndex % sequence.length;
    const frame = sequence[normalizedFrameIndex];
    
    return this.textureCache.get(frame.url) || null;
  }
  
  // Set the current animation state
  public setAnimationState(state: AnimationState): void {
    this.currentState = state;
  }
  
  // Get the current animation state
  public getCurrentState(): AnimationState {
    return this.currentState;
  }
  
  // Get the total number of frames in a sequence
  public getSequenceLength(state: AnimationState): number {
    const sequence = this.sequences.get(state);
    return sequence ? sequence.length : 0;
  }
  
  // Dispose of all textures to prevent memory leaks
  public dispose(): void {
    this.textureCache.forEach(texture => {
      texture.dispose();
    });
    
    this.textureCache.clear();
    this.sequences.clear();
  }
}
