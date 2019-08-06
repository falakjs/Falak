const Tag = require('./tag');
const path = require('path');
const { JSDOM } = require("flk-parser");
// const minify = require("babel-minify");
const HtmlCompiler = require('./html-compiler');
const { fs } = require('./../../bootstrap/modules');

class Parser {
    constructor(html, filePath, env = Parser.DEVELOPMENT_MODE) {
        html = this.handleCustomSelfClosedTagsFirst(html);
        const dom = new JSDOM(html);

        this.debugger = true;

        this.env = env;

        this.filePath = filePath;

        this.viewName = Parser.getViewName(filePath);

        this.filename = path.basename(filePath).rtrim('.html');

        global.document = dom.window.document;

        this.html = html;

        this.htmlCompiler = new HtmlCompiler(this.html, this.viewName);

        this.htmlCompiler.parser = this;
    }

    /**
     * Handle custom self closed tags before parsing the html
     * 
     * @param   string html
     * @returns string
     */
    handleCustomSelfClosedTagsFirst(html) {
        return html.replace(/<([^\/>]+)\/>/g, (matchedTag, tagContent) => {
            let [tagName] = tagContent.split(' ');

            if (Tag.selfClosedTags.includes(tagName.toLowerCase())) return matchedTag;

            return `<${tagContent.rtrim()}></${tagName}>`;
        });
    }

    parse() {
        return new Promise(resolve => {
            if (this.debugger) {
                echo(cli.blueBright(`Recompiling ${this.viewName.ltrim('/')}`));
            }

            this.htmlCompiler.parse();

            this.parsed = this.htmlCompiler.getCompiledCode(this.env);

            let fileContent = `${this.parsed}`.trim();

            let viewName = this.viewName.replace(APP_NAME + '/modules/', '').replace('/components', '');

            let parsedFilePath = `${ROOT}/public/${APP_NAME}/smart-views/${viewName.replace(/\//g, '_')}.js`;

            fs.put(parsedFilePath, fileContent);
            if (this.debugger) {
                // echo(`${this.viewName} has been compiled successfully`);
            }

            resolve(parsedFilePath);
        });
    }

    /**
     * Disable/Enable console messaging
     * 
     * @param   bool debug
     * @returns void
     */
    debug(debug) {
        this.debugger = debug;
    }


    /**
     * Prepare view name
     * 
     * @param string filePath 
     */
    static getViewName(filePath) {
        // if the path has node_modules directory, then we'll split the path with node_modules
        // but we'll keep it in the path (?=) >> lookahead 
        if (filePath.includes('node_modules')) {
            filePath = filePath.split(/(?=node_modules)/)[1];
        }

        filePath = filePath.replace(/\\/g, '/').replace(/\.\/|\.\.\/|compiler\/components/g, '').replace(/\/\//g, '/').ltrim(SRC_DIR).trim('/');

        if (!filePath.includes('node_modules')) {
            filePath = filePath.removeFirst(`${APP_NAME}/components`);

            // prepend the app name at the beginning
            filePath = filePath;
        }

        filePath = filePath.trim('/');

        if (filePath.endsWith('.component.html')) {
            filePath = filePath.removeLast('.component.html');
        }

        return filePath;
    }
}

Parser.DEVELOPMENT_MODE = 'dev';
Parser.PRODUCTION_MODE = 'prod';

module.exports = Parser;