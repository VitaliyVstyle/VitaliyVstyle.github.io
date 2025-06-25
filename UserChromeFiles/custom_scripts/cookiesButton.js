/**
@UCF @param {"prop":"JsBackground","force":true} @UCF
@UCF @param {"prop":"JsAllChrome.DOMContentLoaded","ucfobj":true,"urlregxp":"^chrome:\\/\\/browser\\/content\\/preferences\\/dialogs\\/siteDataSettings\\.xhtml"} @UCF
*/
(async (
    id = "ucf-view-cookies-with-right-click",
    label = "Cookies",
    tooltiptext = "Left-click: Toggle Cookies\nShift+Left-click: Delete cookies from the domain of the current page\nMidle-click: Delete cookies from the domain of the current page\nRight-click: Managing cookies",
    image = "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><path style='fill:none;stroke:context-fill rgb(142, 142, 152);stroke-opacity:context-fill-opacity;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;' d='M12.5 10.5v-1h-1v1h1m-4-4h1v1h-1v-1m0 7h1v-1h-1v1m-6-7h1v1h-1v-1m4 4v-1h-1v1h1m-3 3v-1h-1m3-9h1v1h-1v-1M8 .6C8 5 11 8 15.4 8c0 4-3.4 7.4-7.4 7.4S.6 12 .6 8 4 .6 8 .6M12.5 26.5v-1h-1v1h1m-4-4h1v1h-1v-1m0 7h1v-1h-1v1m-6-7h1v1h-1v-1m4 4v-1h-1v1h1m-3 3v-1h-1m3-9h1v1m2-3.5v.5h1V17m2 2.5v1h1v-1h-1m3.5 3h-.5v1h.5m-8.5-3h-1v-1M8 16.6c4 0 7.4 3.4 7.4 7.4S12 31.4 8 31.4.6 28 .6 24 4 16.6 8 16.6'/></svg>",
    interval = 5000, // Update interval after clicking Right-click by button
    noconfirmation = false, // Do not display notifications when removing cookies
    notclosewindow = true, // Do not close the window after removal
    searchshift = false, // When the window is already open, by Shift + Right-click: true - site domain in the search field, false - do not change the search field
    message1 = "Cookies for the current domain have been cleared!",
    message2 = "Missing cookies from the current domain!",

    idw = "SiteDataSettingsDialog",
    typew = "Browser:SiteDataSettings",
    urlSds = "chrome://browser/content/preferences/dialogs/siteDataSettings.xhtml",
    cookiePref = "network.cookie.cookieBehavior",
) => ({
    get getSetInterval() {
        delete this.getSetInterval;
        this.hasinterval = true;
        return this.getSetInterval = this.interval;
    },
    get interval() {
        return setInterval(async () => {
            if (gSiteDataSettings._list.selectedItems.length) return;
            await SiteDataManager.updateSites();
            this.ucf_gSiteDataSettings();
        }, interval);
    },
    get image() {
        var subst = `${id}-img`;
        Services.io.getProtocolHandler("resource")
            .QueryInterface(Ci.nsIResProtocolHandler)
            .setSubstitution(subst, Services.io.newURI(image));
        Services.io.getProtocolHandler("resource")
            .QueryInterface(Ci.nsIResProtocolHandler)
            .setSubstitution(`${subst}-0`, Services.io.newURI(`${image.replace("viewBox='0 0 16 16'", "viewBox='0 16 16 16'")}`));
        Services.prefs.addObserver(cookiePref, this);
        delete this.image;
        return this.image = `resource://${subst}`;
    },
    get showAlert() {
        delete this.showAlert;
        return this.showAlert = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService).showAlertNotification.bind(null, this.image);
    },
    id,
    type: "custom",
    label,
    tooltiptext,
    defaultArea: "nav-bar",
    localized: false,
    onBuild(doc) {
        var btn = doc.createXULElement("toolbarbutton");
        btn.id = id;
        btn.className = "toolbarbutton-1 chromeclass-toolbar-additional badged-button";
        btn.setAttribute("badged", "true");
        btn.setAttribute("constrain-size", "true");
        btn.setAttribute("label", label);
        btn.setAttribute("context", "");
        btn.setAttribute("tooltiptext", tooltiptext);
        this.setStyle(btn);
        btn.onclick = e => {
            if (e.button === 0) {
                if (!e.shiftKey) this.prefToggleNumber(cookiePref, [1, 2, 3, 4, 5, 0]);
                else this.delCookies(doc.defaultView);
            } else if (e.button === 1) this.delCookies(doc.defaultView);
            else if (e.button === 2) {
                e.preventDefault();
                e.stopPropagation();
                this.viewCookies(e);
            }
        };
        return btn;
    },
    init() {
        if (UcfPrefs.customSandbox == globalThis) this.widget = CustomizableUI.createWidget(this);
        else {
            if (window.ucf_gsitedatasettings) {
                if (ucf_gsitedatasettings.sizemode === "maximized") windowRoot.addEventListener("MozUpdateWindowPos", () => maximize(), { once: true, capture: true });
                let docEl = document.documentElement;
                docEl.id = idw;
                docEl.setAttribute("windowtype", typew);
                docEl.setAttribute("persist", "screenX screenY width height sizemode");
                window.focus();
                this.filter();
            }
            window.ucf_gSiteDataSettings = this.ucf_gSiteDataSettings.bind(this);
            setUnloadMap(Symbol(id), this.destructor, this);
            for (let btn of this.removeBtns = document.querySelectorAll("#removeSelected, #removeAll"))
                btn.addEventListener("command", this);
            if (notclosewindow) document.addEventListener("dialogaccept", this);
            if (noconfirmation) Object.assign(gSiteDataSettings, UcfPrefs.dbg
                    .makeGlobalObjectReference(window).executeInGlobal(`({${gSiteDataSettings.saveChanges}})`
                    .replace(/if\s*\(\!SiteDataManager\.promptSiteDataRemoval\(window,\s*promptArg\)\)\s*\{[^\{]+?\}/, "")).return.unsafeDereference());
        }
    },
    setStyle(btn) {
        var cookieBehavior = Services.prefs.getIntPref(cookiePref);
        btn.style.cssText = `list-style-image:url("${this.image}${cookieBehavior === 0 ? "-0" : ""}");${cookieBehavior === 2 ? "fill:color-mix(in srgb, currentColor 20%, #e31b5d);" : ""}`;
        btn.setAttribute("badge", cookieBehavior);
        btn.setAttribute("badgeStyle", `background: ${cookieBehavior !== 2 ? "#0074e8" : "#e31b5d"}; color: #ffffff; font-size: 10px; line-height: 10px; box-shadow: none; text-shadow: none; padding-block: 0 1px !important; padding-inline: 2px !important; min-width: 0 !important;`);
    },
    setBtnsStyle() {
        for (let win of CustomizableUI.windows) {
            let btn = this.widget.forWindow(win).node;
            if (btn) this.setStyle(btn);
        }
    },
    observe() {
        this.setBtnsStyle();
    },
    delCookies(win) {
        if (!win.gIdentityHandler?._uriHasHost || win.gIdentityHandler._pageExtensionPolicy) return;
        win.SiteDataManager.hasSiteData(win.gIdentityHandler._uri.asciiHost).then(hasData => {
            if (!hasData) return this.showAlert(label, message2);
            var baseDomain = win.SiteDataManager.getBaseDomainFromHost(win.gIdentityHandler._uri.host);
            if (win.SiteDataManager.promptSiteDataRemoval(win, [baseDomain])) win.SiteDataManager.remove(baseDomain).then(() => this.showAlert(label, message1));
        });
    },
    prefToggleNumber(pref, next) {
        Services.prefs.setIntPref(pref, next[Services.prefs.getIntPref(pref)]);
    },
    ucf_gSiteDataSettings() {
        SiteDataManager.getSites().then(sites => {
            var gsds = gSiteDataSettings;
            gsds._sites = sites;
            var col = document.querySelector("treecol[data-isCurrentSortCol=true]"), last = "data-last-sortDirection";
            col.setAttribute(last, col.getAttribute(last) === "ascending" ? "descending" : "ascending");
            gsds._sortSites(gsds._sites, col);
            gsds._buildSitesList(gsds._sites);
            this.getSetInterval;
        });
    },
    command() {
        if (this.hasinterval) clearInterval(this.getSetInterval);
    },
    dialogaccept(e) {
        e.preventDefault();
        if (!this.hasinterval) return;
        clearInterval(this.getSetInterval);
        gSiteDataSettings._list.clearSelection();
        this.getSetInterval = this.interval;
    },
    handleEvent(e) {
        this[e.type](e);
    },
    async viewCookies({view, shiftKey}) {
        var { _uriHasHost, _pageExtensionPolicy, _uri } = view.gIdentityHandler;
        var ugsds = {_uriHasHost, _pageExtensionPolicy, _uri};
        var w = Services.wm.getMostRecentWindow(typew);
        if (!w) {
            await view.SiteDataManager.updateSites();
            let {xulStore: xs} = Services;
            let sx = +xs.getValue(urlSds, idw, "screenX") || xs.setValue(urlSds, idw, "screenX", 1) || 1;
            let sy = +xs.getValue(urlSds, idw, "screenY") || xs.setValue(urlSds, idw, "screenY", 1) || 1;
            let wh = +xs.getValue(urlSds, idw, "width") || xs.setValue(urlSds, idw, "width", 600) || 600;
            let ht = +xs.getValue(urlSds, idw, "height") || xs.setValue(urlSds, idw, "height", 500) || 500;
            ugsds.sizemode = xs.getValue(urlSds, idw, "sizemode") || true;
            w = view.openDialog(urlSds, typew, `chrome,dialog=no,resizable,${`screenX=${sx},screenY=${sy}`}${`,width=${wh},height=${ht}`}`);
            w.ucf_gsitedatasettings = ugsds;
        } else {
            w.ucf_gsitedatasettings = ugsds;
            w.ucf_gSiteDataSettings();
            w.focus();
            if (shiftKey === searchshift) this.filter(w);
        }
    },
    filter(w = window) {
        var filter = w.document.querySelector("#searchBox");
        if (!filter) return;
        if (w.ucf_gsitedatasettings._uriHasHost && !w.ucf_gsitedatasettings._pageExtensionPolicy)
            filter.value = (filter.inputEl || {}).value = w.SiteDataManager.getBaseDomainFromHost(w.ucf_gsitedatasettings._uri.host);
        else filter.value = (filter.inputEl || {}).value = "";
        filter.dispatchEvent(new w.Event("input", { bubbles: true }));
    },
    destructor() {
        if (this.hasinterval) clearInterval(this.getSetInterval);
        for (let btn of this.removeBtns)
            btn.removeEventListener("command", this);
        if (notclosewindow) document.removeEventListener("dialogaccept", this);
    },
}).init())();
