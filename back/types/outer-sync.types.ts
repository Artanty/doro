export interface TikUpdateEntriesResDeletedItem {
    "id": string,
    "cur": number,
    "len": number,
    "stt": number,
}

export interface TikUpdateEntriesRes{
    "success": boolean,
    "desc": string,
    "stat": {
        "added": string[],
        "addedCount": number,
        
        "updated": string[],
        "updatedCount": number,
        
        "deleted": string[],
        "deletedCount": number,
        "deletedItems": TikUpdateEntriesResDeletedItem[],
    }
}