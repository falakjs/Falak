const Component = require(COMPONENT_CLASS_PATH);

class Page extends Component {}

module.exports = {
    selector: 'home-page',
    handler: Page,
    isUnique: true,
    component: 'HomePage',
    htmlFile: __dirname + '/../../home-page.component.html',
};