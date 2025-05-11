# Interactive Orbe - 3D Voice AI Visualization

A React component that provides an interactive 3D visualization for a voice AI agent using Three.js. The component displays an organic sphere that animates differently based on its current state, providing visual feedback for the AI's status.

## Features

- **Four Animation States**:

  - **Idle**: Default state when no interaction is happening
  - **Listening**: When the AI is actively listening to user input
  - **Thinking**: When the AI is processing information
  - **Talking**: When the AI is speaking or responding

- **Smooth Transitions**: Seamless transitions between animation states
- **Visibility Controls**: Scale animations for turning the element on/off
- **Organic 3D Rendering**: Distortion-based animations that create an organic feel
- **PNG Sequence Support**: Support for loading animation sequences from PNG files
- **Performance Optimized**: Efficient rendering for smooth animations
- **React Integration**: Easy to integrate into React projects

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/interactive-orbe.git

# Install dependencies
cd interactive-orbe
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

  // Example of changing state programmatically
  const handleVoiceCommand = () => {
    if (orbeRef.current) {
      orbeRef.current.changeState("listening");
    }
  };

  return (
    <div className="App">
      <OrbeElement ref={orbeRef} initialState="idle" />
      <button onClick={handleVoiceCommand}>Start Listening</button>
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

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
