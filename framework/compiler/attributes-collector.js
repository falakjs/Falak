const {glob} = require('./../bootstrap/modules');
class AttributesCollector {
    constructor(attributesPatterns) {
        this.attributesPatterns = attributesPatterns;
        this.attributesList = {};
        this.bulkAttributesList = [];
    }

    /**
     * Collect all attributes
     */
    collect() {
        return new Promise(resolve => {
            glob(this.attributesPatterns, (err, files) => {
                for (let i = 0; i < files.length; i++) {
                    let file = files[i];

                    const attribute = require(file);

                    if (file.endsWith('-list.js')) {
                        this.bulkAttributesList.push(attribute);
                    } else {
                        this.attributesList[attribute.attr] = attribute.handler;
                    }

                    if (i == files.length - 1) {
                        resolve();
                    }
                }
            });
        });
    }
}

module.exports = AttributesCollector;