const { fs } = require('./../../bootstrap/modules');
const Tag = require('./tag');
const HtmlCompiler = require('./html-compiler');
const childComponents = require('./../child-components');

/**
 * Child component is used to inject the content of the current component into its parent component instead of 
 * creating separated component  
 */
module.exports = class ChildComponent extends Tag {
    /**
     * {@inheritDoc}
     */
    build() {
        let componentFile = this.htmlFile;
        let htmlContent = fs.get(componentFile);
        let compiler = new HtmlCompiler(htmlContent);

        let passedAttributesList = this.attrs().list();

        for (let child of compiler.root.childNodes) {
            // check if there is passed attributes to child component
            // if so, then we will pass it to each element in that child component that has *primary attribute
            if (! Is.empty(passedAttributesList) && child.hasAttribute && child.hasAttribute('*primary')) {
                child.removeAttribute('*primary');
                for (let attr in passedAttributesList) {
                    let value = passedAttributesList[attr];

                    // if the attribute is `class` and the primary element has a `class`, then merge them.
                    if (attr == 'class' && child.hasAttribute('class')) {
                        value = child.getAttribute('class') + ' ' + value;
                    }
                    child.setAttribute(attr, value)
                }
            }
            this.htmlCompiler.extract(child, null, this.tagNamespace);
            this.htmlCompiler.observe(compiler.observableProperties);
        }

        // for some fu***n unknown reason, the child component prevents compile next text
        if (this.originalElement.nextSibling && this.originalElement.nextSibling.constructor.name == 'Text')  {
            this.htmlCompiler.extract(this.originalElement.nextSibling, null, this.tagNamespace);
        }

        let absoluteFilePath = normalizePath(this.htmlFile);

        // Map the current html file to its parents as when the current child component is saved
        // the parent should be re-parsed not this one
        childComponents.add(absoluteFilePath, normalizePath(this.htmlCompiler.originalCompiler.parser.filePath));

        this.originalElement.parentNode.removeChild(this.originalElement);
    }
}