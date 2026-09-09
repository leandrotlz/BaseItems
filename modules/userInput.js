import { texParser, generateFiles, ParseDetailDict } from './texParser.js';
import { msParser } from './msParser.js';
import { compareDetails } from './jsonCompare.js';
import { addTextTab, addComparisonTab } from './uiTabs.js';
import { addBaseItemsTab } from './uiBaseItems.js';
import { detailsToJson, extractDetails } from './utils.js';

const dictionaryFileInput = document.getElementById('dictionary-file-input');
const detailsFileInput = document.getElementById('details-file-input');
const jsonFileInput = document.getElementById('json-file-input');
const compareJsonFileInput = document.getElementById('compare-json-file-input');

const openJsonBtn = document.getElementById('open-json-btn');
const saveJsonBtn = document.getElementById('save-json-btn');
const importDataBtn = document.getElementById('import-data-btn');
// TODO: export-data-btn
const compareJsonBtn = document.getElementById('compare-json-btn');

const importDialog = document.getElementById('import-dialog');
const importDialogCancel = document.getElementById('import-dialog-cancel');
const chooseDictionaryBtn = document.getElementById('choose-dictionary-file');
const chooseDetailsBtn = document.getElementById('choose-details-file');
const dictionaryFileName = document.getElementById('dictionary-file-name');
const detailsFileName = document.getElementById('details-file-name');

let pstrings = {};
let details = {};
let dictionaryFile = null;
let detailsFile = null;

function enableButtons() {
    const hasData = Array.isArray(details) ? details.length > 0 : Object.keys(details).length > 0;
    for (const btn of [saveJsonBtn, compareJsonBtn]) {
        if (hasData) {
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

function exportJson() {
    const jsonString = detailsToJson(details);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Details.json';
    document.body.appendChild(link);
    // It's 2026 and we're still faking clicks to trigger a download...
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function loadDictionary(rawContent) {
    addTextTab('dictionary-tab', "Base_Items.ms", rawContent);

    pstrings = msParser(rawContent);
}

function loadDetails(rawContent) {
    details = texParser(rawContent, ParseDetailDict, pstrings);
    addTextTab('details-tab', "Details.details", rawContent, true, false);

    addTextTab('json-data-tab', "JSON Data", detailsToJson(details), true, false);

    addBaseItemsTab(details, true);
    enableButtons();
}

function loadJson(jsonData) {
    const newDetails = extractDetails(jsonData);
    if (!newDetails) {
        alert("JSON file is invalid.");
        return;
    }
    details = newDetails;

    addTextTab('json-data-tab', "JSON Data", detailsToJson(details), true, false);

    const { rawText, dictionary } = generateFiles(details, ParseDetailDict);
    addTextTab('details-tab', "Details.details", rawText, true, false);
    addTextTab('dictionary-tab', "Base_Items.ms", dictionary, true, false);

    addBaseItemsTab(details, true);
    enableButtons();
}

function showComparison(jsonData) {
    const newDetails = extractDetails(jsonData);
    if (!Array.isArray(details) || !newDetails) {
        alert("JSON file is invalid.");
        return;
    }

    const result = compareDetails(details, newDetails, ParseDetailDict);
    addComparisonTab('json-comparison-tab', "JSON Comparison", result);
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
            loadDictionary(dictionaryText);
            loadDetails(detailsText);
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

    jsonFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        readJsonFile(file, loadJson);
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
