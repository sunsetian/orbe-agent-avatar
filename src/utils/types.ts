export type AnimationState = 'idle' | 'listening' | 'thinking' | 'talking';

export interface TextureFrame {
  url: string;
  frame: number;
}

export interface AnimationSequence {
  state: AnimationState;
  textures: TextureFrame[];
  duration: number;
  frameRate: number;
}
