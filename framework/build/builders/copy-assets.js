const {fs} = require('./../../bootstrap/modules');

function copyAssets() {
    for (let assets of resources.assets) {
        let dist = assets.dist;

        for (let asset of assets.src) {
            if (!fs.isDir(asset)) {
                throw new Error(`${asset} asset doesn't exists`);
            }

            fs.copy(asset, STATIC_DIR + '/' + dist);
        }
    }
}

function copyFavicon() {
    let favicon = resources.favicon;

    if (!favicon) return;

    let currentAppFaviconPath = `${APP_DIR}/assets/${favicon}`;
    let commonAppFaviconPath = `${SRC_DIR}/common/assets/${favicon}`;
    let faviconPath;

    if (fs.exists(currentAppFaviconPath)) {
        faviconPath = currentAppFaviconPath;
    } else if (fs.exists(commonAppFaviconPath)) {
        faviconPath = commonAppFaviconPath;
    }

    if (!faviconPath) return;

    fs.copy(faviconPath, STATIC_DIR + '/assets/' + favicon);
}

module.exports = function () {
    copyAssets();

    copyFavicon();
};