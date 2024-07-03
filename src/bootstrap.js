var EpaZoteroPlugin;

function log(msg) {
	Zotero.debug("EPA Zotero Plugin: " + msg);
}

function install() {
	log("Installed 1.0");
}

async function startup({ id, version, rootURI }) {
	log("Starting 1.0");
	
	Zotero.PreferencePanes.register({
		pluginID: 'github@epa.gov',
		src: rootURI + 'preferences.xhtml',
		scripts: [rootURI + 'preferences.js']
	});
	
	Services.scriptloader.loadSubScript(rootURI + 'epa-zotero-plugin.js');
	EpaZoteroPlugin.init({ id, version, rootURI });
	EpaZoteroPlugin.addToAllWindows();
	await EpaZoteroPlugin.main();
}

function onMainWindowLoad({ window }) {
	EpaZoteroPlugin.addToWindow(window);
}

function onMainWindowUnload({ window }) {
	EpaZoteroPlugin.removeFromWindow(window);
}

function shutdown() {
	log("Shutting down 1.0");
	EpaZoteroPlugin.removeFromAllWindows();
	EpaZoteroPlugin = undefined;
}

function uninstall() {
	log("Uninstalled 1.0");
}
