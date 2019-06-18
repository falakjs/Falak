const Component = require(COMPONENT_CLASS_PATH);

class FooterSectionTag extends Component {}

module.exports = {
    selector: 'footer-section',
    isUnique: true,
    component: 'Footer',
    htmlFile: __dirname + '/../../footer-section.component.html',
    handler: FooterSectionTag,
};