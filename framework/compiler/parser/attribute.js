module.exports = class Attribute {
    /**
     * Constructor
     * 
     * @param HTMLElement element
     */
    constructor(tag, element, attribute) {
        this.tag = tag;
        this.element = element;
        this.returnedValue = '';
        this.attribute = attribute;

        this.originalAttributes = {};

        for (let attribute in this.tag.originalAttributes) {
            this.originalAttributes[attribute] = this.tag.originalAttributes[attribute];
        }

        this.returnedAttribute = this.attribute;

        this.init();
    }

    /**
     * Get all|rest of the attributes in square brackets
     * 
     * @returns object
     */
    brackets() {
        let attributes = {};

        for (let attribute in this.originalAttributes) {
            if (attribute.startsWith('[')) {
                let attributeWithoutBrackets = attribute.replace(/\[|\]/g, '');
                attributes[attributeWithoutBrackets] = this.originalAttributes[attribute];
            }
        }

        return attributes;
    }

    /**
     * Get then remove the attribute
     * 
     * @param   string attribute
     * @returns string
     */
    pull(attribute) {
        let attributeValue = this.get(attribute);

        this.remove(attribute);

        return attributeValue;
    }

    /**
     * Get value of the given attribute name
     * 
     * @param  string attribute
     * @returns string
     */
    get(attribute) {
        return this.originalAttributes[attribute];
    }

    /**
     * Set the given attribute name and value
     */
    set(attribute, value) {
        this.originalAttributes[attribute] = value;
        this.tag.attributes[attribute] = value;
        this.tag.originalAttributes[attribute] = value;
    }

    /**
     * Get and remove attribute from list
     */
    forcePull(attribute, defaultValue = null) {
        let value = this.get(attribute);

        if (typeof value == 'undefined') return defaultValue;

        delete this.originalAttributes[attribute];
        delete this.tag.attributes[attribute];
        // delete this.tag.originalAttributes[attribute];

        this.tag.originalElement.removeAttribute(attribute);

        return value;
    }

    /**
     * Determine if the given attribute name exists
     * 
     * @param  string attribute
     * @returns bool
     */
    has(attribute) {
        return 'undefined' !== typeof this.originalAttributes[attribute];
    }

    /**
     * Determine if any of the given attributes exists 
     * 
     * @param  array attributes
     * @returns bool
     */
    hasAny(...attributes) {
        for (let attribute of attributes) {
            if (this.tag.originalAttributes[attribute]) return true;
        }

        return false;
    }

    /**
     * Remove the given attribute name
     * 
     * @param  string attribute
     * @returns void
     */
    remove(attribute) {
        // this.element.removeAttribute(attribute);
    }

    /**
     * Initialize the object
     */
    init() { }

    /**
     * Get attributes list
     */
    list() {
        return this.originalAttributes;
    }

    /**
     * Build final attributes and set it in the attributes list
     * 
     * @returns void
     */
    build() {
        this.tag.attributes[this.returnedAttribute] = this.returnedValue;
    }
}