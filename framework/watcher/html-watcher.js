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
        const { htmlCompiler } = require('./../bootstrap');
        this.eyeOrb.watch([
            SRC_DIR + '/**/*.html',
            BASE_NODE_MODULES_DIR + '/**/*.html',
        ]).on('change', filePath => {
            filePath = normalizePath(filePath);
            // this condition will stop reloading the application if the user edited a file 
            // in another application than the current/common application.
            if (filePath.startsWith(SRC_DIR) && ! (filePath.startsWith(SRC_DIR + '/' + APP_NAME) || filePath.startsWith(SRC_DIR + '/common'))) return;

            setTimeout(() => {
                htmlCompiler.recompile(filePath).then(() => {
                    reloadApp();
                    echo(cli.green('File has been compiled...'));
                });
            }, 50);
        });
    }
}

module.exports = HTMLWatcher;