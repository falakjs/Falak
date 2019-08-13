const cli = require('chalk');
const { fs } = require('flk-fs');
var execute = require('child-process-promise').exec;

class WorkSpace {
    constructor(command) {
        this.command = command;
        this.createNewWorkSpace();
    }

    async createNewWorkSpace() {
        echo(cli.yellow(`Creating ${cli.green(this.command.appName)} workspace...`));

        this.workspaceDirectory = `${ROOT}/${this.command.appName}`;

        global.ROOT = this.workspaceDirectory;

        global.SRC_DIR = ROOT + '/src';

        if (fs.exists(this.workspaceDirectory)) {
            die(cli.redBright(`Workspace "${cli.cyan(this.workspaceDirectory)}" is not empty, please use another directory or application name.`));
        }

        fs.makeDirectory(this.workspaceDirectory);

        await execute(`npm init -y`, {
            cwd: this.workspaceDirectory,
        });

        try {
            echo(cli.cyan(`Installing dependencies...`));
            let result = await execute(`npm i falak --unsafe-perm=true --allow-root`, {
                cwd: this.workspaceDirectory,
            });

            echo(result.stdout);

            echo(cli.green('Dependencies have been installed successfully'));

            echo('Configuring workspace...');
            this.install();
        } catch (e) {
            echo(cli.red(e));
            console.trace();
            die();
        }
    }


    install() {
        if (fs.exists(ROOT + '/src')) {
            die(cli.redBright('The framework is already installed'));
        }

        echo.sameLine(cli.yellow('Copying files...'));

        fs.copy(FRAMEWORK_RESOURCES_PATH + '/content', ROOT);

        global.MAIN_CONFIG_PATH = ROOT + '/config.json';

        let config = fs.get(MAIN_CONFIG_PATH);

        config = config.replaceAll('blog', this.command.appName).replace('Blog', this.command.appName.capitalize());

        config = JSON.parse(config);

        if (this.command.options.withoutAdmin) {
            delete config.apps.admin;
            fs.remove(ROOT + '/src/admin');
        } else {
            echo.sameLine(cli.green('Admin app has been installed successfully'));
        }

        fs.rename(ROOT + '/src/blog', ROOT + '/src/' + this.command.appName);

        echo.sameLine(cli.green(this.command.appName + ' app has been installed successfully'));

        fs.putJson(MAIN_CONFIG_PATH, config);

        let appConfig = require('./../bootstrap/app-config');
        appConfig();

        const { appBuilder } = require('./../bootstrap');

        appBuilder.build().then(async () => {
            await appBuilder.finish();
            echo();
            echo.sameLine(cli.green(`You're ready to start crafting your applications now, everything is OK.`));
            die();
        });
    }
}

module.exports = command => new WorkSpace(command);