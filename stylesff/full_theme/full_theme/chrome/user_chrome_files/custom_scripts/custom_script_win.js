// Этот скрипт работает в главном окне браузера если включено в настройках

var ucf_custom_script_win = {
    initialized: false,
    get unloadlisteners() {
        delete this.unloadlisteners;
        window.addEventListener("unload", this, { once: true });
        return this.unloadlisteners = [];
    },
    load() {
        if (this.initialized)
            return;
        this.initialized = true;
        // this.specialwidgets.init(); // <-- Special Widgets
        this.autohidesidebar.init(); // <-- Auto Hide Sidebar
        /* ************************************************ */

        // Здесь может быть ваш код который сработает по событию "load" не раньше

        /* ************************************************ */
    },
    handleEvent(e) {
        this[e.type](e);
    },
    unload() {
        this.unloadlisteners.forEach(str => {
            try {
                this[str].destructor();
            } catch (e) {}
        });
    },
    specialwidgets: {
        _timer: null,
        get Customizable() {
            delete this.Customizable;
            if ("createSpecialWidget" in CustomizableUI)
                return this.Customizable = CustomizableUI;
            var scope = null;
            try {
                scope = Cu.import("resource:///modules/CustomizableUI.jsm", {}).CustomizableUIInternal;
            } catch (e) { }
            return this.Customizable = scope;
        },
        init() {
            if (!("CustomizableUI" in window) || !("gCustomizeMode" in window))
                return;
            ucf_custom_script_win.unloadlisteners.push("specialwidgets");
            window.addEventListener("customizationready", this);
        },
        destructor() {
            window.removeEventListener("customizationready", this);
        },
        handleEvent(e) {
            this[e.type](e);
        },
        customizationchange() {
            clearTimeout(this._timer);
            this._timer = setTimeout(() => {
                this.createSpecialWidgets();
            }, 1000);
        },
        customizationready() {
            if (!this.Customizable)
                return;
            this.createSpecialWidgets();
            window.addEventListener("customizationchange", this);
            window.addEventListener("customizationending", this);
        },
        customizationending() {
            window.removeEventListener("customizationchange", this);
            window.removeEventListener("customizationending", this);
        },
        createSpecialWidgets() {
            try {
                let fragment = document.createDocumentFragment();
                if (this.findSpecialWidgets("spring")) {
                    let spring = this.Customizable.createSpecialWidget("spring", document);
                    spring.setAttribute("label", "Растягивающийся интервал");
                    fragment.append(gCustomizeMode.wrapToolbarItem(spring, "palette"));
                }
                if (this.findSpecialWidgets("spacer")) {
                    let spacer = this.Customizable.createSpecialWidget("spacer", document);
                    spacer.setAttribute("label", "Интервал");
                    fragment.append(gCustomizeMode.wrapToolbarItem(spacer, "palette"));
                }
                if (this.findSpecialWidgets("separator")) {
                    let separator = this.Customizable.createSpecialWidget("separator", document);
                    separator.setAttribute("label", "Разделитель");
                    fragment.append(gCustomizeMode.wrapToolbarItem(separator, "palette"));
                }
                gCustomizeMode.visiblePalette.append(fragment);
            } catch (e) {}
        },
        findSpecialWidgets(string) {
            try {
                if (!gCustomizeMode.visiblePalette.querySelector(`toolbar${string}[id^="customizableui-special-${string}"]`))
                    return true;
            } catch (e) {}
            return false;
        }
    },
    autohidesidebar: {
        init() {
            var sidebar = this.sidebar = document.querySelector("#sidebar-box");
            if (!sidebar) return;
            for (let type of ["dragenter", "drop", "dragexit"])
                sidebar.addEventListener(type, this);
            ucf_custom_script_win.unloadlisteners.push("autohidesidebar");
            var popup = this.popup = document.querySelector("#sidebarMenu-popup");
            if (!popup) return;
            popup.addEventListener("popupshowing", this);
        },
        destructor() {
            var sidebar = this.sidebar;
            for (let type of ["dragenter", "drop", "dragexit"])
                sidebar.removeEventListener(type, this);
            if (!this.popup) return;
            this.popup.removeEventListener("popupshowing", this);
        },
        handleEvent(e) {
            this[e.type](e);
        },
        popupshowing() {
            this.popup.addEventListener("popuphidden", this, { once: true });
            this.dragenter();
        },
        popuphidden() {
            this.drop();
        },
        dragenter() {
            if (!this.sidebar.hasAttribute("sidebardrag"))
                this.sidebar.setAttribute("sidebardrag", "true");
        },
        drop() {
            if (this.sidebar.hasAttribute("sidebardrag"))
                this.sidebar.removeAttribute("sidebardrag");
        },
        dragexit(e) {
            var sidebar = this.sidebar;
            var boxObj = sidebar.getBoundingClientRect(), boxScrn = !sidebar.boxObject ? sidebar : sidebar.boxObject;
            if ((!e.relatedTarget || e.screenY <= (boxScrn.screenY + 5) || e.screenY  >= (boxScrn.screenY + boxObj.height - 5)
                || e.screenX <= (boxScrn.screenX + 5) || e.screenX >= (boxScrn.screenX + boxObj.width - 5))
                && sidebar.hasAttribute("sidebardrag"))
                sidebar.removeAttribute("sidebardrag");
        }
    },
    setattributechromemargin: {
        init() {
            if (AppConstants.platform != "win" || !(window.matchMedia("(-moz-os-version: windows-win8)").matches || window.matchMedia("(-moz-os-version: windows-win7)").matches)) return;
            this.mediawindowsglass = window.matchMedia("(-moz-windows-glass)");
            this.mediawindowsglass.addEventListener("change", this);
            ucf_custom_script_win.unloadlisteners.push("setattributechromemargin");
            this.update();
        },
        handleEvent() {
            this.update();
        },
        update() {
            var margin = this.mediawindowsglass.matches ? "0,7,7,7" : "0,0,0,0";
            if (TabsInTitlebar.enabled)
                document.documentElement.setAttribute("chromemargin", margin);
            TabsInTitlebar._update = eval(`(${`${TabsInTitlebar._update}`
                .replace(/setAttribute\s*\(\s*"\s*chromemargin\s*"\s*,\s*(?:"\s*0\s*,\s*2\s*,\s*2\s*,\s*2\s*"|"0,7,7,7"|"0,0,0,0")\s*\)/, `setAttribute("chromemargin", "${margin}")`)
                .replace(/^_update/, "function _update")})`);
        },
        destructor() {
            this.mediawindowsglass.removeEventListener("change", this);
        },
    },
};

if (window.document.readyState != "complete") {
    window.addEventListener("load", function load() {
        ucf_custom_script_win.load();
    }, { once: true });
} else
    ucf_custom_script_win.load();

ucf_custom_script_win.setattributechromemargin.init();
