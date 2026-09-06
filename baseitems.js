import { texParser, ParseDetailDict } from './modules/texParser.js';
import { msParser } from './modules/msParser.js';

const dictionaryFileInput = document.getElementById('dictionary-file-input');
const detailsFileInput = document.getElementById('details-file-input');
const importDictionaryBtn = document.getElementById('import-dictionary-file');
const importDetailsBtn = document.getElementById('import-details-file');
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
        importDetailsBtn.removeAttribute("disabled");
        pstrings = msParser(rawContent);
        jsonPreview.textContent = JSON.stringify(pstrings, null, 2);
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
    };

    reader.readAsText(file);
});
