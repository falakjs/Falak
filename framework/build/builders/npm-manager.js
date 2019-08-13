const { fs } = require('./../../bootstrap/modules');
var execute = require('child-process-promise').exec;

let packagesList = {};
const NODE_MODULES_DIR = ROOT + '/node_modules';

function installPackages(packages) {
    return new Promise(async resolve => {
        let packagesToBeInstalled = [];
        for (let $package of packages) {
            let packagePath = NODE_MODULES_DIR + '/' + $package;
            if (!fs.isDir(packagePath)) {
                packagesToBeInstalled.push($package);
            }

            packagesList[$package] = $package;
        }

        if (!Is.empty(packagesToBeInstalled)) {
            echo.sameLine(`Installing ${cli.cyan(packagesToBeInstalled.join(', '))}`);

            await execute(`npm install ${packagesToBeInstalled.join(' ')}`, {
                cwd: ROOT,
            });

            echo.sameLine(`${cli.green(packagesToBeInstalled.join(', '))} have been installed`);
        }

        for (let $package of packages) {
            collectPackageDependencies($package);
        }

        resolve();
    });
}

function collectPackageDependencies($package) {
    let packagePath = NODE_MODULES_DIR + '/' + $package;
    let packageJsonFile = fs.getJson(packagePath + '/package.json');

    if (!Is.empty(packageJsonFile.dependencies) && $package.startsWith(process.env.CLI_NAME + '-')) {
        for (let packageName in packageJsonFile.dependencies) {
            collectPackageDependencies(packageName);
        }
    }

    if (!packagesList[$package]) {
        packagesList[$package] = $package;
    }
}

function collect() {
    return new Promise(async resolve => {
        let filesList = [];

        global.excludePackages = [];

        let devDependencies = [];

        for (let $package in packagesList) {
            let packagePath = NODE_MODULES_DIR + '/' + $package;

            // if it is in the main files and set to null, then it will be skipped
            if (resources.mainFiles[$package] === null) continue;

            if (resources.mainFiles[$package]) {
                for (let filePath of resources.mainFiles[$package]) {
                    filesList.push(packagePath + '/' + filePath);
                }

                continue;
            }

            let packageJsonFile = fs.getJson(packagePath + '/package.json');
            let mainFile = packageJsonFile.main;

            if (packageJsonFile.devDependencies) {
                for (let npmPackage in packageJsonFile.devDependencies) {
                    let requiredPackage = npmPackage + '@' + packageJsonFile.devDependencies[npmPackage];
                    if (!devDependencies.includes(requiredPackage) && !fs.isDir(NODE_MODULES_DIR + '/' + npmPackage)) {
                        devDependencies.push(requiredPackage);
                    }
                }
            }

            if (!mainFile) {
                excludePackages.push($package);
                continue;
            }

            // if the package is a framework package 
            // then skip it as we're getting all files from the dist directory instead of the main file
            if ($package.startsWith(process.env.CLI_NAME + '-')) continue;

            let mainFilePath = packagePath + '/' + mainFile;

            if (mainFilePath.endsWith('.css') || mainFilePath.endsWith('.scss')) {
                excludePackages.push($package);
                continue;
            }

            if (!mainFilePath.endsWith('.js')) {
                mainFilePath += '.js';
            }

            filesList.push(mainFilePath);
        }

        if (!Is.empty(devDependencies)) {
            // await installDevDependencies(devDependencies);
        }

        return resolve(filesList.map(filePath => filePath.ltrim(ROOT)));
    });
}

function installDevDependencies(devDependencies) {
    return new Promise(async (resolve, reject) => {
        resolve();
        echo('Installing dev dependencies...');
        echo(devDependencies)
        try {
            await execute(`npm install --save-dev ${devDependencies.join(' ')}`, {
                cwd: ROOT,
            });

            // resolve();
        } catch (e) {
            // echo(cli.red(e));
            // resolve();
        }
    });
}

module.exports = {
    collect,
    installPackages,
    packagesList,
};