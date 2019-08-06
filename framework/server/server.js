const express = require('express');
const app = express();
const { sassCompiler } = require('./../bootstrap');
const htmlBuilder = require('../helpers/html-builder');

function setApp(request) {
    for (let appName in config.apps) {
        let appConfig = config.apps[appName];
        if (request.path.startsWith(appConfig.path)) {
            global.appConfig = appConfig;
            appConfig.name = appName;
            setCurrentLocale(appConfig, request);
            break;
        }
    }
}

function getDirectionOf(localeCode) {
    return config.locales[localeCode].direction;
}

function setCurrentLocale(appConfig, request) {
    let oldLocale = CURRENT_LOCALE;
    if (request.path == appConfig.path) {
        global.CURRENT_DIRECTION = getDirectionOf(appConfig.locale);
        global.CURRENT_LOCALE = appConfig.locale;
    }

    // echo(request.path)

    for (let locale of appConfig.locales) {
        if (request.path.trim('/').startsWith(appConfig.path.ltrim('/') + '/' + locale)) {
            global.CURRENT_LOCALE = locale;
            global.CURRENT_DIRECTION = getDirectionOf(locale);

            break;
        }
    }

    // clear compiled sass code if the locale has changed
    if (oldLocale != CURRENT_LOCALE) {
        sassCompiler.clear(CURRENT_DIRECTION);
    }
}

app.get('*', async (request, response) => {
    if ((request.path.startsWith('/public') && !request.path.startsWith(`/public/${APP_NAME}/css`))
        || request.path.startsWith('/src') || request.path.startsWith('/node_modules')) {
        return response.sendFile(ROOT + request.path);
    }

    setApp(request);

    if (request.path.startsWith(`/public/${APP_NAME}/css`)) {
        try {
            let compiledStyle = await sassCompiler.compile(CURRENT_DIRECTION);
            response.setHeader("Content-Type", "text/css");
            return response.send(compiledStyle);
        } catch (e) {
            sassCompiler.error(e);
        }
    }

    response.send(sendResponse());
});

function sendResponse() {
    let localeCode = CURRENT_LOCALE;

    let title = appConfig.meta.title[localeCode];

    return htmlBuilder.appName(appConfig.name)
                      .appDirection(CURRENT_DIRECTION)
                      .facebookAppId(appConfig.meta.facebookAppId)
                      .localeCode(CURRENT_LOCALE)
                      .baseUrl(BASE_URL)
                      .title(title)
                      .stylesheets(getStylesheets(CURRENT_DIRECTION, appConfig.name))
                      .scripts(getScriptTags())
                      .compile();
}

function getScriptTags() {
    let cdnFiles = resources.externals.js || [];
        
    return cdnFiles.concat(resources.jsVendor).concat(resources.jsFiles).map(filePath => {
        return `<script src="${filePath}"></script>`;
    }).join('');
}

function getStylesheets(direction) {
    let stylesheets = {
        appSheet: `public/${APP_NAME}/css/app-${direction}.css`,
        externalSheets: [],
        favicons: [],
    };

    // let stylesheets = `
    //     <link rel="stylesheet" dir="${direction}" id="app-style" href="/public/${APP_NAME}/css/app-${direction}.css?v=" />
    // `;

    if (!Is.empty(Object.get(resources.externals, `css.${CURRENT_DIRECTION}`)) || !Is.empty(Object.get(resources.externals, `css.common`))) {
        // if (! Is.empty(resources.externals.css[CURRENT_DIRECTION]) || ! Is.empty(resources.externals.css.common)) {
        let commonCdns = resources.externals.css.common || [],
            directionCdns = resources.externals.css[CURRENT_DIRECTION] || [],
            cdns = commonCdns.concat(directionCdns);
        // stylesheets = cdns.map(stylesheet => `<link rel="stylesheet" href="${stylesheet}" />`).join("") + stylesheets;
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

function sassError(error) {
    sassCompiler.error(error);
    // die();
}

async function startServer(command) {
    echo.sameLine(cli.cyan('Compiling sass files...'));
    await sassCompiler.compile('ltr').then().catch(sassError);
    await sassCompiler.compile('rtl').then().catch(sassError);
    echo.sameLine(cli.green('Sass files have been compiled successfully.'));

    setTimeout(() => {
        io.emit('reconnected');
    }, 500);

    let port = process.env.PORT,
        scriptUrl = SCRIPT_URL;

    app.listen(port, (err) => {
        echo.sameLine(cli.green(`Start browsing the application from ${cli.cyan(scriptUrl)}`));
        echo();
        if (command.open) {
            let openOptions = {};

            if (command.browser) {
                openOptions.app = command.browser;
            } else if (config.browser != 'default') {
                openOptions.app = config.browser;
            }

            const open = require('open');
            open(scriptUrl, openOptions);
        }
    });
}

module.exports = {
    start: startServer,
};