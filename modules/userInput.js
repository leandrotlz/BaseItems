import { addTextTab, addComparisonTab, addWarningsTab } from './uiTabs.js';
import { addBaseItemsTab } from './uiBaseItems.js';
import { loadJson, saveJson, importData, exportFiles, compareJson, getState, getDetails, hasDetails } from './dataStore.js';

const dictionaryFileInput = document.getElementById('dictionary-file-input');
const detailsFileInput = document.getElementById('details-file-input');
const jsonFileInput = document.getElementById('json-file-input');
const compareJsonFileInput = document.getElementById('compare-json-file-input');

const openJsonBtn = document.getElementById('open-json-btn');
const saveJsonBtn = document.getElementById('save-json-btn');
const importDataBtn = document.getElementById('import-data-btn');
const exportDataBtn = document.getElementById('export-data-btn');
const compareJsonBtn = document.getElementById('compare-json-btn');

const importDialog = document.getElementById('import-dialog');
const importDialogCancel = document.getElementById('import-dialog-cancel');
const chooseDictionaryBtn = document.getElementById('choose-dictionary-file');
const chooseDetailsBtn = document.getElementById('choose-details-file');
const dictionaryFileName = document.getElementById('dictionary-file-name');
const detailsFileName = document.getElementById('details-file-name');

let dictionaryFile = null;
let detailsFile = null;

function enableButtons() {
    for (const btn of [saveJsonBtn, exportDataBtn, compareJsonBtn]) {
        if (hasDetails()) {
            btn.removeAttribute("disabled");
        } else {
            btn.setAttribute("disabled", "");
        }
    }
}

function readFileAsText(file, onLoad) {
    const reader = new FileReader();
    reader.onload = (e) => onLoad(e.target.result);
    reader.readAsText(file);
}

function readJsonFile(file, onParsed) {
    readFileAsText(file, (rawContent) => {
        let jsonData;
        try {
            jsonData = JSON.parse(rawContent);
        } catch (err) {
            alert("Invalid JSON file: " + err.message);
            return;
        }
        onParsed(jsonData);
    });
}

function downloadFile(fileName, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    // It's 2026 and we're still faking clicks to trigger a download...
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function exportJson() {
    downloadFile('Details.json', saveJson(), 'application/json');
}

function exportData() {
    const { rawText, dictionary } = exportFiles();
    addTextTab('details-tab', "Details.details", rawText, true, false);
    addTextTab('dictionary-tab', "Base_Items.ms", dictionary, true, false);
    downloadFile('Details.details', rawText, 'text/plain');
    downloadFile('Base_Items.ms', dictionary, 'text/plain');
}

function showTabs() {
    // Show JSON output for debug purposes, likely deprecated in the future.
    addTextTab('json-data-tab', "JSON Data", saveJson(), true, false);
    addBaseItemsTab(getState().Details, true);
    enableButtons();
}

function loadJsonData(jsonData) {
    if (!loadJson(jsonData)) {
        alert("JSON file is invalid.");
        return;
    }
    showTabs();
}

function showComparison(jsonData) {
    const newDetails = getDetails(jsonData);
    if (!hasDetails() || !newDetails) {
        alert("JSON file is invalid.");
        return;
    }

    addComparisonTab('json-comparison-tab', "JSON Comparison", compareJson(newDetails));
}

function openImportDialog() {
    dictionaryFile = null;
    detailsFile = null;
    dictionaryFileInput.value = '';
    detailsFileInput.value = '';
    dictionaryFileName.textContent = '';
    detailsFileName.textContent = '';
    importDialog.showModal();
}

function importDataFiles() {
    if (!dictionaryFile || !detailsFile) return;
    importDialog.close();
    readFileAsText(dictionaryFile, (dictionaryText) => {
        readFileAsText(detailsFile, (detailsText) => {
            const warnings = importData(detailsText, dictionaryText);
            // Show raw data for debug purposes, likely deprecated in the future.
            addTextTab('dictionary-tab', "Base_Items.ms", dictionaryText);
            addTextTab('details-tab', "Details.details", detailsText, true, false);
            showTabs();
            // Warning tabs added last so it takes focus.
            addWarningsTab(warnings);
        });
    });
}

export function addListeners() {
    openJsonBtn.addEventListener('click', () => {
        jsonFileInput.click();
    });

    importDataBtn.addEventListener('click', openImportDialog);

    chooseDictionaryBtn.addEventListener('click', () => dictionaryFileInput.click());

    dictionaryFileInput.addEventListener('change', () => {
        const file = dictionaryFileInput.files[0];
        if (!file) return;
        dictionaryFile = file;
        dictionaryFileName.textContent = file.name;
        importDataFiles();
        dictionaryFileInput.value = '';
    });

    chooseDetailsBtn.addEventListener('click', () => detailsFileInput.click());

    detailsFileInput.addEventListener('change', () => {
        const file = detailsFileInput.files[0];
        if (!file) return;
        detailsFile = file;
        detailsFileName.textContent = file.name;
        importDataFiles();
        detailsFileInput.value = '';
    });

    importDialogCancel.addEventListener('click', () => importDialog.close());

    saveJsonBtn.addEventListener('click', exportJson);

    exportDataBtn.addEventListener('click', exportData);

    jsonFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        readJsonFile(file, loadJsonData);
    });

    compareJsonBtn.addEventListener('click', () => {
        compareJsonFileInput.click();
    });

    compareJsonFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        readJsonFile(file, showComparison);
    });
}
