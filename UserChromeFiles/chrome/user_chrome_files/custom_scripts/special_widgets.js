(async (
    id = Symbol("specialwidgets"),
    _timer = null,
) => (this[id] = {
    async init() {
        window.addEventListener("customizationready", this);
        setUnloadMap(id, this.destructor, this);
    },
    handleEvent(e) {
        this[e.type](e);
    },
    customizationchange() {
        clearTimeout(_timer);
        _timer = setTimeout(() => {
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
    },
    findSpecialWidgets(string) {
        if (!gCustomizeMode.visiblePalette.querySelector(`toolbar${string}[id^="customizableui-special-${string}"]`))
            return true;
        return false;
    },
    destructor() {
        window.removeEventListener("customizationready", this);
    },
}).init())();
