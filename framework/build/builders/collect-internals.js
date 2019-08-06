const { fs } = require('flk-fs');

function collectInternals($package) {
    if (Is.empty($package.internals)) return;

    if ($package.internals.js) {
        $package.internals.js = $package.internals.js.map(file => {
            // first copy the file
            let appName = $package.type == 'app' && $package.name ? $package.name : APP_NAME;

            fs.copy(`${SRC_DIR}/${appName}/${file}`, `${ROOT}/public/${APP_NAME}/js/${file}`);

            return `public/${APP_NAME}/js/${file}`;
        });
    }

    resources['internals'] = Object.merge(resources['internals'], $package.internals);
}

module.exports = collectInternals;