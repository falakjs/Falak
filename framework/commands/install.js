const { fs } = require('./../bootstrap/modules');   
var execute = require('child-process-promise').exec;

async function installPackages(command) {
    let appName = command.options.app || APP_NAME;

    let packages = command.packages;

    echo(`Installing ${cli.cyan(packages.join(', '))}`);
    
    try {
        let output = await execute(`npm install ${packages.join(' ')}`, {
            cwd: ROOT,
        });

        echo(output.stdout);
    } catch(e) {
        die(cli.red(e));
    }

    let appPackageFile = SRC_DIR + '/' + appName + '/package.json';

    let appPackageContent = fs.getJson(appPackageFile);

    if (! appPackageContent.packages) {
        appPackageContent.packages = [];
    }

    for (let $package of packages) {
        if ($package.includes('@')) {
            let {packageName, version} = $package.split('@');
            $package = packageName;
        }

        appPackageContent.packages.push($package);
    }

    fs.putJson(appPackageFile, appPackageContent);

    die(cli.green('All Done.'));
}

module.exports = function (command) {
    installPackages(command);
}