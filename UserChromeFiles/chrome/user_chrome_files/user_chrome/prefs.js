const {UcfPrefs} = ChromeUtils.importESModule("chrome://user_chrome_files/content/user_chrome/UcfPrefs.mjs");
const controlSet = new Set([
    "toolbars_enable",
    "t_enable",
    "t_autohide",
    "v_enable",
    "v_autohide",
    "custom_styles_scripts_child",
]);
const replaceSet = new Set([
    "custom_styles_scripts_groups",
    "custom_styles_scripts_matches",
]);
const Change = {
    observe(s, t, pref) {
        var i = document.querySelector(`[data-pref="${pref}"]`);
        if (i)
            FillForm(pref, i);
    },
    handleEvent({target: i}) {
        UcfPrefs.setPrefs(i.dataset.pref, i.type === "checkbox" ? i.checked : (replaceSet.has(i.dataset.pref) ? (i.value ? i.value.split(",") : []) : i.value));
    },
};
const FillForm = (pref, i, val = UcfPrefs.prefs[pref]) => {
    if (i.type === "checkbox") {
        if (i.checked !== val)
            i.checked = val;
        if (controlSet.has(pref))
            i.parentElement.nextElementSibling.disabled = !val;
    } else {
        let v = replaceSet.has(pref) ? val.join(",") : val;
        if (i.value !== v)
            i.value = v;
    }
};
const filePicker = (str = "Open", mode = "modeOpen") => {
    var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
    try {
        fp.init(browsingContext, str, fp[mode]);
    } catch {
        fp.init(window, str, fp[mode]);
    }
    fp.open(res => {
        if (res !== fp.returnOK) return;
        var {path} = fp.file;
        var inp = document.querySelector("[data-pref=custom_editor_path]");
        if (path === inp.value) return;
        inp.value = path;
        inp.dispatchEvent(new Event("change", { bubbles: true }));
    });
};
const RestoreDefaults = () => {
    var prefs = [];
    for (let i of document.querySelectorAll("[data-pref]")) {
        let pref = i.dataset.pref;
        prefs.push([pref, UcfPrefs.default[pref]]);
    }
    UcfPrefs.setPrefs(prefs);
};
const initOptions = () => {
    var l10n = UcfPrefs.doMLocalization("prefs.ftl");
    l10n.connectRoot(document.documentElement);
    l10n.translateRoots();
    for (let i of document.querySelectorAll("[data-pref]"))
        FillForm(i.dataset.pref, i);
    document.querySelector("#btn_browse").onclick = e => filePicker(e.currentTarget.parentElement.parentElement.firstElementChild.textContent);
    document.querySelector("#restore").onclick = () => RestoreDefaults();
    document.querySelector("#restart").onclick = () => UcfPrefs.restartApp();
    document.querySelector("#restart_no_cache").onclick = () => UcfPrefs.restartApp(true);
    document.querySelector("#homepage").onclick = () => UcfPrefs.openHavingURI(window, "https://github.com/VitaliyVstyle/VitaliyVstyle.github.io/tree/main/UserChromeFiles");
    document.querySelector("#open_options").onclick = () => UcfPrefs.openHavingURI(window, "about:user-chrome-files-options", true);
    window.addEventListener("change", Change);
    Services.obs.addObserver(Change, UcfPrefs.TOPIC_PREFS);
    window.addEventListener("unload", () => {
        window.removeEventListener("change", Change);
        Services.obs.removeObserver(Change, UcfPrefs.TOPIC_PREFS);
        l10n.disconnectRoot(document.documentElement);
    }, { once: true });
};
initOptions();
