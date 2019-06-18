var sass = require('node-sass');
const glob = require("multi-glob").glob;
const { fs } = require('./../bootstrap/modules');
require('./globals');

// resources => from app builder module

class SassCompiler {
    constructor(options) {
        this.setOptions(options);
    }

    /**
     * Set options for the sass compiler
     * 
     * @param  object options
     */
    setOptions(options) {
        this.root = options.root;
        this.srcDir = options.srcDir;
        this.appName = options.appName;
        this.appDir = options.appDir;
        this.vendorSassCode = {
            ltr: '',
            rtl: '',
        };

        this.compiled = {
            ltr: '',
            rtl: '',
        };

        this.currentStyleCode = {
            ltr: '',
            rtl: '',
        };

        this.filesList = {
            ltr: [],
            rtl: [],
        };

        this.paths = [
            this.srcDir + '/common/scss/',
            this.appDir + '/scss/',
            this.root + '/node_modules/',
        ];

        this.outputDirectory = `${this.root}/public/${this.appName}/css/`;

        if (options.direction) {
            this.setDirection(direction);
        }
    }

    /**
     * Set direction
     */
    setDirection(direction) {
        this.direction = direction;
        this.filesList[this.direction] = [];
        this.left = this.direction == 'ltr' ? 'left' : 'right';
        this.right = this.direction == 'ltr' ? 'right' : 'left';
        this.outputFile = this.getDirectionPath(direction);
    }

    /**
     * Check if the given direction css path exists
     */
    directionExists(direction) {
        return fs.exists(this.getDirectionPath(direction));
    }

    /**
     * Generate full path for the given direction
     * 
     * @param   string direction
     * @returns string
     */
    getDirectionPath(direction) {
        return this.outputDirectory + `app-${direction}.css`;
    }

    /**
     * Compile both directions
     */
    compileBothDirections() {
        return new Promise(async resolve => {
            await this.compileThenSave('ltr')
            await this.compileThenSave('rtl');
            resolve();
        });
    }

    compile() {
        return this.compileThenSave(...arguments);
    }

    clear(direction) {
        delete this.compiled[direction];
        delete this.currentStyleCode[direction];
        return this;
    }

    /**
     * Compile then save the compiled code to the given path
     * 
     * @param  string path
     */
    compileThenSave(direction) {
        return new Promise(async (resolve, reject) => {
            if (this.compiled[direction]) {
                return resolve(this.compiled[direction]);
            }

            if (Is.empty(this.currentStyleCode[direction])) {
                this.setDirection(direction);

                await this.getData();
            }

            let styleCode = this.currentStyleCode[this.direction];

            let sassOptions = {
                includePaths: this.paths,
                data: styleCode,
                outputStyle: 'compressed',
            };

            if (process.env.mode == 'development') {
                // source map should be in development mode only
                sassOptions = Object.merge(sassOptions, {
                    sourceMap: true,
                    sourceMapEmbed: true,
                    sourceMapRoot: BASE_URL,
                });
            }

            sass.render(sassOptions, (error, result) => {
                if (!error) {
                    let compiledScssCode = result.css.toString();

                    this.compiled[this.direction] = compiledScssCode;

                    // force removing comments
                    compiledScssCode = compiledScssCode.replace(/\/\*[^*]*\*+([^\/][^*]*\*+)*\//, '');

                    fs.makeDirectory(this.outputFile + '/../', '0777');
                    fs.put(this.outputFile, compiledScssCode);
                    resolve(compiledScssCode);
                } else {
                    error.file = error.file.ltrim(this.root).replace(/\\/g, '/');
                    reject(error);
                }
            });
        })
    }

    /**
     * Get the data of the entry point
     */
    getData() {
        return new Promise(resolve => {
            this.getAppSassFiles((filesList, vendorSassFiles) => {
                this.filesList[this.direction] = filesList;
                this.vendorSassCode[this.direction] = vendorSassFiles;

                let vendorStyle = resources.cssVendor.map(file => `@import "${file.rtrim('.css')}";`).join("\r\n");
                let appSassCode = this.filesList[this.direction].map(file => `@import "${file}";`).join("\r\n");
                let vendorSassCode = this.vendorSassCode[this.direction].map(file => `@import "${file}";`).join("\r\n");

                let styleCode = `                    
                    ${vendorStyle}
                    $direction: ${this.direction};
                    $left: ${this.left};
                    $right: ${this.right};
                    ${vendorSassCode}
                    @import "common-app.scss";
                    @import "app.scss";
                    ${appSassCode}
                `;

                if (ENV == 'development') {
                    styleCode = `
                        ${fs.get(FRAMEWORK_ROOT_PATH + '/outputs/scss/sass-compiler-error.scss')}
                        ${styleCode}
                    `;
                }

                this.currentStyleCode[this.direction] = styleCode;

                resolve(styleCode);
            });
        });
    }

    /**
     * Get current app sass code
     */
    getAppSassFiles(callback) {
        let filesList = [],
            sassVendor = [];
        let packagesList = Object.values(resources.packages);

        packagesList = packagesList.map(packagePath => {
            if (packagePath.includes('node_modules')) {
                packagePath += '/dist';
            }

            packagePath += `/**/*.scss`;
            return packagePath;
        });

        glob(packagesList, (error, files) => {
            if (!files) die(error);

            for (let file of files) {
                file = normalizePath(file);

                if (file.includes('node_modules')) {
                    sassVendor.push(file);
                } else {
                    filesList.push(file);
                }
            }

            callback(filesList, sassVendor);
        });
    }

    /**
     * Display the error in cli
     */
    error(error) {
        echo();
        echo(cli.redBright('Sass Compiler Error'));
        echo(cli.bold.white(error.message))
        echo(`${cli.greenBright('in')} ${cli.yellow(error.file)} ${cli.magenta('line:')} ${error.line}`);
    }
}

module.exports = SassCompiler;