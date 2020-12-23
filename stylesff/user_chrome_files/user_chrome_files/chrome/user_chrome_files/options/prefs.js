if (!("Cc" in window)) window.Cc = Components.classes;
if (!("Ci" in window)) window.Ci = Components.interfaces;
if (!("Cu" in window)) window.Cu = Components.utils;

var {Services} = ("ChromeUtils" in window && "import" in ChromeUtils)
    ? ChromeUtils.import("resource://gre/modules/Services.jsm")
    : Cu.import("resource://gre/modules/Services.jsm", {});
var controlSet = new Set([
    "extensions.user_chrome_files.vertical_top_bottom_bar_enable",
    "extensions.user_chrome_files.top_enable",
    "extensions.user_chrome_files.vertical_enable",
    "extensions.user_chrome_files.vertical_autohide",
]);
var PREF_BRANCH = "extensions.user_chrome_files.";
var FormObserver = {
    observe: function(aSubject, aTopic, aData) {
        var input = document.querySelector(`[data-pref="${aData}"]`);
        FillForm(aData, input);
    },
    handleEvent: function() {
        SaveForm();
    },
};
function FillForm(aData, input) {
    var val = GetPref(aData);
    if (input.type == "checkbox") {
        input.checked = val;
        if (controlSet.has(aData))
            input.parentElement.nextElementSibling.disabled = !val;
    } else
        input.value = val;
}
function SaveForm(e) {
    var inputs = document.querySelectorAll("[data-pref]");
    for (let i of inputs) {
        let pref = i.dataset.pref;
        if (i.type == "checkbox")
            SetPref(pref, i.checked);
        else
            SetPref(pref, i.value);
    }
}
function GetPref(name) {
    var type = Services.prefs.getPrefType(name);
    switch (type) {
        case Services.prefs.PREF_BOOL:
            return Services.prefs.getBoolPref(name);
        case Services.prefs.PREF_INT:
            return Services.prefs.getIntPref(name);
        case Services.prefs.PREF_STRING:
            return Services.prefs.getStringPref(name);
    }
}
function SetPref(name, value) {
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
}
function RestoreDefaults() {
    var inputs = document.querySelectorAll("[data-pref]");
    for (let i of inputs)
        Services.prefs.clearUserPref(i.dataset.pref);
}
function Restart(nocache = false) {
    var cancelQuit = Cc["@mozilla.org/supports-PRBool;1"].createInstance(Ci.nsISupportsPRBool);
    Services.obs.notifyObservers(cancelQuit, "quit-application-requested", "restart");
    if (cancelQuit.data)
        return false;
    if (nocache)
        Services.appinfo.invalidateCachesOnRestart();
    var restart = Services.startup;
    restart.quit(restart.eAttemptQuit | restart.eRestart);
}
window.addEventListener("load", function onLoad() {
    var inputs = document.querySelectorAll("[data-pref]");
    for (let i of inputs)
        FillForm(i.dataset.pref, i);
    document.querySelector("#restore").onclick = function() { RestoreDefaults(); };
    document.querySelector("#restart").onclick = function() { Restart(); };
    document.querySelector("#restart_no_cache").onclick = function() { Restart(true); };
    window.addEventListener("change", FormObserver);
    Services.prefs.addObserver(PREF_BRANCH, FormObserver, false);
    window.addEventListener("unload", function onUnload() {
        window.removeEventListener("change", FormObserver);
        Services.prefs.removeObserver(PREF_BRANCH, FormObserver);
    }, { once: true });
}, { once: true });
