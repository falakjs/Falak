const Command = require('./command');
const cli = require('chalk');

class Commander {
    constructor() {
        this.commandsList = [];
        this.helpCommand = null;
    }

    version(version) {
        this.command('-v, --version', 'Framework version').then(command => {
            die(cli.green(version));
        });

        return this;
    }

    createHelpCommand() {
        let command = this.command('-h, --help', 'Display help commands');

        if (this._beforeParsing) {
            this._beforeParsing(command);
        }

        echo('Available commands');

        for (let command of this.commandsList) {
            echo();
            echo(`${cli.cyan(command.commandNamesList.join(', '))} ${command.description || ''} ${cli.redBright('i.e')}: ${cli.green(`${process.env.CLI_NAME + ' ' + (command._example || command.name)}`)}`);
            command.displayAvailableOptions();
        }
    }

    beforeParsing(callback) {
        this._beforeParsing = callback;

        return this;
    }

    onParsing(callback) {
        this._onParsing = callback;
        return this;
    }

    parse(argv) {
        [, , this.commandName, ...this.argumentsList] = argv;

        if (!this.commandName) {
            die((`Please write at least one ${cli.redBright('command')}, use  ${cli.cyan(`${process.env.CLI_NAME} --help`)} command to view all available commands list.`));
        }

        if (this.commandName == '-h' || this.commandName == '--help') {
            this.createHelpCommand();
            exit();
        }

        for (let command of this.commandsList) {
            if (command.is(this.commandName)) {
                if (this._beforeParsing) {
                    command.beforeParsing(this._beforeParsing);
                }
                if (this._onParsing) {
                    command.onParsing(this._onParsing);
                }
                return command.parse(this.argumentsList);
            }
        }

        die(`Invalid command ${cli.redBright(this.commandName)}, use  ${cli.cyan(`${process.env.CLI_NAME} --help`)} command to view all available commands list.`);
    }

    /**
     * Get a new command object
     */
    command() {
        let command = new Command(...arguments);
        this.commandsList.push(command);
        return command;
    }
}

module.exports = new Commander;