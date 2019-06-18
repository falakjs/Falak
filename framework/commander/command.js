const cli = require('chalk');
// new component
// command('new <components...>')
class Command {
    constructor(command, description) {
        this._options = []; // defined by developer
        this.argumentsList = []; // passed to cli 
        this.optionsList = []; // passed to cli
        this.command = command;
        this._examples = [];
        this.description(description);
        this._parseCommand(command);
    }

    beforeParsing(callback) {
        this._beforeParsing = callback;
    }
    
    onParsing(callback) {
        this._onParsing = callback;
        return this;
    }

    /**
     * Create new command recursively 
     */
    command() {
        return new Command(...arguments);
    }

    /**
     * Parse the given command name
     * i.e
     * -h, --help >> [help]
     * n, new >> [new]
     * @param string name 
     */
    _parseCommand(name) {
        this.commandNamesList = name.split(',').map(commandName => commandName.trim());

        let lastCommandName = this.commandNamesList.pop();

        let [commandName, ...expectedArguments] = lastCommandName.split(' ');

        this.commandNamesList.push(commandName);

        this.parseExpectedArguments(expectedArguments);

        this.name = commandName;
    }

    parseArgument(argument) {
        let name, isArray = false, isRequired = false, defaultValue = null;
        if (argument.startsWith('<')) {
            name = argument.replace('<', '');
            isRequired = true;
            if (argument.endsWith('...>')) {
                isArray = true;
                name = name.replace('...>', '');
            } else {
                name = name.replace('>', '');
            }
        } else if (argument.startsWith('[')) {
            name = argument.replace('[', '');
            if (argument.endsWith('...]')) {
                isArray = true;
                name = name.replace('...]', '');
            } else {
                name = name.replace(']', '');
            }
        } else {
            die(`invalid argument name ${cli.cyan(argument)} in ${this.command} command`);
        }

        if (name.includes('=')) {
            [name, defaultValue] = name.split('=');
        }
        
        name = name.toCamelCase();

        this.argumentsList.push({
            name,
            isArray,
            isRequired,
            defaultValue,
        });
    }

    parseExpectedArguments(expectedArguments) {
        for (let argument of expectedArguments) {
            this.parseArgument(argument);
        }
    }

    isOption(argument) {
        return argument.startsWith('-');
    }

    option(option, description, defaultValue = null) {
        let aliases = option.split(',').map(optionAlias => optionAlias.trim());

        let mainOptionName;

        for (let alias of aliases) {
            if (alias.startsWith('--')) {
                mainOptionName = alias.replace('--', '').toCamelCase();
            }
        }

        this._options.push({
            option,
            aliases,
            mainOptionName,
            description,
            defaultValue,
        });

        return this;
    }

    then(callback) {
        this._callback = callback;

        return this;
    }

    /**
     * check if the given command name is equal to any of the current command names
     */
    is(commandName) {
        return this.commandNamesList.includes(commandName);
    }

    description(description) {
        this.description = description;
        return this;
    }

    parsePassedArgs(args) {
        let argumentsList = [],
            options = [];

        for (let argument of args) {
            if (this.isOption(argument)) {
                options.push(argument);
            } else {
                argumentsList.push(argument);
            }
        }

        return [argumentsList, options];
    }

    example(example) {
        this._example = example;
        return this;
    }
    examples(...examples) {
        this._examples = this._examples.concat(examples);
        return this;
    }

    displayHelp() {
        echo(`Command name: ${cli.cyan(this.name)}`);
        echo(`${cli.redBright(`${process.env.CLI_NAME} ${this.command}`)}`);
     
        echo(`${cli.yellow(this.description)}`);
        this.displayAvailableOptions();
        
        if (this._examples.length > 0) {
            echo(cli.green('Examples of usage'));
            this._examples.forEach(example => echo(example));
        }
        else if (this._example) {
            echo(`Example: ${cli.green((process.env.CLI_NAME || '') + ' ' + this._example)}`);
        }

        exit();
    }

    displayAvailableOptions() {
        if (this._options.length == 0) return;

        echo(cli.yellow('Available Options'));
        for (let commandOption of this._options) {
            echo(`  ${cli.bold.magenta(commandOption.option.padEnd(16))} ${commandOption.description || ''}`);
        }
    }

    parse(args) {
        if (args.includes('--help')) {
            return this.displayHelp();
        }

        if (this._beforeParsing) {
            this._beforeParsing(this);
        }

        this.collected = {
            args: {},
            options: {},
        };

        let [passedArguments, passedOptions] = this.parsePassedArgs(args);

        this.collectArgs(passedArguments);
        this.collectOptions(passedOptions);

        this.options = this.collected.options;
        this.args = this.collected.args;

        if (this._onParsing) {
            this._onParsing(this);
        }

        if (this._callback) {
            this._callback(this);
        }

        return this;
    }

    collectOptions(passedOptions) {
        for (let option of passedOptions) {
            this.parseOption(option);
        }
    }

    parseOption(argument) {
        for (let option of this._options) {
            let [optionName, value] = argument.split('=');
            let trueValue = true;

            // if (optionName.startsWith('--no')) {
            //     trueValue = false;
            //     optionName = optionName.replace(/^--no/, '');
            // }

            if (option.aliases.includes(optionName)) {
                if (!value) {
                    value = trueValue;
                }

                if (value === 'false') {
                    value = false;
                } else if (value === 'true') {
                    value = true;
                }

                this.collected.options[option.mainOptionName] = this[option.mainOptionName] = value;
                break
            }
        }
    }

    collectArgs(passedArguments) {
        for (let argument of this.argumentsList) {
            if (argument.isRequired && passedArguments.length == 0) {
                die(cli.redBright(`Missing argument ${cli.cyan(argument.name)}`));
            }

            if (argument.isArray) {
                this.collected.args[argument.name] = this[argument.name] = passedArguments;
                break;
            } else {
                this.collected.args[argument.name] = this[argument.name] = passedArguments.shift();
            }
        }
    }
}

module.exports = Command;