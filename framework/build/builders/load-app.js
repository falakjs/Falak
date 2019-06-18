const { fs } = require('./../../bootstrap/modules');
const loadPackage = require('./load-package');

function loadApp(appName) {
    return new Promise(async resolve => {
        let appPackageSrc = SRC_DIR + '/' + appName + '/package.json';
        
        if (fs.exists(appPackageSrc)) {
            await loadPackage(appName, 'app');
        } else {
            throw new Error(`Not Found package.json file for ${appName} application`);
        }

        resolve();
    });
}

module.exports = loadApp;