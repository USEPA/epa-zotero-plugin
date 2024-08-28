# EPA Zotero Plugin

Supports Zotero 7 only.

Currently what this plugin does is disable the build-in Cloud Sync features from Zotero. This is to allow the software to be used at EPA.

## Build
To build, run `./make-zips` and install the XPI from ./build in the Zotero Add-ons window. 

## Developing
See [Setting Up a Plugin Development Environment](https://www.zotero.org/support/dev/client_coding/plugin_development#setting_up_a_plugin_development_environment) to run from source.

## Releasing
Uploading a new tag to this repository kicks off a GitHub action which builds and creates a new release. Zotero clients will automatically check for this an update from this GitHub repository. Definitely check your plugin thoroughly before as if clients update to a broken plugin they might not be able to automatically update to a working on.

## Compiling/Signing installer

On the off chance a new installer is needed these are the commands:

You will need makesnsis program with the inet plugin. You will also need the signtool from "windows kits".

```
cd win-install
makensis install.nsis
signtool sign /fd SHA256 /a /tr http://timestamp.digicert.com /td SHA256 /d "EPA Zotero Installer" /du "http://www.epa.gov" /v "EPA_Zotero_Installer.exe"
```
