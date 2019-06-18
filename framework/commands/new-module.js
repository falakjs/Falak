const service = require('./new-service');
const component = require('./new-component');
const { fs } = require('./../bootstrap/modules');

function createModule(moduleName, command) {
    let appName = command.options.app || APP_NAME;

    let modulePath = ROOT + `/src/${appName}/modules/${moduleName}`;

    if (fs.exists(modulePath)) {
        die(`${cli.redBright(moduleName)} module already exists!`);
    }

    echo(`${cli.yellow('Creating')} ${cli.green(moduleName)} module...`);

    command.services = [moduleName];
    command.components = [moduleName];
    command.options.module = moduleName;

    component(command, false);
    service(command, false);

    echo(`${cli.cyan(moduleName)} ${cli.green('module has been created successfully.')}`);
}

module.exports = function (command) {
    for (let moduleName of command.modules) {
        createModule(moduleName, command);
    }

    die();
}