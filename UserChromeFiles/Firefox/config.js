// version, date year-month-day: 2024-3-24
(async () => {
    var file = Services.dirsvc.get("UChrm", Ci.nsIFile);
    file.append("user_chrome_files");
    file.append("user_chrome.manifest");
    if (!file.exists() || !file.isFile())
        return;
    Components.manager.QueryInterface(Ci.nsIComponentRegistrar)
    .autoRegister(file);
    var sandbox = Cu.Sandbox(Services.scriptSecurityManager.getSystemPrincipal(), {
        wantComponents: true,
        sandboxName: "UserChromeFiles",
        wantGlobalProperties: ["ChromeUtils"],
    });
    Services.scriptloader.loadSubScript("chrome://user_chrome_files/content/user_chrome/user_chrome.js", sandbox, "UTF-8");
    sandbox.user_chrome.init();
})();
