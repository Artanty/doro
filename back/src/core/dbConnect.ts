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
            dialect: process.env.DB_DIALECT,
        } as Options
    }

    public static getInstance(additionalOptions: Options = {}): Sequelize {

        const options = mergeObjects(Database.getDbConnectOptions(), additionalOptions)

        if (!Database.instance) {
            Database.instance = new Sequelize(options);
        }
        return Database.instance;
    }
}


export async function checkDbConnection () {
    try {
        await Database.getInstance().authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}


