const Tag = require(TAG_CLASS_PATH);

class TextNode extends Tag {
    /**
     * {@inheritdoc}
     */
    boot() {}

    /**
     * {@inheritdoc}
     */
    build() {
        let node = this.originalElement;
        let nodeValue = node.constructor.name == 'Text' ? node.nodeValue : node;

        nodeValue = nodeValue.trim();

        if (!nodeValue) return '';

        if (nodeValue.includes('@echo')) {
            nodeValue.replace(/@echo\((.*)\)/, (original, value) => {
                this.appendLine(`console.log(${value.replace(/this/g, this.htmlCompiler.objectName)})`);
            });

            return;
        }
        
        // if the text is just a variable, then we will be not add single quotes

        this.textValue = nodeValue;

        if (this.textValue.repeatsOf('${') == 1 && this.textValue.startsWith("${") && this.textValue.endsWith('}')) {
            this.textValue = this.textValue.ltrim('${').rtrim('}'); 
        } else if (this.textValue.repeatsOf('${') > 1 && this.textValue.startsWith("${") && this.textValue.endsWith('}')) {
            this.textValue = `\`${this.textValue}\``;
        } else {
            this.textValue = nodeValue.replace(/\`/g, '\\`');
            this.textValue = `\`${this.textValue}\``;
        }

        this.appendLine(`text(${this.textValue})`);
    }


    /**
     * {@inheritDoc}
     */
    terminate() {}
}

module.exports = TextNode;