// Placeholder: split lines and clean up.

export function parseDetails(rawText) {
    return rawText
        .split(/\r?\n|\r/)
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('//'));
}
