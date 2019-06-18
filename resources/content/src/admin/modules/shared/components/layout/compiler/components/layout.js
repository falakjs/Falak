const Component = require(COMPONENT_CLASS_PATH);

class LoggedInLayout extends Component {}

module.exports = {
    selector: 'layout',
    isUnique: true,
    component: 'LayoutWrapper',
    htmlFile: __dirname + '/../../layout.component.html',
    handler: LoggedInLayout,
};