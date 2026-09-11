import { generatedByComment } from './utils.js';
import { generateDictionary, msAddString } from './msParser.js';

export function texParser(rawText, parseInfo, pStrings, warnings) {
    let cursor = 0;
    const tokens = [];
    for (const line of rawText.split(/\r?\n|\r/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//')) continue;
        tokens.push(...trimmed.split(/\s+/), '\n');
    }

    function peekToken() {
        while (cursor < tokens.length && tokens[cursor] === '\n') cursor++;
        return tokens[cursor] ?? null;
    }

    function consumeToken() {
        while (cursor < tokens.length && tokens[cursor] === '\n') cursor++;
        return tokens[cursor++] ?? null;
    }

    function consumeLine() {
        const rest = [];
        while (cursor < tokens.length && tokens[cursor] !== '\n') {
            rest.push(tokens[cursor++]);
        }
        if (tokens[cursor] === '\n') cursor++;
        return rest.join(' ');
    }

    function parseStruct(info, pStrings) {
        let result = {};
        const rules = {};
        for (const [key, rule] of Object.entries(info)) {
            rules[key.toLowerCase()] = { preserveCase: key, rule };
        }

        while (cursor < tokens.length) {
            const token = peekToken();
            if (!token) break;

            const match = rules[token.toLowerCase()];
            if (!match) {
                warnings.push("Unknown Token " + token);
                consumeToken();
                continue;
            }

            const { preserveCase, rule } = match;
            consumeToken();

            if (rule.type === 'START') continue;
            if (rule.type === 'END') return result;

            let value;
            if (rule.type === 'STRUCT') {
                if (rule.named) {
                    const structName = consumeToken();
                    const structData = parseStruct(rule.parseInfo, pStrings);
                    value = { Name: structName, ...structData };
                } else {
                    value = parseStruct(rule.parseInfo, pStrings);
                }
            } else if (rule.type === 'PSTRING') {
                value = consumeLine().replace(/^"|"$/g, '');
                if (value === "") {
                    warnings.push("Missing " + preserveCase + " PString");
                } else if (pStrings[value]) {
                    value = pStrings[value];
                } else {
                    warnings.push("Unknown PString " + value);
                }
            } else if (rule.type === 'STRING') {
                value = consumeLine();
            } else if (rule.type === 'ARRAY') {
                const lineContent = consumeLine();
                value = lineContent ? lineContent.split(/\s+/) : [];
            } else if (rule.type === 'BOOL') {
                value = true;
            }

            if (rule.array) {
                if (!result[preserveCase]) result[preserveCase] = [];
                result[preserveCase].push(value);
            } else {
                result[preserveCase] = value;
            }
        }
        return result;
    }

    const output = parseStruct(parseInfo, pStrings);
    const rootKeys = Object.keys(output);
    return rootKeys.length === 1 && Array.isArray(output[rootKeys[0]]) ? output[rootKeys[0]] : output;
}

function structTokens(info) {
    const tokens = { start: "", end: "" };
    for (const [key, rule] of Object.entries(info)) {
        if (rule.type === 'START') tokens.start = key;
        if (rule.type === 'END') tokens.end = key;
    }
    return tokens;
}

function generateStruct(info, data, lines, pstrings, indent) {
    const pad = " ".repeat(indent);

    for (const [key, rule] of Object.entries(info)) {
        if (rule.type === 'START' || rule.type === 'END') continue;
        if (!(key in data)) continue;
        const value = data[key];

        if (rule.type === 'STRUCT') {
            const { start, end } = structTokens(rule.parseInfo);
            const entries = rule.array ? value : [value];
            for (const entry of entries) {
                if (rule.named) {
                    lines.push(pad + key + " " + entry.Name);
                    lines.push(pad + start);
                } else {
                    lines.push(pad + key + " " + start);
                }
                generateStruct(rule.parseInfo, entry, lines, pstrings, indent + 1);
                lines.push(pad + end);
            }
        } else if (rule.type === 'PSTRING') {
            lines.push(pad + key + ' "' + msAddString(pstrings, value) + '"');
        } else if (rule.type === 'BOOL') {
            if (value === true) lines.push(pad + key);
        } else if (rule.array) {
            for (const item of value) lines.push(pad + key + " " + item);
        } else if (rule.type === 'ARRAY') {
            lines.push(pad + key + (value.length > 0 ? " " + value.join(" ") : ""));
        } else {
            lines.push(pad + key + " " + value);
        }
    }
}

function generateRoot(jsonData, parseInfo, pstrings) {
    let rootKey = null;
    for (const key of Object.keys(parseInfo)) {
        if (parseInfo[key].type === 'STRUCT') {
            rootKey = key;
            break;
        }
    }

    const rootData = Array.isArray(jsonData) ? { [rootKey]: jsonData } : jsonData;
    const lines = generatedByComment();
    generateStruct(parseInfo, rootData, lines, pstrings, 0);
    return lines.join("\r\n") + "\r\n";
}

export function generateFiles(jsonData, parseInfo) {
    const pstrings = {};
    const rawText = generateRoot(jsonData, parseInfo, pstrings);
    const dictionary = generateDictionary(pstrings);
    return { rawText, dictionary };
}

const ParseVolume = {
    "{": { "type": "START" },
    "Min": { "type": "STRING" },
    "Max": { "type": "STRING" },
    "}": { "type": "END" },
};

const ParseDetail = {
    "{": { "type": "START" },
    "DisplayName": { "type": "PSTRING" },
    "DisplayHelp": { "type": "PSTRING" },
    "DisplayShortHelp": { "type": "PSTRING" },
    "DisplayTabName": { "type": "PSTRING" },
    "Category": { "type": "STRING" },

    "GroupName": { "type": "STRING" },
    "GroupNameUnpowered": { "type": "STRING" },
    "GroupNameDestroyed": { "type": "STRING" },
    "GroupNameBaseEdit": { "type": "STRING" },

    "Attach": { "type": "STRING" },
    "Pos": { "type": "STRING" },
    "Pyr": { "type": "STRING" },
    "Bounds": { "type": "STRUCT", "parseInfo": ParseVolume },
    "Volume": { "type": "STRUCT", "parseInfo": ParseVolume },

    "GridScale": { "type": "STRING" },
    "GridMin": { "type": "STRING" },
    "GridMax": { "type": "STRING" },

    "AccessPermissions": { "type": "BOOL" },
    "AnimatedEnt": { "type": "BOOL" },
    "CannotDelete": { "type": "BOOL" },
    "DoNotBlock": { "type": "BOOL" },
    "HasVolumeTrigger": { "type": "BOOL" },
    "Mounted": { "type": "BOOL" },

    "Flags": { "type": "ARRAY" },
    "Requires": { "type": "STRING" },

    "MigrateVersion": { "type": "STRING" },
    "MigrateDetail": { "type": "STRING" },

    "EntityDef": { "type": "STRING" },
    "Level": { "type": "STRING" },
    "Behavior": { "type": "STRING" },

    "Function": { "type": "STRING" },
    "FunctionParams": { "type": "STRING" },
    "FunctionRequires": { "type": "STRING" },

    "AuxAllowed": { "type": "ARRAY" },
    "MaxAuxAllowed": { "type": "STRING" },

    "include": { "type": "STRING", "array": true },
    "}": { "type": "END" },
};

export const ParseDetailDict = {
    "Detail": { "type": "STRUCT", "named": true, "array": true, "parseInfo": ParseDetail }
};
