# Interactive Orbe Element Documentation

This component provides an interactive 3D visualization for a voice AI agent using Three.js. The component displays an organic sphere that animates differently based on its current state, providing visual feedback for the AI agent's status.

## Animation States

The orbe element supports four animation states:

1. **Idle**: Default state when no interaction is happening
2. **Listening**: When the AI is actively listening to user input
3. **Thinking**: When the AI is processing information
4. **Talking**: When the AI is speaking or responding

## Integration Guide

### Basic Usage

```tsx
import React from "react";
import OrbeElement from "./components/OrbeElement/OrbeElement";

function App() {
  return (
    <div className="App">
      <OrbeElement initialState="idle" />
    </div>
  );
}
```

### Props

The `OrbeElement` component accepts the following props:

| Prop           | Type                                               | Default  | Description                 |
| -------------- | -------------------------------------------------- | -------- | --------------------------- |
| `initialState` | `'idle' \| 'listening' \| 'thinking' \| 'talking'` | `'idle'` | The initial animation state |

### Using Refs to Control the Orbe

You can use a ref to access the component's methods for controlling the animation state and visibility:

```tsx
import React, { useRef, useEffect } from "react";
import OrbeElement from "./components/OrbeElement/OrbeElement";

function App() {
  const orbeRef = useRef(null);

  useEffect(() => {
    // Example: Change state after 2 seconds
    setTimeout(() => {
      if (orbeRef.current) {
        orbeRef.current.changeState("listening");
      }
    }, 2000);

    // Example: Toggle visibility after 5 seconds
    setTimeout(() => {
      if (orbeRef.current) {
        orbeRef.current.toggleVisibility();
      }
    }, 5000);
  }, []);

  return (
    <div className="App">
      <OrbeElement ref={orbeRef} initialState="idle" />
    </div>
  );
}
```

## PNG Sequence Animations

The orbe supports loading and playing PNG sequence animations exported from After Effects. Each animation state requires its own sequence of PNG files.

### Animation Requirements

- **Frame Rate**: 24 fps
- **Duration**: 5 seconds (120 frames total)
- **First Frame**: The first frame of each animation should be the same to enable seamless transitions
- **Format**: PNG files named sequentially (e.g., idle0000.png, idle0001.png, etc.)

### Directory Structure

Place your PNG sequences in the following directory structure:

```
src/
  assets/
    animations/
      idle/
        idle0000.png
        idle0001.png
        ...
      listening/
        listening0000.png
        listening0001.png
        ...
      thinking/
        thinking0000.png
        thinking0001.png
        ...
      talking/
        talking0000.png
        talking0001.png
        ...
```

## Technical Implementation Details

### Animation State Management

The component uses the `useAnimationState` hook to manage transitions between animation states. Each state has a full animation loop (5 seconds at 24fps = 120 frames).

### Texture Sequence Loading

The `TextureSequenceManager` utility handles loading and caching texture sequences for efficient playback.

### Performance Considerations

- Textures are preloaded and cached to minimize runtime performance impact
- The component uses requestAnimationFrame for smooth animation
- The scene automatically adjusts to container size changes

### Mobile Performance

For better performance on mobile devices:

1. Reduce the resolution of PNG textures
2. Lower the polygon count of the sphere geometry
3. Use lower precision shaders where possible

## Troubleshooting

### Common Issues

1. **White screen/No rendering**: Check if Three.js is properly installed and imported.
2. **Missing textures**: Ensure the PNG files are correctly placed in the assets directory.
3. **Performance issues**: Try reducing the complexity of animations or the number of vertices in the sphere geometry.

### Browser Compatibility

The component should work in all modern browsers that support WebGL, including:

- Chrome 9+
- Firefox 4+
- Safari 5.1+
- Edge 12+
- Opera 15+

Internet Explorer is not supported.
