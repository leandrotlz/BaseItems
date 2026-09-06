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

export function msAddString(pstrings, rawText) {
    function crc32(str) {
        var crc = 0xFFFFFFFF;
        for (var i = 0; i < str.length; i++) {
            crc ^= str.charCodeAt(i);
            for (var j = 0; j < 8; j++) {
                if ((crc & 1) != 0) {
                    crc = (crc >>> 1) ^ 0xEDB88320;
                } else {
                    crc = crc >>> 1;
                }
            }
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    const key = "P" + crc32(rawText);
    pstrings[key] = rawText;
};
