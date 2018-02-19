'use strict';
const fs = require('fs-extra');
fs.removeSync('.static');
fs.ensureDirSync('.static');
console.log('.static cleaned');
