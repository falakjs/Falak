class ChildComponents {
    constructor() {
        this.childrenList = {};
    }

    /**
     * Link the given child path to its parent
     */
    add(childPath, parentPath) {
        if (!this.childrenList[childPath]) {
            this.childrenList[childPath] = [];
        }

        if (!this.childrenList[childPath].includes(parentPath)) {
            this.childrenList[childPath].push(parentPath);
        }
    }

    /**
     * Check if the given html file is a child
     */
    has(htmlFile) {
        return typeof this.childrenList[htmlFile] != 'undefined';
    }

    /**
     * Get all parents of the given html file child
     */
    getParentsOf(htmlFile) {
        return this.childrenList[htmlFile];
    }
}

module.exports = new ChildComponents;