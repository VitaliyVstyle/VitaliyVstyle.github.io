(this.specialwidgets = {
    _timer: null,
    init(that) {
        if (!("CustomizableUI" in window) || !("gCustomizeMode" in window))
            return;
        that.unloadlisteners.push("specialwidgets");
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
                let spring = CustomizableUI.createSpecialWidget("spring", document);
                fragment.append(gCustomizeMode.wrapToolbarItem(spring, "palette"));
            }
            if (this.findSpecialWidgets("spacer")) {
                let spacer = CustomizableUI.createSpecialWidget("spacer", document);
                fragment.append(gCustomizeMode.wrapToolbarItem(spacer, "palette"));
            }
            if (this.findSpecialWidgets("separator")) {
                let separator = CustomizableUI.createSpecialWidget("separator", document);
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
}).init(this);
