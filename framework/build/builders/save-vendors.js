const { fs } = require('./../../bootstrap/modules');

// CURRENT_DIRECTION from sass compiler 

function saveVendors() {
    let $vendors = {
        js: [],
        css: {},
    };
    // first we need to filter css files
    // so we will append the rtl/ltr files to the common css files
    $vendors['js'] = Object.get(resources['vendor'], 'js');

    let $vendorsCss = Object.get(resources['vendor'], 'css');

    $vendors['css'] = Object.get($vendorsCss, 'common');

    if (!Is.empty($vendorsCss[CURRENT_DIRECTION])) {
        $vendors['css'] = Object.merge($vendors['css'], $this.vendors['css'][CURRENT_DIRECTION]);
    }

    for (let $vendorType in $vendors) {
        let $vendorsList = $vendors[$vendorType];
        let $vendorContent = '';

        for (let $vendor of $vendorsList) {
            let resouruceType = $vendorType == 'js' ? 'jsVendor': 'cssVendor';

            let vendorPath = SRC_DIR + '/vendor/' + $vendor;
            if (!fs.exists(vendorPath)) {
                throw new Error('Not Found Vendor: ' + $vendor);
            }

            if (!resources[resouruceType].includes('src/vendor/' + $vendor)) {
                resources[resouruceType].push('src/vendor/' + $vendor);
            }
        }
    }
}

module.exports = saveVendors;