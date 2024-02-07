import {ModelStatic} from "@sequelize/core";
import {SyncOptions} from "@sequelize/core";

export function getTableSyncMode (model: ModelStatic): SyncOptions{
    const isForceSync = (model.build() as any).isForceSync
    if (isForceSync !== undefined) {
        return boolToObjSyncMode(isForceSync)
    } else {
        return boolToObjSyncMode(process.env.DB_SYNC_MODE_FORCE === 'true')
    }
}

export function boolToObjSyncMode (val: boolean): Record<string, boolean> {
    return val
        ? { force: true }
        : { alter: true }
}







