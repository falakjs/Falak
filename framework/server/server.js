const express = require('express');
const app = express();
const { sassCompiler } = require('./../bootstrap');
const htmlBuilder = require('../helpers/html-builder');
// const browserify = require('browserify');

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
    if (request.path.endsWith('bundle.js')) {
        while (bundling) { }
        return response.sendFile(BUNDLED_PATH);
    } else if ((request.path.startsWith('/public') && !request.path.startsWith(`/public/${APP_NAME}/css`))
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

    // return cdnFiles.concat(['bundle.js']).concat(resources.jsFiles).map(filePath => {
    //     return `<script src="${filePath}"></script>`;
    // }).join('');

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

const bundledJs = '';

let bundling = true;

const BUNDLED_PATH = ROOT + '/public/bundle.js';

function bundleJS() {
    let filesList = resources.jsFiles.map(f => ROOT + '/' + f.ltrim('/'));

    const { fs } = require('flk-fs');

    // create a temp app.js file and inject all files inside it

    let appContent = '';

    const flkPackages = [];

    // get the common and the current app package.json files content
    for (let app of ['common', APP_NAME]) {
        let packageJsonFile = SRC_DIR + '/' + app + '/package.json';
        if (fs.exists(packageJsonFile)) {
            let commonFile = fs.getJson(packageJsonFile);
            commonFile.packages.map(npmPackage => {
                // excludePackages is from npm-manager.js file
                if (excludePackages.includes(npmPackage)) return;
                if (npmPackage.includes('flk-')) {
                    return;
                    // return flkPackages.push(npmPackage);
                }

                appContent += `require('${npmPackage}');\n`;
            });
        }
    }

    // filesList.map(f => {
    //     appContent += `require('${f}');\n`;  
    // })

    // const appPath = ROOT + '/public/' + APP_NAME + '/js/app.js';
    const appPath = ROOT + '/app.js';

    fs.put(appPath, appContent);

    // fs.putJson(ROOT + '/p.json', filesList.map(f => f.replace(ROOT, '')));

    // return;

    let bundler = browserify({
        entries: appPath,
        paths: [ROOT, ROOT + '/node_modules'],
        debug: true,
        insertGlobalVars: {
            $: function (file) {
                echo(file)
            }
        }
    });


    filesList.map(f => {
        bundler.add(f);
    })

    bundler.on('file', file => {
        file = file.replace(/\\/g, '/')
        // if (file.toLowerCase().includes('jquery') || file.includes('mdb.min')) echo(file.replace(ROOT, ''));
        if (file.includes('flk-') || file.includes(SRC_DIR) || file.includes(ROOT + '/public')) return;
        // echo(file.replace(ROOT, ''));
    })

    let opt = '';

    const fileSystem = require('fs');

    // let output = bundler.bundle((e, buf) => {
    //     opt += buf.toString();
    // });

    var bundleFs = fileSystem.createWriteStream(BUNDLED_PATH);

    bundler.pipeline.on('file', function () {
        // echo(arguments[0])
    })

    bundler.bundle().on('error', function () {
        echo(arguments[0]);
    }).pipe(bundleFs);

    bundleFs.on('finish', e => {
        echo('Done');
        bundling = false;
    });
}

async function startServer(command) {
    // bundleJS();

    // function getAppDirections() {
    //     let directions = [];
    //     for (let locale of appConfig.locales) {
    //         if (! directions.includes(config.locales[locale].direction)) {
    //             directions.push(config.locales[locale].direction);
    //         }
    //     }
    //     return directions;
    // }

    // let directions = getAppDirections();

    // echo.sameLine(cli.cyan('Compiling sass files...'));
    
    // for (let direction of directions) {
    //     await sassCompiler.compile(direction).then().catch(sassError);
    // }

    // echo.sameLine(cli.green('Sass files have been compiled successfully.'));

    setTimeout(() => {
        io.emit('reconnected');
    }, 500);

    let port = process.env.PORT,
        scriptUrl = SCRIPT_URL;

    app.listen(port, (err) => {
        if (ORIGINAL_PORT != port) {
            echo.sameLine(cli.blueBright(`NOTICE: Port ${cli.redBright(ORIGINAL_PORT)} is in use, ${cli.green(port)} is used instead.`));
            echo();
        }
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