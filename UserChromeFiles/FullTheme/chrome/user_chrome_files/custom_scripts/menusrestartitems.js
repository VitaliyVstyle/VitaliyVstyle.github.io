(async (
    id = Symbol("menusrestartitems"),
    btnID = "ucf-appmenu-restart-button",
    muimID = "ucf-menu-restart-Item",
    icon = "chrome://global/skin/icons/reload.svg",
) => (this[id] = {
    async init() {
        var abtn = document.querySelector("template#appMenu-viewCache")?.content.querySelector("#appMenu-quit-button2");
        var ura = (await UcfPrefs.l10nMap.get("main.ftl").fM())[4];
        if (abtn) {
            let frag = MozXULElement.parseXULToFragment(`<toolbarbutton/>`);
            let btn = this.btn = frag.firstElementChild;
            btn.id = btnID;
            btn.className = "subviewbutton";
            btn.setAttribute("label", ura.value);
            btn.setAttribute("tooltiptext", `${ura.attributes[0].value}\n${ura.attributes[1].value}\n${ura.attributes[2].value}`);
            btn.setAttribute("shortcut", "Ctrl+Alt+Q");
            btn.addEventListener("click", this);
            abtn.before(frag);
        }
        var aftermuim = document.querySelector("#menu_FilePopup #menu_FileQuitItem");
        if (aftermuim) {
            let muim = this.muim = document.createXULElement("menuitem");
            muim.id = muimID;
            muim.className = "menuitem-iconic";
            muim.setAttribute("label", ura.value);
            muim.setAttribute("tooltiptext", `${ura.attributes[0].value}\n${ura.attributes[1].value}\n${ura.attributes[2].value}`);
            muim.setAttribute("acceltext", "Ctrl+Alt+Q");
            muim.setAttribute("context", "");
            muim.addEventListener("click", this);
            aftermuim.before(muim);
        }
        if (icon) {
            let style = "data:text/css;charset=utf-8," + encodeURIComponent(`
                #${btnID}, #${muimID} {
                    list-style-image: url(${icon}) !important;
                    -moz-context-properties: fill;
                    fill: color-mix(in srgb, currentColor 20%, #f38525) !important;
                }
            `);
            try {
                windowUtils.loadSheetUsingURIString(style, windowUtils.USER_SHEET);
            } catch {}
        }
        window.addEventListener("keydown", this);
        setUnloadMap(id, this.destructor, this);
    },
    click(e) {
        switch (e.button) {
            case 0:
                this._restart_mozilla();
                break;
            case 1:
                e.view.safeModeRestart();
                break;
            case 2:
                this._restart_mozilla(true);
                break;
        }
    },
    keydown(e) {
        if (e.code == "KeyQ" && e.ctrlKey && e.altKey)
            this._restart_mozilla();
    },
    _restart_mozilla(nocache = false) {
        var cancelQuit = Cc["@mozilla.org/supports-PRBool;1"].createInstance(Ci.nsISupportsPRBool);
        Services.obs.notifyObservers(cancelQuit, "quit-application-requested", "restart");
        if (cancelQuit.data)
            return false;
        if (nocache)
            Services.appinfo.invalidateCachesOnRestart();
        var {startup} = Services;
        startup.quit(startup.eAttemptQuit | startup.eRestart);
    },
    handleEvent(e) {
        this[e.type](e);
    },
    destructor() {
        window.removeEventListener("keydown", this);
        this.btn?.removeEventListener("click", this);
        this.muim?.removeEventListener("click", this);
    },
}).init())();
