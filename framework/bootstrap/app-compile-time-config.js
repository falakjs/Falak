const { fs } = require('./modules');
const globalize = require('./globals');

function loadAppConfig() {
    const commonConfigPath = SRC_DIR + '/common/compiled-config.json';
    const appConfigPath = APP_DIR + '/compiled-config.json';

    let appConfig = {};
    if (fs.exists(commonConfigPath)) {
        appConfig = fs.getJson(commonConfigPath);
    }

    if (fs.exists(appConfigPath)) {
        appConfig = Object.merge(appConfig, appConfigPath);
    }

    globalize('htmlAppConfig', appConfig);
}

loadAppConfig();