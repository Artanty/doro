export function reorderArray<T>(
     originalArray: any[],
     orderArray: string[],
     propertyName: string
 ): any[] {
    return originalArray.sort((a, b) => {

        const indexA = orderArray.indexOf(a[propertyName]);
        const indexB = orderArray.indexOf(b[propertyName]);

        // Compare the indices
        return indexA - indexB;
    });
}