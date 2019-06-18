const glob = require("multi-glob").glob;
const fs = require('flk-fs');

const promisableGlob = (patterns, callback = () => {}) => {
    return new Promise((resolve, reject) => {
            glob(patterns, (e, files) => {
            if (e) {
                reject(e);
                return;
            }


            callback(e, files);
            resolve(files);
        });
    });
};

module.exports = {
    glob: promisableGlob,
    fs,
};