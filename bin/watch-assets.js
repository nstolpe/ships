/**
 * `paths` stores sets of source and build paths.
 * Files in build paths are watched and copied to the corresponding build path on change.
 */
const chokidar = require('chokidar');
const fs = require('fs-extra');

const paths = [
    {
        source: 'source/data/',
        build: '.static/assets/data/',
    },
    {
        source: 'source/images/',
        build: '.static/assets/images/',
    },
    {
        source: 'source/spritesheets/',
        build: '.static/assets/spritesheets/',
    },
];

const copy = (filePath, sourcePath, buildPath) => {
    let fileName = filePath.replace(sourcePath, '');
    fs.copy(filePath, buildPath + fileName)
        .then(() => console.log(`${filePath} copied to ${buildPath + fileName}\nWatching ${sourcePath}`))
        .catch(e => console.error(e));
};

paths.forEach(path => {
    fs.copySync(path.source, path.build);
    chokidar.watch(path.source, {
        ignored: /(^|[\/\\])\../,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100,
            },
    }).on('change', function(filePath) {
        console.log('dsfasdf');
        copy(filePath, path.source, path.build);
    });
});

console.log('Watching assets.');
