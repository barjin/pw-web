#!/bin/bash
cd ..
echo "Installing pwww-server dependencies..."
sudo npm install .
cd playwright
echo "Installing playwright dependencies..."
sudo npm install --production=false .
cd ..
echo "Compiling pwww-server ts to js..."
sudo tsc
sudo cp ./package.json ./build/backend/src
sudo rm -r ./build/backend/playwright
echo "pwww-server has been successfully built!"