#!/bin/bash
cd ..
sudo npm install .
cd playwright
sudo npm install --production=false .
cd ..
sudo tsc
cp ./package.json ./build