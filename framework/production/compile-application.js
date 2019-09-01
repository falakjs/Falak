const { fs, glob } = require('./../bootstrap/modules');
const { flatten } = require('./../compiler/helpers/flatten');
const babel = require("@babel/core");
const removeComments = require('./comment-remover');

function getAlias(fileContent, className) {
    let lines = fileContent.split("\n");

    for (let line of lines) {
        line = line.trim();

        if (line.startsWith('alias')) {
            let alias = line.replaceAll("'", '').replaceAll('"', '').replace(',', '').replace(/alias(\s)*:(\s)*/, '');
            return alias;
        }
    }

    return null;
}

function getDep(code) {
    let regexExp = '';

    let methodText = code;
    let methodName = 'constructor';

    regexExp += '(?:' + methodName + ')';

    regexExp += '\\s*\\(([^\\)]*)\\)';

    let regex = new RegExp(regexExp),
        matches = methodText.match(regex);

    if (!matches || !matches[1]) return [];

    // now we will remove any spaces, tabs or new lines
    return matches[1].replace(/\t|\n|\s/g, '').replace(/,$/, '').split(',');
}

module.exports = (hash, appDistPath) => {
    return new Promise(async (resolve, reject) => {
        echo(cli.magentaBright('Compiling application files...'));

        let DIContent = fs.get(FRAMEWORK_ROOT_PATH + '/production/di.js');

        let filesList = resources.jsFiles.map(file => ROOT + '/' + file.ltrim('/'));

        let classesList = {};

        let aliasMap = {};

        let productionContent = '';

        for (let file of filesList) {
            if (file.includes('injection')) continue;

            let fileContent = fs.get(file).trim();

            // remove any comments from the file content
            fileContent = removeComments(fileContent).trim();

            if (fileContent.startsWith('class ') || fileContent.includes('DI.register')) {
                let className;
                fileContent.replace(/class ([^\{|\s]+)/, function (text, classNameString) {
                    className = classNameString;
                });

                let classInfo = {
                    className,
                    dependencies: getDep(fileContent),
                };

                let classAlias = getAlias(fileContent, className);

                classesList[className] = classInfo;

                if (classAlias) {
                    aliasMap[classAlias] = className;
                } else {
                    // if no alias, then class name will alias itself
                    aliasMap[className] = className;
                }

                // attach the class to window
                fileContent = fileContent.replace(`class ${className}`, `window.${className} = class ${className}`);

                if (fileContent.includes('DI.register')) {
                    let [contentWithoutRegister] = fileContent.split('DI.register');
                    fileContent = contentWithoutRegister;
                }
            }
            productionContent += fileContent + ";\r\n";
        }

        DIContent = DIContent.replace('classesListContent', flatten(classesList)).replace('aliasMapContent', flatten(aliasMap));

        let productionFilePath = appDistPath + `/js/app-${hash}.min.js`;

        productionContent = DIContent + ";\r\n" + productionContent;

        // fs.put(ROOT + '/p.js', productionContent)

        // generators
        productionContent = fs.get(NODE_MODULES_DIR + '/regenerator-runtime/runtime.js') + ';' + productionContent;

        // replace using the keywords maps in all packages

        let packagePaths = Object.values(resources.packages).map(path => path + '/**/compiler/**/production/**/keywords-map.js');

        let files = await glob(packagePaths);

        // for (let file of files) {
        //     let keywordsMap = require(file);

        //     for (let originalKeyword in keywordsMap.keywords) {
        //         let shortcut = keywordsMap.keywords[originalKeyword];
        //         if (Is.string(shortcut)) {
        //             if (productionContent.includes(shortcut) && !Is.empty(keywordsMap.prefix)) {
        //                 for (let prefix of keywordsMap.prefix) {
        //                     if (!productionContent.includes(prefix + shortcut)) {
        //                         shortcut = prefix + shortcut;
        //                         break;
        //                     }
        //                 }
        //             }
        //             let pattern = new RegExp(`${RegExp.escape(originalKeyword)}(?:\\s)?([\\=|\\(]+)?`, 'g');

        //             productionContent = productionContent.replace(pattern, (text, symbol) => {
        //                 return symbol ? shortcut + symbol : shortcut;
        //             });
        //         }
        //     }
        // }
        let result = babel.transformSync(productionContent, {
            envName: 'production',
            comments: false,
            // useBuiltIns: 'usage',
            // plugins: [
            //     ["@babel/transform-runtime"]
            // ],
            presets: [
                '@babel/preset-env',
                ["minify", {
                    // builtIns: false,
                    "mangle": {
                        "keepFnName": true
                    },
                }],
            ],
        });

        let productionCode = result.code;


        // return;
        fs.put(productionFilePath, productionCode);
        // fs.put(productionFilePath, productionContent);
        resolve();
    });
}