const { fs } = require('./../bootstrap/modules');

let htaccessFileContent = fs.get(FRAMEWORK_OUTPUTS_PATH + '/.htaccess');

let htaccessRulesPlaceholder = `
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^appRule appName-locale.html [L] 
`;

const httpsOnly = `    # Force https
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
`;

const prerenderText = (prerenderHandlerUrl, domainUrl, delay, bots) => `     # Prerender
    RewriteCond %{HTTP_USER_AGENT} .*(${bots}).*
    RewriteRule (.*) ${prerenderHandlerUrl}?domain=${domainUrl}&path=/$1&delay=${delay} [L,QSA]
`;
// with 301 Redirect
// '    RewriteRule (.*) ${prerenderHandlerUrl}?domain=${domainUrl}&path=/$1&delay=${delay} [L,R=301]'

const DEFAULT_PRERENDER_OPTIONS = {
    mode: 'facade', // facade|external|internal
    internalPath: 'prerender.php',
    delay: 2500,
    externalUrl: 'https://prerender.hasanzohdy.com',
    bots: 'Googlebot|facebook|crawl',
    staticDir: 'static-files',
};

function createHtaccessFile(command, apps) {
    let htacessRulesList = [],
        mainApp = '',
        appsList = '',
        APPS_LIST = [];
    for (let i = 0; i < apps.length; i++) {
        let appName = apps[i];

        let app = config.apps[appName],
            appPath = app.path.ltrim('/');

        let isBaseApp = i == apps.length - 1;
        if (! isBaseApp) {
            APPS_LIST.push(appName);
        }

        for (let localeCode of app.locales) {
            let appRule = localeCode == app.locale ? appPath : `${appPath}/${localeCode}`;

            if (isBaseApp && localeCode == app.locale) {
                mainApp = `${appName}-${localeCode}`;
            } else {
                if (isBaseApp && localeCode != app.locale) {
                    appRule = localeCode;
                    APPS_LIST.push(localeCode);
                }

                let htaccessAppsRules = htaccessRulesPlaceholder.replace('appRule', appRule)
                    .replace('appName', appName)
                    .replace('locale', localeCode);

                if (isBaseApp || ! isBaseApp && localeCode == app.locale) {
                    htacessRulesList.push(htaccessAppsRules);
                } else {
                    htacessRulesList.unshift(htaccessAppsRules);
                }
            }
        }
    }

    if (! Is.empty(APPS_LIST)) {
        appsList = `(${APPS_LIST.join('|')})|`;
    }

    let outputHtaccessFileContent = htaccessFileContent.replace('main', mainApp).replace('APPS_LIST', appsList).replace('#apps-rules', htacessRulesList.join(""));

    let httpsMode = typeof command.options.https != 'undefined' ? typeof command.options.https : config.production.https;
    let prerender = config.production.prerender;

    if (prerender === true) {
        prerender = DEFAULT_PRERENDER_OPTIONS;
    } else {
        prerender = Object.merge(DEFAULT_PRERENDER_OPTIONS, prerender);
    }

    if (prerender.mode === 'facade') {
        prerender.handlerUrl = prerender.internalPath;
    } else if (prerender.mode == 'external') {
        prerender.handlerUrl = prerender.externalUrl;
    } else if (prerender.mode == 'internal') {

    }

    outputHtaccessFileContent = outputHtaccessFileContent.replace('#https', httpsMode ? httpsOnly : '');

    if (prerender) {
        outputHtaccessFileContent = outputHtaccessFileContent.replace('#Prerender', prerenderText(prerender.handlerUrl, config.production.baseUrl, prerender.delay, prerender.bots));
    } else {
        outputHtaccessFileContent = outputHtaccessFileContent.replace('#Prerender', '');
    }

    fs.put(ROOT + '/dist/.htaccess', outputHtaccessFileContent);

    if (prerender.mode == 'facade') {
        let prerenderFile = fs.get(FRAMEWORK_OUTPUTS_PATH + '/prerender.php');

        prerenderFile = prerenderFile.replace('{staticDir}', prerender.staticDir);

        fs.put(ROOT + '/dist/' + prerender.internalPath, prerenderFile);
    }
}

async function startProducing(command) {
    if (!fs.exists(MAIN_CONFIG_PATH)) {
        die(cli.white(`Framework is not configured, please run ${cli.green(process.env.CLI_NAME + ' fresh-install')} first.`));
    }

    let config = fs.getJson(MAIN_CONFIG_PATH);
    // remove the old dist
    fs.remove(ROOT + '/dist');
    // create again
    fs.makeDirectory(ROOT + '/dist');

    let apps = ! Is.empty(command.args.apps) ? command.args.apps : Object.keys(config.apps);
        
    for (let appName of apps) {
        require(FRAMEWORK_ROOT_PATH + '/bootstrap/app-config')(appName);

        if (command.options.baseUrl) {
            global.BASE_URL = command.options.baseUrl;
        }

        let { sassCompiler } = require(FRAMEWORK_ROOT_PATH + '/bootstrap');

        global.echo.sameLine = console.log;

        sassCompiler.setOptions({
            root: ROOT,
            srcDir: SRC_DIR,
            appDir: APP_DIR,
            appName: APP_NAME,
        });

        const buildApp = require('./../app-compiler');

        await buildApp();
        await sassCompiler.clear('ltr').compile('ltr');
        await sassCompiler.clear('rtl').compile('rtl');

        await require('./../production/compiler')(appName, command);
    }

    echo(cli.yellowBright('Generating htacess file...'));
    createHtaccessFile(command, apps);

    echo(cli.greenBright('All applications have been built successfully.'));

    die();
}

module.exports = function (command) {
    startProducing(command);
}