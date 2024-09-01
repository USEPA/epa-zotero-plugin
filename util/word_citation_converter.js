// ## Endnote to Zotero Word Conversion Script
// By: Andy Chase
// 2024-08-31
// What it does: Converts Endnote inline citations to Zotero inline citations
// Instructions to convert a Endnote word file to a Zotero one.

// How to use:
// 1. First, export your database from Endnote. You need to export using the RIS format as described here to maintain the IDs: https://www.zotero.org/support/kb/endnote_import . You will need to follow the steps including opening the config.
// 2. Next in your Zotero database, you need to run a script which will move the IDs to a special field. In Zotero run Tools -> Developer -> Run Javascript. Copy/paste zotero_import_script.js code in there
// 3. In your word document, you need to add all your zotero citations as inline citations. Click add citation, click z on far left click classic. Click mulitple. Add all. Add. You can remove this mega citation after you are done.
// 4. Add "Build" add on to word
// 5. Click samples, first one. Copy/paste the office script code. Click run. Click button.
// 6. Click "refresh in zotero".
// 7. You may want to test editing an author's name in Zotero and clicking refresh to confirm it worked.


// Example of what citations look like before and after :
// Before: <w:instrText xml:space="preserve"> ADDIN EN.CITE &lt;EndNote&gt;&lt;Cite&gt;&lt;Author&gt; ...
// After: <w:instrText xml:space="preserve"> ADDIN ZOTERO_ITEM CSL_CITATION {"citationID":"...","properties" ...

Office.onReady(() => {
    console.log("Office is ready");
});

document.getElementById("run").addEventListener("click", () => tryCatch(run));

function run() {
    return Word.run(function (context) {
        var documentBody = context.document.body;
        var ooxml = documentBody.getOoxml();

        return context.sync().then(function () {
            var zoteroMapping = parseZoteroItemsFromOoxml(ooxml.value);

            // TODO * Look for Endnote Inline citations (which look like <w:instrText xml:space="preserve"> ADDIN EN.CITE RecNum&gt;1&lt; ... </w:instrText>)
            // Search for Endnote Inline Citations in OOXML
            var updatedOoxml = replaceEndnoteCitationsWithZotero(ooxml.value, zoteroMapping);

            // Set the modified OOXML back to the document
            documentBody.insertOoxml(updatedOoxml, Word.InsertLocation.replace);
        });
    });
}

function parseZoteroItemsFromOoxml(ooxml) {
    var zoteroMapping = {};
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(ooxml, "application/xml");
    // Use XPath to find all <w:instrText> elements
    var xpath = "//w:instrText[contains(text(), 'ADDIN ZOTERO_ITEM CSL_CITATION')]";
    var namespaceResolver = function(prefix) {
        var ns = {
            'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
        };
        return ns[prefix] || null;
    };

    var instrTextNodes = xmlDoc.evaluate(xpath, xmlDoc, namespaceResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

    // Iterate over the matched nodes
    for (var i = 0; i < instrTextNodes.snapshotLength; i++) {
        var node = instrTextNodes.snapshotItem(i);
        var textContent = node.textContent.trim();

        var jsonString = textContent.substring("ADDIN ZOTERO_ITEM CSL_CITATION ".length);

        try {
            JSON.parse(jsonString).citationItems.forEach((item) => {
                var endNoteRef = item.itemData.note.match(/ENDNOTE_REF: (\d+)/);
                if (endNoteRef) {
                    var refNumber = endNoteRef[1]; // Extract reference number
                    zoteroMapping[refNumber] = item.itemData.id;
                }
            });
        } catch (error) {
            console.error("Invalid JSON format: ", error);
        }
    }

    return zoteroMapping;
}

function replaceEndnoteCitationsWithZotero(ooxml, zoteroMapping) {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(ooxml, "application/xml");

    // Use XPath to find all EndNote citations
    var xpath = "//w:instrText[contains(text(), 'ADDIN EN.CITE')]";
    var namespaceResolver = function(prefix) {
        var ns = {
            'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
        };
        return ns[prefix] || null;
    };

    var instrTextNodes = xmlDoc.evaluate(xpath, xmlDoc, namespaceResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

    // Iterate over the matched nodes
    for (var i = 0; i < instrTextNodes.snapshotLength; i++) {
        var node = instrTextNodes.snapshotItem(i);
        var textContent = node.textContent.trim();

        // Detect the endnote id (using RecNum&gt;1&lt; extract the 1, for example)
        var endnoteMatch = textContent.match(/RecNum>(\d+)</);
        if (endnoteMatch) {
            var endnoteID = endnoteMatch[1]; // Extract the ID (e.g., 1)

            if (zoteroMapping[endnoteID]) {
                // Create a new <w:instrText> element with Zotero format
                var newInstrTextNode = xmlDoc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:instrText');
                newInstrTextNode.setAttribute('xml:space', 'preserve');
                var zoteroTemplate = `ADDIN ZOTERO_ITEM CSL_CITATION {"citationID":"","properties":{"formattedCitation":"","plainCitation":"","noteIndex":0},"citationItems":[{"id":"${zoteroMapping[endnoteID]}"}]}`;
                newInstrTextNode.textContent = zoteroTemplate;

                // Replace the old node with the new one
                node.parentNode.replaceChild(newInstrTextNode, node);
            }
        }
    }

    // Serialize the XML document back to a string
    var serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
}

function tryCatch(callback) {
    Promise.resolve()
        .then(callback)
        .catch(function (error) {
            console.error(error);
        });
}
