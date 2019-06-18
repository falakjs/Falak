const {glob} = require('./../bootstrap/modules');
class ComponentsCollector {
    constructor(componentsPatterns) {
        this.componentsPatterns = componentsPatterns;
        this.componentsList = {};
    }

    /**
     * Collect all components
     */
    collect() {
        return new Promise(resolve => {
            glob(this.componentsPatterns, (err, files) => {
                if (! files) die(err)
                for (let i = 0; i < files.length; i++) {
                    let file = files[i];

                    const component = require(file);

                    this.componentsList[component.selector] = component;

                    if (i == files.length - 1) {
                        resolve();
                    }
                }
            });
        });
    }
}

module.exports = ComponentsCollector;