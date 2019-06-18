const Tag = require('./tag');
const TextNode = require('./text');
const ROOT_NAMESPACE = '';
const { flatten } = require('./../helpers/flatten');

global.HTML_SPECIAL_ELEMENTS_PREFIX = `${process.env.CLI_NAME}---`;

const controlStructures = {
    if: '*if',
    elseif: '*elseif',
    else: '*else',
    for: '*for',
};

// const collectedComponents >> core.js;

module.exports = class HtmlCompiler {
    /**
     * Constructor
     * 
     * @param  string html
     */
    constructor(html, viewName) {
        this.objectName = 'comp' + random(3);
        this.objectName = 'component';

        const exceptionalElements = ['table', 'thead', 'th', 'tr', 'tbody', 'td', 'tfoot'];

        for (let el of exceptionalElements) {
            let regex = new RegExp(`(<)${el}(\\s|>)`, 'g');
            html = html.replace(regex, `$1${HTML_SPECIAL_ELEMENTS_PREFIX}${el}$2`).replaceAll(`(<)/${el}(>)`, `$1/${HTML_SPECIAL_ELEMENTS_PREFIX}${el}$2`);
        }

        this.viewName = viewName;

        this.observableProperties = [];

        this.originalCompiler = this;

        this.collectObservedPropertiesInComponent(html);

        this.html = html.trim().replace(/this\./g, this.objectName + '.');

        this.html = this.convert(this.html);

        this.adjustSpecialSyntax();

        this.root = document.createElement('root');

        this.root.innerHTML = this.html;

        this.adjustSpecialSyntaxForAttributes();

        this.handleControlStructure(this.root);

        this.rootNamespace = ROOT_NAMESPACE;

        this.parsed = '';

        this.additionalArguments = [];

        this.children = {};

        // if states
        this.ifStates = [];
        this.currentState = null;

        this.componentsCallback = [];
    }

    /**
     * Handle control structure of the given element
     * 
     * @param {Element} element 
     */
    handleControlStructure(element) {
        for (let child of element.childNodes) {
            if (child.hasAttribute) {
                for (let controlStructure in controlStructures) {
                    let attribute = controlStructures[controlStructure];

                    if (child.hasAttribute(attribute) && controlStructure != 'for') {
                        let newElement = document.createElement(controlStructure);

                        newElement.setAttribute('condition', child.getAttribute(attribute));

                        child.removeAttribute(attribute);

                        let currentElement = child,
                            newParent = newElement,
                            parent = currentElement.parentNode;

                        // replace the child node
                        parent.insertBefore(newParent, currentElement);

                        parent.removeChild(currentElement);

                        newParent.appendChild(currentElement);
                    } else if (controlStructure == 'for' && child.hasAttribute(attribute)) {
                        let newElement = document.createElement(controlStructure);

                        newElement.setAttribute('loop', child.getAttribute(attribute));

                        child.removeAttribute(attribute);

                        let currentElement = child,
                            newParent = newElement,
                            parent = currentElement.parentNode;

                        // replace the child node
                        parent.insertBefore(newParent, currentElement);

                        parent.removeChild(currentElement);

                        newParent.appendChild(currentElement);
                    } else {
                        // this.handleControlStructure(child);
                    }
                }
            } else {
                this.handleControlStructure(child);
            }
        }
    }

    /**
     * Set current if state
     */
    setCurrentState(state) {
        this.currentState = state;
    }

    /**
     * Observe the given property
     */
    observe(property) {
        if (Is.array(property)) {
            for (let prop of property) {
                this.observe(prop);
            }
            return;
        }

        let compiler = this.originalCompiler;
        if (compiler.observableProperties.includes(property)) return;

        compiler.observableProperties.push(property);
    }

    /**
     * Set new if state
     */
    clearState(currentState) {
        this.currentState = null;
        for (let i = 0; i < this.ifStates.length; i++) {
            let state = this.ifStates[i];

            if (state.state === currentState.state) {
                this.ifStates.splice(i, 1);

                break;
            }
        }
    }

    /**
     * Get state object by state key
     * 
     * @param   string state
     * @returns object
     */
    getState(stateKey) {
        for (let state of this.ifStates) {
            if (state.state === stateKey) return state;
        }
    }

    /**
     * Add states
     */
    addStates(states) {
        this.ifStates = this.ifStates.concat(states);
    }

    /**
     * Collect the properties that will be used in the html component to be marked as observable 
     */
    collectObservedPropertiesInComponent(html) {
        let regex = /this\.([$A-Z_][0-9A-Z_$]*)/gi;

        html.replace(regex, (matched, observableProperty) => {
            if (this.observableProperties.includes(observableProperty)) return;
            this.observableProperties.push(observableProperty);
        });
    }

    /**
     * Execute a callback each time a component is loaded
     * 
     * @param  callable callback
     */
    onComponentLoad(callback) {
        this.componentsCallback.push(callback);
    }

    /**
     * Get compiled code
     * 
     * @param   bool env
     * @returns string
     */
    // getCompiledCode(env) {
    //     return env == 'prod' ? this.getProductionCode() : this.getDevelopmentCode();
    // }

    /**
     * Get production code
     * Which mean basically with the try catch block and displaying some errors
     * 
     * @returns string
     */
    getCompiledCode() {
        // this.isUnique = false; // just for now
        let component = `DI.${this.isUnique ? 'resolve' : 'instance'}('${this.component}')`;
        // let children = '';

        // for (let component in this.children) {
        //     let selector = this.children[component];
        //     children += `${component}: '${selector}',`;
        // }

        let children = flatten(this.children);

        // echo(this.selector, this.observableProperties)
        if (this.observableProperties.includes('inputs')) {
            this.observableProperties = Array.remove(this.observableProperties, 'inputs');
        }

        let observableProperties = flatten(this.observableProperties);

        return `_Component({
                selector: '${this.selector}',
                componentName: '${this.component}',
                component: () => ${component},
                observable: ${this.observableProperties.length > 0},
                observe: ${observableProperties},
                children: ${children},
                render: function (${this.argumentsList()}) {
                    ${this.parsed}
                    this.isReadyToGo();
                }
        });`;

        return `function (${this.argumentsList()}) {
            try {
                ${this.parsed}
            } catch(e) {
                console.error(\`View Error in ${this.viewName}\`)
                console.error(e.message.replace(/${this.objectName}\./g, 'this.')); 
                throw new SyntaxError(\`${escape(this.html)}\`);
            }
        };
        `;
    }

    /**
     * Get production code
     * Which mean basically without the try catch block
     * 
     * @returns string
     */
    getProductionCode() {
        return `function(${this.argumentsList()}){${this.parsed}
        };`;
    }

    /**
     * Get the arguments list that will be passed to the view handler
     *  
     */
    argumentsList() {
        let argumentsList = ['component', ...this.additionalArguments];

        return argumentsList.join(', ');
    }

    /**
     * Start parsing
     */
    parse() {
        this.extractChildren(this.root, this.rootNamespace);

        // replace let with var
        // this.parsed = this.parsed.replace(/let\s/g, 'var ');
    }

    /**
     * Define component info
     */
    componentInfo(info) {
        this.component = info.component;
        this.isUnique = info.isUnique;
        this.selector = info.selector;
    }

    /**
     * Add child component
     * 
     * @param  string namespace
     * @param  string selector
     */
    addChild(name, selector) {
        this.children[name] = selector;
    }

    /**
     * Extract elements
     * 
     * @param   HtmlElement element
     * @param   string id
     * @param   string namespace
     * @returns void
     */
    extract(element, id = null, namespace) {
        if (typeof element == 'undefined' || element.constructor.name == 'Comment') return;

        let tagObject = null;

        if (element.constructor.name === 'Text') {
            tagObject = new TextNode(element, this);
        } else {
            let tag = element.tagName.toLowerCase();

            if (collectedComponents.has(tag)) {
                let component = collectedComponents.get(tag),
                    ComponentHandler = component.handler;

                tagObject = new ComponentHandler(element, this, id, namespace);

                tagObject.parseContent = component.parseContent; // Parse the passed content to the component to html element
                tagObject.contentToString = component.contentToString; // pass the content as a property without parsing
                tagObject.component = component.component;
                tagObject.isUnique = component.isUnique;
                tagObject.isChild = component.isChild;
                tagObject.selector = component.selector;
                tagObject.htmlFile = component.htmlFile;
            } else {
                tagObject = new Tag(element, this, id, namespace);
            }
        }

        tagObject.build();
        tagObject.terminate();

        if (tagObject.component && !tagObject.isChild) {
            for (let callback of this.componentsCallback) {
                callback(tagObject);
            }
        }
    }

    /**
     * Extract element children
     * 
     * @param   Element element
     * @returns void
     */
    extractChildren(element, namespace, id = null) {
        for (let child of element.childNodes) {
            this.extract(child, id, namespace);
        }
    }

    /**
     * Convert any {{ }} to ${}
     * 
     * @param   string text
     */
    convert(text) {
        let regex = /(?:\{\{([^\}\}]*)\}\})/gm;
        return text.replace(regex, "${$1}");
    }

    /**
     * Adjust special syntax in html code
     */
    adjustSpecialSyntax() {
        this.navigationOperator = value => {
            return value.replace(/([^\s|\{]+)\?\.([^\s|\}]+)/g, (m) => {
                let [object, ...keys] = m.split('?.');
                return `Object.get(${object}, '${keys.join('.')}', '')`;
            });
        }
        this.html = this.html.replace(/\$\{.+\}/g, this.navigationOperator);
    }

    /**
     * Adjust special syntaxes for dynamic attributes
     */
    adjustSpecialSyntaxForAttributes() {
        const convert = element => {
            for (let attribute of element.attributes) {
                element.setAttribute(attribute.name, this.navigationOperator(attribute.value));
            }

            for (let child of element.children) {
                convert(child);
            }
        };

        convert(this.root);
    }

    /**
     * Add semi colon and new line after the given code
     * 
     * @param   string code
     * @returns string 
     */
    line(code) {
        return code + ';' + "\n";
    }
}