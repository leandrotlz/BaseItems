import { generatorString } from './utils.js';
import { texParser, generateFiles, ParseDetailDict } from './texParser.js';
import { msParser } from './msParser.js';
import { compareDetails } from './jsonCompare.js';

const state = {
    Schema: "BaseItems",
    Generator: generatorString(),
    Details: [],
    Tags: {},
    Data: {},
};

export function getState() {
    return state;
}

export function hasDetails() {
    return state.Details.length > 0;
}

export function getDetails(jsonData) {
    if (jsonData === null || typeof jsonData !== 'object') return null;
    if (jsonData.Schema !== 'BaseItems') return null;
    return Array.isArray(jsonData.Details) ? jsonData.Details : null;
}

export function getTags(jsonData) {
    const tags = jsonData?.Tags;
    if (tags === null || typeof tags !== 'object' || Array.isArray(tags)) return {};
    return tags;
}

export function getDetailData(jsonData) {
    const detailData = jsonData?.Data;
    if (detailData === null || typeof detailData !== 'object' || Array.isArray(detailData)) return {};
    return detailData;
}

// A JSON load replaces the state entirely.
export function loadJson(jsonData) {
    const details = getDetails(jsonData);
    if (!details) return false;
    state.Schema = jsonData.Schema;
    state.Generator = jsonData.Generator;
    state.Details = details;
    state.Tags = getTags(jsonData);
    state.Data = getDetailData(jsonData);
    return true;
}

function extractTags(displayHelp) {
    if (typeof displayHelp !== 'string') return [];
    const tagsIndex = displayHelp.indexOf('Tags:');
    if (tagsIndex === -1) return [];

    // The tags section runs from "Tags:" until it finds a Tab: or Name: section.
    // <br>, commas and = (used by #tint-area) are separators.
    const section = displayHelp.slice(tagsIndex + 'Tags:'.length).replace(/<br>|,|=/g, ' ');
    const tags = new Set();
    for (const token of section.split(/\s+/)) {
        if (token.startsWith('Tab:') || token.startsWith('Name:')) break;
        if (token.startsWith('#')) tags.add(token.toLowerCase());
    }
    return [...tags];
}

function mergeTags(tags, details) {
    for (const item of details) {
        for (const tag of extractTags(item?.DisplayHelp)) {
            if (!(tag in tags)) tags[tag] = {};
        }
    }
    return tags;
}

// Data holds detail metadata that is not part of the Details file data.
function getDataFromImport(details) {
    const itemData = {};
    for (const item of details) {
        if (typeof item?.Name !== 'string') continue;
        const tags = extractTags(item?.DisplayHelp);
        if (tags.length > 0) itemData[item.Name.toLowerCase()] = { tags };
    }
    return itemData;
}

// A Data Import replaces the details, but keeps the rest of the state.
// New tags are added to the state, existing tags are left alone.
// Data is rebuilt from the imported details, mirroring the file.
// Returns the warnings produced by the parser, if any.
export function importData(detailsText, dictionaryText) {
    const pstrings = msParser(dictionaryText);
    const warnings = [];
    state.Details = texParser(detailsText, ParseDetailDict, pstrings, warnings);
    mergeTags(state.Tags, state.Details);
    state.Data = getDataFromImport(state.Details);
    return warnings;
}

export function saveJson() {
    return JSON.stringify({ Schema: "BaseItems", Generator: generatorString(), Details: state.Details, Tags: state.Tags, Data: state.Data }, null, 2);
}

export function exportFiles() {
    return generateFiles(state.Details, ParseDetailDict);
}

export function compareJson(newDetails) {
    return compareDetails(state.Details, newDetails, ParseDetailDict);
}
