class HTMLWatcher {
    /**
     * Constructor
     */
    constructor(eyeOrb) {
        this.eyeOrb = eyeOrb;
        this.startWatching();
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

module.exports = HTMLWatcher;