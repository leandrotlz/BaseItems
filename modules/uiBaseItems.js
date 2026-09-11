import { tabManager } from './tabManager.js';
import { searchTokens, searchItems } from './utils.js';

let treeRoot = null;
let selectedRows = new Set();
let anchorRow = null;
let draggedRow = null;

let searchInput = null;

let jsonOutput = null;
let currentDetails = null;

export function addBaseItemsTab(details, activate) {
    if (!Array.isArray(details)) return;

    currentDetails = details;
    selectedRows = new Set();
    anchorRow = null;
    draggedRow = null;

    const content = document.createElement('div');
    content.className = 'bi-viewer';

    const listPanel = document.createElement('div');
    listPanel.className = 'bi-list-panel';
    listPanel.appendChild(buildSearchBar());

    const treeScroll = document.createElement('div');
    treeScroll.className = 'bi-tree-scroll';
    treeRoot = buildTree(details);
    treeScroll.appendChild(treeRoot);
    listPanel.appendChild(treeScroll);

    applySearch();

    const editPanel = document.createElement('div');
    editPanel.className = 'bi-edit-panel';
    jsonOutput = document.createElement('pre');
    jsonOutput.className = 'bi-edit';
    jsonOutput.textContent = '[]';
    editPanel.appendChild(jsonOutput);

    content.appendChild(listPanel);
    content.appendChild(editPanel);

    treeRoot.addEventListener('click', handleClick);
    treeRoot.addEventListener('dragover', handleDragOver);
    treeRoot.addEventListener('drop', handleDrop);

    tabManager.addTab('base-items-tab', "Base Items", content, false, activate);
}

function buildSearchBar() {
    const bar = document.createElement('div');
    bar.className = 'bi-search-bar';

    searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'bi-search-input';
    searchInput.placeholder = 'Search...';
    searchInput.autocomplete = 'off';
    searchInput.spellcheck = false;
    searchInput.addEventListener('input', applySearch);

    const clearSearchBtn = document.createElement('button');
    clearSearchBtn.type = 'button';
    clearSearchBtn.className = 'bi-search-clear';
    clearSearchBtn.textContent = 'Clear';
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        applySearch();
        searchInput.focus();
    });

    bar.appendChild(searchInput);
    bar.appendChild(clearSearchBtn);
    return bar;
}

function applySearch() {
    const tokens = searchTokens(searchInput.value);
    const rows = itemRows();
    const visible = new Set();

    for (const row of rows) {
        const match = searchItems(row._item.DisplayHelp, tokens);
        row.closest('li').classList.toggle('hidden', !match);
        if (match) visible.add(row);
    }

    for (const group of treeRoot.querySelectorAll('li.bi-group')) {
        const anyVisible = group.querySelector('.bi-items li:not(.hidden)') !== null;
        group.classList.toggle('hidden', !anyVisible);
        if (anyVisible && tokens.length > 0) {
            group.querySelector('details').open = true;
        }
    }

    const filterSelection = rows.filter(row => selectedRows.has(row) && visible.has(row));
    if (filterSelection.length !== selectedRows.size) setSelected(filterSelection);
}

function buildTree(details) {
    const groups = new Map();
    const root = document.createElement('ul');
    root.className = 'bi-tree';

    for (const item of details) {
        const key = item.DisplayTabName ?? "(None)";
        let group = groups.get(key);
        if (!group) {
            group = createGroup(key);
            groups.set(key, group);
            root.appendChild(group.li);
        }
        group.list.appendChild(createItemRow(item));
    }
    return root;
}

function createGroup(key) {
    const li = document.createElement('li');
    li.className = 'bi-group';
    li.dataset.tabName = key;

    const items = document.createElement('details');
    const summary = document.createElement('summary');
    summary.className = 'bi-row bi-group-row';
    summary.textContent = key || "(None)";

    const list = document.createElement('ul');
    list.className = 'bi-items';

    items.appendChild(summary);
    items.appendChild(list);
    li.appendChild(items);
    return { li, list };
}

function createItemRow(item) {
    const li = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'bi-row bi-item-row';
    row.draggable = true;
    row.textContent = item.DisplayName || item.Name || "(None)";
    row._item = item;
    row.addEventListener('dragstart', (e) => handleDragStart(e, row));
    row.addEventListener('dragend', () => handleDragEnd(row));
    li.appendChild(row);
    return li;
}

function itemRows() {
    return [...treeRoot.querySelectorAll('.bi-item-row')];
}

function handleClick(e) {
    const row = e.target.closest('.bi-item-row');
    if (!row) return;

    if (e.shiftKey && anchorRow) {
        const rows = itemRows();
        const from = rows.indexOf(anchorRow);
        const to = rows.indexOf(row);
        if (from !== -1 && to !== -1) {
            const range = rows.slice(Math.min(from, to), Math.max(from, to) + 1);
            // Hidden items are being filtered out by a search, ignore them.
            setSelected(range.filter(row => !row.closest('li').classList.contains('hidden')));
        }
        return;
    }

    if (e.ctrlKey || e.metaKey) {
        const next = new Set(selectedRows);
        if (next.has(row)) {
            next.delete(row);
        } else {
            next.add(row);
        }
        anchorRow = row;
        setSelected(next);
        return;
    }

    anchorRow = row;
    setSelected([row]);
}

function setSelected(rows) {
    for (const row of selectedRows) row.classList.remove('bi-selected');
    selectedRows = new Set(rows);
    for (const row of selectedRows) row.classList.add('bi-selected');
    refreshEditPanel();
}

function refreshEditPanel() {
    const selected = itemRows().filter(row => selectedRows.has(row));
    jsonOutput.textContent = JSON.stringify(selected.map(row => row._item), null, 2);
}

function handleDragStart(e, row) {
    // Drag and drop reordering is only possible when all items are visible;
    // don't allow it if a search is active.
    if (searchInput.value) {
        e.preventDefault();
        return;
    }
    draggedRow = row;
    row.classList.add('bi-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', row.textContent);
}

function handleDragEnd(row) {
    row.classList.remove('bi-dragging');
    draggedRow = null;
    clearDropMarks();
}

function handleDragOver(e) {
    const row = e.target.closest('.bi-item-row, .bi-group-row');
    if (!row || row === draggedRow) {
        clearDropMarks();
        return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    clearDropMarks();
    if (row.classList.contains('bi-group-row')) {
        row.classList.add('bi-drop-target');
    } else {
        const rect = row.getBoundingClientRect();
        row.classList.add(e.clientY < rect.top + rect.height / 2 ? 'bi-drop-above' : 'bi-drop-below');
    }
}

function handleDrop(e) {
    const row = e.target.closest('.bi-item-row, .bi-group-row');
    if (!row || !draggedRow || row === draggedRow) return;
    e.preventDefault();

    const li = draggedRow.closest('li');
    if (row.classList.contains('bi-group-row')) {
        const groupLi = row.closest('li.bi-group');
        groupLi.querySelector('.bi-items').appendChild(li);
        draggedRow._item.DisplayTabName = groupLi.dataset.tabName;
    } else {
        const targetLi = row.closest('li');
        const rect = row.getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) {
            targetLi.before(li);
        } else {
            targetLi.after(li);
        }
        draggedRow._item.DisplayTabName = targetLi.closest('li.bi-group').dataset.tabName;
    }

    clearDropClass();
    syncDetails();
    refreshEditPanel();
}

function clearDropClass() {
    for (const el of treeRoot.querySelectorAll('.bi-drop-above, .bi-drop-below, .bi-drop-target')) {
        el.classList.remove('bi-drop-above', 'bi-drop-below', 'bi-drop-target');
    }
}

function syncDetails() {
    const ordered = [];
    for (const groupLi of treeRoot.querySelectorAll(':scope > li.bi-group')) {
        for (const row of groupLi.querySelectorAll('.bi-item-row')) {
            ordered.push(row._item);
        }
    }
    currentDetails.splice(0, currentDetails.length, ...ordered);
}
