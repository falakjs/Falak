const Tag = require('./tag');
const HtmlCompiler = require('./html-compiler');
const { flatten } = require('./../helpers/flatten');

module.exports = class Component extends Tag {
    /**
     * {@inheritdoc}
     */
    init() {
        this.attributesInBrackets = this.attrs().brackets();

        for (let attribute in this.attributesInBrackets) {
            let attributeValue = this.attributesInBrackets[attribute],
                newAttribute = attribute.toCamelCase();

            delete this.attributesInBrackets[attribute];

            this.attributesInBrackets[newAttribute] = attributeValue;
        }
    }

    /**
     * Disable element events by overriding the collectEvents method
     */
    collectEvents() { }

    /**
     * Get component object 
     * 
     * @returns string
     */
    objectName() {
        return `${this.htmlCompiler.objectName}._c.${this.namespace}`;
    }

    /**
     * Get child name
     */
    childName() {
        if (!this._childName) {
            this._childName = 'c' + random(8);
        }

        return this._childName;
    }

    /**
     * {@inheritDoc}
     */
    build() {
        let componentName = this.childName(),
            objectName = this.objectName(),
            component = this.component,
            componentContent = this.getElement().innerHTML,
            parsedComponentContent = null;


        let contentToString;

        // check if component has a content passed to it
        // i.e <component-name>Some content</component-name>
        // in that case we need to pass to the component the value of `Some content`
        if (componentContent.length > 0) {
            if (this.contentToString) {
                // contentToString = componentContent; as innerHTML converts special characters, we'll use textContent instead
                // contentToString = this.getElement().textContent;
                contentToString = '';

                for (let child of this.getElement().childNodes) {
                    contentToString += child.outerHTML || child.nodeValue;
                }
            }

            else if (this.parseContent !== false) {
                let contentCompiler = new HtmlCompiler(componentContent);

                contentCompiler.originalCompiler = this.htmlCompiler.originalCompiler;

                if (this.htmlCompiler.currentState) {
                    contentCompiler.currentState = this.htmlCompiler.currentState;
                }

                contentCompiler.onComponentLoad(component => {
                    let htmlCompilerToInjectIn = this.htmlCompiler.viewName ? this.htmlCompiler : this.htmlCompiler.originalCompiler;
                    htmlCompilerToInjectIn.addChild(component.childName(), component.selector);
                });

                contentCompiler.parse();

                parsedComponentContent = `(${this.selector.toCamelCase()}) => {${contentCompiler.parsed}}`;
            }
        }

        this.htmlCompiler.addChild(componentName, this.selector);

        let parentComponent = this.htmlCompiler.objectName;

        let componentAlias,
            componentIsArray = false;

        if (this.elementAlias) {
            componentAlias = this.elementAlias;
        }

        let props = {};

        let skippedProperties = [this.variableName];

        for (let attribute in this.attributesInBrackets) {
            let value = this.attributesInBrackets[attribute].replace(/this/g, this.htmlCompiler.objectName);
            props[attribute] = value;
            skippedProperties.push(value);
        }

        let customEvents = this.collectCustomEvents();

        this.clearInvalidAttributes();
        // this.openTag();

        // this.variableNameWillBeUsed();

        let componentInfo = {};

        componentInfo.parent = this.htmlCompiler.originalCompiler.objectName;

        skippedProperties.push(this.htmlCompiler.originalCompiler.objectName)

        if (contentToString) {
            componentInfo.contentToString = '`' + contentToString.replace(/\`/g, '\\`') + '`';
            skippedProperties.push(componentInfo.contentToString);
        }

        if (!Is.empty(props)) {
            componentInfo.props = props;
        }

        if (!Is.empty(customEvents)) {
            componentInfo.events = customEvents;
        }

        if (parsedComponentContent) {
            componentInfo.content = parsedComponentContent;
        }

        if (Object.keys(this.events).length) {
            componentInfo.events = Object.merge(this.events, componentInfo.events || {});
        }

        if (Object.keys(this.booleanAttributes).length) {
            componentInfo.boolAttrs = this.booleanAttributes;
        }

        if (Object.keys(this.attributes).length) {
            componentInfo.attrs = this.attributes;
        }

        if (Object.keys(this.style).length) {
            componentInfo.style = this.style;
        }

        // it means the component is inside an if statement
        if (this.htmlCompiler.currentState) {
            componentInfo.state = this.htmlCompiler.currentState.state;
        } else if (this.htmlCompiler.originalCompiler.currentState) {
            componentInfo.state = this.htmlCompiler.originalCompiler.currentState.state;
        }

        if (this.htmlCompiler.insideForLoop) {
            componentInfo.insideLoop = true;
            // the unique id of the for loop is used because there might be nested loops
            // so we want to make sure that any component inside all of these loops have
            // a unique index
            let uniqueIdOfForLoop = '"" +' + this.htmlCompiler.currentLoop.idTree.join('+');
            componentInfo.index = uniqueIdOfForLoop;
            skippedProperties.push(uniqueIdOfForLoop);

            if (componentAlias) {
                componentIsArray = true;
                this.appendLine(`${parentComponent}.${componentAlias} = []`);
            }
        }

        let secondArgument = '';

        if (!Is.empty(componentInfo)) {
            componentInfo = flatten(componentInfo, {
                skip: skippedProperties,
            });
            secondArgument = `, ${componentInfo}`;
        }

        let componentCode = `this._lc('${componentName}'${secondArgument})`;

        if (componentAlias) {
            if (componentIsArray) {
                this.appendLine(`${parentComponent}.${componentAlias}.push(${componentCode}.component)`);
            } else {
                this.appendLine(`${parentComponent}.${componentAlias} = ${componentCode}`);
            }
        } else {
            this.appendLine(componentCode);
        }

        // this.closeTag();
    }

    /**
     * Collect passed custom events
     */
    collectCustomEvents() {
        let customEvents = {};
        for (let attribute in this.originalAttributes) {
            if (attribute.startsWith('(') && attribute.endsWith(')')) {
                let eventName = 'on' + attribute.ltrim('(').rtrim(')');

                let functionArguments = this.collectArgumentsOf(this.originalAttributes[attribute]);

                // customEvents[eventName] = `function(${functionArguments}) {${this.originalAttributes[attribute]}}`;
                customEvents[eventName] = `function(e) {let $el = this; ${this.originalAttributes[attribute]}}`;
            }
        }

        return customEvents;
    }

    /**
     * Get the parameters inside the braces ()
     * 
     * i.e this.update(value1, value2) so we will return value1, value2
     */
    collectArgumentsOf(functionCode) {
        let fullArgumentsList = [];

        functionCode.split(';').forEach(string => {
            string.replace(/\((.*)\)/g, function (matched, argumentsList) {
                // split arguments by semi colon
                argumentsList.split(',').forEach(argument => {
                    argument = argument.trim();

                    if (!fullArgumentsList.includes(argument)) {
                        fullArgumentsList.push(argument);
                    }
                });
            });
        });

        return fullArgumentsList.join(',');
    }
}