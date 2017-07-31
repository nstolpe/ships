#!/bin/bash

for js in source/js/*.js; do
	echo "compiling $js";
	browserify "$js" -o .static/assets/js/$(basename "$js") --noparse=$(pwd -P)/node_modules/pixi-particles/dist/pixi-particles.min.js;
done
