const { fs } = require('./../bootstrap/modules');

function createService(serviceName, command) {
    let appName = command.options.app || APP_NAME;

    let serviceSegments = serviceName.split('/');

    let service = serviceSegments.end().toStudlyCase() + 'Service';

    let moduleName = command.options.module;

    let servicePath = ROOT + (moduleName ? `/src/${appName}/modules/${moduleName}/services/${serviceName}-service.js` : `/src/${appName}/modules/services/${serviceName}-service.js`);

    updatePackage(moduleName, appName);

    if (fs.exists(servicePath)) {
        die(`${cli.redBright(serviceName)} service already exists!`);
    }

    echo(`${cli.yellow('Creating')} ${cli.green(serviceName)} service...`);

    // first we will copy the service
    fs.copy(FRAMEWORK_RESOURCES_PATH + '/service.js', servicePath);

    let serviceFileContent = fs.get(servicePath);

    let alias = command.options.alias || service.toCamelCase();

    let route = command.options.route || '/' + serviceName;

    serviceFileContent = serviceFileContent.replace('aliasName', alias)
        .replace('route', route)
        .replaceAll('ServiceName', service);

    fs.put(servicePath, serviceFileContent);

    echo(`${cli.cyan(serviceName)} ${cli.green('service has been created successfully.')}`);
}

function updatePackage(moduleName, appName) {
    let packagePath = ROOT + `/src/${appName}/package.json`;

    let $package = fs.getJson(packagePath);

    if (moduleName && $package.modules.includes(moduleName)) {
        $package.modules.push(moduleName);
    } else if (!$package.modules.includes('services')) {
        $package.modules.push('services');
    }

    fs.putJson(packagePath, $package);
}

module.exports = function (command, exitOnFinish = true) {
    if (command.services.length > 1 && command.route) {
        die(`Can't use ${cli.redBright('--route')} with more than one service`);
    }

    for (let serviceName of command.services) {
        createService(serviceName, command);
    }

    if (exitOnFinish) {
        die();
    }
}