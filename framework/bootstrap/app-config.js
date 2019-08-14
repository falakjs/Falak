const { fs } = require('./modules');

if (!global.config) {
    if (!fs.exists(MAIN_CONFIG_PATH)) {
        die(cli.white(`Framework is not running in a workspace, please run it in a workspace.`));
    }

    global.config = fs.getJson(MAIN_CONFIG_PATH);
}

class AppConfig {
    constructor(appName, command) {
        this.command = command;
        this.setApp(appName);
        this.setGlobals();
    }

    setApp(appName) {
        this.port = config.port;

        if (this.command && this.command.options.port) {
            this.port = Number(this.command.options.port);
        } else if (appName && config.apps[appName].port) {
            this.port = Number(config.apps[appName].port);
        }

        process.env.PORT = this.port;

        this.appName = appName || config.baseApp;

        if (global.ENV) {
            process.env.mode = global.ENV;
        } else {
            process.env.mode = global.ENV = config.env;
        }

        if (ENV == 'production') {
            this.baseUrl = config.production.baseUrl;
        } else {
            // development
            this.baseUrl = `http://localhost:${process.env.PORT}`;
        }

        if (!config.apps[this.appName]) {
            die(`Undefined app ${cli.redBright(this.appName)}`);
        }

        this.currentApp = config.apps[this.appName];
    }

    setGlobals() {
        global.BASE_URL = this.baseUrl;
        global.SCRIPT_URL = (this.baseUrl.rtrim('/') + this.currentApp.path).rtrim('/');
        global.APP_NAME = this.appName;
        global.appConfig = this.currentApp;
        global.APP_SCRIPT_PATH = appConfig.path;
        global.CURRENT_DIRECTION = config.locales[appConfig.locale].direction;
        global.CURRENT_LOCALE = appConfig.locale;
        global.STATIC_DIR = ROOT + `/public/${APP_NAME}`;
        global.APP_DIR = SRC_DIR + '/' + APP_NAME;
    }
}

module.exports = (app, command) => new AppConfig(app, command);