import { texParser, ParseDetailDict } from './modules/texParser.js';
import { msParser } from './modules/msParser.js';

const dictionaryFileInput = document.getElementById('dictionary-file-input');
const detailsFileInput = document.getElementById('details-file-input');
const importDictionaryBtn = document.getElementById('import-dictionary-file');
const importDetailsBtn = document.getElementById('import-details-file');
const exportJsonBtn = document.getElementById('export-json-file');
const jsonPreview = document.getElementById('json-preview');

let pstrings = {}
let details = {}

importDictionaryBtn.addEventListener('click', () => {
    dictionaryFileInput.click();
});

importDetailsBtn.addEventListener('click', () => {
    detailsFileInput.click();
});

dictionaryFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        const rawContent = e.target.result;
        pstrings = msParser(rawContent);
        jsonPreview.textContent = JSON.stringify(pstrings, null, 2);
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
        jsonPreview.textContent = JSON.stringify(details, null, 2);
        exportJsonBtn.removeAttribute("disabled");
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
