/**
@UCF @param {"prop":"JsChrome.DOMContentLoaded","ucfobj":true,"disable":true} @UCF
*/
(async () => { var
    // -- Sidebar Tabs Settings -->
    ID = "ucf_sidebar_tabs",
    [
        st_bookmarks,
        st_history,
        st_downloads,
        st_addons,
        st_sites,
        st_name,
        st_tooltip,
        st_tooltip_button,
    ] = await UcfPrefs.formatMessages("sidebar_tabs.ftl", [
        "st-bookmarks",
        "st-history",
        "st-downloads",
        "st-addons",
        "st-sites",
        "st-name",
        "st-tooltip",
        "st-tooltip-button",
    ]),
    TABS = [
        {
            label: st_bookmarks.value,
            src: "chrome://browser/content/places/bookmarksSidebar.xhtml",
        },
        {
            label: st_history.value,
            src: "chrome://browser/content/places/historySidebar.xhtml",
        },
        {
            label: st_downloads.value,
            src: "about:downloads",
        },
        {
            label: st_addons.value,
            src: "about:addons",
            attributes: 'type="content" disableglobalhistory="true" context="contentAreaContextMenu" tooltip="aHTMLTooltip" autocompletepopup="PopupAutoComplete" remote="false" maychangeremoteness="true" ',
        },
        {
            label: st_sites.value,
            src: "https://github.com/VitaliyVstyle/VitaliyVstyle.github.io",
            attributes: 'messagemanagergroup="webext-browsers" type="content" disableglobalhistory="true" context="contentAreaContextMenu" tooltip="aHTMLTooltip" autocompletepopup="PopupAutoComplete" remote="true" maychangeremoteness="true" ',
            menu: {
                label: "Open in Sidebar Tabs",
                icon: `resource://${ID}`,
            }
        },
    ],
    NAME = st_name.value,
    TOOLTIP = st_tooltip.value,
    TOOLTIP_BUTTON = st_tooltip_button.value,
    START = true, // Placement
    WIDTH = 350,
    AUTO_HIDE = true, // Auto hide
        SHOWDELAY = 300,
        HIDEDELAY = 2000,
        MIN_WIDTH = 10,
        SHOW_HIDE = true,
    HIDE_FULLSCREEN = true, // Hide in full screen mode
    HIDE_HEADER = false,
    PADDING_FOR_VBAR = true,
    KEY = "KeyB_true_true_false", // Keyboard shortcut for to switch Sidebar Tabs - code ctrlKey altKey shiftKey
    SELECTOR = "#context-sep-open",
    // <-- Sidebar Tabs Settings --
    popup,
    showing = (e, g) => (e.target != popup || g.webExtBrowserType === "popup"
    || (g.isTextSelected || g.onEditable || g.onPassword || g.onImage || g.onVideo || g.onAudio || g.inFrame) && !g.linkURL),
    hiding = e => (e.target != popup);
(this[ID] = {
    last_open: "sidebar_tabs_last_open",
    last_index: "sidebar_tabs_last_index",
    toolbox_width: "sidebar_tabs_toolbox_width",
    book_url: "chrome://browser/content/places/bookmarksSidebar.xhtml",
    book_aIndex: null,
    eventListeners: new Map(),
    eventCListeners: [],
    urlsMap: new Map(),
    timer: null,
    showTimer: null,
    hideTimer: null,
    _visible: false,
    isMouseOver: false,
    isPanel: false,
    init() {
        var open = this._open = UcfPrefs.getPref(this.last_open, true);
        var docElm = document.documentElement;
        docElm.setAttribute("sidebar_tabs_start", START);
        docElm.setAttribute("sidebar_tabs_auto_hide", AUTO_HIDE);
        windowUtils.loadSheetUsingURIString(`data:text/css;charset=utf-8,${encodeURIComponent(`
#st_toolbox {
background-color: Field !important;
background-image: linear-gradient(var(--toolbar-bgcolor), var(--toolbar-bgcolor)) !important;
color: var(--toolbar-color, FieldText) !important;
overflow: hidden !important;
border-inline-${START ? "end" : "start"}: 1px solid var(--chrome-content-separator-color, ThreeDShadow) !important;
#st_header {
padding: 6px !important;
padding-bottom: 3px !important;
flex-direction: ${START ? "row" : "row-reverse"} !important;
${HIDE_HEADER ? "display: none !important;" : ""}
& > label {
white-space: nowrap !important;
}
}
[flex="1"] {
flex: 1 !important;
}
tabs > spacer {
display: none !important;
}
tabs, tabpanels, tab, label {
appearance: none !important;
background-color: transparent !important;
color: inherit !important;
margin: 0 !important;
padding: 0 !important;
border: none !important;
}
tabs {
justify-content: ${START ? "start" : "end"} !important;
}
browser[id^=st_browser_] {
color-scheme: light dark;
background-color: Field !important;
color: FieldText !important;
}
tab {
margin: 0 !important;
padding-inline: 6px !important;
padding-block: 3px !important;
outline: none !important;
border-block: 2px solid transparent !important;
--default-focusring: none !important;
}
tab:hover {
border-bottom-color: color-mix(in srgb, currentColor 30%, transparent) !important;
}
tab[selected="true"] {
border-bottom-color: color-mix(in srgb, currentColor 80%, transparent) !important;
}
}
#st_splitter {
appearance: none !important;
cursor: ew-resize;
width: 6px !important;
position: relative !important;
z-index: calc(var(--browser-area-z-index-tabbox, 2) + 2) !important;
background-color: transparent !important;
border: none !important;
margin: 0 !important;
opacity: 0 !important;
margin-inline-${START ? "start" : "end"}: -6px !important;
}
#ucf-additional-vertical-container[v_vertical_bar_start="true"] {
order: 0 !important;
}
#ucf-additional-vertical-container[v_vertical_bar_start="false"] {
order: 102 !important;
}
:root:is(${HIDE_FULLSCREEN ? "[inFullscreen]," : ""}[inDOMFullscreen],[chromehidden~="extrachrome"]) :is(#st_vbox_container,#st_toolbox,#st_splitter) {
visibility: collapse !important;
}
${AUTO_HIDE ? `#st_vbox_container {
position: relative !important;
width: 0 !important;
overflow: visible !important;
transition-property: margin-top !important;
transition-timing-function: linear !important;
transition-duration: .2s !important;
transition-delay: 0s !important;
order: ${START ? "0" : "100"} !important;
}
#st_hbox_container {
position: absolute !important;
z-index: calc(var(--browser-area-z-index-tabbox, 2) + 2) !important;
pointer-events: none !important;
top: 0 !important;
bottom: 0 !important;
${START ? `inset-inline-start: 0 !important;
justify-content: start !important;
margin-inline-start: calc(-1 * (var(--v-sidebar-tabs-width) - ${MIN_WIDTH}px)) !important;`
: `inset-inline-end: 0 !important;
flex-direction: row-reverse !important;
justify-content: end !important;
margin-inline-end: calc(-1 * (var(--v-sidebar-tabs-width) - ${MIN_WIDTH}px)) !important;`}
opacity: 0 !important;
transition-property: margin-inline, opacity !important;
transition-timing-function: linear, step-start !important;
transition-duration: .2s, 0s !important;
transition-delay: 0s, .2s !important;
}
#st_toolbox {
transition-property: width !important;
transition-timing-function: linear !important;
transition-duration: .2s !important;
transition-delay: 0s !important;
}
#st_splitter {
cursor: default !important;
}
#st_vbox_container[sidebar_tabs_visible^=visible] #st_hbox_container {
width: var(--v-sidebar-tabs-tabpanels-width, 80vw) !important;
margin-inline: 0 !important;
opacity: 1 !important;
transition-delay: 0s !important;
}
#st_vbox_container[sidebar_tabs_visible^=visible] #st_splitter {
cursor: ew-resize !important;
}
:root[v_vertical_bar_start="true"][sidebar_tabs_start="true"]:is([v_vertical_bar_visible^="visible"],[v_vertical_bar_visible^="visible"][sidebar_tabs_visible=visible]) #st_vbox_container #st_hbox_container {
width: calc(var(--v-sidebar-tabs-tabpanels-width, 80vw) - var(--v-vertical-bar-width, 0px)) !important;
margin-inline-start: var(--v-vertical-bar-width, 0px) !important;
opacity: 1 !important;
transition-delay: 0s !important;
}
:root[v_vertical_bar_start="false"][sidebar_tabs_start="false"]:is([v_vertical_bar_visible^="visible"],[v_vertical_bar_visible^="visible"][sidebar_tabs_visible=visible]) #st_vbox_container #st_hbox_container {
width: calc(var(--v-sidebar-tabs-tabpanels-width, 80vw) - var(--v-vertical-bar-width, 0px)) !important;
margin-inline-end: var(--v-vertical-bar-width, 0px) !important;
opacity: 1 !important;
transition-delay: 0s !important;
}
#st_hbox_container > * {
pointer-events: auto !important;
}
:root[BookmarksToolbarOverlapsBrowser] #st_vbox_container {
margin-top: var(--bookmarks-toolbar-overlapping-browser-height, var(--bookmarks-toolbar-height)) !important;
}
:root[v_top_bar_overlaps="true"] #st_vbox_container {
margin-top: var(--v-top-bar-overlaps) !important;
}
:root[BookmarksToolbarOverlapsBrowser][v_top_bar_overlaps="true"] #st_vbox_container {
margin-top: calc(var(--bookmarks-toolbar-overlapping-browser-height, var(--bookmarks-toolbar-height)) + var(--v-top-bar-overlaps)) !important;
}`
: `:root[BookmarksToolbarOverlapsBrowser] :is(#st_toolbox,#st_splitter) {
margin-top: var(--bookmarks-toolbar-overlapping-browser-height, var(--bookmarks-toolbar-height)) !important;
}
:root[v_top_bar_overlaps="true"] :is(#st_toolbox,#st_splitter) {
margin-top: var(--v-top-bar-overlaps) !important;
}
:root[BookmarksToolbarOverlapsBrowser][v_top_bar_overlaps="true"] :is(#st_toolbox,#st_splitter) {
margin-top: calc(var(--bookmarks-toolbar-overlapping-browser-height, var(--bookmarks-toolbar-height)) + var(--v-top-bar-overlaps)) !important;
}
${PADDING_FOR_VBAR ? `:root[v_vertical_bar_start="true"][sidebar_tabs_start="true"][v_vertical_bar_visible^="visible"] #st_toolbox {
padding-inline-start: var(--v-vertical-bar-width, 0px) !important;
}
:root[v_vertical_bar_start="false"][sidebar_tabs_start="false"][v_vertical_bar_visible^="visible"] #st_toolbox {
padding-inline-end: var(--v-vertical-bar-width, 0px) !important;
}` : ""}
#st_toolbox, #st_splitter {
order: 0 !important;
transition-property: margin-top !important;
transition-timing-function: linear !important;
transition-duration: .2s !important;
transition-delay: 0s !important;
}
#st_toolbox {
transition-property: margin-top, padding-inline !important;
}
${START ? ""
: `#st_toolbox {
order: 101 !important;
}
#st_splitter {
order: 100 !important;
}`}`}`)}`, windowUtils.USER_SHEET);
        var str = `<vbox id="st_toolbox" class="chromeclass-extrachrome" hidden="true">
                <hbox id="st_header" align="center">
                    <label>${NAME}</label>
                    <spacer flex="1"/>
                    <toolbarbutton id="st_close_button" class="close-icon tabbable" tooltiptext="${TOOLTIP}"/>
                </hbox>
                <tabbox id="st_tabbox" flex="1">
                    <tabs id="st_tabs">
                        ${this.getTabs()}
                    </tabs>
                    <tabpanels id="st_tabpanels" flex="1">
                        ${this.panels_str}
                    </tabpanels>
                </tabbox>
            </vbox>
            <splitter id="st_splitter" class="chromeclass-extrachrome" resizebefore="sibling" resizeafter="none" hidden="true"/>`;
        if (AUTO_HIDE)
            str = `<vbox id="st_vbox_container" class="chromeclass-extrachrome" hidden="true">
                    <hbox id="st_hbox_container" flex="1">
                        ${str}
                        <vbox id="st_uncontrolled"></vbox>
                    </hbox>
                </vbox>`;
        var fragment = this.fragment = MozXULElement.parseXULToFragment(str);
        var importNode = document.importNode(fragment, true);
        var toolbox = this.toolbox = importNode.querySelector("#st_toolbox");
        this.splitter = importNode.querySelector("#st_splitter");
        for (let browser of toolbox.querySelectorAll("[id^=st_browser_]"))
            this[browser.id] = browser;
        this.st_tabpanels = toolbox.querySelector("#st_tabpanels");
        this.st_tabbox = toolbox.querySelector("#st_tabbox");
        this.st_close_btn = toolbox.querySelector("#st_close_button");
        document.querySelector("#sidebar-box, #sidebar-main").before(importNode);
        this.st_tabbox.handleEvent = function() {};
        this.st_tabbox.selectedIndex = this.aIndex = UcfPrefs.getPref(this.last_index, 0);
        delete this.panels_str;
        if (open)
            this.open();
        this.addListener("window_keydown", window, "keydown", this);
        if (this.menus.length) {
            popup = document.querySelector("#contentAreaContextMenu");
            this.addListener("popup_popupshowing", popup, "popupshowing", this);
        }
        var shb = this.show_hide = AUTO_HIDE && SHOW_HIDE;
        if (!(ID in UcfPrefs.customSandbox))
            Cu.evalInSandbox(`
                (this["${ID}"] = {
                    async init() {
                        Services.io.getProtocolHandler("resource")
                        .QueryInterface(Ci.nsIResProtocolHandler)
                        .setSubstitution("${ID}", Services.io.newURI("data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><g style='fill:context-fill rgb(142, 142, 152);fill-opacity:context-fill-opacity;'><path d='M2 2C.892 2 0 2.89 0 4v9.1a2 2 0 0 0 2 2h12c1.1 0 2-.9 2-2V4a2 2 0 0 0-2-2Zm0 1h12c.6 0 1 .45 1 1v9.1c0 .5-.5.9-1 .9H1.99c-.55 0-.99-.4-.99-.9V4c0-.55.45-1 1-1Z'/> <rect width='14' height='1' x='1' y='6'/> <rect width='1' height='7' x='5' y='7'/></g></svg>"));
                        CustomizableUI.createWidget({
                            id: "${ID}",
                            label: "${NAME}",
                            tooltiptext: "${TOOLTIP_BUTTON}",
                            defaultArea: CustomizableUI.AREA_NAVBAR,
                            localized: false,
                            onCreated(btn) {
                                btn.style.setProperty("list-style-image", 'url("resource://${ID}")');
                                btn.checked = btn.ownerGlobal.ucf_custom_scripts_win?.["${ID}"]?._open ?? UcfPrefs.getPref("${this.last_open}", true);
                            },
                            onCommand(e) {
                               ${shb
                                ? `var st = e.view.ucf_custom_scripts_win["${ID}"];
                                    if (!e.shiftKey) st.showHide();
                                    else st.toggle();`
                                : `e.view.ucf_custom_scripts_win["${ID}"].toggle();`}
                            },
                        });
                    },
                }).init();
            `, UcfPrefs.customSandbox);
        setUnloadMap(ID, this.destructor, this);
    },
    getTabs() {
        var str = panels_str = "", menus = [];
        for (let [ind, {label, src, attributes, menu}] of TABS.entries()) {
            str += `<tab id="st_tab_${ind}" label="${label}"/>`;
            panels_str += `<vbox id="st_container_${ind}" flex="1">
                <browser id="st_browser_${ind}" flex="1" autoscroll="false" ${attributes || ""}/>
            </vbox>`;
            this.urlsMap.set(ind, {url: src});
            if (menu) {
                menu.aIndex = ind;
                menus.push(menu);
            }
            if (src === this.book_url)
                this.book_aIndex = ind;
        }
        this.panels_str = panels_str;
        this.menus = menus;
        return str;
    },
    async loadURI(browser, url, options = {}) {
        if (browser.getAttribute("type") !== "content")
            browser.setAttribute("src", url);
        else {
            options.triggeringPrincipal ||= Services.scriptSecurityManager.getSystemPrincipal();
            browser.loadURI(Services.io.newURI(url), options);
        }
    },
    select(e, aIndex) {
        if (e.target != this.st_tabpanels || (aIndex = this.st_tabbox.selectedIndex) == this.aIndex) return;
        var browser = this[`st_browser_${this.aIndex}`];
        this.loadURI(browser, "about:blank");
        this.aIndex = aIndex;
        UcfPrefs.setPrefs(this.last_index, aIndex);
        var width = `${UcfPrefs.getPref(`${this.toolbox_width}${aIndex}`, WIDTH)}px`;
        document.documentElement.style.setProperty("--v-sidebar-tabs-width", width);
        this.toolbox.style.width = width;
        browser = this[`st_browser_${aIndex}`], {url, options} = this.urlsMap.get(aIndex);
        this.loadURI(browser, url, options);
    },
    open() {
        this.toolbox.hidden = this.splitter.hidden = false;
        var {aIndex, book_aIndex} = this;
        var width = `${UcfPrefs.getPref(`${this.toolbox_width}${aIndex}`, WIDTH)}px`;
        document.documentElement.style.setProperty("--v-sidebar-tabs-width", width);
        this.toolbox.style.width = width;
        this.addListener("st_tabpanels_select", this.st_tabpanels, "select", this);
        this.addListener("splitter_mousedown", this.splitter, "mousedown", this);
        this.addListener("st_close_btn_command", this.st_close_btn, "command", this);
        if (book_aIndex !== null)
            this.addListener("st_browser_domcontload", this[`st_browser_${book_aIndex}`], "DOMContentLoaded", this);
        if (AUTO_HIDE) {
            let st_vbox = this.st_vbox_container ||= this.toolbox.parentElement.parentElement;
            st_vbox.hidden = false;
            this.addListener("st_vbox_mouseenter", st_vbox, "mouseenter", this);
            this.addListener("st_vbox_mouseleave", st_vbox, "mouseleave", this);
            this.addListener("st_vbox_dragenter", st_vbox, "dragenter", this);
        }
        var browser = this[`st_browser_${aIndex}`], {url, options} = this.urlsMap.get(aIndex);
        this.loadURI(browser, url, options);
        UcfPrefs.setPrefs(this.last_open, true);
        this._open = true;
    },
    toggle() {
        if (!this._open)
            this.open();
        else {
            let {aIndex, book_aIndex} = this;
            this.delListener("st_tabpanels_select");
            this.delListener("splitter_mousedown");
            this.delListener("st_close_btn_command");
            if (book_aIndex !== null)
                this.delListener("st_browser_domcontload");
            this.toolbox.hidden = this.splitter.hidden = true;
            if (AUTO_HIDE) {
                if (this._visible) {
                    this.isMouseOver = false;
                    this.isPanel = false;
                    this.hideToolbar(true);
                }
                this.delListener("st_vbox_mouseenter");
                this.delListener("st_vbox_mouseleave");
                this.delListener("st_vbox_dragenter");
                this.st_vbox_container.hidden = true;
            }
            let browser = this[`st_browser_${aIndex}`];
            this.loadURI(browser, "about:blank");
            UcfPrefs.setPrefs(this.last_open, false);
            this._open = false;
        }
        this.togglebutton();
    },
    togglebutton() {
        if (this.button ||= CustomizableUI.getWidget(ID)?.forWindow(window).node)
            this.button.checked = this._open;
    },
    setPanel(aIndex, url, options = {}) {
        try {
            let browser = this[`st_browser_${aIndex}`];
            if (!browser || !/^(?:https?|ftp|chrome|about|moz-extension|file):/.test(url)) throw "Missing or invalid arguments!";
            if (options.userContextId != browser.getAttribute("usercontextid")) {
                let newbrowser = (this[`cn_browser_${aIndex}`] ||= this.fragment.querySelector(`#st_browser_${aIndex}`)).cloneNode(false);
                if ("userContextId" in options)
                    newbrowser.setAttribute("usercontextid", options.userContextId);
                browser.replaceWith(newbrowser);
                browser = this[`st_browser_${aIndex}`] = newbrowser;
            }
            this.urlsMap.set(aIndex, {url, options});
            if (this.st_tabbox.selectedIndex !== aIndex) {
                this.st_tabbox.selectedIndex = aIndex;
                if (!this._open) {
                    this.aIndex = aIndex;
                    this.open();
                    this.togglebutton();
                }
            } else {
                if (!this._open) {
                    this.open();
                    this.togglebutton();
                } else
                    this.loadURI(browser, url, options);
            }
            if (AUTO_HIDE) {
                this.isPanel = true;
                if (!this._visible)
                    this.showToolbar(true);
            }
        } catch (e) {console.error(e)}
    },
    click(e) {
        var url = !(e.shiftKey || e.button === 1) ? (gContextMenu?.linkURI?.displaySpec || this.getCurrentURL()) : this.readFromClipboard();
        var {staIndex} = e.currentTarget;
        var userContextId = gContextMenu?.contentData?.userContextId;
        var triggeringPrincipal = gContextMenu?.principal;
        this.setPanel(staIndex, url, {...(userContextId ? {userContextId} : {}), ...(triggeringPrincipal ? {triggeringPrincipal} : {})});
    },
    showHide() {
        if (!this._visible) {
            if (!this._open) {
                this.open();
                this.togglebutton();
            }
            this.isPanel = true;
            this.showToolbar(true);
        } else {
            this.isPanel = false;
            this.isMouseOver = false;
            this.hideToolbar(true);
        }
    },
    mousedown() {
        this.splitter.addEventListener("mousemove", this);
        this.splitter.addEventListener("mouseup", this, { once: true });
    },
    mousemove() {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            var width = this.toolbox.getBoundingClientRect().width;
            document.documentElement.style.setProperty("--v-sidebar-tabs-width", `${width}px`);
            UcfPrefs.setPrefs(`${this.toolbox_width}${this.aIndex}`, width);
        }, 500);
    },
    mouseup(e) {
        switch (e.currentTarget) {
            case this.splitter:
                this.splitter.removeEventListener("mousemove", this);
                break;
            default:
                if (e.button) return;
                this.isPanel = false;
                this.hideToolbar(true);
                break;
        }
    },
    keydown(e) {
        if (KEY === `${e.code}_${e.getModifierState("Control")}_${e.altKey}_${e.shiftKey}`) {
            if (this.show_hide) this.showHide();
            else this.toggle();
        }
    },
    command() {
        this.toggle();
    },
    handleEvent(e) {
        this[e.type](e);
    },
    mouseenter(e) {
        switch (e.currentTarget) {
            case this.st_vbox_container:
                this.isMouseOver = true;
                if (!this._visible)
                    this.showToolbar();
                break;
            default:
                this.isMouseOver = false;
                this.hideToolbar();
                break;
        }
    },
    dragenter(e) {
        switch (e.currentTarget) {
            case this.st_vbox_container:
                this.isMouseOver = true;
                if (!this._visible)
                    this.showToolbar();
                break;
            default:
                this.isMouseOver = false;
                this.hideToolbar(true);
                break;
        }
    },
    mouseleave() {
        clearTimeout(this.showTimer);
    },
    DOMContentLoaded(e) {
        var doc = e.target;
        if (doc?.documentURI !== this.book_url) return;
        doc.querySelector("#sidebar-panel-header")?.style.setProperty("display", "none", "important");
    },
    showToolbar(nodelay) {
        clearTimeout(this.showTimer);
        var onTimeout = () => {
            this._visible = true;
            var docElm = document.documentElement;
            var tabpanels = this.tabpanels ||= gBrowser.tabpanels;
            var {st_vbox_container} = this;
            docElm.style.setProperty("--v-sidebar-tabs-tabpanels-width", `${tabpanels.getBoundingClientRect().width}px`);
            st_vbox_container.setAttribute("sidebar_tabs_visible", "visible");
            docElm.setAttribute("sidebar_tabs_visible", "visible");
            this.addListener("tabpanels_mouseenter", tabpanels, "mouseenter", this);
            this.addListener("tabpanels_dragenter", tabpanels, "dragenter", this);
            this.addListener("tabpanels_mouseup", tabpanels, "mouseup", this);
        };
        if (!nodelay) this.showTimer = setTimeout(onTimeout, SHOWDELAY);
        else onTimeout();
    },
    hideToolbar(nodelay) {
        clearTimeout(this.hideTimer);
        var docElm = document.documentElement;
        var {st_vbox_container} = this;
        st_vbox_container.setAttribute("sidebar_tabs_visible", "visible_hidden");
        docElm.setAttribute("sidebar_tabs_visible", "visible_hidden");
        var onTimeout = () => {
            if (this.isMouseOver || this.isPanel) return;
            this.delListener("tabpanels_mouseenter");
            this.delListener("tabpanels_dragenter");
            this.delListener("tabpanels_mouseup");
            st_vbox_container.setAttribute("sidebar_tabs_visible", "hidden");
            docElm.setAttribute("sidebar_tabs_visible", "hidden");
            this._visible = false;
        };
        if (!nodelay) this.hideTimer = setTimeout(onTimeout, HIDEDELAY);
        else onTimeout();
    },
    addListener(key, elm, type, listener) {
        elm.addEventListener(type, listener);
        this.eventListeners.set(key, {elm, type, listener});
    },
    delListener(key) {
        var {eventListeners} = this, getkey = eventListeners.get(key);
        if (!getkey) return;
        var {elm, type, listener} = getkey;
        elm.removeEventListener(type, listener);
        eventListeners.delete(key);
    },
    addCListener(elm, type, listener) {
        elm.addEventListener(type, listener);
        this.eventCListeners.push({elm, type, listener});
    },
    popupshowing(e) {
        if (showing(e, gContextMenu)) return;
        var contextsel = popup.querySelector(`:scope > ${SELECTOR}`) || popup.querySelector(":scope > menuseparator:last-of-type");
        var fragment = document.createDocumentFragment();
        var itemId = 0;
        this.menus.forEach(item => {
            var {label, icon, aIndex} = item;
            var mitem = document.createXULElement("menuitem");
            mitem.id = `ucf-sidebar-tabs-${++itemId}`;
            mitem.className = "menuitem-iconic ucf-sidebar-tabs";
            mitem.setAttribute("label", label);
            if (icon)
                mitem.style.cssText = `list-style-image:url("${icon}");-moz-context-properties:fill,stroke,fill-opacity;stroke:currentColor;fill:currentColor;fill-opacity:var(--toolbarbutton-icon-fill-opacity,.8);`;
            mitem.staIndex = aIndex;
            fragment.append(mitem);
            this.addCListener(mitem, "click", this);
        });
        contextsel.before(fragment);
        this.popupshowing = this.itemsShow;
        this.popuphiding = this.itemsHide;
        this.addListener("popup_popuphiding", popup, "popuphiding", this);
    },
    itemsShow(e) {
        if (showing(e, gContextMenu)) return;
        for (let {elm} of this.eventCListeners)
            elm.hidden = false;
    },
    itemsHide(e) {
        if (hiding(e)) return;
        for (let {elm} of this.eventCListeners)
            elm.hidden = true;
    },
    getCurrentURL() {
        var url = gBrowser.selectedBrowser.currentURI.displaySpec;
        try {
            let _url = ReaderMode.getOriginalUrl(url);
            if (_url)
                url = Services.io.newURI(_url).displaySpec;
        } catch {}
        return url;
    },
    readFromClipboard() {
        try {
            let trans = Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable);
            trans.init(docShell.QueryInterface(Ci.nsILoadContext));
            trans.addDataFlavor("text/plain");
            let {clipboard} = Services, data = {};
            clipboard.getData(trans, clipboard.kGlobalClipboard);
            trans.getTransferData("text/plain", data);
            if (data.value)
                return data.value.QueryInterface(Ci.nsISupportsString).data.trim();
        } catch {}
        return "";
    },
    destructor() {
        this.eventListeners.forEach(({elm, type, listener}) => {
            elm.removeEventListener(type, listener);
        });
        for (let {elm, type, listener} of this.eventCListeners)
            elm.removeEventListener(type, listener);
    },
}).init();})();
