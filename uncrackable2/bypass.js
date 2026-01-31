// UnCrackable Level 3 Bypass v4.1 (Silent Mode)
// Modifications: Reduced logging for REPL usability

function hook_libc() {
    console.log("[*] Searching for libc...");
    var libc = null;
    try {
        libc = Process.getModuleByName("libc.so");
    } catch (e) {
        var modules = Process.enumerateModules();
        for (var i = 0; i < modules.length; i++) {
            if (modules[i].name.indexOf("libc.so") !== -1) {
                libc = modules[i];
                break;
            }
        }
    }

    if (!libc) {
        console.log("[!] FATAL: Could not find libc.so module.");
        return;
    }
    console.log("[+] Found libc: " + libc.name + " @ " + libc.base);

    function findExport(name) {
        var p = libc.findExportByName(name);
        if (!p) {
            var exports = libc.enumerateExports();
            for (var i = 0; i < exports.length; i++) {
                if (exports[i].name === name) {
                    return exports[i].address;
                }
            }
        }
        return p;
    }

    // 1. Hook strstr (SILENCED)
    var strstrPtr = findExport("strstr");
    if (strstrPtr) {
        Interceptor.attach(strstrPtr, {
            onEnter: function (args) {
                this.haystack = args[0];
                this.needle = args[1];
                this.frida = false;
                if (!this.haystack.isNull() && !this.needle.isNull()) {
                    try {
                        var s = this.needle.readUtf8String();
                        if (s && (s.indexOf("frida") !== -1 || s.indexOf("xposed") !== -1 || s.indexOf("gum-js-loop") !== -1)) {
                            this.frida = true;
                            // [SILENCED] Do not print here, it spams the console
                            // console.log("[-] Intercepted strstr check for: " + s);
                        }
                    } catch (e) { }
                }
            },
            onLeave: function (retval) {
                if (this.frida) {
                    retval.replace(ptr(0));
                }
            }
        });
        console.log("[+] Hooked strstr (Silent Mode)");
    }

    // 2. Hook exit
    var exitPtr = findExport("exit");
    if (exitPtr) {
        Interceptor.replace(exitPtr, new NativeCallback(function (code) {
            console.log("[!] Intercepted exit(" + code + ") - BLOCKED");
        }, 'void', ['int']));
        console.log("[+] Hooked exit");
    }
}

// Global Exception Handler (SILENCED)
Process.setExceptionHandler(function (details) {
    if (details.type === 'breakpoint' || details.signal === 6 /* SIGABRT */) {
        // [SILENCED] The app might hit this 100 times a second. 
        // We suppress the log so you can type in REPL.
        return true;
    }
    return false;
});


Java.perform(function () {
    console.log("[*] Java Layer Starting...");

    hook_libc();

    try {
        var MainActivity = Java.use("sg.vantagepoint.uncrackable3.MainActivity");
        MainActivity.verifyLibs.implementation = function () {
            // [SILENCED] One-time log is fine, but keeping it minimal
            // console.log("[-] Bypassing verifyLibs"); 
        };
    } catch (e) {
        console.log("[!] MainActivity hook error: " + e.message);
    }

    try {
        var IntegrityCheckName = "sg.vantagepoint.uncrackable3.IntegrityCheck";
        var IntegrityCheck = Java.use(IntegrityCheckName);
        IntegrityCheck.isDebuggable.implementation = function () {
            return false;
        };
    } catch (e) {
        Java.choose(IntegrityCheckName, {
            onMatch: function (instance) { },
            onComplete: function () { }
        });
    }

    console.log("[*] Setup complete. Logs silenced. Ready for REPL commands.");
});