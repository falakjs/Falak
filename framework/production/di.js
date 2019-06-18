class DependencyInjection {
    /**
     * Resolve the given alias or class name if it doesn't have an alias
     * Please Note that this method works as with the flow of the singleton pattern
     * So if you want to get new instance of the class, use the DI.instance method instead
     * 
     * @param string className 
     * @param string constructor 
     */
    static resolve(className) {
        if (typeof className === 'object') {
            let object = className;
            className = className.constructor.name;

            if (!DI.instances[className]) {
                DI.instances[className] = object;
            }
            return object;
        } else {
            className = DI.className(className);
        }

        if (typeof DI.instances[className] != 'undefined') return DI.instances[className];

        return DI.instances[className] = DependencyInjection.instance(className);
    }

    /**
     * Get class name from alias map 
     * 
     * @param  string className
     * @returns string
     */
    static className(className) {
        return DI.aliasMap[className] || className;
    }

    /**
     * Get new instance for the given class name
     * 
     * @param string className
     * @returns object
     */
    static instance(className) {
        className = DI.className(className);

        let classInfo = DI.classesList[className];

        let dependencies = DI.resolveDependencies(classInfo.dependencies);

        return new window[className](...dependencies);
    }

    /**
     * Resolve the given dependencies list
     * 
     * @param array dependencies
     * @param object classInfo
     * @returns array
     */
    static resolveDependencies(dependencies) {
        let resolveDependencies = [];

        if (dependencies.length > 0) {
            for (let dependency of dependencies) {
                resolveDependencies.push(DI.resolve(dependency));                
            }
        }

        return resolveDependencies;
    }

    /**
     * Determine if the given `alias` or `className` is registered in the DI
     */
    static contains(className) {
        return Boolean(DI.aliasMap[className] || DI.classesList[className]);
    }
}

var DI = DependencyInjection;
// registered instances
DI.instances = {};
// registered classes => No instances yet
DI.classesList = classesListContent;
// map of aliases that refer to class
DI.aliasMap = aliasMapContent;