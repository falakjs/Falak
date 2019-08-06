const { fs } = require('flk-fs');

const serviceWorker = require('./../build/builders/service-worker-handler');

class JavascriptWatcher {
    /**
     * Constructor
     */
    constructor(eyeOrb) {
        this.eyeOrb = eyeOrb;
        this.serviceWorkerExists = false;
        if (serviceWorker.check(APP_NAME)) {
            this.serviceWorkerExists = true;
            serviceWorker.copy();
        }
        this.startWatching();
    }

    isServiceWorkerFile(filePath) {
        return this.possibleServiceWorkerPaths.includes(filePath);
    }

    updateServiceWorkerFile(filePath) {
        fs.copy(filePath, STATIC_DIR + '/js/service-worker.js');
    }

    /**
     * Start watching
     */
    startWatching() {
        this.eyeOrb.watch(STATIC_DIR + '/smart-views/**/*.js').on('all', filePath => {
            reloadApp();
        });

        let updatingJs = false;

        this.eyeOrb.watch(SRC_DIR + '/**/*.js').on('add', filePath => {
            rebuildApp();
        }).on('change', filePath => {
            filePath = filePath.replace(/\\/g, '/');

            if (serviceWorker.is(filePath)) {
                serviceWorker.copy();
                reloadApp();
                return;
            }

            if (updatingJs) return;
            updatingJs = true;

            setTimeout(() => {
                if (filePath.includes('/compiler')) {
                    const { htmlCompiler } = require('./../bootstrap');
                    echo('Rebuilding html files...');
                    htmlCompiler.compileAll().then(() => {
                        reloadApp();
                        echo('Html files have been rebuilt successfully');
                    });
                } else {
                    reloadApp();
                }
                updatingJs = false;
            }, 100);

        }).on('unlink', filePath => {
            rebuildApp();
        });

        this.eyeOrb.watch(SRC_DIR + '/**/package.json').on('all', (e, file) => {
            rebuildApp();
        });
    }
}

module.exports = JavascriptWatcher;