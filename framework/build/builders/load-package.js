const { fs } = require('./../../bootstrap/modules');
const collectAssets = require('./collect-assets');
const collectInternals = require('./collect-internals');
const collectExternals = require('./collect-externals');
const { installPackages } = require('./npm-manager');

const MAIN_APP_COMPONENTS = [];

function loadPackage(packageName, packageType) {
    return new Promise(async resolve => {
        if (!Is.empty(resources['packages'][packageType + '@' + packageName])) {
            resolve();
            return;
        }

        let packagePath;

        if (packageType == 'package') {
            packagePath = ROOT + '/node_modules/' + packageName;
        } else if (packageType == 'app') {
            packagePath = SRC_DIR + '/' + packageName;
        }

        if (!fs.exists(packagePath + '/package.json')) {
            throw new Error(`Missing package.json file for "${packageType}" package "${packageName}"`);
        }

        let $package = fs.getJson(packagePath + '/package.json');

        $package.path = packagePath;

        if (Is.empty($package.type)) {
            $package.type = packageType;
        }

        if ($package.type == 'app') {
            // just add default components for the main app package
            if (packageName != 'common') {
                $package.modules = ($package.modules || []).concat(MAIN_APP_COMPONENTS);
            }

            if ($package.favicon) {
                resources.favicon = $package.favicon;
            }

            if (!Is.empty($package.packages)) {
                await installPackages($package.packages);

                for (let packageName of $package.packages) {
                    if (!packageName.startsWith(process.env.CLI_NAME + '-')) continue;
                    await loadPackage(packageName, 'package');
                }
            }

            for (let appModule of $package.modules) {
                if (! fs.isDir(`${$package.path}/modules/${appModule}`)) {
                    echo.clear();
                    echo(cli.white(`Not found module ${cli.yellowBright(appModule)} directory in ${cli.greenBright($package.name)} application`));
                    continue;
                }
                resources.packages[`${packageName}@${appModule}`] = `${$package.path}/modules/${appModule}`;
            }
        } else if ($package.type == 'package') {
            if (!Is.empty($package.dependencies)) {
                for (let packageName in $package.dependencies) {
                    if (!packageName.startsWith(process.env.CLI_NAME + '-')) continue;
                    await loadPackage(packageName, 'package');
                }
            }
            resources.packages[`${$package.type}@${packageName}`] = $package.path;
        }

        collectInternals($package);
        collectExternals($package);

        if (!Is.empty($package.assets)) {
            let assetsDir = $package.type == 'app' ? $package.path : $package.path + '/dist';
            collectAssets($package.assets, assetsDir + '/assets');
        }

        if (!Is.empty($package.mainFiles)) {
            if (!Is.plainObject($package.mainFiles)) {
                die(`The mainFiles property must be an object in ${cli.redBright($package.path)}/package.json.`);
            }

            addMainFiles($package.mainFiles);
        }
        resolve();
    });
}

module.exports = loadPackage;