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
cp ./package.json ./build/src

sudo apt install zip unzip

sudo zip -r pwww-server.zip ./build/src/*
echo "pwww-server has been successfully built!"