/**
@UCF @param {"prop":"JsChrome.load","ucfobj":true} @UCF
*/
(async (
    delay = 350,
    btnSelectors = `
        #PanelUI-menu-button,
        #library-button,
        #fxa-toolbar-menu-button,
        #nav-bar-overflow-button,
        #star-button-box,
        #pageActionButton,
        #unified-extensions-button,
        #downloads-button,
        #alltabs-button
    `,
    excludeBtnSelectors = `
        #back-button,
        #forward-button,
        #tabs-newtab-button,
        #new-tab-button
    `,
    areas = `
        toolbar
    `,
) => ({
    timer: null,
    async init() {
        await delayedStartupPromise;
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
            if (!btn || btn.matches(`[open],[disabled]:not([disabled="false"]),${excludeBtnSelectors}`)) return;
            if (btn.matches(`toolbarbutton:is([type=menu],[widget-type=view],.toolbarbutton-combined-buttons-dropmarker),menu,${btnSelectors}`)
                || (btn.matches("toolbarbutton") && (id = btn.dataset?.extensionid) && UcfPrefs.customSandbox.ExtensionParent.apiManager.global.browserActionFor(WebExtensionPolicy.getByID(id).extension).action.tabContext.get(gBrowser.selectedTab).popup)) {
                for (let p of document.querySelectorAll(":is(menupopup,panel)[panelopen],:is(toolbarbutton,#main-menubar > menu)[open] > menupopup,.urlbar[breakout-extend]")) {
                    p.hidePopup?.();
                    p.inputField?.blur();
                }
                let params = { bubbles: true, cancelable: true, button: 0, view: window };
                btn.dispatchEvent(new MouseEvent("mousedown", params));
                btn.dispatchEvent(new MouseEvent("click", params));
            }
        }, delay);
    },
    mouseleavedown() {
        clearTimeout(this.timer);
    },
    destructor() {
        for (let elem of this.areas) {
            elem.removeEventListener("mouseover", this.mouseover);
            elem.removeEventListener("mouseleave", this.mouseleavedown);
            elem.removeEventListener("mousedown", this.mouseleavedown, true);
        }
    },
}).init())();
