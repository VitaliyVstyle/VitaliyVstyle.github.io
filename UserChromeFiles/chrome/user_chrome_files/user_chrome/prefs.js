const {UcfPrefs} = ChromeUtils.importESModule("chrome://user_chrome_files/content/user_chrome/UcfPrefs.mjs");
const PREF_BRANCH = "extensions.user_chrome_files.";
const controlSet = new Set([
    "extensions.user_chrome_files.toolbars_enable",
    "extensions.user_chrome_files.top_enable",
    "extensions.user_chrome_files.top_autohide",
    "extensions.user_chrome_files.vertical_enable",
    "extensions.user_chrome_files.vertical_autohide",
]);

const FormObserver = {
    observe(aSubject, aTopic, aData) {
        var input = document.querySelector(`[data-pref="${aData}"]`);
        if (input)
            FillForm(aData, input);
    },
    handleEvent() {
        SaveForm();
    },
};
const FillForm = (aData, input) => {
    var val = GetPref(aData);
    if (input.type == "checkbox") {
        input.checked = val;
        if (controlSet.has(aData))
            input.parentElement.nextElementSibling.disabled = !val;
    } else
        input.value = val;
};
const SaveForm = () => {
    var inputs = document.querySelectorAll("[data-pref]");
    for (let i of inputs) {
        let pref = i.dataset.pref;
        if (i.type == "checkbox")
            SetPref(pref, i.checked);
        else
            SetPref(pref, i.value);
    }
};
const GetPref = name => {
    var type = Services.prefs.getPrefType(name);
    switch (type) {
        case Services.prefs.PREF_BOOL:
            return Services.prefs.getBoolPref(name);
        case Services.prefs.PREF_INT:
            return Services.prefs.getIntPref(name);
        case Services.prefs.PREF_STRING:
            return Services.prefs.getStringPref(name);
    }
};
const SetPref = (name, value) => {
    var type = Services.prefs.getPrefType(name);
    switch (type) {
        case Services.prefs.PREF_BOOL:
            Services.prefs.setBoolPref(name, value);
            break;
        case Services.prefs.PREF_INT:
            Services.prefs.setIntPref(name, value);
            break;
        case Services.prefs.PREF_STRING:
            Services.prefs.setStringPref(name, value);
            break;
    }
};
const RestoreDefaults = () => {
    var inputs = document.querySelectorAll("[data-pref]");
    for (let i of inputs)
        Services.prefs.clearUserPref(i.dataset.pref);
};
const Restart = (nocache = false) => {
    var cancelQuit = Cc["@mozilla.org/supports-PRBool;1"].createInstance(Ci.nsISupportsPRBool);
    Services.obs.notifyObservers(cancelQuit, "quit-application-requested", "restart");
    if (cancelQuit.data)
        return false;
    if (nocache)
        Services.appinfo.invalidateCachesOnRestart();
    var {startup} = Services;
    startup.quit(startup.eAttemptQuit | startup.eRestart);
};
const Homepage = () => {
    var win = window;
    switch (Services.appinfo.ID) {
        case "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}": // Firefox or etc.
            win = (win.top?.opener && !win.top.opener.closed) ? win.top.opener : Services.wm.getMostRecentWindow("navigator:browser");
            if (win)
                win.gBrowser.selectedTab = win.gBrowser.addTab("https://github.com/VitaliyVstyle/VitaliyVstyle.github.io/tree/main/UserChromeFiles", {
                    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
                });
            break;
        case "{3550f703-e582-4d05-9a08-453d09bdfdc6}": // Thunderbird
            win = (win.top?.opener && !win.top.opener.closed) ? win.top.opener : Services.wm.getMostRecentWindow("mail:3pane");
            if (win)
                win.document.querySelector("#tabmail")?.openTab("contentTab", { url: "https://github.com/VitaliyVstyle/VitaliyVstyle.github.io/tree/main/UserChromeFiles" });
            break;
    }
};
const initOptions = () => {
    var l10n = UcfPrefs.dOMLocalization("prefs.ftl");
    l10n.connectRoot(document.documentElement);
    l10n.translateRoots();
    var inputs = document.querySelectorAll("[data-pref]");
    for (let i of inputs)
        FillForm(i.dataset.pref, i);
    document.querySelector("#restore").onclick = () => RestoreDefaults();
    document.querySelector("#restart").onclick = () => Restart();
    document.querySelector("#restart_no_cache").onclick = () => Restart(true);
    document.querySelector("#homepage").onclick = () => Homepage();
    window.addEventListener("change", FormObserver);
    Services.prefs.addObserver(PREF_BRANCH, FormObserver);
    window.addEventListener("unload", () => {
        window.removeEventListener("change", FormObserver);
        Services.prefs.removeObserver(PREF_BRANCH, FormObserver);
        l10n.disconnectRoot(document.documentElement);
    }, { once: true });
};
initOptions();
