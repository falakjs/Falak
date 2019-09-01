const { appBuilder, htmlCompiler, watcher, sassCompiler } = require('./bootstrap');

let ready = {};

function resetReady() {
    ready = {
        // scss: false,
        html: false,
        // npm: false,
    };
}

function compileSass() {
    echo.sameLine(cli.cyan('Compiling sass files...'));

    function getAppDirections() {
        let directions = [];
        for (let locale of appConfig.locales) {
            if (!directions.includes(config.locales[locale].direction)) {
                directions.push(config.locales[locale].direction);
            }
        }
        return directions;
    }

    let directions = getAppDirections();

    for (let direction of directions) {
        sassCompiler.compile(direction);
    }
}

function buildApp() {
    return new Promise(resolve => {
        resetReady();

        let readyChecker = setInterval(() => {
            for (let type in ready) {
                if (ready[type] === false) return;
            }

            clearInterval(readyChecker);
            resolve();
        }, 10);

        appBuilder.build().then(() => {
            if (ENV == 'development') {
                watcher.watchType('js');
                watcher.watchType('scss');
                watcher.watchType('assets');
            }

            echo.sameLine(cli.cyan(`Compiling html files`));

            htmlCompiler.compileAll().then(async () => {
                compileSass();

                if (ENV == 'development') {
                    watcher.watchType('html');
                }
                await appBuilder.finish();

                ready.html = true;
                // echo.sameLine(cli.yellow(cli.green('Html') + ' files are ready to go.'));
            });
        });
    });
}

module.exports = buildApp;