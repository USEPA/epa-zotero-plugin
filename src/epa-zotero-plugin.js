var EpaZoteroPlugin = {
    id: null,
    version: null,
    rootURI: null,
    initialized: false,
    prefWindowListener: null,
    addedElementIDs: [],
    oldSyncReminderSetting: null,
    oldConfig: {
        API_URL: "", // https://
        STREAMING_URL: "", // wss://
        PROXY_AUTH_URL: "", //"https://  .s3.amazonaws.com/test'"
    },

    init({
        id,
        version,
        rootURI
    }) {
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
        this.patchConfig(window.ZOTERO_CONFIG);

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
        this.unPatchConfig(window.ZOTERO_CONFIG);
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
    	if (!this.prefWindowListener) {
    		this.prefWindowListener = this.makePatchPrefsWindow(this);
    	}
        Services.wm.addListener({
            onOpenWindow: this.prefWindowListener
        });
    },

    shutdownPrefsWindowWatcher() {
        Services.wm.removeListener({
            onOpenWindow: this.prefWindowListener
        });
        this.prefWindowListener = null;
    },

    makePatchPrefsWindow(_this) { return (window) => {
        let domWindow = window.docShell.domWindow;
        Zotero.debug(domWindow);
        async function onload() {
            domWindow.removeEventListener("load", onload, false);
            if (
                domWindow.location.href !==
                "chrome://zotero/content/preferences/preferences.xhtml"
            ) {
                return;
            }
            if(!_this.initialized) {
                return;
            }

            // Add css
            var doc = domWindow.document;
            let link1 = doc.createElement('link');
	        link1.id = 'epa-zotero-plugin-stylesheet';
	        link1.type = 'text/css';
	        link1.rel = 'stylesheet';
	        link1.href = _this.rootURI + 'style.css';
	        doc.documentElement.appendChild(link1);


            var container = domWindow.document;


            new domWindow.MutationObserver((mutations) => {
                var syncPrefPane = container.getElementById("zotero-prefpane-sync");
                if (syncPrefPane && !container.getElementById("zotero-epa-plugin-pref-msg")) {
                    var div = container.createElement('html:div');
                    div.textContent = "Zotero cloud sync has been disabled for EPA";
                    div.id = "zotero-epa-plugin-pref-msg";
                    syncPrefPane.parentElement.appendChild(div);
                }
                //if (container.getElementById('sync-unauthorized')) {
                //    container.getElementById('sync-unauthorized').parentElement.hidden = true;
                //}
            }).observe(container, {
                childList: true,
                subtree: true
            });



        }
        domWindow.addEventListener("load", onload, false);
    }},

    patchConfig(ZOTERO_CONFIG) {
        if (this.oldSyncReminderSetting === null) {
            this.oldSyncReminderSetting = Zotero.Prefs.get('sync.reminder.setUp.enabled');
        }
        Zotero.Prefs.set('sync.reminder.setUp.enabled', false);
        for (const key of Object.keys(this.oldConfig)) {
            if(!this.oldConfig[key]) {
                this.oldConfig[key] = ZOTERO_CONFIG[key];
            }
            ZOTERO_CONFIG[key] = "";
            Zotero.Prefs.set(key, "", null);
        }
    },
    
    unPatchConfig(ZOTERO_CONFIG) {
        if (this.oldSyncReminderSetting === null) {
            this.oldSyncReminderSetting = true;
        }
        Zotero.Prefs.set('sync.reminder.setUp.enabled', this.oldSyncReminderSetting);
        for (const [key, value] of Object.entries(this.oldConfig)) {
            Zotero.Prefs.set(key, value, null);
            ZOTERO_CONFIG[key] = value;
        }
    },

    async main() {},
};