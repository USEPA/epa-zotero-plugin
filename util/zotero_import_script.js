// ## Zotero import conversion script
// By: Andy Chase
// 2024-06-24
// What it does: Converts extra imported information from attached notes into the "extra" field.
// How to use:
// 1. Export references from Endnote (file -> export, save as type .txt, output style refman (ris) export)
// 2. Import from zotero (https://www.zotero.org/support/kb/endnote_import) Use the RIS format instructions at end! Espectially RIS.import.ignoreUnknown
// 3. In Zotero, tools -> developer -> javascript console
// 4. Paste this script in

// Example of what the string looks like after Zotero import:
//
// The following values have no corresponding Zotero field:  
// Label: 7661953  
// ID - 1
//
// Here's the format for the extras field:
// HERO: 123345 ENDNOTE_REF: 1

function convertNote(note) {
    // Only convert notes with this value
    // indexOf because if someone edits the field then it will start with html like <p>
    const prefix = "The following values have no corresponding Zotero field";
    if (!note.indexOf(prefix) == -1) {
        return;
    }
    const patterns = {
        'HERO': /Label: +(\d+)/,
        'ENDNOTE_REF': /ID +- *(\d+)/
    };
    var results = '';
    for (const key in patterns) {
        const match = note.match(patterns[key]);
        if (match) {
            if (results) {
                results = `${results} `
            }
            results = `${results}${key}: ${match[1]}`;
        }
    }
    return results;
}

// For item in library
var fieldName = "extra";
var extraFieldID = Zotero.ItemFields.getID(fieldName);
var s = new Zotero.Search();
s.addCondition('deleted', 'false');
s.libraryID = ZoteroPane.getSelectedLibraryID();
var ids = await s.search();
var error = "";
return Zotero.DB.executeTransaction(async function () {
    let notesToDelete = [];
    for (let id of ids) {
        let item = await Zotero.Items.getAsync(id);
        // Look for notes
        try {
            var notes = await item.getNotes()
        } catch (_) {
            // Must have selected something that isn't an item.
            // For example notes show up in this search, 
            //   but when you try to get notes on a note it throws an error.
            continue;
        }
        // For note in notes
        for (let noteID of notes) {
            // Get note and convert the text to the extras format
            
            let note = await Zotero.Items.getAsync(noteID);
            let noteText = note.getNote();
            let convertedNoteText = convertNote(noteText);
            console.log(convertedNoteText);
            // Note found, erase the note and pop out
            if (convertedNoteText) {
                // Add to extras field
                let mappedFieldID = Zotero.ItemFields.getFieldIDFromTypeAndBase(item.itemTypeID, fieldName)
                mappedFieldID = mappedFieldID ? mappedFieldID : extraFieldID;
                // Existing text in extras field, abort
                if (item.getField(mappedFieldID)) {
                    break;
                }
                item.setField(mappedFieldID, convertedNoteText);
                await item.save();
                // Erase note
                notesToDelete.push(noteID);
                break;
            }
        }
    }
    return notesToDelete;
}).then(async function (notesToDelete) {
    // I delete in a seperate transaction becuase including this in the execute transaction above causes a timeout
    await Zotero.Items.erase(notesToDelete);
}).then(async function () {
    // Show something in the user window
    return "Success!"
}).catch(async function (functionError) {
    return functionError;
});