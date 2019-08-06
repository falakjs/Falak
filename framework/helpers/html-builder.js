const { fs } = require('./../bootstrap/modules');

class HTMLBuilder {
    constructor() {
        this.cssPreloader = fs.get(FRAMEWORK_ROOT_PATH + '/outputs/js/css-preload.js');
        let indexContent;

        if (fs.exists(APP_DIR + '/index.html')) {
            indexContent = fs.get(APP_DIR + '/index.html');
        } else {
            indexContent = fs.get(FRAMEWORK_ROOT_PATH + '/outputs/html/index.html');
        }

        this.originalHtml = this.finalHtml = indexContent;

        this.dataList = {
            appName: null,
            appDirection: null,
            localeCode: null,
            baseUrl: null,
            stylesheets: [],
            scripts: [],
            meta: {
                image: true,
                title: null,
                twitter: true,
                graph: true,
                facebookAppId: null,
                description: null,
                url: true,
                siteName: true
            },
        };

        this.conversionMap = {
            APP_NAME: 'appName',
            APP_DIR: 'appDirection',
            APP_LOCALE: 'localeCode',
            APP_BASE_URL: 'baseUrl',
            SCRIPTS: 'scripts',
        };
    }

    /**
     * Add the stylesheets
     * 
     * @param   object stylesheets 
     * @returns this
     */
    stylesheets(stylesheets) {
        this.dataList.stylesheets = stylesheets
        return this;
    }

    /**
     * Add base url
     * 
     * @param   string baseUrl 
     * @returns this
     */
    baseUrl(baseUrl) {
        this.dataList.baseUrl = baseUrl;

        return this;
    }

    /**
     * Add app direction 
     * 
     * @param   string direction 
     * @returns this
     */
    appDirection(direction) {
        this.dataList.appDirection = direction;

        return this;
    }

    /**
     * Add app name
     * 
     * @param   string appName 
     * @returns this
     */
    appName(appName) {
        this.dataList.appName = appName;

        return this;
    }


    /**
     * Facebook app id
     * 
     * @param   integer  
     * @returns this
     */
    facebookAppId(appId) {
        this.dataList.facebookAppId = appId;

        return this;
    }

    /**
     * Add locale code
     * 
     * @param   string localeCode 
     * @returns this
     */
    localeCode(localeCode) {
        this.dataList.localeCode = localeCode;

        return this;
    }

    /**
     * Add the scripts
     * 
     * @param   array scripts 
     * @returns this
     */
    scripts(scripts) {
        this.dataList.scripts = scripts;

        return this;
    }

    /**
     * Set page title
     * 
     * @param   string title
     * @returns this
     */
    title(title) {
        return this.meta('title', title);
    }

    /**
     * Add new meta to the meta list
     * 
     * @param   string metaName
     * @param   string value
     * @returns this
     */
    meta(metaName, value) {
        this.dataList.meta[metaName] = value;
        return this;
    }

    /**
     * Compile html content
     * 
     * @returns string
     */
    compile() {
        return this.toString();
    }

    /**
     * Get the output of the final string
     * 
     * @returns string
     */
    toString() {
        this.collectAndConvert();
        return this.finalHtml;
    }

    /**
     * Collect all data then start converting it for actual html code
     * 
     * @returns void
     */
    collectAndConvert() {
        for (let original in this.conversionMap) {
            let value = this.dataList[this.conversionMap[original]];
            this.replace(original, value);
        }

        // add main stylesheet and favicons
        this.replace('STYLESHEETS', this.link('stylesheet', this.dataList.stylesheets.appSheet, {
            id: 'app-style',
        }));

        // just for now it will be only one fav icon
        if (!Is.empty(this.dataList.stylesheets.favicons)) {
            for (let favicon of this.dataList.stylesheets.favicons) {
                this.replace('FAVICONS', this.link('shortcut icon', favicon));
            }
        } else {
            this.replace('FAVICONS', '');
        }

        // replace external stylesheets
        let stylesheets = `<script id="lcss">${this.cssPreloader}`;
        for (let stylesheet of this.dataList.stylesheets.externals) {
            stylesheets += `lcss('${stylesheet}');`;
        }

        // remove the script itself
        stylesheets += `var m = document.getElementById('lcss');m.parentNode.removeChild(m);</script>`;

        this.replace('EXTERNAL_STYLESHEETS', stylesheets);
        // let stylesheets = '';
        // for (let stylesheet of this.dataList.stylesheets.externals) {
        //     stylesheets += this.link('preload', stylesheet);
        // }

        // this.replace('EXTERNAL_STYLESHEETS', stylesheets + `<script>${this.cssPreloader}</script>`);

        // now update the meta
        let appMetaOptions = appConfig.meta;

        this.metaTags = [];

        this.listOfPropertiesTypes = {
            name: ['keywords', 'description', 'twitter:card'],
            property: true, // all
        }

        let title = this.dataList.meta.title;

        // title
        this.metaTags.push({
            tag: 'title',
            value: title,
        });

        let titleProperties = [];

        if (appMetaOptions.graph) {
            titleProperties.push('og:title');
        }

        if (appMetaOptions.twitter) {
            titleProperties.push('twitter:title');
        }

        for (let property of titleProperties) {
            this.metaTags.push({
                tag: 'meta',
                property: property,
                value: title,
            });
        }

        // add site name property
        if (appMetaOptions.graph) {
            this.metaTags.push({
                tag: 'meta',
                property: 'og:site_name',
                value: this.dataList.appName,
            });
        }

        // facebook app id
        if (appMetaOptions.facebookAppId) {
            this.metaTags.push({
                tag: 'meta',
                property: 'fb:app_id',
                value: this.dataList.facebookAppId,
            })
        }

        // url
        if (appMetaOptions.url) {
            let propertiesList = [];

            if (appMetaOptions.graph) {
                propertiesList.push('og:url');
            }

            if (appMetaOptions.twitter) {
                propertiesList.push('twitter:url');
            }

            for (let property of propertiesList) {
                this.metaTags.push({
                    tag: 'meta',
                    property: property,
                    value: this.dataList.baseUrl,
                });
            }
        }

        // description
        if (appMetaOptions.description) {
            let description = appMetaOptions.description[this.dataList.localeCode];

            if (Is.boolean(description)) {
                description = '';
            }

            let propertiesList = ['description'];

            if (appMetaOptions.graph) {
                propertiesList.push('og:description');
            }

            if (appMetaOptions.twitter) {
                propertiesList.push('twitter:description');
            }

            for (let property of propertiesList) {
                this.metaTags.push({
                    tag: 'meta',
                    property: property,
                    value: description,
                });
            }
        }

        // keywords
        if (appMetaOptions.keywords) {
            let keywords = appMetaOptions.keywords[this.dataList.localeCode];

            if (Is.boolean(keywords)) {
                keywords = '';
            }

            this.metaTags.push({
                tag: 'meta',
                property: 'keywords',
                value: keywords,
            });
        }

        // image
        if (appMetaOptions.image) {
            let propertiesList = ['image'];

            if (appMetaOptions.graph) {
                propertiesList.push('og:image');
            }

            if (appMetaOptions.twitter) {
                propertiesList.push('twitter:image');
            }

            for (let property of propertiesList) {
                this.metaTags.push({
                    tag: 'meta',
                    property: property,
                    value: '',
                });
            }
        }

        // twitter card
        if (appMetaOptions.twitter && appMetaOptions.twitterCard) {
            this.metaTags.push({
                tag: 'meta',
                property: 'twitter:card',
                value: appMetaOptions.twitterCard,
            });
        }

        // start creating the meta tags text
        let metaContent = '';
        for (let meta of this.metaTags) {
            if (meta.tag == 'title') {
                metaContent += `<title>${meta.value}</title>`;
            } else if (meta.tag == 'meta') {
                let metaProperty = this.listOfPropertiesTypes.name.includes(meta.property) ? 'name' : 'property';
                metaContent += `<meta ${metaProperty}="${meta.property}" content="${meta.value}" />`;
            }
        }

        this.finalHtml = this.finalHtml.replace('META_TAGS', metaContent);
    }

    /**
     * Replace the given placeholder for the given value
     * 
     * @param {string} placeholder 
     * @param {string} value 
     */
    replace(placeholder, value) {
        this.finalHtml = this.finalHtml.replace(placeholder, value);
    }

    /** 
     * Get the link tag for the given info
     * 
     * @param   string type
     * @param   string href
     * @param   object
     * @returns string
    */
    link(type, href, attributes = {}) {
        attributes.href = href;
        attributes.rel = type;

        if (type == 'preload') {
            attributes.as = 'style';
            attributes.onload = `this.onload=null;this.rel='stylesheet'`;
        }

        let flattenedAttributes = '';

        for (let attribute in attributes) {
            flattenedAttributes += `${attribute}="${attributes[attribute]}"`;
        }

        return `<link ${flattenedAttributes} />`;
    }
}
module.exports = new HTMLBuilder;