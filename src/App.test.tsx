import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the Example component to avoid Three.js rendering issues in tests
jest.mock('./components/Example/Example', () => {
  return function MockExample() {
    return <div data-testid="example-component">Example Component Mock</div>;
  };
});

test('renders the app header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Interactive Orbe Element/i);
  expect(headerElement).toBeInTheDocument();
});
