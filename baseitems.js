import { texParser, ParseDetailDict } from './modules/texParser.js';

const detailsFileInput = document.getElementById('details-file-input');
const importDetailsBtn = document.getElementById('import-details-file');
const jsonPreview = document.getElementById('json-preview');

importDetailsBtn.addEventListener('click', () => {
    detailsFileInput.click();
});

detailsFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        const rawContent = e.target.result;
        const parsedData = texParser(rawContent, ParseDetailDict);

        jsonPreview.textContent = JSON.stringify(parsedData, null, 2);
    };

    reader.readAsText(file);
});
