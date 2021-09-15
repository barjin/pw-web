#!/bin/bash
cd ..
echo "Installing pwww-server dependencies..."
sudo npm install .
cd ..
echo "Compiling pwww-server ts to js..."
sudo tsc
sudo cp ./package.json ./build/src
echo "pwww-server has been successfully built!"