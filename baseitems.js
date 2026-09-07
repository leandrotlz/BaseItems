import { texParser, generateFiles, ParseDetailDict } from './modules/texParser.js';
import { msParser } from './modules/msParser.js';
import { tabManager } from './modules/tabManager.js';
import { compareDetails } from './modules/jsonCompare.js';
import { detailLabel } from './modules/utils.js';

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

function textTabContent(text) {
    const div = document.createElement('div');
    div.className = 'tab-text';
    div.textContent = text;
    return div;
}

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

    const reader = new FileReader();

    reader.onload = (e) => {
        const rawContent = e.target.result;
        tabManager.addTab('dictionary-tab', "Base_Items.ms", textTabContent(rawContent));

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
        tabManager.addTab('details-tab', "Details.details", textTabContent(rawContent));

        const output = JSON.stringify(details, null, 2);
        tabManager.addTab('json-data-tab', "JSON Data", textTabContent(output), true, false);

        enableButtons();
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
        tabManager.addTab('json-data-tab', "JSON Data", textTabContent(output));

        const { rawText, dictionary } = generateFiles(details, ParseDetailDict);
        tabManager.addTab('details-tab', "Details.details", textTabContent(rawText), true, false);
        tabManager.addTab('dictionary-tab', "Base_Items.ms", textTabContent(dictionary), true, false);

        enableButtons();
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

compareJsonFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        let newDetails;
        try {
            newDetails = JSON.parse(e.target.result);
        } catch (err) {
            alert("Invalid JSON file: " + err.message);
            return;
        }
        if (!Array.isArray(newDetails) || !Array.isArray(details)) {
            alert("JSON file does not contain a details array.");
            return;
        }

        const result = compareDetails(details, newDetails, ParseDetailDict);
        tabManager.addTab('json-comparison-tab', "JSON Comparison", comparisonTabContent(result));
    };

    reader.readAsText(file);
});

function comparisonTabContent(result) {
    const div = document.createElement('div');
    div.className = 'tab-comparison';

    const summaryLines = [
        `Details with no changes: ${result.unchanged.length}`,
        `Details added: ${result.added.length}`,
        `Details removed: ${result.removed.length}`,
        `Details with changed data: ${result.changedData.length}`,
        `Display with changed text: ${result.changedText.length}`,
    ];
    for (const line of summaryLines) {
        const p = document.createElement('p');
        p.className = 'comparison-summary';
        p.textContent = line;
        div.appendChild(p);
    }

    const sections = [
        { heading: "Details added:", items: result.added },
        { heading: "Details removed:", items: result.removed },
        { heading: "Details with changed data:", items: result.changedData },
        { heading: "Details with changed text:", items: result.changedText },
    ];
    for (const { heading, items } of sections) {
        if (items.length === 0) continue;

        const p = document.createElement('p');
        p.className = 'comparison-summary';
        p.textContent = heading;
        div.appendChild(p);

        const ul = document.createElement('ul');
        ul.className = 'comparison-list';
        for (const item of items) {
            const li = document.createElement('li');
            li.textContent = detailLabel(item);
            ul.appendChild(li);
        }
        div.appendChild(ul);
    }

    return div;
}
