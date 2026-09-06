export function texParser(rawText, parseInfo, pStrings) {
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
                console.log("Unknown token: " + token);
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
                if (pStrings[value]) {
                    value = pStrings[value];
                } else {
                    console.log("Unknown pstring: " + value);
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
