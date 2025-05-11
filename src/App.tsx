import React from 'react';
import './App.css';
import Example from './components/Example/Example';
import PhysicsExample from './components/Example/PhysicsExample';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Interactive Orbe Element</h1>
        <p>
          A 3D visualization of a voice AI agent with different animation states
        </p>
      </header>
      <main className="App-main">
        <Example />
      </main>
    </div>
  );
}

export default App;
