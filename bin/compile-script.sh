#!/bin/bash

# takes a path argument and compiles the file at that path with browserify.
# compiles to the static path.
echo "compiling $1";
browserify "$1" -o .static/assets/js/$(basename "$1") --noparse=$(pwd -P)/node_modules/pixi-particles/dist/pixi-particles.min.js;
