import {
    ModelStatic,
} from "@sequelize/core";

import {
    readJsonFileSync,
    reorderArray,
    getTableSyncMode,
    boolToObjSyncMode
} from "../utils";
import {addDbModels} from "../core/dbAddModels";
import {jsStr} from "../utils/json";
import { Database } from "../core/dbConnect";
import {getModels} from "../models/_getModels";
import path from "path";

const modelClasses = getModels()
addDbModels(modelClasses)

const tablesOrderMap: string[] = readJsonFileSync(path.join(__dirname, 'orderedClasses.json'))

const permittedClasses = readJsonFileSync(path.join(__dirname, 'permittedClasses.json'))
const filterPermittedClasses = (model: ModelStatic) => {
    return permittedClasses.indexOf(model.name) > -1
}
reorderArray(modelClasses, tablesOrderMap, 'name')

const globalForceSync = process.env.DB_SYNC_MODE_FORCE === 'true'
console.log('globalForceSync: ' + globalForceSync)

if (globalForceSync) {
    const forceSync = async () => {
        await Database.getInstance().query('SET FOREIGN_KEY_CHECKS = 0');
        await Database.getInstance().sync({ force: true });
        await Database.getInstance().query('SET FOREIGN_KEY_CHECKS = 1'); // setting the flag back for security
    };
    forceSync()
} else {
    const tableControlledSync = async () => {
        try {
            // Step 1: Disable foreign key checks
            await Database.getInstance().query('SET FOREIGN_KEY_CHECKS = 0');

            // Step 2: Synchronize tables
            await Promise.all(modelClasses
                .filter(filterPermittedClasses)
                .map(async (model) => {
                    const syncMode = getTableSyncMode(model);
                    console.log(`The table for the ${model.name} model`);
                    console.log(`(sync mode: ${jsStr(syncMode)})`);
                    await model.sync(syncMode);
                    console.log(`was just ${(jsStr(syncMode) === jsStr(boolToObjSyncMode(true))) ? '(re)created' : 'updated'}!`);
                }));

        } catch (error) {
            // Handle errors during synchronization
            console.error('Error during table synchronization:', error);

        } finally {
            // Step 3: Enable foreign key checks (executes regardless of success or failure)
            await Database.getInstance().query('SET FOREIGN_KEY_CHECKS = 1');
        }
    }
    tableControlledSync()
}