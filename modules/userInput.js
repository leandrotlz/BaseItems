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
const importDictionaryBtn = document.getElementById('import-dictionary-file');
const importDetailsBtn = document.getElementById('import-details-file');
const importJsonBtn = document.getElementById('import-json-file');
const exportJsonBtn = document.getElementById('export-json-file');
const compareJsonBtn = document.getElementById('compare-json-file');

let pstrings = {};
let details = {};

function enableButtons() {
    const hasData = Array.isArray(details) ? details.length > 0 : Object.keys(details).length > 0;
    for (const btn of [exportJsonBtn, compareJsonBtn]) {
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
    importDetailsBtn.removeAttribute("disabled");
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

export function addListeners() {
    importDictionaryBtn.addEventListener('click', () => {
        dictionaryFileInput.click();
    });

    importDetailsBtn.addEventListener('click', () => {
        detailsFileInput.click();
    });

    importJsonBtn.addEventListener('click', () => {
        jsonFileInput.click();
    });

    compareJsonBtn.addEventListener('click', () => {
        compareJsonFileInput.click();
    });

    dictionaryFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        readFileAsText(file, loadDictionary);
    });

    detailsFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        readFileAsText(file, loadDetails);
    });

    jsonFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        readJsonFile(file, loadJson);
    });

    exportJsonBtn.addEventListener('click', exportJson);

    compareJsonFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        readJsonFile(file, showComparison);
    });
}
