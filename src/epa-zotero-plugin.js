var EpaZoteroPlugin = {
	id: null,
	version: null,
	rootURI: null,
	initialized: false,
	addedElementIDs: [],
	
	init({ id, version, rootURI }) {
		if (this.initialized) return;
		this.id = id;
		this.version = version;
		this.rootURI = rootURI;
		this.initialized = true;
	},
	
	log(msg) {
		Zotero.debug("EPA Zotero Plugin: " + msg);
	},
	
	addToWindow(window) {
		let doc = window.document;
		
		// Add a stylesheet to the main Zotero pane
		let link1 = doc.createElement('link');
		link1.id = 'epa-zotero-plugin-stylesheet';
		link1.type = 'text/css';
		link1.rel = 'stylesheet';
		link1.href = this.rootURI + 'style.css';
		doc.documentElement.appendChild(link1);
		this.storeAddedElement(link1);
		
		// Use Fluent for localization
		window.MozXULElement.insertFTLIfNeeded("epa-zotero-plugin.ftl");
		
		// Add menu option
		// let menuitem = doc.createXULElement('menuitem');
		// menuitem.id = 'make-it-green-instead';
		// menuitem.setAttribute('type', 'checkbox');
		// menuitem.setAttribute('data-l10n-id', 'make-it-red-green-instead');
		// // MozMenuItem#checked is available in Zotero 7
		// doc.getElementById('menu_viewPopup').appendChild(menuitem);
		// this.storeAddedElement(menuitem);
	},
	
	addToAllWindows() {
		var windows = Zotero.getMainWindows();
		for (let win of windows) {
			if (!win.ZoteroPane) continue;
			this.addToWindow(win);
		}
	},
	
	storeAddedElement(elem) {
		if (!elem.id) {
			throw new Error("Element must have an id");
		}
		this.addedElementIDs.push(elem.id);
	},

	removeFromWindow(window) {
		var doc = window.document;
		// Remove all elements added to DOM
		for (let id of this.addedElementIDs) {
			doc.getElementById(id)?.remove();
		}
		doc.querySelector('[href="epa-zotero-plugin.ftl"]').remove();
	},
	
	removeFromAllWindows() {
		var windows = Zotero.getMainWindows();
		for (let win of windows) {
			if (!win.ZoteroPane) continue;
			this.removeFromWindow(win);
		}
	},

	setupPrefsWindowWatcher() {
		Services.wm.addListener({onOpenWindow: this.patchPrefsWindow});
	},

	shutdownPrefsWindowWatcher() {
		Services.wm.removeListener({onOpenWindow: this.patchPrefsWindow});
	},

	patchPrefsWindow(window) {
		// The timeout needs to be changed to use promises or mutation observer
		let domWindow = window.docShell.domWindow;
		async function onload() {
			domWindow.removeEventListener("load", onload, false);
			if (
				domWindow.location.href
				!== "chrome://zotero/content/preferences/preferences.xhtml"
			) {
				return;
			}
			setTimeout(function() {
			var syncPrefPane = domWindow.document.getElementById("zotero-prefpane-sync").parentElement;
			var textElement = domWindow.document.createElement('html:div');
			textElement.textContent = "Zotero cloud sync has been disabled for EPA";
			syncPrefPane.appendChild(textElement);
		}, 2000)
		}
		domWindow.addEventListener("load", onload, false);
	},

	addEpaText(win) {

	},

	async main() {
	},
};
