#!/bin/sh

echo -e " 
  _ ____      ____      ____      __\n | '_ \ \ /\ / /\ \ /\ / /\ \ /\ / /\n | |_) \ V  V /  \ V  V /  \ V  V / \n | .__/ \_/\_/    \_/\_/    \_/\_/  \n | |                                \n |_|            ...server          \n\n"

node ./checkForUpdates.js 

if [ $? -eq 1 ] # terrible, but it works
then
	unzip -o pwww-bundle.zip;
	/usr/local/bin/npm install --prefix ./src/
fi
echo "[runner] Running server..."
node --unhandled-rejections=warn ./src/pwwwServer.js