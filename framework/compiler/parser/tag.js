// don't forget to comment the DOMException in /node_modules/jsdom/lib/jsdom/living/helpers/validate-names.js:11:11

const Attribute = require('./attribute');
const { flatten } = require('./../helpers/flatten');
const { toArray } = require('./../helpers/helpers');

const controlStructuresList = [
    '*if', '*elseif', '*else', '*for',
];

class Tag {
    /**
     * Constructor
     * 
     * @param HTMLElement element
     */
    constructor(element, htmlCompiler, id = null, namespace) {
        if (element !== false) {
            this.originalElement = element;
            this.htmlCompiler = htmlCompiler;
            this.id = id; // used with iterators usually

            this.setNamespace(namespace);

            this.boot();
        }
    }

    /**
     * Set the namespace for the tag
     */
    setNamespace(namespace) {
        if (this.originalElement.constructor.name == 'Text') return;

        let tagName = this.originalElement.tagName.toLowerCase().toCamelCase(); // i.e table-row => tableRow

        this.tagNamespace = tagName;

        this.originalNamespace = namespace;

        if (!this.isTheOnlySibling()) {
            this.tagNamespace += '_' + (this.getTagPosition() + 1);
        }

        this.namespace = this.tagNamespace;

        if (namespace) {
            this.namespace = namespace + '_' + this.namespace;
        }
    }

    /**
     * Boot initial info
     */
    boot() {
        // when set to true, if any component passed an extra info such as events, attributes...etc to another component, 
        // the primary tag will get all these info
        this.isPrimary = false;
        this.removeTagVariable = true; // if the variable of the element will not be used then it will be removed from the code `var variableName`
        this.style = {};
        this.userStyle = '';
        this.events = {};
        this.isSkippable = false;
        this.attributes = {};
        this.onBuildEvents = [];
        this.onTerminateEvents = [];
        this.booleanAttributes = {};
        this.staticAttributes = [];
        this.originalElement.innerHTML = this.originalElement.innerHTML.trim();
        this.originalElementHTML = this.originalElement.outerHTML;
        this.originalAttributes = {};
        this.readyFunctionsList = []; // <element-name (ready)="doSomethingWhenElementIsRendered();"></element-name>

        this.infoKey = 'this.__info';

        for (let attribute of this.originalElement.attributes) {
            this.originalAttributes[attribute.name] = attribute.value;
        }

        if (this.attrs().has('*as')) {
            this.elementAlias = this.attrs().forcePull('*as');
            this.variableName = this.currentVariableDeclaration = `${this.htmlCompiler.objectName}.${this.elementAlias}`;
            this.declareVariable();
        } else {
            this.variableName = `el${random(3)}`;

            this.currentVariableDeclaration = `let ${this.variableName}`;
        }

        // this.variableName = `${this.htmlCompiler.objectName}._e.${this.namespace}`;

        this.handleElementReadyCallbacks();
        this.collectBooleanAttributes();
        this.collectCustomAttributes();
        this.collectEvents();
        this.collectAttributes();

        this.init();
    }

    /**
     * Handle element callbacks
     */
    handleElementReadyCallbacks() {
        if (this.attrs().has('(ready)')) {
            let readyCallback = this.attrs().forcePull('(ready)');
            this.onElementReady(readyCallback);
        }

        this.onTerminate(tag => {
            if (!Is.empty(this.readyFunctionsList)) {
                this.append(`
                    setTimeout(function () {
                        let $el = ${this.variableName};
                        ${this.readyFunctionsList.join('\n')};
                    }, 0);                
                `);
            }
        });
    }

    /**
     * Execute the given code on the current element is ready
     */
    onElementReady(callbackCode) {
        this.variableNameWillBeUsed();
        this.readyFunctionsList.push(callbackCode);
    }

    /**
     * When called, the current element will have a variable assignment
     * i.e let elOpe = elementOpen(...)
     */
    variableNameWillBeUsed() {
        this.removeTagVariable = false;
    }

    /**
     * An alias to variableNameWillBeUsed
     */
    declareVariable() {
        return this.variableNameWillBeUsed();
    }

    /**
     * Check if the variable name is declared
     * 
     * @returns bool
     */
    variableIsDeclared() {
        return this.removeTagVariable === false;
    }

    /**
     * Initialize the info
     * 
     * @returns HTMLElement
     */
    getElement() {
        return this.originalElement;
    }

    /**
     * Get tag name
     * 
     * @returns string
     */
    tagName() {
        return this.getElement().tagName.toLowerCase();
    }

    /**
     * Check if this is the only child in the parent node of the current tag
     * 
     * @returns bool
     */
    isTheOnlySibling() {
        let totalSiblings = 0,
            tagName = this.originalElement.tagName;

        if (!this.originalElement.parentNode) return true;

        for (let child of this.originalElement.parentNode.childNodes) {
            if (child.tagName === tagName) {
                totalSiblings++;
            }
        }

        return totalSiblings === 1;
    }

    /**
     * Get the tag position between its siblings
     * 
     * @returns int
     */
    getTagPosition() {
        let siblingNumber = -1,
            tagName = this.originalElement.tagName,
            children = this.originalElement.parentNode.childNodes;

        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (child.tagName === tagName) {
                siblingNumber++;
                if (child === this.originalElement) {
                    return siblingNumber;
                }
            }
        }

        return siblingNumber;
    }

    /**
     * Append text to the html parsed code
     * 
     * @param string string
     * @returns void
     */
    append(string) {
        this.htmlCompiler.parsed += string;
    }

    /**
     * Get attributes handler
     */
    attrs() {
        if (!this.attributesHandler) {
            this.attributesHandler = new Attribute(this, this.getElement(), null);
        }

        return this.attributesHandler;
    }

    /**
     * Append text to the html parsed code in new line
     * 
     * @param string string
     * @returns void
     */
    appendLine(string) {
        this.append(this.htmlCompiler.line(string));
    }

    /**
     * Add new listener when the tag has been built
     * 
     * @param   callback callback
     * @returns void
     */
    onBuild(callback) {
        this.onBuildEvents.push(callback);
    }

    /**
     * Add new listener when the tag has been closed
     * 
     * @param   callback callback
     * @returns void
     */
    onTerminate(callback) {
        this.onTerminateEvents.push(callback);
    }

    /**
     * Collect boolean attributes
     */
    collectBooleanAttributes() {
        let attributes = ['readonly', 'checked', 'selected', 'disabled', 'multiple'];
        this.booleanAttributesRegex = new RegExp(`\\[\(${attributes.join('|')})\]`);

        let removedAttributes = [];

        for (let attribute of this.originalElement.attributes) {
            if (!attribute.name.match(this.booleanAttributesRegex)) continue;

            let attributeName = attribute.name.replace(/\[|\]/g, ''),
                attributeValue = attribute.value;

            if (attributeName.toLowerCase() == 'readonly') {
                attributeName = 'readOnly';
            }

            this.booleanAttributes[attributeName] = attributeValue;

            removedAttributes.push(attribute.name)
        }

        removedAttributes.forEach(attribute => this.originalElement.removeAttribute(attribute));
    }

    /**
     * Collect element events
     */
    collectEvents() {
        let eventsList = [
            'abort',
            'animationend',
            'animationiteration',
            'animationstart',
            'blur',
            'canplay',
            'canplaythrough',
            'change',
            'click',
            'contextmenu',
            'copy',
            'cut',
            'dblclick',
            'drag',
            'dragend',
            'dragenter',
            'dragexit',
            'dragleave',
            'dragover',
            'dragstart',
            'drop',
            'durationchange',
            'emptied',
            'encrypted',
            'ended',
            'error',
            'focus',
            'focusin',
            'focusout',
            'hashchange',
            'input',
            'invalid',
            'keydown',
            'keypress',
            'keyup',
            'load',
            'loadeddata',
            'loadedmetadata',
            'loadstart',
            'mousedown',
            'mouseenter',
            'mouseleave',
            'mousemove',
            'mouseout',
            'mouseover',
            'mouseup',
            'paste',
            'pause',
            'play',
            'playing',
            'popstate',
            'progress',
            'ratechange',
            'reset',
            'resize',
            'scroll',
            'seeked',
            'seeking',
            'select',
            'stalled',
            'submit',
            'suspend',
            'timeupdate',
            'touchcancel',
            'touchend',
            'touchmove',
            'touchstart',
            'transitionend',
            'unload',
            'volumechange',
            'waiting',
            'wheel',
        ];

        let foundEvents = [];

        this.eventsRegex = new RegExp('\\((' + eventsList.join('|') + '\\))');
        for (let attribute in this.originalAttributes) {
            let value = this.originalAttributes[attribute];

            foundEvents.push(attribute);

            if (attribute.match(this.eventsRegex)) {
                let attributeName = 'on' + attribute.replace(/\(|\)/g, '');
                this.addEventListener(attributeName, `var $el = this;${value}`);

                this.originalElement.removeAttribute(attribute);
            }
        }
    }

    /**
     * Add new event listener
     * @param string event 
     * @param string callback
     * @param boolean prepend >> if set to true, the event will be at the top of the callbacks
     */
    addEventListener(event, callback, prepend = false) {
        this.events[event] = Array.isArray(this.events[event]) ? this.events[event] : [];

        let method = prepend ? 'unshift' : 'push';

        this.events[event][method](`function(e) {${callback}}`.trim());
    }

    /**
     * Add custom event listener
     * Usually set by custom attributes
     * 
     * @param string event
     * @param string action
     * @param boolean prepend >> if set to true, the event will be at the top of the callbacks
     */
    on(event, action, prepend = false) {
        if (event.includes(' ')) {
            let events = event.split(' ');
            for (let event of events) {
                this.on(event, action, prepend);
            }
            return;
        }

        event = 'on' + event;
        this.addEventListener(event, action, prepend);
    }

    /**
     * Initialize the object
     */
    init() { }

    /**
     * Call an attribute handler for the given attribute
     * 
     * @param  attribute
     * @returns Attribute
     */
    callAttributeHandler(attribute) {
        let AttributeHandler = attributesList[attribute];
        let attributeHandlerObject = new AttributeHandler(this, this.originalElement, attribute);

        attributeHandlerObject.build();

        return attributeHandlerObject;
    }

    /**
     * Collect custom attributes of the element
     */
    collectCustomAttributes() {
        for (let attribute in attributesList) {
            if (this.originalElement.hasAttribute(attribute)) {
                this.callAttributeHandler(attribute);
            }
        }

        for (let attributeList of bulkAttributesList) {
            let attributeHandlerObject = new attributeList(this, this.originalElement),
                attributesList = attributeHandlerObject.map();

            for (let attribute in attributesList) {
                if (!attributeHandlerObject.has(attribute)) continue;

                let attributeHandler = attributesList[attribute];

                attributeHandler.call(attributeHandlerObject, attribute);
            }
        }
    }

    /**
     * Collect all attributes after collecting the custom attributes
     */
    collectAttributes() {
        for (let attribute of this.originalElement.attributes) {
            if (typeof this.attributes[attribute.name] != 'undefined') continue;
            this.attributes[attribute.name] = attribute.value;
        }
    }

    /**
     * Get tag type as open-close or self-closed tag
     */
    tagType() {
        if (this._tagType) return this._tagType;
        // new
        // check if the element has no inner content
        // make sure that tha tag variable is not needed, as we cam them shorthand the empty tags or the tag with texts only
        if (! this.variableIsDeclared() && ! Tag.selfClosedTags.includes(this.tagName())) {
            if (this.originalElement.innerHTML.length == 0) return this._tagType = Tag.ELEMENT_EMPTY_CONTENT;
            if (this.originalElement.childNodes.length == 1 && this.originalElement.childNodes[0].constructor.name == 'Text') {
                return this._tagType = Tag.ELEMENT_TEXT_CONTENT;
            }    
        }

        return this._tagType = Tag.selfClosedTags.includes(this.tagName()) ? Tag.ELEMENT_VOID : Tag.ELEMENT_OPEN;
    }

    /**
     * Render element properties
     */
    renderElementProperties() {
        this.clearInvalidAttributes();
        this.attributesText = '';
        this.renderStyle();
        this.renderEvents();
        this.renderBooleanAttributes();
        this.renderNormalAttributes();
    }

    /**
     * Build the tag
     */
    build() {
        this.openTag();

        const renderChildren = () => {
            this.htmlCompiler.extractChildren(this.getElement(), this.namespace)
        };

        if (this.isSkippable) {
            let variableName = this.variableName;
            let variableNameWithDeclaration = this.getVariableNameWithDeclaration();
            this.append(`
                ${variableNameWithDeclaration} = currentElement();

                if (! ${variableName}.__rendered) {
                    ${variableName}.__rendered = true;`);

            renderChildren();
            this.append(`
                } else {
                    skip();
                }
            `);
        } else {
            renderChildren();
        }

        this.closeTag();

        // attach element to the object
        // this.appendLine(`${this.htmlCompiler.objectName}.__el('${this.namespace}', ${variableName})`);
    }


    getVariableNameWithDeclaration() {
        return this.currentVariableDeclaration;
    }

    /**
     * Open tag
     */
    openTag() {
        this.renderElementProperties();

        this.addTag();

        for (let callback of this.onBuildEvents) {
            callback(this);
        }
    }

    /**
     * Close tag
     */
    closeTag() {
        if (this.tagType() == Tag.ELEMENT_OPEN) {
            let tagName = this.tagName();
            if (tagName.startsWith(HTML_SPECIAL_ELEMENTS_PREFIX)) {
                tagName = tagName.ltrim(HTML_SPECIAL_ELEMENTS_PREFIX);
            }
            this.appendLine(`${Tag.ELEMENT_CLOSE}('${tagName}')`);
        }

        if (this.removeTagVariable) {
            this.htmlCompiler.parsed = this.htmlCompiler.parsed.replace(`${this.currentVariableDeclaration} = `, '');
        }
    }

    /**
     * Add tag to dom list
     */
    addTag() {
        let tagName = this.tagName();

        if (tagName.startsWith(HTML_SPECIAL_ELEMENTS_PREFIX)) {
            tagName = tagName.ltrim(HTML_SPECIAL_ELEMENTS_PREFIX);
        }

        let argumentsList = [`'${tagName}'`];

        let tagType = this.tagType();

        if (tagType == Tag.ELEMENT_TEXT_CONTENT) {
            let tagText = this.originalElement.childNodes[0].nodeValue;
            this.originalElement.removeChild(this.originalElement.childNodes[0]);

            argumentsList.push('`' + tagText + '`');
        }

        if (!this.id) {
            if (this.htmlCompiler.insideForLoop) {
                this.id = "'ff'";
            } else if (this.htmlCompiler.insideIfStatement) {
                this.id = "'f'";
            }
        }

        if (this.htmlCompiler.insideForLoop) {
            this.id += '+' + this.htmlCompiler.currentLoop.idTree.join('+');
        }

        if (this.id || !Is.empty(this.staticAttributes) || this.attributesText) {
            if (this.id) {
                // just make sure it is unique as the id is passed from the for loop
                // this addition is because the for loop may have more than one sibling inside it
                if (this.id.startsWith("'")) {
                    this.id = this.id.ltrim("'");
                    this.id = "'" + random(3) + this.id;
                } else {
                    this.id = random(3) + this.id;
                }
                argumentsList.push(this.id);
            }
            if (!Is.empty(this.staticAttributes)) {
                if (!this.id) {
                    argumentsList.push('null');
                }
                argumentsList.push(flatten(this.staticAttributes));
            } else {
                this.staticAttributes = null;
            }

            if (this.attributesText) {
                if (Is.empty(this.staticAttributes)) {
                    if (!this.id) {
                        argumentsList.push('null');
                    }
                    this.staticAttributes = "null";
                }

                argumentsList.push(this.staticAttributes, this.attributesText.ltrim(','));
            }
        }

        argumentsList = argumentsList.join(',');

        this.appendLine(`${this.currentVariableDeclaration} = ${tagType}(${argumentsList})`);
    }

    /**
     * Render normal attributes
     */
    renderNormalAttributes() {
        if (!this.isPrimary && Object.keys(this.attributes).length == 0) return;

        let normalAttrs;

        if (this.isPrimary) {
            normalAttrs = `Object.merge(${flatten(this.attributes)}, ${this.infoKey}.attrs || {})`;
            this.attributesText += `,...normalAttrs(${normalAttrs})`;
        } else {
            let attributes = toArray(this.attributes).map(text => '`' + text + '`');
            this.attributesText += ',' + attributes.join(',');
        }
    }

    /**
     * clear any invalid attribute
     */
    clearInvalidAttributes() {
        for (let key in this.attributes) {
            if (key.includes('[') || key.includes('*') || key.includes('(') || key.includes('.')) {
                delete this.attributes[key];
            }
        }
    }

    /**
     * Render style
     */
    renderStyle() {
        if (!this.isPrimary && Object.keys(this.style).length == 0 && !this.userStyle) return;

        let styleAttrs;

        let styleObjects = [];

        if (!Is.empty(this.style)) {
            styleObjects.push(flatten(this.style));
        }

        if (!Is.empty(this.userStyle)) {
            styleObjects.push(this.userStyle);
        }

        if (this.isPrimary) {
            styleObjects.push(`${this.infoKey}.style || {}`);
        }

        if (styleObjects.length == 1) {
            styleAttrs = styleObjects[0];
        } else {
            styleAttrs = `Object.merge(${styleObjects.join(',')})`;
        }

        this.attributesText += `, 'style', ${styleAttrs}`;
    }

    /**
     * Render style
     */
    stringifyStyle() {
        let style = '';
        if (Object.keys(this.style).length > 0) {
            for (let key in this.style) {
                style += `${key}: \`${this.style[key]}\`,`;
            }
            style = `{${style}}`;

            if (this.userStyle) {
                style = `Object.merge(${style}, ${this.userStyle})`;
            }
        } else if (Object.keys(this.style).length == 0 && this.userStyle) {
            style = this.userStyle;
        }

        return style || '{}';
    }

    /**
     * Render events
     */
    renderEvents() {
        if (!this.isPrimary && Object.keys(this.events).length == 0) return;
        let eventsAttrs;

        if (this.isPrimary) {
            eventsAttrs = `mergeEvents(${flatten(this.events)}, ${this.infoKey}.events)`;
        } else {
            eventsAttrs = flatten(this.events);
        }

        this.attributesText += `, eventListeners, ${eventsAttrs}`;
    }

    /**
     * Render boolean attributes
     */
    renderBooleanAttributes() {
        if (!this.isPrimary && Object.keys(this.booleanAttributes).length == 0) return;
        let booleanAttrs,
            options = {
                skip: 'all',
            };

        if (this.isPrimary) {
            booleanAttrs = `Object.merge(${flatten(this.booleanAttributes, options)}, ${this.infoKey}.boolAttrs || {})`;
        } else {
            booleanAttrs = flatten(this.booleanAttributes, options);
        }

        this.attributesText += `, boolAttrs, ${booleanAttrs}`;
    }

    /**
     * Mark the given string as variable
     */
    var(string) {
        return '${' + string + '}';
    }

    /**
     * Terminate the tag
     */
    terminate() {
        for (let callback of this.onTerminateEvents) {
            callback(this);
        }
    }

    /**
     * Stop executing the remaining code
     */
    exit() {
        this.build = () => { };
        this.terminate = () => { };
    }

    /**
     * Create new element
     */
    createElement(tagName, attributes = {}, children = []) {
        let element = document.createElement(tagName)

        for (let key in attributes) {
            element.setAttribute(key, attributes[key]);
        }


        for (let child of children) {
            element.appendChild(child);
        }

        return element;
    }

    /**
     * Reset attributes except the given attributes list
     * 
     * @param  string...attributes
     */
    resetAttributes(...excludeAttributes) {
        for (let attribute in this.originalAttributes) {
            if (excludeAttributes.includes(attribute)) continue;
            this.originalElement.setAttribute(attribute, this.originalAttributes[attribute]);
        }
    }

    /**
     * Instead of rendering the current element
     * the current element will be inserted into other element and that other element 
     * will be rendered instead
     */
    injectInto(newParent, excludeAttributes = []) {
        let currentElement = this.originalElement,
            parent = currentElement.parentNode;

        // add original attributes once more
        this.resetAttributes(...excludeAttributes);

        // replace the child node
        // if (! parent) echo(currentElement.tagName)
        parent.insertBefore(newParent, currentElement);

        parent.removeChild(currentElement);

        newParent.appendChild(currentElement);

        // disable the build of the current tag as it will be built later
        this.build = () => { };

        this.htmlCompiler.extract(newParent);
    }
}

Tag.selfClosedTags = ['input', 'img', 'br', 'hr', 'link', 'meta'];

Tag.ELEMENT_OPEN = 'eo';
Tag.ELEMENT_CLOSE = 'ec';
Tag.ELEMENT_EMPTY_CONTENT = 'eec'; // element empty content
Tag.ELEMENT_TEXT_CONTENT = 'ewt'; // element with text
Tag.ELEMENT_VOID = 'ev';

module.exports = Tag;