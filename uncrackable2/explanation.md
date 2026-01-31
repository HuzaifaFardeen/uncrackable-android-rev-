This is the process i used to get the secret from owasp uncrackable l3 in android16 using ghidra, jadx-gui, frida=17.6.2
this is not particularly detailed rn and I will further explain it later.
in short after the setup and static analysis I ran command "frida -U -f owasp.mstg.uncrackable3 -l bypass.js"
it might show some errors but if the app did not crash press enter and congrats you are now in the app REPL
now use the repl_code.js and it should print the secret if the architecture you used was arm65-v8a
i will also upload a repl script that extracts the secret for all architectures.
