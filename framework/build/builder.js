const { fs } = require('./../bootstrap/modules');
const globalize = require('./../bootstrap/globals');

const loadApp = require('./builders/load-app');
const copyAssets = require('./builders/copy-assets');
const saveComponents = require('./builders/save-components');
const npmManager = require('./builders/npm-manager');
var execute = require('child-process-promise').exec;

global.bundleJsFiles = function () {
    if (typeof JS_BUNDLE_FILE_NAME != 'undefined') {
        fs.unlink(`${STATIC_DIR}/js/${JS_BUNDLE_FILE_NAME}`);
    }
    
    echo.sameLine(`${cli.bold.white('Bundling js files...')}`);
    global.JS_BUNDLE_FILE_NAME = `bundle-${random(10)}.js`;
    return execute(`cd ${ROOT} && npx babel ${resources.jsVendor.concat(resources.jsFiles).join(" ")} --source-maps inline -o ${STATIC_DIR}/js/${JS_BUNDLE_FILE_NAME}`);
};

class AppBuilder {
    /**
     * Constructor
     */
    constructor() {
        this.buildingApp = false;
    }

    /**
     * Determine if the application is being built
     */
    appIsBeingBuilt() {
        return this.buildingApp === true;
    }

    /**
     * Start building the application
     */
    startBuilding() {
        this.buildingApp = true;

        echo.sameLine(`Building ${cli.redBright(APP_NAME)}`);
    }

    /**
     * Build the application
     */
    build() {
         return new Promise(async resolve => {
            if (this.appIsBeingBuilt()) return;

            let resources = {
                packages: {},
                vendor: {},
                externals: {},
                internals: {}, // internal static files
                assets: [],
                cssVendor: [],
                jsVendor: [],
                jsFiles: [],
                smartViews: [],
                mainFiles: {},
            };

            globalize('resources', resources);

            this.startBuilding();

            this.checkOutputDirectory();

            await loadApp('common');

            await loadApp(APP_NAME);

            copyAssets();

            await saveComponents();

            resolve();
        });
    }

    /**
     * Finish construction
     */
    finish() {
        return new Promise(async resolve => {
            resources.jsVendor = await npmManager.collect();

            resources.jsFiles = resources.jsFiles.concat(resources.smartViews);

            resources.jsFiles.push('src/' + APP_NAME + '/modules/config.js');
            resources.jsFiles.push('src/' + APP_NAME + '/modules/routing.js');
            resources.jsFiles.push('src/' + APP_NAME + '/modules/main.js');
            resources.jsFiles.push('public/' + APP_NAME + '/js/__run__.js');

            if (ENV == 'development') {
                let cliSocketHandlerPublicPath = STATIC_DIR + '/js/socket-handler.js';
                fs.put(cliSocketHandlerPublicPath, fs.get(FRAMEWORK_ROOT_PATH + '/cli-socket-handler.js').replace('PORT', process.env.SOCKET_PORT));

                resources.jsVendor.unshift('node_modules/socket.io-client/dist/socket.io.slim.js');
                resources.jsFiles.unshift(cliSocketHandlerPublicPath.replace(ROOT + '/', ''));
            }

            // let jsContent = '';

            // let filesList = resources.jsVendor.concat(resources.jsFiles);

            // for (let file of filesList) {
            //     jsContent += `//Starting ${file.ltrim(ROOT)} \r\n`;
            //     jsContent +=  fs.get(ROOT + '/' + file.ltrim('/')) + "\n\n;";
            // }

            // let bundlePath = STATIC_DIR + '/js/bundler.js';

            // fs.put(bundlePath, jsContent);

            // resources.jsVendor = [];

            // resources.jsFiles = [bundlePath.ltrim(ROOT)];

            // await bundleJsFiles();

            this.constructionComplete();
            resolve();
        });
    }

    /**
     * Finish the building
     */
    constructionComplete() {
        this.buildingApp = false;

        echo.sameLine(cli.redBright(APP_NAME) + cli.green(' has been built successfully'));
    }

    /**
     * Check if the output directory exists, if not then create it
     */
    checkOutputDirectory() {
        const htmlOutputDirectory = STATIC_DIR + '/smart-views';
        
        if (fs.exists(htmlOutputDirectory)) return;

        fs.makeDirectory(htmlOutputDirectory, '0777');
    }
}

function addMainFiles(mainFiles) {
    for (let packageName in mainFiles) {
        let packageMainFiles = mainFiles[packageName];
        
        if (Is.string(packageMainFiles)) {
            packageMainFiles = [packageMainFiles];
        }

        if (! resources.mainFiles[packageName]) {
            resources.mainFiles[packageName] = packageMainFiles;
        }
    }
}

global.addMainFiles = addMainFiles;

module.exports = new AppBuilder;