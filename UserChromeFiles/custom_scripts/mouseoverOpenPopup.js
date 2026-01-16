/**
@UCF @param {"prop":"JsChrome.load","ucfobj":true} @UCF
*/
(async (
    delay = 350,
    buttonsID = [
        "PanelUI-menu-button",
        "library-button",
        "fxa-toolbar-menu-button",
        "nav-bar-overflow-button",
        "star-button-box",
        "pageActionButton",
        "unified-extensions-button",
        "downloads-button",
        "alltabs-button",
    ],
    excludeButtonsID = [
        "back-button",
        "forward-button",
        "tabs-newtab-button",
        "new-tab-button",
    ],
    areas = "toolbar",
) => ({
    timer: null,
    get buttonsID() {
        delete this.buttonsID;
        return this.buttonsID = new Set(buttonsID);
    },
    get excludeButtonsID() {
        delete this.excludeButtonsID;
        return this.excludeButtonsID = new Set(excludeButtonsID);
    },
    init() {
        setUnloadMap(Symbol(), this.destructor, this);
        this.mouseover = this.mouseover.bind(this);
        this.mouseleavedown = this.mouseleavedown.bind(this);
        for (let elem of this.areas = document.querySelectorAll(areas)) {
            elem.addEventListener("mouseover", this.mouseover);
            elem.addEventListener("mouseleave", this.mouseleavedown);
            elem.addEventListener("mousedown", this.mouseleavedown, true);
        }
    },
    mouseover(e) {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            var btn = e.target.closest?.("toolbarbutton:scope:is(.toolbarbutton-1,.bookmark-item),#main-menubar > menu:scope,hbox.urlbar-page-action"), id;
            if (!btn || btn.matches("[open],[disabled]") || this.excludeButtonsID.has(btn.id)) return;
            if (btn.matches("toolbarbutton[type=menu],menu")) this.openPopup(btn, btn.menupopup);
            else if (btn.matches("toolbarbutton") && (id = btn.dataset?.extensionid)) {
                if (UcfPrefs.customSandbox.ExtensionParent.apiManager.global.browserActionFor(WebExtensionPolicy.getByID(id).extension).action.tabContext.get(gBrowser.selectedTab).popup)
                    this.openPopup(btn);
            } else if (btn.matches("toolbarbutton:is([widget-type=view],.toolbarbutton-combined-buttons-dropmarker)")) this.openPopup(btn);
            else if (this.buttonsID.has(btn.id)) this.openPopup(btn, null, true);
        }, delay);
    },
    mouseleavedown() {
        clearTimeout(this.timer);
    },
    openPopup(btn, mpopup, buttonID) {
        for (let p of document.querySelectorAll(":is(menupopup,panel)[panelopen],:is(toolbarbutton,#main-menubar > menu)[open] > menupopup"))
            p.hidePopup();
        if (mpopup) mpopup.openPopup();
        else if (buttonID) btn.click();
        else btn.doCommand();
    },
    destructor() {
        for (let elem of this.areas) {
            elem.removeEventListener("mouseover", this.mouseover);
            elem.removeEventListener("mouseleave", this.mouseleavedown);
            elem.removeEventListener("mousedown", this.mouseleavedown, true);
        }
    },
}).init())();
