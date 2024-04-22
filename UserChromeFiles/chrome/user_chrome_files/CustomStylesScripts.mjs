export var UcfStylesScripts = {
    /** ************************▼ Settings ▼************************ */
    /**
    * Styles Settings:
    *   path: path to file from folder custom_styles
    *   type: style rights AGENT_SHEET,  AUTHOR_SHEET or USER_SHEET
    */
    styleschrome: [ // For documents of all windows [ChromeOnly]
        { path: "special_widgets.css", type: "USER_SHEET", }, // <-- Special Widgets
        // { path: "auto_hide_sidebar.css", type: "USER_SHEET", }, // <-- Auto Hide Sidebar
    ],
    stylesall: [ // For all documents
        // { path: "example_all.css", type: "USER_SHEET", }, // <-- Example
    ],
    /**
    * Scripts Settings:
    *   path: path to the script from the folder custom_scripts
    *   urlregxp: The address where the script works in regular expression, only For documents of all windows [ChromeOnly]
    *   ucfobj: true - upload the script to a specially created object or to windows, not used for scripts In the background [System Principal]
    *   func: A function in the form of a string that will be executed when loading
    */
    scriptschrome: { // For browser window document [ChromeOnly]
        domload: [ // By event "DOMContentLoaded"

        ],
        load: [ // By event "load"
            { path: "special_widgets.js", ucfobj: true, }, // <-- Special Widgets
            // { path: "auto_hide_sidebar.js", ucfobj: true, }, // <-- Auto Hide Sidebar
        ],
    },
    scriptsallchrome: { // For documents of all windows [ChromeOnly]
        domload: [ // By event "DOMContentLoaded"

        ],
        load: [ // By event "load"
            // { path: "example_places.js", urlregxp: /chrome:\/\/browser\/content\/places\/places\.xhtml/, ucfobj: false, }, // <-- Example
        ],
    },
    scriptsbackground: [ // In the background [System Principal]
        { path: "custom_script.js", },
    ],
    /** ************************▲ Settings ▲************************ */
};

export var UcfStylesScriptsChild = {
    /** ************************▼ Сontent Settings ▼************************ */
    /**
    * Styles Settings:
    *   path: path to file from folder custom_styles
    *   type: style rights AGENT_SHEET,  AUTHOR_SHEET or USER_SHEET
    */
    stylescontent: [
        // { path: "example_content.css", type: "USER_SHEET", }, // <-- Example
    ],
    /**
    * Scripts Settings:
    *   path: path to the script from the folder custom_scripts
    *   urlregxp: The address where the script works in regular expression
    *   func: A function in the form of a string that will be executed when loading
    */
    scriptscontent: {
        DOMWindowCreated: [ // By event "DOMWindowCreated"

        ],
        DOMContentLoaded: [ // By event "DOMContentLoaded"
            // { path: "example_all_about.js", urlregxp: /about:.*/, }, // <-- Example
        ],
        pageshow: [ // By event "pageshow"
            // { path: "example_downloads.js", urlregxp: /about:downloads/, }, // <-- Example
        ],
    },
    /** ************************▲ Сontent Settings ▲************************ */
};
