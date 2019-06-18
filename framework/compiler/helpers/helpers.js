const toArray = object => {
    let array = [];
    for (let key in object) {
        array.push(key);
        array.push(object[key]);
    }

    return array;
};

module.exports = {
    toArray,
};