import {
    ModelStatic,
} from "@sequelize/core";

import {
    readJsonFileSync,
    reorderArray,
    getTableSyncMode,
    boolToObjSyncMode,
    dd
} from "../utils";
import {addDbModels} from "../core/dbAddModels";
import {jsStr} from "../utils/json";
import { Database } from "../core/dbConnect";
import {getModels} from "../models/_getModels";
import path from "path";
import { createDefaultScheduleConfig } from "../dbActions/createDefaultScheduleConfig";
import { log } from "../utils/Logger";


const modelClasses = getModels()
addDbModels(modelClasses)

const tablesOrderMap: string[] = readJsonFileSync(path.join(__dirname, 'orderedClasses.json'))

const permittedClasses = readJsonFileSync(path.join(__dirname, 'permittedClasses.json'))
const filterPermittedClasses = (model: ModelStatic) => {
    return permittedClasses.indexOf(model.name) > -1
}
reorderArray(modelClasses, tablesOrderMap, 'name')

const globalForceSync = process.env.DB_SYNC_MODE_FORCE === 'true'

let deleteTablesAction: () => Promise<void>

if (globalForceSync) {
    log('Удаление всех таблиц со всеми данными')
    const forceSync = async () => {
        await Database.getInstance().query('SET FOREIGN_KEY_CHECKS = 0');
        await Database.getInstance().sync({ force: true });
        await Database.getInstance().query('SET FOREIGN_KEY_CHECKS = 1'); // setting the flag back for security
    };
    deleteTablesAction = forceSync
} else {
    const tableControlledSync = async () => {
        log('Синхронизация таблиц с моделями с индивидуальными настройками')
        try {
            await Database.getInstance().query('SET FOREIGN_KEY_CHECKS = 0');
            await Promise.all(modelClasses
                .filter(filterPermittedClasses)
                .map(async (model) => {
                    const syncMode = getTableSyncMode(model);
                    log(`The table for the ${model.name} model`);
                    log(`(sync mode: ${jsStr(syncMode)})`);
                    await model.sync(syncMode);
                    log(`was just ${(jsStr(syncMode) === jsStr(boolToObjSyncMode(true))) ? '(re)created' : 'updated'}!`);
                }));
        } catch (error) {
            console.error('Error during table synchronization:', error);
        } finally {
            await Database.getInstance().query('SET FOREIGN_KEY_CHECKS = 1');
        }
    }
    deleteTablesAction = tableControlledSync
}
deleteTablesAction().then(async() => {
    dd('Наполнение таблиц')
    await createDefaultScheduleConfig()
})