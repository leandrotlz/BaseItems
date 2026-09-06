export function msParser(rawText) {
    let pstrings = {};
    for (const line of rawText.split(/\r?\n|\r/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//')) continue;

        const match = trimmed.match(/^"([^"]*)"\s+"(.*)"$/);
        if (match) {
            const [, key, value] = match;
            pstrings[key] = value;
        }
    }
    return pstrings;
};
