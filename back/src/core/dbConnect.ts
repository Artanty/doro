import {
    importModels,
    Model,
    ModelStatic,
    Options,
    Sequelize
} from '@sequelize/core';
import {mergeObjects} from "../utils/mergeObjects";
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import path from "path";
import fs from "fs";

require('dotenv').config();

export class Database {

    private static instance: Sequelize | null = null;

    private constructor() {}

    private static getDbConnectOptions () {
        return {
            database: process.env.DB_DATABASE,
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            dialect: process.env.DB_DIALECT ?? "mysql",
            logging: false,
        } as Options
    }

    public static getInstance(additionalOptions: Options = {}): Sequelize {

        if (!Database.instance) {
            Database.instance = Database.createInstance(additionalOptions) 
        }
        return Database.instance;
    }

    private static createInstance (additionalOptions: Options) {

        const options = mergeObjects(Database.getDbConnectOptions(), additionalOptions)

        return new Sequelize(options);
    }
}




// export function setLogger (dbInstance: Sequelize) {
//     dbInstance.on('error', (error) => {
//         console.error('Database connection error:', error);
//       });
// }


