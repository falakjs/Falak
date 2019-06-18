const watcher = require('chokidar');

const HTMLWatcher = require('./html-watcher');
const SassWatcher = require('./sass-watcher');
const JavascriptWatcher = require('./javascript-watcher');
const AssetsWatcher = require('./assets-watcher');

const watchList = {
    html: HTMLWatcher,
    scss: SassWatcher,
    js: JavascriptWatcher,
    assets: AssetsWatcher,
};

class Watcher {
    /**
     * Watch the given type
     * @param {*} type 
     */
    watchType(type) {
        return new watchList[type](this);
    }

    /**
     * Start watching the given path
     * @param {*} path 
     */
    watch(path) {
        return watcher.watch(path, {
            ignoreInitial: true,
        });
    }
}

module.exports = new Watcher;