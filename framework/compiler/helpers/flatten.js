function wrapFunction(text) {
    return `function() {return ${text}}`;
}

function flatten(object, options = {}) {
    let text = '';

    if (! options.skip) {
        options.skip = [];
    }

    if (Is.array(object)) {
        return flattenArray(object, options);
    } else if (Is.object(object)) {
        return flattenObject(object, options);
    } else if (options.skip == 'all' || Is.boolean(object) || Is.numeric(object) || (Is.string(object) && (object.startsWith('function(') || object.startsWith('(') || options.skip.includes(object)))) {
        text += `${object}`;
    } else if (Is.string(object) && object.includes('${')) {
        text += '`' + object + '`';
    } else {
        text += `'${object}'`;
    }

    return text;
}

global.flatten = flatten;

function flattenObject(object, options) {
    let text = '{';

    for (let key in object) {
        let value = object[key];

        if (key.includes('-') || key.includes('/')) {
            text += `'${key}':`;
        } else {
            text += `${key}:`;
        }

        let flattenedValue = flatten(value, options);

        if (key == 'nodes') {
            text += wrapFunction(flattenedValue);
        } else {
            text += flattenedValue;
        }

        text += ',';
    }

    text = text.replace(/\,$/, '');

    text += '}';

    return text;
}

function flattenArray(array, options) {
    let text = '[';

    for (let element of array) {
        text += flatten(element, options);
        text += ',';
    }

    text = text.replace(/\,$/, '');

    text += ']';

    return text;
}

module.exports = {
    flatten,
    wrapFunction,
};