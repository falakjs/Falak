function collectExternals($package) {
    if (Is.empty($package.externals)) return;

    resources['externals'] = Object.merge(resources['externals'], $package.externals);
}

module.exports = collectExternals;