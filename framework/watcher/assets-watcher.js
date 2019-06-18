class AssetsWatcher {
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
        this.eyeOrb.watch(SRC_DIR + '/**/assets/**').on('all', filePath => {
            reloadApp();
        });
    }
}

module.exports = AssetsWatcher;