const { fs } = require('flk-fs');
let currentServiceWorkerPath = null;
let currentApp = null;
function checkServiceWorkerAndReturnItIfExists(appName) {
    currentApp = appName;
    let possibleServiceWorkerPaths = [
        SRC_DIR + `/${appName}/service-worker.js`,
        SRC_DIR + '/common/service-worker.js',
    ];


    for (let file of possibleServiceWorkerPaths) {
        if (fs.exists(file)) {
            return currentServiceWorkerPath = file;
        }
    }
}

function copyServiceWorkerToPublicDir() {
    let destinationPath = ENV == 'production' ? `${ROOT}/dist/public/${currentApp}/js/service-worker.js` : `${ROOT}/public/${currentApp}/js/service-worker.js`;
    fs.copy(currentServiceWorkerPath, destinationPath);
}

function checkIfTheGivenFilePathIsThePathOfTheCurrentServiceWorkerFile(filePath) {
    return filePath == currentServiceWorkerPath;
}

module.exports = {
    copy: copyServiceWorkerToPublicDir,
    check: checkServiceWorkerAndReturnItIfExists,
    is: checkIfTheGivenFilePathIsThePathOfTheCurrentServiceWorkerFile,
};