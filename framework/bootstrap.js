const globalize = require('./bootstrap/globals');
const chalk = require('chalk');
globalize('cli', chalk);
const { fs } = require('./bootstrap/modules');
require('./bootstrap/globals');

require('./helpers/manager');

require('./bootstrap/app-compile-time-config');

const SassCompiler = require('./sass-compiler/sass-compiler');

const watcher = require('./watcher/eye-orb');

const appBuilder = require('./build/builder');

const npmManager = require('./build/builders/npm-manager');

let sassCompiler, htmlCompiler;

if (fs.exists(MAIN_CONFIG_PATH)) {
    htmlCompiler = require('./compiler/core');
    sassCompiler = new SassCompiler({
        root: ROOT,
        srcDir: SRC_DIR,
        appDir: APP_DIR,
        appName: APP_NAME,
    });
}

module.exports = {
    watcher,
    htmlCompiler,
    appBuilder,
    sassCompiler,
    npmManager,
};