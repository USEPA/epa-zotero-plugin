var EpaZoteroPlugin;

function log(msg) {
	Zotero.debug("EPA Zotero Plugin: " + msg);
}

function install() {}

async function startup({ id, version, rootURI }) {
	// Zotero.PreferencePanes.register({
	// 	pluginID: 'epa-zotero-plugin@epa.gov',
	// 	src: rootURI + 'preferences.xhtml',
	// 	scripts: [rootURI + 'preferences.js']
	// });
	
	Services.scriptloader.loadSubScript(rootURI + 'epa-zotero-plugin.js');
	EpaZoteroPlugin.init({ id, version, rootURI });
	EpaZoteroPlugin.addToAllWindows();
	EpaZoteroPlugin.setupPrefsWindowWatcher();
	//await EpaZoteroPlugin.main();
}

function onMainWindowLoad({ window }) {
	EpaZoteroPlugin.addToWindow(window);
}

function onMainWindowUnload({ window }) {
	EpaZoteroPlugin.removeFromWindow(window);
}

function shutdown() {
	EpaZoteroPlugin.removeFromAllWindows();
	EpaZoteroPlugin.shutdownPrefsWindowWatcher();
	EpaZoteroPlugin.initialized = false;
	EpaZoteroPlugin = undefined;
}

function uninstall() {}
