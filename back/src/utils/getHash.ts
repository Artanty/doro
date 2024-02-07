export function getHash(id: number, currentTime: number): string {
    const inputString = id.toString() + currentTime.toString();
    let hash = 0;

    if (inputString.length === 0) return hash.toString();

    for (let i = 0; i < inputString.length; i++) {
        const char = inputString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }

    return hash.toString();
}
