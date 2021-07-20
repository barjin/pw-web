#!/bin/bash
sudo cat tm-header.user.js ../../build/src/extractSelector.js > tmscript.user.js
sudo echo -e "\n(function() {\n'use strict';\n" >> tmscript.user.js
sudo cat ../../test/generatorClickCapture.js >> tmscript.user.js
sudo echo -e "\n})();" >> tmscript.user.js