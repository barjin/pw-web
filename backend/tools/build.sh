#!/bin/bash
cd $GITHUB_WORKSPACE/backend
sudo npm install .
cd playwright
sudo npm install --production=false .
cd ..
sudo tsc
cp ./package.json ./build