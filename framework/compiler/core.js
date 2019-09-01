require('./globals');
require('./../bootstrap/app-compile-time-config');
const globalize = require('./../bootstrap/globals');
const AttributesCollector = require('./attributes-collector');
const ComponentsCollector = require('./components-collector');
const childComponents = require('./child-components');
const Parser = require('./parser/parser');
const { fs } = require('./../bootstrap/modules');

class HtmlCore {
    /**
     * Constructor
     */
    constructor() {
        this.pathsList = [
            `${APP_DIR}/**/compiler`,
        ];

        this.componentsPaths = pathsList => pathsList.map(path => path + '/**/compiler/components/**/*.js');
        this.attributesPaths = pathsList => pathsList.map(path => path + '/**/compiler/attributes/**/*.js');
        this.filesQueue = {};
        this.htmlFilesList = {};
    }

    /**
     * Init the compiler
     */
    init() {
        return new Promise(async resolve => {
            let packagesList = [];

            for (let packageName in resources.packages) {
                let packagePath = resources.packages[packageName];
                if (packageName.startsWith('package')) {
                    packagePath += '/dist';
                }

                packagesList.push(packagePath);
            }

            this.attributes = new AttributesCollector(this.attributesPaths(packagesList));
            this.components = new ComponentsCollector(this.componentsPaths(packagesList));

            try {
                await this.components.collect();
                await this.attributes.collect();
                resolve();
            } catch (e) {
                die(e);
            }
        });
    }

    /**
     * Compile all html files
     */
    async compileAll() {
        await this.init();

        this.collectedComponents = new Map;
        this.componentsList = this.components.componentsList;
        this.attributesList = this.attributes.attributesList;
        this.bulkAttributesList = this.attributes.bulkAttributesList;

        for (let selector in this.componentsList) {
            let component = this.componentsList[selector];

            this.collectedComponents.set(selector, component);
        }

        globalize('attributesList', this.attributesList);
        globalize('bulkAttributesList', this.bulkAttributesList);
        globalize('collectedComponents', this.collectedComponents);
        return this.startCompiling();
    }

    /**
     * Start compiling all html files
     */
    startCompiling() {
        return new Promise(resolve => {
            let compiledFiles = {};

            let lastFile = null;

            for (let [key] of this.collectedComponents) {
                compiledFiles[key] = false;
                lastFile = key;
            }

            for (let [key, componentInfo] of this.collectedComponents) {
                if (componentInfo.htmlFile) {
                    componentInfo.htmlFile = normalizePath(componentInfo.htmlFile);
                }


                let { selector, component, htmlFile, isUnique, isChild } = componentInfo;

                // it means the component is acting as a tag
                if (!htmlFile || isChild) {
                    compiledFiles[key] = true;

                    if (key == lastFile) {
                        resolve();
                    }
                    continue;
                }

                if (!this.htmlFilesList[htmlFile]) {
                    this.htmlFilesList[htmlFile] = componentInfo;
                }

                if (htmlFile) {
                    echo.sameLine(cli.yellow('Compiling ' + cli.green(htmlFile.replace(ROOT + '/', ''))));
                }

                this.compileView(htmlFile, selector, component, isUnique, false).then(parsedFilePath => {
                    compiledFiles[key] = true;
                    // add to smart-views files list 
                    resources.smartViews.push(parsedFilePath.ltrim(ROOT).replace(/\\/g, '/').ltrim('/'));
                    if (key == lastFile) {
                        resolve();
                    }
                });
            }
        });
    }

    /**
     * Compile the given file 
     * 
     * @param {*} htmlFile 
     * @param {*} selector 
     * @param {*} component 
     * @param {*} isUnique 
     * @param {*} debug 
     */
    compileView(htmlFile, selector, component, isUnique, debug) {
        return new Promise(resolve => {
            if (this.filesQueue[htmlFile]) return;

            this.filesQueue[htmlFile] = true;

            let html = fs.get(htmlFile, 'utf-8');

            let parser = new Parser(html, htmlFile);

            parser.debug(debug);
            parser.htmlCompiler.componentInfo({
                component,
                isUnique,
                selector,
            });

            parser.parse().then(parsedFilePath => {
                delete this.filesQueue[htmlFile];
                resolve(parsedFilePath);
            });
        });
    }

    /**
     * Recompile the given file
     */
    recompile(htmlFile) {
        return new Promise(async resolve => {
            if (childComponents.has(htmlFile)) {
                let parents = childComponents.getParentsOf(htmlFile);
                for (let parent of parents) {
                    await this.compile(parent);
                }
            } else {
                await this.compile(htmlFile);
            }

            resolve();
        });
    }

    /**
     * Compile the given file
     */
    compile(htmlFile) {
        return new Promise(async resolve => {
            let htmlOptions = this.htmlFilesList[htmlFile];

            await this.compileView(htmlOptions.htmlFile, htmlOptions.selector, htmlOptions.component, htmlOptions.isUnique, true);
            resolve();
        });
    }
}

module.exports = new HtmlCore;