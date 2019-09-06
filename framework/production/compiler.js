const { fs } = require('./../bootstrap/modules');
let htmlBuilder = require('../helpers/html-builder');
const hashCode = random(24);
const serviceWorker = require('./../build/builders/service-worker-handler');

function copyAssets(STATIC_DIR) {
    for (let assets of resources.assets) {
        let dist = assets.dist;

        for (let asset of assets.src) {
            if (!fs.isDir(asset)) {
                throw new Error(`${asset} asset doesn't exists`);
            }

            fs.copy(asset, STATIC_DIR + '/' + dist);
        }
    }
}

function createHtmlFiles(appName) {
    for (let localeCode of appConfig.locales) {
        let direction = config.locales[localeCode].direction;
        let htmlCode = getHtmlCode(localeCode, direction, appName);
        fs.put(ROOT + `/dist/${appName}-${localeCode}.html`, htmlCode);
    }
}

function getHtmlCode(localeCode, direction, appName) {
    let title = appConfig.meta.title[localeCode];

    return htmlBuilder.appName(appName)
        .appDirection(direction)
        .localeCode(localeCode)
        .facebookAppId(appConfig.meta.facebookAppId)
        .baseUrl(BASE_URL)
        .title(title)
        .stylesheets(getStylesheets(direction, appName))
        .scripts(getScriptTags(appName))
        .compile();
}

function getScriptTags(appName) {
    let scripts = '',
        cdnFiles = resources.externals.js || [];

    // polyfill
    // scripts += '<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/7.2.5/polyfill.min.js"></script>';

    if (!Is.empty(cdnFiles)) {
        scripts += cdnFiles.map(filePath => {
            return `<script src="${filePath}"></script>`;
        }).join('');
    }


    scripts += ['vendor', 'app'].map(fileType => {
        return `<script src="public/${appName}/js/${fileType}-${hashCode}.min.js"></script>`
    }).join('');

    return scripts;
}

function getStylesheets(direction, appName) {
    let stylesheets = {
        appSheet: `public/${appName}/css/app-${direction}-${hashCode}.min.css`,
        externalSheets: [],
        favicons: [],
    };
    // let stylesheets = `<link rel="stylesheet" dir="${direction}" id="app-style" href="public/${appName}/css/app-${direction}-${hashCode}.min.css" />`;

    if (!Is.empty(resources.externals.css[direction]) || !Is.empty(resources.externals.css.common)) {
        let commonCdns = resources.externals.css.common || [],
            directionCdns = resources.externals.css[direction] || [],
            cdns = commonCdns.concat(directionCdns);
        stylesheets.externals = cdns;
    }

    if (resources.favicon) {
        stylesheets.favicons = [`public/${APP_NAME}/${resources.favicon}`];
        // stylesheets = `
        //     <link rel="icon" type="image/x-icon" href="public/${APP_NAME}/${resources.favicon}" />
        // ` + stylesheets;
    }

    return stylesheets;
}

module.exports = (appName, command) => {
    return new Promise(async (resolve, reject) => {
        const appDistPath = ROOT + '/dist/public/' + appName;

        // remove the old dist
        fs.remove(appDistPath);
        // create it again
        fs.makeDirectory(appDistPath);
        // create js directory
        fs.makeDirectory(appDistPath + '/js');

        // check if there's a service worker
        if (serviceWorker.check(appName)) {
            serviceWorker.copy();
        }

        // create css directory
        fs.makeDirectory(appDistPath + '/css');
        // copy css files
        fs.copy(STATIC_DIR + '/css', appDistPath + '/css');
        // rename css files
        fs.rename(appDistPath + '/css/app-ltr.css', appDistPath + `/css/app-ltr-${hashCode}.min.css`);
        fs.rename(appDistPath + '/css/app-rtl.css', appDistPath + `/css/app-rtl-${hashCode}.min.css`);
        // copy assets
        copyAssets(appDistPath);
        Promise.all([
            // compile vendors
            require('./compile-vendors')(hashCode, appDistPath),
            // compile application
            require('./compile-application')(hashCode, appDistPath, appName)
        ]).then(resolve);

        echo(cli.yellow('Generating html files..'));
        // create html files
        createHtmlFiles(appName);
        // resolve();
    });
};