const { fs, glob } = require('./../../bootstrap/modules');

function saveComponents() {
    return new Promise(resolve => {
        let $jsComponentsContent = '';

        // now we will register the script configurations
        // env, appName base url, script path
        let $config = [
            ENV,
            APP_NAME,
            BASE_URL,
            APP_SCRIPT_PATH,
        ].map(value => `'${value}'`).join(',');

        $jsComponentsContent += `const BASE_URL = "${BASE_URL}"; const APP_NAME = '${APP_NAME}'; const _C = [${$config}];`;

        // now we need to check if there is any externals files to be loaded
        // js or css files
        let $externals = resources.externals;

        $jsComponentsContent += `var __EXTERNALS__ = ${JSON.stringify($externals)};`;
        $jsComponentsContent += `var LANGUAGES = ${JSON.stringify(config.locales)};`;

        let $initPath = STATIC_DIR + '/js/__init__.js';

        fs.makeDirectory($initPath + '/../', '0777');

        fs.put($initPath, $jsComponentsContent);

        resources.jsFiles.push('public/' + APP_NAME + '/js/__init__.js');

        let packagesPaths = Object.values(resources.packages).map(packagePath => {
            if (packagePath.includes('node_modules')) {
                packagePath += '/dist';
            }
            
            return packagePath + '/**/*.js';
        });

        glob(packagesPaths, (err, files) => {
            for (let file of files) {
                let $jsPath = file.removeFirst(ROOT + '/');

                // just for now
                if ($jsPath.includes('compiler/')) continue;

                if (resources.jsFiles.includes($jsPath)) continue;

                resources.jsFiles.push($jsPath);
            }

            let runPath = STATIC_DIR + '/js/__run__.js';

            if (!fs.exists(runPath)) {
                let runContent = `(new Application).run();`;
                fs.put(runPath, runContent);
            }

            resolve();
        });
    });
}

module.exports = saveComponents;