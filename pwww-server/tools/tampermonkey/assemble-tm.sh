#!/bin/bash
NAME="tm_script.user.js"
sudo cat tm-header.user.js ../../build/src/extractSelector.js > $NAME
sudo echo -e "\n(function() {\n'use strict';\n" >> $NAME
sudo cat ../../test/generatorClickCapture.js >> $NAME
sudo echo -e "\n})();" >> $NAME