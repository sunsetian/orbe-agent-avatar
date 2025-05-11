# Development Roadmap for Physics-Based Metaballs

This file contains a step-by-step guide to implementing Rapier physics-based metaballs in the interactive-orbe project, matching the reference implementation in the Metaballs-with-Physics repository.

## Step 1: Install Dependencies

```bash
npm install @dimforge/rapier3d-compat
```

## Step 2: Create Utility Classes

### MetaBody.ts

Create a utility class that represents a physical metaball with Rapier physics:

```typescript
import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d-compat";

// This class was successfully created in src/utils/MetaBody.ts
```

### MouseInteractor.ts

Create a utility class for physics-based mouse interaction:

```typescript
import * as THREE from "three";
import * as RAPIER from "@dimforge/rapier3d-compat";

// This class was successfully created in src/utils/MouseInteractor.ts
```

## Step 3: Create OrbeElement with Physics

The current approach of modifying the existing OrbeElement.tsx is causing TypeScript errors due to duplicate identifiers. Instead, follow these approaches:

### Option A: Create a new component

1. Create a new component named OrbeElementRapier.tsx that implements physics
2. Update App.tsx to use this component instead

### Option B: Refactor the existing component

1. Remove the current physics-related code
2. Replace it with Rapier physics implementation
3. Update imports and references

## Step 4: Create a Matcap Texture

1. Create or download a black-n-shiney.jpg matcap texture
2. Place it in the public/assets directory
3. Load it in the component:

```typescript
const textureLoader = new THREE.TextureLoader();
const matcap = textureLoader.load("/assets/black-n-shiney.jpg");
const material = new THREE.MeshMatcapMaterial({
  matcap,
  vertexColors: true,
});
```

## Step 5: Update MarchingCubes Settings

Match the reference implementation's settings:

```typescript
const metaballs = new MarchingCubes(
  96, // Higher resolution
  material,
  true, // Enable UVs
  true, // Enable colors
  90000 // Max poly count
);
metaballs.scale.setScalar(5);
metaballs.isolation = 1000;
```

## Step 6: Fix TypeScript Errors

1. Fix import statements to avoid duplicate identifiers
2. Fix type definitions for Rapier-specific code
3. Ensure proper initialization of physics engine

## Step 7: Test and Optimize

1. Test on different devices to ensure performance
2. Adjust bodyCount, resolution, and other parameters for optimal experience
3. Fine-tune forces and interactions to match the reference implementation

## Debugging Tips

1. Use the `debug` option in MetaBody constructor to visualize the physics bodies
2. Enable the `addToScene` option in MouseInteractor to visualize mouse interaction
3. Try different force values in the MetaBody.update() method

## Final Notes

The core functionality is already implemented in the utility classes. The remaining work focuses on correctly integrating these into the main component and fixing TypeScript errors.
