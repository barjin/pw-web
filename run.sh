#!/bin/sh

echo -e " 
  _ ____      ____      ____      __\n | '_ \ \ /\ / /\ \ /\ / /\ \ /\ / /\n | |_) \ V  V /  \ V  V /  \ V  V / \n | .__/ \_/\_/    \_/\_/    \_/\_/  \n | |                                \n |_|            ...server          \n\n"

node ./checkForUpdates.js 
EXITCODE=$? # terrible, but it works

if [[ $EXITCODE -ne 0 && $EXITCODE -ne 1 ]] 
then
	echo "Error detected, terminating... See you later!"
fi

if [ $EXITCODE -eq 1 ] 
then
	unzip -o pwww-bundle.zip;
	/usr/local/bin/npm install --prefix ./src/
fi
echo "[runner] Running server..."
node --unhandled-rejections=warn ./src/PwwwServer.js