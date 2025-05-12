#!/bin/bash

# Setup script for running the interactive orbe with fixed mouse tracking

# Create necessary symbolic links for the ComplexShapesFixed.ts file
echo "Setting up environment for fixed mouse tracking..."

# Backup original files if needed
if [ ! -f "src/utils/ComplexShapes.ts.bak" ]; then
  echo "Creating backup of original ComplexShapes.ts..."
  cp src/utils/ComplexShapes.ts src/utils/ComplexShapes.ts.bak
fi

# Install any required dependencies
echo "Installing dependencies..."
npm install

# Start the development server
echo "Starting development server with fixed mouse tracking implementation..."
npm start
