const { fs } = require('./../bootstrap/modules');

function createComponent(componentName, command) {
    let appName = command.options.app || APP_NAME;

    if (!componentName.endsWith('-page') && ! command.options.asChild && command.options.route) {
        componentName += '-page';
    }

    let componentSegments = componentName.split('/');

    let defaultSelector = Array.end(componentSegments);

    let selector = command.options.selector || defaultSelector;

    let component = (command.options.component || defaultSelector).toStudlyCase();

    let moduleName = command.options.module;

    let componentPath = ROOT + ( moduleName ? `/src/${appName}/modules/${moduleName}/components/${componentName}` : `/src/${appName}/modules/${componentName}`);

    if (fs.isDir(componentPath)) {
        die(`${cli.redBright(componentName)} component already exists!`);
    }

    echo(`${cli.yellow('Creating')} ${cli.green(componentName)} component...`);

    // first we will copy the component
    fs.copy(FRAMEWORK_RESOURCES_PATH + '/ui-component', componentPath);

    // now we will update all files to replace the placeholder with component details
    handleJsFiles(command, componentPath, component, selector, componentName);
    handleScssFiles(componentPath, selector);
    updatePackage(appName, componentName, moduleName);

    if (command.options.route) {
        addPageRoute(command.options.route, component, componentName, appName);
    }

    echo(`${cli.cyan(componentName)} ${cli.green('component has been created successfully.')}`);
}

function addPageRoute(route, component, componentName, appName) {
    let routingJsPath = ROOT + `/src/${appName}/modules/routing.js`;

    let routingJsContent = fs.get(routingJsPath);

    routingJsContent += `\r\n// ${componentName.replace('-page', '').replace(/-/g, ' ').capitalize()} page\r\n Router.add('${route}', ${component});`;

    fs.put(routingJsPath, routingJsContent);
}

function updatePackage(appName, componentName, moduleName) {
    let packagePath = ROOT + `/src/${appName}/package.json`;

    let $package = fs.getJson(packagePath);

    if (moduleName) {
        if (! $package.modules.includes(moduleName)) {
            $package.modules.push(moduleName);
        }
    } else {
        $package.modules.push(componentName);
    }

    fs.putJson(packagePath, $package);
}

function handleJsFiles(command, componentPath, component, selector, componentName) {
    // handle the compiler file
    let tagHandler = fs.get(componentPath + '/compiler/components/tag-handler.js');

    // if the unique option is not passed, then the component will be unique if and only if the component is not child component 
    let isUnique = typeof command.options.unique != 'undefined' ? command.options.unique : 
                          command.options.route ? true : command.options.asChild === false;

    let isChildComponent = command.options.asChild;

    let parseContent = typeof command.options.parseContent != 'undefined' ? command.options.parseContent : true;
    let contentToString = typeof command.options.contentToString != 'undefined' ? command.options.contentToString : false;

    let parentComponentName,
        parentComponentClassPath;

    if (isChildComponent) {
        parentComponentName = 'ChildComponent';
        parentComponentClassPath = 'CHILD_COMPONENT_CLASS_PATH';
    } else {
        parentComponentName = 'Component';
        parentComponentClassPath = 'COMPONENT_CLASS_PATH';
    }

    tagHandler = tagHandler.replace('PARENT_COMPONENT_PATH', parentComponentClassPath)
        .replaceAll('ParentComponent', parentComponentName)
        .replace('isChildFlag', isChildComponent ? 'true' : 'false')
        .replace('parseContentFlag', parseContent ? 'true' : 'false')
        .replace('contentToStringFlag', contentToString ? 'true' : 'false')
        .replace('ComponentHandler', component)
        .replaceAll('NewCustom', component)
        .replace('tag-name', selector)
        .replace('component-name', selector)
        .replaceAll('isUniqueComponent', isUnique ? 'true' : 'false');

    fs.put(componentPath + `/compiler/components/${selector}.js`, tagHandler);

    fs.unlink(componentPath + '/compiler/components/tag-handler.js');

    let htmlFilePath = componentPath + '/component-name.component.html';

    let htmlFileContent = fs.get(htmlFilePath);

    htmlFileContent = htmlFileContent.replace('%component', selector);

    fs.put(htmlFilePath, htmlFileContent);

    // rename html file
    fs.rename(htmlFilePath, componentPath + `/${selector}.component.html`);

    // handle the js file
    let jsFile = fs.get(componentPath + '/component-name.component.js');
    fs.unlink(componentPath + '/component-name.component.js');

    if (isChildComponent) return; // do not set js file for the component if it is child

    jsFile = jsFile.replace('class ComponentHandler', `class ${component}`);

    let pageName = '',
        pageTitle = '';

    if (command.options.route) {
        pageName = `this.name = '${selector.replace('-page', '')}';`;
    }

    if (command.options.title || command.options.route) {
        let title = command.options.title ? `'${command.options.title}'` : `trans('${selector}')`;
        pageTitle = `this.title = ${title};`;
    }

    jsFile = jsFile.replace('pageName', pageName)
        .replace('pageTitle', pageTitle);

    fs.put(componentPath + `/${selector}.component.js`, jsFile);
}

/**
 * Create scss files
 *
 * @param  string $component
 * @return void
 */
function handleScssFiles(componentPath, selector) {
    // rename scss file
    let scssFilePath = componentPath + `/${selector}.component.scss`;
    fs.rename(componentPath + '/component-name.component.scss', scssFilePath);
    let content = fs.get(scssFilePath).replace('placeholder', selector);

    fs.put(scssFilePath, content);
}

module.exports = function (command, exitOnFinish = true) {
    if (command.asChild && command.options.route) {
        die(`Can't use ${cli.redBright('--as-child')} and ${cli.redBright('--route')} for same component`);
    }

    if (command.components.length > 1 && command.options.route) {
        die(`Can't use ${cli.redBright('--route')} with more than one component`);
    }

    for (let componentName of command.components) {
        createComponent(componentName, command);
    }

    if (exitOnFinish) {
        die();
    }
}