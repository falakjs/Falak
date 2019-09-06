const babel = require("@babel/core");
const { fs } = require('./../bootstrap/modules');

function compile(hash, appDistPath) {
    return new Promise(resolve => {
        let vendorContent = '';

        echo(cli.magenta('Bundling vendors...'));
    
        for (let vendorFile of resources.jsVendor) {
            vendorContent += fs.get(ROOT + '/' + vendorFile.ltrim('/')) + "\r\n";
        }
    
        let result = babel.transformSync(vendorContent, {
            envName: 'production',
            "comments": false,
            presets: [['minify', {
                builtIns: false,
            }]]
        });
    
        fs.put(appDistPath + `/js/vendor-${hash}.min.js`, result.code);
        // fs.put(appDistPath + `/js/vendor-${hash}.min.js`, vendorContent);
        resolve();
    });
}

module.exports = (hash, appDistPath) => compile(hash, appDistPath);