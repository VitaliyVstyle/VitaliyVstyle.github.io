export var UcfStylesScripts = {
    /** ************************▼ Settings ▼************************ */
    /**
    * Styles Settings:
    * @param {String} type: (required)
    *    style rights AGENT_SHEET,  AUTHOR_SHEET or USER_SHEET
    * @param {String} path: (required, or ospath)
    *    path to file from folder custom_styles
    * @param {String} ospath: (optional, required for isos, ver)
    *    path to file from folder custom_styles, replace %OS% with the current OS
    * @param {Array} isos: (optional)
    *    e.g. ["linux", "windows"]
    * @param {Object} ver: (optional)
    * @param {Int} ver.min: (optional)
    *    compare with <= Services.appinfo.platformVersion
    * @param {Int} ver.max: (optional)
    *    compare with >= Services.appinfo.platformVersion
    */
    styleschrome: [ // For documents of all windows [ChromeOnly]
        { path: "main_author.css", type: "AUTHOR_SHEET", }, // Main interface AUTHOR_SHEET
        { path: "main.css", type: "USER_SHEET", }, // Main interface
        { path: "appbutton.css", type: "USER_SHEET", }, // Appbutton show classic menu
        { ver: {max: 138}, ospath: "menu_max138.css", type: "USER_SHEET", }, // Menu
        { ver: {min: 139}, ospath: "menu.css", type: "USER_SHEET", }, // Menu
        { path: "common_win.css", type: "USER_SHEET", },
        { path: "special_widgets.css", type: "USER_SHEET", }, // Special Widgets
    ],
    stylesall: [ // For all documents
        { path: "common_agent.css", type: "AGENT_SHEET", }, // Scrollbar, tooltips ...
        { path: "content_html.css", type: "AUTHOR_SHEET", },
        // { ver: {min: 117}, isos: ["linux"], ospath: "example_all.css", type: "USER_SHEET", }, // Example
    ],
    /**
    * Scripts Settings:
    * @param {String} path: (optional, or ospath or func)
    *    path to the script from the folder custom_scripts
    * @param {String} ospath: (optional, required for isos, ver, module)
    *    path to the script from the folder custom_scripts, replace %OS% with the current OS
    *    for the module: there must be a full address, but if there is %UCFDIR% at the beginning then this will be replaced with chrome://user_chrome_files/content/custom_scripts/
    * @param {RegExp} urlregxp: (optional)
    *    address of the document where the script is run, only For documents of all windows [ChromeOnly]
    * @param {Boolean} ucfobj: (optional)
    *    if true, load the script into a specially created object, not for scripts In the background [System Principal].
    * @param {String} func: (optional)
    *    Function as a string
    * @param {Array} isos: (optional)
    *    e.g. ["linux", "windows"]
    * @param {Object} ver: (optional)
    * @param {Int} ver.min: (optional)
    *    compare with <= Services.appinfo.platformVersion
    * @param {Int} ver.max: (optional)
    *    compare with >= Services.appinfo.platformVersion
    * @param {Boolean | Array} module: (optional)
    *   importESModule e.g. ["importSymbol"], only for scripts In the background [System Principal]
    */
    scriptschrome: { // For browser window document [ChromeOnly]
        domload: [ // By event "DOMContentLoaded"
            { path: "sidebar_tabs.js", ucfobj: true, },// Sidebar Tabs
            { path: "appbutton.js", ucfobj: true, }, // Appbutton show classic menu
        ],
        load: [ // By event "load"
            // { path: "custom_script_win.js", ucfobj: true, },
            { path: "special_widgets.js", ucfobj: true, }, // Special Widgets
            { path: "cleardownloadsbutton.js", ucfobj: true, },
            { path: "menusrestartitems.js", ucfobj: true, },
        ],
    },
    scriptsallchrome: { // For documents of all windows [ChromeOnly]
        domload: [ // By event "DOMContentLoaded"

        ],
        load: [ // By event "load"
            // { path: "custom_script_all_win.js",  ucfobj: true, },
            // { path: "example_places.js", urlregxp: /chrome:\/\/browser\/content\/places\/places\.xhtml/, ucfobj: false, },
        ],
    },
    scriptsbackground: [ // In the background [System Principal]
        { path: "custom_script.js", },
    ],
    /** ************************▲ Settings ▲************************ */
};

export var UcfStylesScriptsChild = {
    /** ************************▼ Content Settings ▼************************ */
    /**
    * Styles Settings:
    * @param {String} type: (required)
    *    style rights AGENT_SHEET,  AUTHOR_SHEET or USER_SHEET
    * @param {String} path: (required, or ospath)
    *    path to file from folder custom_styles
    * @param {String} ospath: (optional, required for isos, ver)
    *    path to file from folder custom_styles, replace %OS% with the current OS
    * @param {Array} isos: (optional)
    *    e.g. ["linux", "windows"]
    * @param {Object} ver: (optional)
    * @param {Int} ver.min: (optional)
    *    compare with <= Services.appinfo.platformVersion
    * @param {Int} ver.max: (optional)
    *    compare with >= Services.appinfo.platformVersion
    */
    stylescontent: [
        { path: "content_xhtml.css", type: "USER_SHEET", }, // Service pages
        { ver: {max: 138}, ospath: "menu_max138.css", type: "USER_SHEET", }, // Menu
        { ver: {min: 139}, ospath: "menu.css", type: "USER_SHEET", }, // Menu
    ],
    /**
    * Scripts Settings:
    * @param {String} path: (optional, or ospath or func)
    *    path to the script from the folder custom_scripts
    * @param {String} ospath: (optional, required for isos, ver)
    *    path to the script from the folder custom_scripts, replace %OS% with the current OS
    * @param {RegExp} urlregxp: (optional)
    *    address of the document where the script is run
    * @param {String} func: (optional)
    *    Function as a string
    * @param {Array} isos: (optional)
    *    e.g. ["linux", "windows"]
    * @param {Object} ver: (optional)
    * @param {Int} ver.min: (optional)
    *    compare with <= Services.appinfo.platformVersion
    * @param {Int} ver.max: (optional)
    *    compare with >= Services.appinfo.platformVersion
    */
    scriptscontent: {
        DOMWindowCreated: [ // By event "DOMWindowCreated"

        ],
        DOMContentLoaded: [ // By event "DOMContentLoaded"
            // { path: "example_all_about.js", urlregxp: /^about:/, }, // Example
        ],
        pageshow: [ // By event "pageshow"

        ],
    },
    /** ************************▲ Content Settings ▲************************ */
};
