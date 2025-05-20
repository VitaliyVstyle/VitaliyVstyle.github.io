/**
@UCF @param {"prop":"JsChrome.load","ucfobj":true} @UCF
*/
(async (
    id = Symbol("specialwidgets"),
    timer = null,
) => (this[id] = {
    async init() {
        gNavToolbox.addEventListener("customizationready", this);
        setUnloadMap(id, this.destructor, this);
    },
    handleEvent(e) {
        this[e.type](e);
    },
    customizationchange() {
        clearTimeout(timer);
        timer = setTimeout(() => {
            this.createSpecialWidgets();
        }, 1000);
    },
    command(e) {
        switch (e.target.id) {
            case "customization-reset-button":
            case "customization-undo-reset-button":
                this.maybeCreateSW = true;
                break;
        }
    },
    customizationready() {
        this.maybeCreateSW = true;
        this.createSpecialWidgets();
        this.custContainer = document.querySelector("#customization-container");
        this.custContainer.addEventListener("command", this);
        gNavToolbox.addEventListener("customizationchange", this);
        gNavToolbox.addEventListener("customizationending", this);
    },
    customizationending() {
        this.maybeCreateSW = false;
        this.custContainer.removeEventListener("command", this);
        gNavToolbox.removeEventListener("customizationchange", this);
        gNavToolbox.removeEventListener("customizationending", this);
    },
    createSpecialWidgets() {
        if (!this.maybeCreateSW) return;
        this.maybeCreateSW = false;
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
        gNavToolbox.removeEventListener("customizationready", this);
    },
}).init())();
