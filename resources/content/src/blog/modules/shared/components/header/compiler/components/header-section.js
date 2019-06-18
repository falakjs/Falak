const Component = require(COMPONENT_CLASS_PATH);

class HeaderSectionTag extends Component {}

module.exports = {
    selector: 'header-section',
    isUnique: true,
    component: 'Header',
    htmlFile: __dirname + '/../../header-section.component.html',
    handler: HeaderSectionTag,
};