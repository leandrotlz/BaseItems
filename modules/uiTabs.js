import { tabManager } from './tabManager.js';
import { detailLabel } from './utils.js';

function textTabContent(text) {
    const div = document.createElement('div');
    div.className = 'tab-text';
    div.textContent = text;
    return div;
}

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

export function addTextTab(tabId, title, content, canClose = true, activate = true) {
    tabManager.addTab(tabId, title, textTabContent(content), canClose, activate);
}

export function addComparisonTab(tabId, title, content, canClose = true, activate = true) {
    tabManager.addTab(tabId, title, comparisonTabContent(content), canClose, activate);
}
