const cli = require('chalk');
const { fs } = require('./../bootstrap/modules');

class FreshInstall {
    constructor(command) {        
        this.command = command;
        this.install();
    }

    install() {
        if (fs.exists(ROOT + '/src')) {
            die(cli.redBright('The framework is already installed'));
        }
        
        echo.sameLine(cli.yellow('Copying files...'));
        
        fs.copy(FRAMEWORK_RESOURCES_PATH + '/content', ROOT);

        let config = fs.get(MAIN_CONFIG_PATH);

        config = config.replaceAll('blog', this.command.appName).replace('Blog', this.command.appName.capitalize());

        if (this.command.options.withoutAdmin) {
            delete config.apps.admin;
            fs.remove(ROOT + '/src/admin');
        } else {
            echo.sameLine(cli.green('Admin app has been installed successfully'));
        }

        fs.rename(ROOT + '/src/blog', ROOT + '/src/' + this.command.appName);
        
        echo.sameLine(cli.green(this.command.appName + ' app has been installed successfully'));
        
        fs.put(MAIN_CONFIG_PATH, config);

        let appConfig =  require('./../bootstrap/app-config');
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

module.exports = command => new FreshInstall(command);