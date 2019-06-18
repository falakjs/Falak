const path = require('path');
const fs = require('flk-fs');
const util = require('util');

global.echo = (...args) => {
    let formattedArgs = [];
    for (let arg of args) {
        if (Is.object(arg)) {
            formattedArgs.push(util.inspect(arg, {
                colors: true,
                depth: null,
                compact: false,
            }));
        } else {
            formattedArgs.push(arg);
        }
    }

    console.log(...formattedArgs);
};

global.dirname = path.dirname;
global.normalizePath = filePath => path.resolve(filePath).replace(/\\/g, '/');
global.Is = require('./../helpers/Is');
Object.merge = require('deepmerge');
global.cli = require('chalk');
global.random = (length = 32) => {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
};

global.ROOT = normalizePath('./');
global.FRAMEWORK_PACKAGE_PATH = normalizePath(__dirname + '/../../');
global.FRAMEWORK_RESOURCES_PATH = FRAMEWORK_PACKAGE_PATH + '/resources';
global.MAIN_CONFIG_PATH = ROOT + '/config.json';
global.FRAMEWORK_ROOT_PATH = FRAMEWORK_PACKAGE_PATH + '/framework';
global.FRAMEWORK_OUTPUTS_PATH = FRAMEWORK_ROOT_PATH + '/outputs';
global.SRC_DIR = ROOT + '/src';
global.FRAMEWORK_NAME = 'falak';

// check if the package is called globally
if (fs.isDir(FRAMEWORK_PACKAGE_PATH + '/node_modules')) {
    process.env.isGlobal = true;
    global.NODE_MODULES_DIR = FRAMEWORK_PACKAGE_PATH + '/node_modules';
} else {
    process.env.isGlobal = true;
    global.NODE_MODULES_DIR = ROOT + '/node_modules';
}

global.log = require('single-line-log').stdout;

global.echo.sameLine = log;
global.echo.clear = echo;

global.die = global.exit = message => {
    if (message) echo(message);
    process.exit(0);
};

function globalize(key, value) {
    if (Is.object(key)) {
        for (let name in key) {
            globalize(name, key[name]);
        }
        return;
    }

    global[key] = value;
}

echo.clearCli = console.clearCli = () => process.stdout.write('\x1B[2J\x1B[0f');

module.exports = globalize;