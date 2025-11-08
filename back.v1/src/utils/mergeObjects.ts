interface MergedObject {
    [key: string]: any;
}
/**
 * Merge multiple objects into a single object.
 * @param objects - Objects to be merged.
 * @returns Merged object.
 */
export function mergeObjects(...objects: Record<string, any>[]): MergedObject {
    return objects.reduce((merged, obj) => {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                merged[key] = obj[key];
            }
        }
        return merged;
    }, {} as MergedObject);
}