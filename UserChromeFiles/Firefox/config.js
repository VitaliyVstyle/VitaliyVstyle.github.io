// version, date year-month-day: 2025.7.11
(async () => {
    var file = Services.dirsvc.get("UChrm", Ci.nsIFile), iname;
    file.append("user_chrome_files");
    file.append("user_chrome.manifest");
    if (!file.exists() || !file.isFile())
        return;
    switch (Services.appinfo.ID) {
        case "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}": // Firefox or etc.
            iname = "user_chrome.js";
            break;
        case "{3550f703-e582-4d05-9a08-453d09bdfdc6}": // Thunderbird
            iname = "user_chrome_tb.js";
            break;
        default:
            return;
    }
    Components.manager.QueryInterface(Ci.nsIComponentRegistrar)
    .autoRegister(file);
    var sandbox = Cu.Sandbox(Services.scriptSecurityManager.getSystemPrincipal(), {
        wantComponents: true,
        sandboxName: "UserChromeFiles",
        wantGlobalProperties: ["ChromeUtils"],
    });
    sandbox.manifestPath = file.path;
    Services.scriptloader.loadSubScript(`chrome://user_chrome_files/content/user_chrome/${iname}`, sandbox);
})();
