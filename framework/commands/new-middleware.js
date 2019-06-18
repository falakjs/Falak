const { fs } = require('./../bootstrap/modules');

function createMiddleware(middlewareName, command) {
    let appName = command.options.app || APP_NAME;

    let moduleName = command.options.module;

    let middlewarePath = ROOT + (moduleName ? `/src/${appName}/modules/${moduleName}/middleware/${middlewareName}.js` : `/src/${appName}/modules/middleware/${middlewareName}.js`);

    updatePackage(moduleName);

    if (fs.exists(middlewarePath)) {
        die(`${cli.redBright(middlewareName)} middleware already exists!`);
    }

    echo(`${cli.yellow('Creating')} ${cli.green(middlewareName)} middleware...`);

    // first we will copy the middleware
    fs.copy(FRAMEWORK_RESOURCES_PATH + '/middleware.js', middlewarePath);

    let middlewareFileContent = fs.get(middlewarePath);

    let middlewareClass = middlewareName.toStudlyCase() + 'Middleware';

    middlewareFileContent = middlewareFileContent.replaceAll('MiddlewareClass', middlewareClass)
                                                .replaceAll('middlewareName', middlewareName);

    fs.put(middlewarePath, middlewareFileContent);

    echo(`${cli.cyan(middlewareName)} ${cli.green('middleware has been created successfully.')}`);
}

function updatePackage(moduleName) {
    let packagePath = ROOT + `/src/${appName}/package.json`;

    let $package = fs.getJson(packagePath);

    if (moduleName && $package.modules.includes(moduleName)) {
        $package.modules.push(moduleName);
    } else if (! $package.modules.includes('middleware')) {
        $package.modules.push('middleware');
    }

    fs.putJson(packagePath, $package);
}

module.exports = function (command) {
    for (let middlewareName of command.middlewares) {
        createMiddleware(middlewareName, command);
    }

    die();
}