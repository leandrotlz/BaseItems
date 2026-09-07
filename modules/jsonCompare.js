const EQUAL = 0;
const TEXT_ONLY = 1;
const DATA = 2;

function indexByName(items) {
    const index = new Map();
    for (const item of items) {
        if (!item?.Name) continue;
        if (!index.has(item.Name)) index.set(item.Name, []);
        index.get(item.Name).push(item);
    }
    return index;
}

function objectEqual(a, b, fieldTypes, field) {
    const remaining = [...b];
    for (const item of a) {
        const index = remaining.findIndex(other => compareItems(item, other, fieldTypes, field) === EQUAL);
        if (index === -1) return false;
        remaining.splice(index, 1);
    }
    return true;
}

function arrayEqual(a, b, fieldTypes, field) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== null && typeof a[i] === 'object') return objectEqual(a, b, fieldTypes, field);
    }
    for (let i = 0; i < b.length; i++) {
        if (b[i] !== null && typeof b[i] === 'object') return objectEqual(a, b, fieldTypes, field);
    }
    const counts = new Map();
    for (const value of b) counts.set(value, (counts.get(value) ?? 0) + 1);
    for (const value of a) {
        if (value !== value) return false;
        const count = counts.get(value);
        if (!count) return false;
        counts.set(value, count - 1);
    }
    return true;
}

function isTextOnlyField(fieldTypes, field) {
    return fieldTypes[field] === 'PSTRING' ? TEXT_ONLY : DATA;
}

function compareItems(a, b, fieldTypes, field) {
    if (a === b) return EQUAL;
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
        return isTextOnlyField(fieldTypes, field);
    }
    if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b)) return isTextOnlyField(fieldTypes, field);
        return arrayEqual(a, b, fieldTypes, field) ? EQUAL : isTextOnlyField(fieldTypes, field);
    }

    const aKeys = Object.keys(a);
    const sameKeyCount = aKeys.length === Object.keys(b).length;
    let result = EQUAL;
    let allFound = true;
    for (const key of aKeys) {
        const keyResult = compareItems(a[key], b[key], fieldTypes, key);
        if (keyResult === DATA) return DATA;
        if (keyResult === TEXT_ONLY) result = TEXT_ONLY;
        if (!(key in b)) allFound = false;
    }
    if (!allFound || !sameKeyCount) {
        for (const key of Object.keys(b)) {
            if (key in a) continue;
            const keyResult = compareItems(undefined, b[key], fieldTypes, key);
            if (keyResult === DATA) return DATA;
            if (keyResult === TEXT_ONLY) result = TEXT_ONLY;
        }
    }
    return result;
}

function getFieldTypes(parseInfo, types = {}) {
    for (const [key, rule] of Object.entries(parseInfo)) {
        if (rule.type === 'START' || rule.type === 'END') continue;
        if (rule.type === 'STRUCT') {
            getFieldTypes(rule.parseInfo, types);
        } else {
            types[key] = rule.type;
        }
    }
    return types;
}

export function compareDetails(curDetails, newDetails, parseInfo) {
    const curIdx = indexByName(curDetails);
    const newIdx = indexByName(newDetails);
    const fieldTypes = getFieldTypes(parseInfo ?? {});
    const unchanged = [];
    const added = [];
    const removed = [];
    const changedData = [];
    const changedText = [];

    for (const [name, newItems] of newIdx) {
        const currentItems = curIdx.get(name);
        const paired = Math.min(currentItems?.length ?? 0, newItems.length);
        for (let i = 0; i < paired; i++) {
            const result = compareItems(currentItems[i], newItems[i], fieldTypes, '');
            if (result === EQUAL) unchanged.push(newItems[i]);
            else if (result === TEXT_ONLY) changedText.push(newItems[i]);
            else changedData.push(newItems[i]);
        }
        for (let i = paired; i < newItems.length; i++) {
            added.push(newItems[i]);
        }
    }

    for (const [name, currentItems] of curIdx) {
        const paired = newIdx.get(name)?.length ?? 0;
        for (let i = paired; i < currentItems.length; i++) {
            removed.push(currentItems[i]);
        }
    }

    return { unchanged, added, removed, changedData, changedText };
}
