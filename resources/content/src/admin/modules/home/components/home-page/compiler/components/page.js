const Component = require(COMPONENT_CLASS_PATH);

class HomePageComponent extends Component {}

module.exports = {
    selector: 'home-page',
    handler: HomePageComponent,
    isChild: false,
    contentToString: false,
    parseContent: true,
    isUnique: true,
    component: 'HomePage',
    htmlFile: __dirname + '/../../home-page.component.html',
};