const clients = require('./../sockets/clients');

class SassWatcher {
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
        const { sassCompiler } = require('./../bootstrap');
        this.eyeOrb.watch([
            SRC_DIR + '/**/*.scss',
            BASE_NODE_MODULES_DIR + '/**/*.scss',
        ]).on('all', async filePath => {
            echo.sameLine(cli.yellow('Recompiling sass...'));
            try {
                let style = await sassCompiler.clear(CURRENT_DIRECTION).compileThenSave(CURRENT_DIRECTION);
                echo.sameLine(cli.green('Sass files has been compiled...'));
                clients.exec(client => {
                    client.emit('sass-compiled', style);
                });
            } catch (error) {
                sassCompiler.error(error);
                clients.exec(client => {
                    client.emit('sass-compiler-error', error);
                });
            }
        });
    }
}

module.exports = SassWatcher;