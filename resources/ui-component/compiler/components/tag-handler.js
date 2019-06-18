const ParentComponent = require(PARENT_COMPONENT_PATH);

class NewCustomComponent extends ParentComponent {}

module.exports = {
    selector: 'tag-name',
    isChild: isChildFlag,
    contentToString: contentToStringFlag,
    parseContent: parseContentFlag,
    handler: NewCustomComponent,
    isUnique: isUniqueComponent,
    component: 'ComponentHandler',
    htmlFile: __dirname + '/../../component-name.component.html',
};