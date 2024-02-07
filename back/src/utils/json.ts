export function jsPrs (data: string) {
    try {
        return JSON.parse(data)
    } catch(e) {
        console.error('jsPrs error')
        return data
    }
}

export function jsStr (data: any): string  {
    return JSON.stringify(data)
}