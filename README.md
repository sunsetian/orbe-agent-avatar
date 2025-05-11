# Orbe Agent Avatar - Physics-Based 3D Voice AI Visualization

A React component tha## Documentation

### Physics Implementation

This project implements physics-based metaballs using the Rapier physics engine. The implementation is based on the reference implementation in the Metaballs-with-Physics repository.

For detailed implementation documentation, see:

- [Physics Implementation Guide](./docs/PHYSICS_IMPLEMENTATION.md)
- [Development Roadmap](./docs/DEVELOPMENT_ROADMAP.md)
- [Physics Code Samples](./docs/PHYSICS_CODE_SAMPLES.md)
- [Usage Guide](./docs/USAGE.md)

### Key Components

- **MetaBody.ts**: Handles physics bodies for metaballs
- **MouseInteractor.ts**: Handles mouse interaction with physics bodies
- **OrbeElement.tsx**: Main component for rendering metaballs with physics
- **MarchingCubes.ts**: Wrapper for THREE.js MarchingCubes for rendering metaballs

### Commands

- `npm start` - Start the development server
- `npm build` - Build the production application
- `npm test` - Run testsphysics-based interactive 3D visualization for voice AI agents using Three.js and Rapier physics. The component displays realistic, organic metaballs that animate differently based on the AI's current state, providing beautiful visual feedback.

## Features

- **Physics-Based Metaballs**: Realistic organic movement using the Rapier physics engine
- **Four Animation States**:

  - **Idle**: Default state when no interaction is happening
  - **Listening**: When the AI is actively listening to user input
  - **Thinking**: When the AI is processing information
  - **Talking**: When the AI is speaking or responding

- **Interactive Mouse Effects**: Physics-based interaction with mouse movement
- **Smooth Transitions**: Seamless transitions between animation states with physics-based animations
- **Visibility Controls**: Scale animations for turning the element on/off with realistic physics effects
- **Organic 3D Rendering**: High-resolution metaballs for smooth, bubble-like appearance
- **Performance Optimized**: Efficient rendering for smooth animations even with complex physics
- **React Integration**: Easy to integrate into React projects

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/sunsetian/orbe-agent-avatar.git

# Install dependencies
cd orbe-agent-avatar
npm install

# Start the development server
npm start
```

### Usage

```jsx
import React, { useRef } from "react";
import OrbeElement from "./components/OrbeElement/OrbeElement";

function App() {
  // Use ref to control the orbe programmatically
  const orbeRef = useRef(null);

  // Example of changing state based on voice AI state
  const handleVoiceCommand = (command) => {
    if (!orbeRef.current) return;

    switch (command) {
      case "listen":
        orbeRef.current.changeState("listening");
        break;
      case "think":
        orbeRef.current.changeState("thinking");
        break;
      case "speak":
        orbeRef.current.changeState("talking");
        break;
      case "idle":
        orbeRef.current.changeState("idle");
        break;
      case "toggle":
        orbeRef.current.toggleVisibility();
        break;
    }
  };

  return (
    <div className="App">
      <OrbeElement ref={orbeRef} initialState="idle" />
      <div className="controls">
        <button onClick={() => handleVoiceCommand("listen")}>
          Start Listening
        </button>
        <button onClick={() => handleVoiceCommand("think")}>
          Processing...
        </button>
        <button onClick={() => handleVoiceCommand("speak")}>Speaking</button>
        <button onClick={() => handleVoiceCommand("idle")}>Idle</button>
      </div>
    </div>
  );
}
```

## Documentation

For detailed documentation, see the [USAGE.md](./docs/USAGE.md) file.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Physics-Based Metaballs

The core of this visualization is the physics-based metaball implementation. Key aspects include:

1. **Rapier Physics Engine**: Uses Rapier 3D for realistic physics simulation
2. **MetaBody Entities**: Each metaball is represented by a physics body with forces
3. **Mouse Interaction**: Interactive forces based on mouse movement
4. **MarchingCubes**: High-resolution rendering for smooth metaballs
5. **Matcap Materials**: Glossy material appearance for beautiful rendering

## Future Plans

- Further optimization for mobile devices
- Additional interaction modes
- Integration with voice AI frameworks
- More advanced physics behaviors
- Expanded animation states

## Credits

This project was inspired by various metaball implementations, with physics-based aspects referenced from the Metaballs-with-Physics repository.

## Learn More

This project was bootstrapped with [Create React App](https://facebook.github.io/create-react-app/docs/getting-started).

For more information on the libraries used:

- [Three.js Documentation](https://threejs.org/docs/)
- [Rapier Physics Engine](https://rapier.rs/)
- [React Documentation](https://reactjs.org/)
