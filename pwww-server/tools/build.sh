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
sudo cp ./package.json ./build/src
sudo rm -r ./build/playwright
echo "pwww-server has been successfully built!"