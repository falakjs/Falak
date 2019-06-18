function collectAssets($assets, $assetPath) {
    for (let $asset of $assets) {
        if (Is.string($asset)) {
            $asset = {
                dist: $asset,
                src: [$asset],
            };
        }

        if (Is.empty($asset.src) || Is.empty($asset.dist)) {
            throw new Error('Assets object must have "src" and "dist" keys');
        }

        // Developer may add one or more source for one dist
        $asset.src = $asset.src.map($src => {
            return $assetPath + '/' + $src;
        });

        resources['assets'].push($asset);
    }
}

module.exports = collectAssets;