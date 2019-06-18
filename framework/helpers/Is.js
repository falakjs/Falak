; /**
 * Supportive Is v1.1
 * A simple lightwegiht library to validate values agains certain types of data
 * For full documentation on github
 * Repo: https://github.com/hassanzohdy/supportive-is
 *
 * released 01/12/2017
 * Licensed under MIT (http://opensource.org/licenses/MIT)
 */
const Is = {
    /**
    * Determine whether the given value is null
    *
    * @param mixed value
    * @return bool
    */
    null: value => value === null,
    /**
    * Determine whether the given value is undefined
    *
    * @param mixed value
    * @return bool
    */
    undefined: value => typeof value == 'undefined',
    /**
    * Determine whether the given value is a number whatever if its data type is String or Number
    *
    * @param mixed value
    * @return bool
    */
    numeric: value => /^[+-]?\d+(\.\d+)?([Ee][+-]?\d+)?$/g.test(value),
    /**
    * Determine whether the given value is an integer and its data type is number
    *
    * @param mixed value
    * @return bool
    */
    int: value => typeof value === 'number' && /^(\d)+$/.test(value),
    /**
    * Determine whether the given value is a float number and its data type is number
    *
    * @param mixed value
    * @return bool
    */
    float: value => typeof value === 'number' && /^(\d)+(\.(\d)+)?$/.test(value),
    /**
    * Determine whether the given value is not a number
    *
    * @param mixed value
    * @return bool
    */
    NaN: value => isNaN(value),
    /**
    * Determine whether the given value is a regular expression
    *
    * @param mixed value
    * @return bool
    */
    regex: value => typeof value != 'undefined' && value.constructor.name == 'RegExp',
    /**
    * Determine whether the given value is an object
    *
    * @param mixed value
    * @return bool
    */
    object: value => !Is.null(value) && typeof value === 'object',
    /**
    * Determine whether the given value is a plain object
    *
    * @param mixed value
    * @return bool
    */
   plainObject: value => !Is.null(value) && ! Is.undefined(value) && value.constructor.name === 'Object',
   /**
    * Determine whether the given value is an array
    *
    * @param mixed value
    * @return bool
    */
    array: value => value instanceof Array,
    /**
     * Determine whether the given value is valid html attribute `id`
     */
    validHtmlId: value => /^[A-Za-z]+[\w\-\:\.]*$/.test(value),
    /**
    * Determine whether the given value is a jquery object
    *
    * @param mixed value
    * @return bool
    */
    jquery: value => value instanceof jQuery,
    /**
    * Determine whether the given value is a dom element
    *
    * @param mixed value
    * @return bool
    */
    dom: value => value instanceof HTMLElement,
    /**
     * Determine whither the given object is instance of the given class name
     * Please note that this method won't work with parent classes
     * use `instanceof` expression instead
     * i.e 
     * class A{} 
     * class B extends A {}
     * let object = new B;
     * 
     * Using Is.instanceof()
     * console.log(Is.instanceof(object, 'B')); // true
     * console.log(Is.instanceof(object, 'A')); // false
     * 
     * Using the normal instanceof 
     * console.log(object instanceof B); // true
     * console.log(object instanceof A); // true
     * 
     * @param object object
     * @param string className
     * @returns bool
     */
    a: (object, className) => object.constructor.name === className,
    /**
     * Determine whether the given variable is iterable
     * 
     * @param object object
     * @returns bool
     */
    iterable: object => typeof object[Symbol.iterator] === 'function',
    /**
     * Check if the given variable is symbol
     */
    symbol: value => typeof value === 'symbol',
    /**
    * Determine whether the given value is a string
    *
    * @param mixed value
    * @return bool
    */
    string: value => typeof value === 'string',
    /**
    * Determine whether the given value is an boolean
    *
    * @param mixed value
    * @return bool
    */
    bool: value => typeof value == 'boolean',
    /**
    * Determine whether the given value is an boolean
    *
    * @param mixed value
    * @return bool
    */
    boolean: value => typeof value == 'boolean',
    /**
    * Determine whether the given value is a function
    *
    * @param mixed value
    * @return bool
    */
    function: value => typeof value == 'function',
    /**
     * Determine whether the given value is callable
     * 
    * @param mixed value
    * @return bool
     */
    callable: value => typeof value == 'function',
    /**
     * Returns `true` if the passed function is native to the browser, and is not
     * polyfilled
     * 
     * @param {function()|undefined} func A function that is attatched to a JS
     * object.
     * @return {boolean}
     */
    native: func => !!func && func.toString().indexOf('[native code]') != -1,
    /**
    * Determine whether the given value is a scalar
    * Scalalr types are strings, booleans, integers and
    *
    * @param mixed value
    * @return bool
    */
    scalar: value => /string|number|boolean/.test(typeof value),
    /**
    * Determine whether the given value if an empty
    * This can be validated against any type of values
    * undefined or nullable values will be considered empty
    * Objects that doesn't have any properties will be considered empty
    * Arrays and Strings will be empty based on its length
    * The 0 'Zero" number will not be considered empty
    *
    * @param mixed value
    * @return bool
    */
    empty(value) {
        if (Is.undefined(value) || Is.null(value)) return true;

        if (Is.string(value)) return value.length == 0;

        if (Is.object(value)) {
            return typeof value.length != 'undefined' ? value.length == 0 : Object.keys(value).length == 0;
        }

        // this is used here fo zero
        if (Is.numeric(value)) return false;

        return true;
    },
    /**
     * Determine if the given value is an object of `FormHandler` class
     * 
     * @param mixed value
     * @returns bool
     */
    formHandler: value => Is.object(value) && value.constructor.name === 'FormHandler',
    /**
     * determine if the given value is an instance of form lement
     */
    formElement: value => Is.object(value) && value.constructor.name == 'HTMLFormElement',
    /**
    * Determine whether the given value is a valid json string
    *
    * @param mixed value
    * @return bool
    */
    json(value) { 
        try {
            JSON.parse(value);
            return true;
        } catch (e) {
            return false;
        }
    },
    /**
    * Determine whether the given value is a valid url
    *
    * @param mixed value
    * @return bool
    */
    url: value => (new RegExp('^(https?:\\/\\/||\/\/)?((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))(\\:\\d+)?(\\/[-a-z\\d%@_.~+&:]*)*(\\?[;&a-z\\d%@_.,~+&:=-]*)?(\\#[-a-z\\d_]*)?$', 'i')).test(value),
    /**
    * Determine whether the given value is a valid email
    *
    * @param mixed value
    * @return bool
    */
    email: value => /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value),
    /**
     * Determine whether the given mobile number is a valid Egyptian mobile number
     * The following formats are valid
     * 010[another-8digs]
     * 2010[another-8digs]
     * +2010[another-8digs]
     * 
     * Available mobile numbers are 010|011|012|015
     * 
     * @param string value
     * @param bool withCode => If set to true, then user can add the +(num) on the beginning of the number 
     * @returns bool
     */
    mobileNumber: {
        eg: (value, withCode = true) => {
            let expression = '^';
            if (withCode) {
                expression += '(\\+?2)?';
            }

            expression += '01(0|1|2|5)\\d{8}$';
            let regex = new RegExp(expression);

            return regex.test(value);
            // value => /^(\+?2)?01(0|1|2|5)\d{8}$/.test(value);
        },
    },
    /**
    * Determine whether cookies are enabled
    *
    * @return bool
    */
    cookieEnabled() {
        return navigator.cookieEnabled;
    },
    /**
    * Determine the current visitor is opening from mobile
    * Please Note this method depends on the user agent
    *
    * @return bool
    */
    mobile: {
        /**
        * Determine whether the current visitor is opening from an Android device
        *
        * @return bool
        */
        android() {
            return navigator.userAgent.match(/Android/i);
        },
        /**
        * Determine whether the current visitor is opening from a blackberry mobile
        *
        * @return bool
        */
        blackBerry() {
            return navigator.userAgent.match(/BlackBerry/i);
        },
        /**
        * Determine whether the current visitor is opening from an ios device
        *
        * @return bool
        */
        ios() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        /**
        * Determine whether the current visitor is opening from an Iphone
        *
        * @return bool
        */
        iphone() {
            return navigator.userAgent.match(/iPhone/i);
        },
        /**
        * Determine whether the current visitor is opening from an ipad
        *
        * @return bool
        */
        ipad() {
            return navigator.userAgent.match(/iPad/i);
        },
        /**
        * Determine whether the current visitor is opening from an ipod
        *
        * @return bool
        */
        ipod() {
            return navigator.userAgent.match(/iPod/i);
        },
        /**
        * Determine whether the current visitor is opening from an windows mobile
        *
        * @return bool
        */
        windows() {
            return navigator.userAgent.match(/IEMobile/i);
        },
        /**
        * Determine whether the current visitor is opening from mobile whatever its type
        *
        * @return bool
        */
        any() {
            return Boolean(Is.mobile.android() || Is.mobile.blackBerry() || Is.mobile.ios() || Is.mobile.windows());
        },
    },
    /**
    * Determine whether the current visitor is opening from desktop
    *
    * @return bool
    */
    desktop() {
        return !Is.mobile.any();
    },
};

module.exports = Is;