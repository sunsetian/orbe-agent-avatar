import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// Environment map options
export enum HDRIEnvironment {
  STUDIO = 'studio_small_03_1k.hdr',
  OUTDOOR = 'royal_esplanade_1k.hdr',
  NEON = 'fondo-neon-1k.hdr'
}

/**
 * Sets up environmental lighting using an HDRI map
 * @param scene The Three.js scene to add the environment to
 * @param hdrFile The HDR file to use (from HDRIEnvironment enum)
 * @returns A promise that resolves when the environment is loaded
 */
export const setupEnvironment = async (
  scene: THREE.Scene, 
  renderer: THREE.WebGLRenderer,
  hdrFile: HDRIEnvironment = HDRIEnvironment.STUDIO
): Promise<THREE.PMREMGenerator> => {
  
  // Enable physical lighting for better PBR materials
  // Handle different THREE.js versions gracefully
  // For newer THREE.js versions
  if ('physicallyCorrectLights' in renderer) {
    (renderer as any).physicallyCorrectLights = true;
  } 
  // For versions that use useLegacyLights
  else if ('useLegacyLights' in renderer) {
    (renderer as any).useLegacyLights = false;
  }
  
  // Handle color encoding for different THREE.js versions
  if ('outputColorSpace' in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } 
  // For older versions
  else if ('outputEncoding' in renderer) {
    // Use numeric value 3001 for sRGBEncoding to avoid direct reference
    (renderer as any).outputEncoding = 3001; // THREE.sRGBEncoding = 3001
  }
  
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  
  // Create a PMREMGenerator to convert HDR to cubemap
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  
  // Load the HDR file
  const loader = new RGBELoader();
  const hdriPath = `/assets/hdri/${hdrFile}`;
  
  return new Promise((resolve) => {
    loader.load(hdriPath, (texture) => {
      // Convert HDR to cubemap and set as environment
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      scene.background = null; // Keep transparent background
      
      // Clean up resources
      texture.dispose();
      pmremGenerator.dispose();
      
      resolve(pmremGenerator);
    });
  });
};

/**
 * Creates glass material with physically-based properties
 * @returns A THREE.MeshPhysicalMaterial configured for glass
 */
export const createGlassMaterial = (): THREE.MeshPhysicalMaterial => {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9, // Make it transparent
    transparent: true,
    envMapIntensity: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    ior: 1.5, // Index of refraction (glass is ~1.5)
    reflectivity: 0.5,
    thickness: 0.5
  });
};

/**
 * Creates mirror material with physically-based properties
 * @returns A THREE.MeshPhysicalMaterial configured for mirror
 */
export const createMirrorMaterial = (): THREE.MeshPhysicalMaterial => {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.9,
    roughness: 0.05,
    envMapIntensity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0
  });
};

/**
 * Creates chrome material with colored metallic properties
 * @param color Base color of the chrome material
 * @returns A THREE.MeshPhysicalMaterial configured for chrome
 */
export const createChromeMaterial = (color: number = 0x8a8a8a): THREE.MeshPhysicalMaterial => {
  return new THREE.MeshPhysicalMaterial({
    color: color,
    metalness: 1.0,
    roughness: 0.15,
    envMapIntensity: 1.0,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2
  });
};
