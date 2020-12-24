// Этот скрипт можно использовать для создания кнопок с помощью CustomizableUI.createWidget
({
    init() {
        if (AppConstants.platform == "linux") {
            const {LightweightThemeConsumer} = ChromeUtils.import("resource://gre/modules/LightweightThemeConsumer.jsm");
            if (/if\s*\(\s*AppConstants\s*\.\s*platform\s*\!\s*=\s*"linux"\s*\)\s*{\s*this\s*\.\s*darkThemeMediaQuery\s*=\s*this\s*\.\s*_win\s*\.\s*matchMedia\s*\(\s*"\(-moz-system-dark-theme\)"\s*\)\s*;\s*this\s*\.\s*darkThemeMediaQuery\s*\.\s*addListener\s*\(\s*this\s*\)\s*;\s*}/.test(`${LightweightThemeConsumer}`)) {
                Object.defineProperty(LightweightThemeConsumer.prototype, "darkThemeMediaQuery", {
                    enumerable: true,
                    configurable: true,
                    get() {
                        if (!("__darkThemeMediaQuery" in this)) {
                            if (!this._win) return this.__darkThemeMediaQuery = null;
                            this.__darkThemeMediaQuery = this._win.matchMedia("(-moz-system-dark-theme)");
                            this.__darkThemeMediaQuery.addListener(this);
                        }
                        return this.__darkThemeMediaQuery;
                    },
                    set(value) {
                        this.__darkThemeMediaQuery = value;
                    },
                });
                delete LightweightThemeConsumer.prototype.darkMode;
                Object.defineProperty(LightweightThemeConsumer.prototype, "darkMode", {
                    enumerable: true,
                    configurable: true,
                    get() {
                        if (this._lastData?.theme.id == "default-theme@mozilla.org")
                            return false;
                        return this.darkThemeMediaQuery.matches;
                    },
                });
            }
        }
        Services.obs.addObserver(this, "lightweight-theme-styling-update", false);
    },
    observe(aSubject, aTopic, aData) {
        var obj = aSubject?.wrappedJSObject;
        if (typeof obj != "object") return;
        var theme = obj.theme;
        if (!theme || obj.darkTheme?.textcolor || !InspectorUtils.isValidCSSColor(theme.textcolor)) {
            if (Services.prefs.getPrefType("ui.systemUsesDarkTheme") == Services.prefs.PREF_INT)
                Services.prefs.clearUserPref("ui.systemUsesDarkTheme");
            return;
        }
        var { r, g, b } = InspectorUtils.colorToRGBA(theme.textcolor);
        Services.prefs.setIntPref("ui.systemUsesDarkTheme", this._isColorDark(r, g, b) ? 0 : 1);
    },
    _isColorDark(r, g, b) {
        return 0.2125 * r + 0.7154 * g + 0.0721 * b <= 110;
    },
}).init();
