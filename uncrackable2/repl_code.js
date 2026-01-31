code to be used after bypass.js gives access to repl
https://g.co/gemini/share/f5175c3b576e
gemini convo related to challenge

/**
 * UnCrackable Level 3 - Master Bypass & Secret Extraction Script
 */

function extractSecret() {
    try {
        var lib = Process.getModuleByName("libfoo.so");
        var key = "pizzapizzapizzapizzapizz"; // 24 bytes
        var ciphertextOffset = 0x34b0; // Found in library data segment
        var ciphertextAddr = lib.base.add(ciphertextOffset);

        // Read raw encrypted bytes directly from memory
        var cipherBytes = ciphertextAddr.readByteArray(24);
        var uint8View = new Uint8Array(cipherBytes);
        
        var secret = "";
        for (var i = 0; i < 24; i++) {
            // XOR logic: Ciphertext ^ Key = Secret
            secret += String.fromCharCode(uint8View[i] ^ key.charCodeAt(i));
        }

        console.log("\n======================================");
        console.log("THE SECRET IS: " + secret);
        console.log("======================================");
    } catch (e) {
        // If libfoo.so isn't loaded yet, we wait and retry
        setImmediate(extractSecret);
    }
}

function hook_libc() {
    var libc = Process.getModuleByName("libc.so");

    // 1. Silent strstr hook to hide Frida
    var strstrPtr = libc.findExportByName("strstr");
    if (strstrPtr) {
        Interceptor.attach(strstrPtr, {
            onEnter: function (args) {
                this.frida = false;
                var needle = args[1].readUtf8String();
                if (needle && (needle.indexOf("frida") !== -1 || needle.indexOf("xposed") !== -1)) {
                    this.frida = true;
                }
            },
            onLeave: function (retval) {
                if (this.frida) retval.replace(ptr(0));
            }
        });
    }

    // 2. Block exit calls to prevent the app from closing
    var exitPtr = libc.findExportByName("exit");
    if (exitPtr) {
        Interceptor.replace(exitPtr, new NativeCallback(function (code) {
            console.log("[!] Blocked exit(" + code + ")");
        }, 'void', ['int']));
    }
}

// Global Exception Handler to catch anti-debugging traps
Process.setExceptionHandler(function (details) {
    return true; 
});

Java.perform(function () {
    console.log("[*] Initializing Master Bypass...");

    hook_libc();

    // Bypass Java-level integrity and debug checks
    try {
        var MainActivity = Java.use("sg.vantagepoint.uncrackable3.MainActivity");
        MainActivity.verifyLibs.implementation = function () { return; };

        var IntegrityCheck = Java.use("sg.vantagepoint.uncrackable3.IntegrityCheck");
        IntegrityCheck.isDebuggable.implementation = function () { return false; };
        IntegrityCheck.isRooted.implementation = function () { return false; };
    } catch (e) {
        console.log("[-] Java hook skip: " + e.message);
    }

    console.log("[*] Bypasses active. Extracting secret...");
    
    // Start extraction loop
    extractSecret();
});
