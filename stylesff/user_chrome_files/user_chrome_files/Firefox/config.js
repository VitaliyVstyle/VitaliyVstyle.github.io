//
try {(function() {
//  var {classes: Cc, interfaces: Ci, utils: Cu} = Components; // для FF < 60
    var sandbox = Cu.Sandbox(Cc["@mozilla.org/systemprincipal;1"].createInstance(Ci.nsIPrincipal), {
        wantComponents: true,
        sandboxName: "user_chrome_files"
    });
//  Object.assign(sandbox, {Cc, Ci, Cu}); // для FF < 60
    Cu.evalInSandbox(`
        try {
            Cu.importGlobalProperties(["ChromeUtils"]);
        } catch(ex) {
            if (!("ChromeUtils" in this))
                Object.defineProperty(this, "ChromeUtils", {
                    configurable: true,
                    enumerable: true,
                    value: {
                        import(module, scope = {}) {
                            return Cu.import(module, scope);
                        },
                    },
                    writable: true,
                });
        }
        var {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");
        var user_chrome_files_sandbox = {
            subScript: {},
            init() {
                Services.obs.addObserver(this, "domwindowopened", false);
                Services.obs.addObserver(this, "profile-after-change", false);
            },
            observe(aSubject, aTopic, aData) {
                ({
                    "domwindowopened": () => {
                        if (!(aSubject instanceof Ci.nsIDOMWindow)) return;
                        aSubject.addEventListener("DOMContentLoaded", () => {
                            var loc = aSubject.location;
                            if (loc && loc.protocol == "chrome:") {
                                try {
                                    this.subScript.user_chrome.loadIntoWindow(aSubject, loc.href);
                                } catch(ex) { }
                            }
                        }, { once: true, capture: true });
                    },
                    "profile-after-change": () => {
                        Services.obs.removeObserver(this, "profile-after-change");
                        var file = Services.dirsvc.get("UChrm", Ci.nsIFile);
                        file.append("user_chrome_files");
                        file.append("user_chrome.manifest");
                        if (!file.exists() || !file.isFile()) {
                            this.removeObs();
                            return;
                        }
                        try {
                            Components.manager.QueryInterface(Ci.nsIComponentRegistrar)
                            .autoRegister(file);
                        } catch(ex) {
                            this.removeObs();
                            return;
                        }

                        try {
                            Services.scriptloader.loadSubScript("chrome://user_chrome_files/content/user_chrome.js", this.subScript, "UTF-8");
                        } catch(ex) {
                            this.removeObs();
                        }
                    },
                })[aTopic]();
            },
            removeObs() {
                Services.obs.removeObserver(this, "domwindowopened");
            },
        };
        user_chrome_files_sandbox.init();
    `, sandbox);
})();} catch(ex) {
    if ("Cu" in globalThis)
        Cu.reportError(ex);
    else
        Components.utils.reportError(ex);
}

// lockPref("extensions.legacy.enabled", true);
// lockPref("xpinstall.signatures.required", false);
// lockPref("extensions.experiments.enabled", true);
// lockPref("extensions.langpacks.signatures.required", false);
