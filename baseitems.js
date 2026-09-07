import { texParser, generateFiles, ParseDetailDict } from './modules/texParser.js';
import { msParser } from './modules/msParser.js';
import { tabManager } from './modules/tabManager.js';

const dictionaryFileInput = document.getElementById('dictionary-file-input');
const detailsFileInput = document.getElementById('details-file-input');
const jsonFileInput = document.getElementById('json-file-input');
const importDictionaryBtn = document.getElementById('import-dictionary-file');
const importDetailsBtn = document.getElementById('import-details-file');
const importJsonBtn = document.getElementById('import-json-file');
const exportJsonBtn = document.getElementById('export-json-file');

let pstrings = {};
let details = {};

function enableExportButton() {
    const hasData = Array.isArray(details) ? details.length > 0 : Object.keys(details).length > 0;
    if (hasData) {
        exportJsonBtn.removeAttribute("disabled");
    } else {
        exportJsonBtn.addAttribute("disabled");
    }
}

importDictionaryBtn.addEventListener('click', () => {
    dictionaryFileInput.click();
});

importDetailsBtn.addEventListener('click', () => {
    detailsFileInput.click();
});

importJsonBtn.addEventListener('click', () => {
    jsonFileInput.click();
});

dictionaryFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        const rawContent = e.target.result;
        tabManager.addTab('dictionary-tab', "Base_Items.ms", rawContent);

        pstrings = msParser(rawContent);
        importDetailsBtn.removeAttribute("disabled");
    };

    reader.readAsText(file);
});

detailsFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        const rawContent = e.target.result;
        details = texParser(rawContent, ParseDetailDict, pstrings);
        tabManager.addTab('details-tab', "Details.details", rawContent);

        const output = JSON.stringify(details, null, 2);
        tabManager.addTab('json-data-tab', "JSON Data", output);

        enableExportButton();
    };

    reader.readAsText(file);
});

jsonFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        let jsonData;
        try {
            jsonData = JSON.parse(e.target.result);
        } catch (err) {
            alert("Invalid JSON file: " + err.message);
            return;
        }
        details = jsonData;

        const output = JSON.stringify(details, null, 2);
        tabManager.addTab('json-data-tab', "JSON Data", output);

        const { rawText, dictionary } = generateFiles(details, ParseDetailDict);
        tabManager.addTab('details-tab', "Details.details", rawText);
        tabManager.addTab('dictionary-tab', "Base_Items.ms", dictionary);

        enableExportButton();
    };

    reader.readAsText(file);
});

exportJsonBtn.addEventListener('click', () => {
    const jsonString = JSON.stringify(details, null, 2);
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
});
