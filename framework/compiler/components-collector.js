const { glob } = require('./../bootstrap/modules');
class ComponentsCollector {
    constructor(componentsPatterns) {
        this.componentsPatterns = componentsPatterns;
        this.componentsList = {};
    }

    /**
     * Collect all components
     */
    collect() {
        return new Promise(async resolve => {

            try {
                let files = await glob(this.componentsPatterns);
                for (let i = 0; i < files.length; i++) {
                    let file = files[i];

                    const component = require(file);

                    this.componentsList[component.selector] = component;

                    if (i == files.length - 1) {
                        resolve();
                    }

                }
            } catch (error) {
                die(12);
            }
        });
    }
}

module.exports = ComponentsCollector;