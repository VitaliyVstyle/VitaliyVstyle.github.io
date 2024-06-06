// version, date year-month-day: 2024-6-5
(async () => {
    var file = Services.dirsvc.get("UChrm", Ci.nsIFile), iname;
    file.append("user_chrome_files");
    file.append("user_chrome.manifest");
    if (!file.exists() || !file.isFile())
        return;
    switch (Services.appinfo.name) {
        case "Firefox":
            iname = "user_chrome.js";
            break;
        case "Thunderbird":
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
    Services.scriptloader.loadSubScript(`chrome://user_chrome_files/content/user_chrome/${iname}`, sandbox, "UTF-8");
})();
