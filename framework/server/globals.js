const globalize = require('./../bootstrap/globals');
const buildApp = require('./../app-compiler');

let isRebuilding = false;

globalize({
    reloadApp: function () {
        if (isRebuilding || !serverIsReady()) return;
        setTimeout(() => {
            // echo('reloading...');
            io.emit('reload');
        }, 100);
    },
    rebuildApp: function () {
        if (isRebuilding) return;
        setTimeout(() => {
            isRebuilding = true;
            buildApp().then(() => {
                isRebuilding = false;
                reloadApp();
                setTimeout(() => {                    
                    echo.sameLine(cli.green('Application has been reloaded successfully...'));
                }, 500);
            });
        }, 100);
    }
})