import path from "path";
import {
    Model,
    ModelStatic
} from "@sequelize/core";
import fs from "fs";

export function getModels () {

    const modelsDirectory = path.join(__dirname, '../models');

    // Array to store model classes
    const modelClasses: ModelStatic[] = [];


// Read files in the models directory
    const files = fs.readdirSync(modelsDirectory)
        .filter((file: string) => {
            return (
                file.indexOf('.') !== 0 &&
                (process.env.NODE_ENV === 'development' ? (file.slice(-3) === '.ts') : (file.slice(-3) === '.js')) &&
                file.indexOf('.test.ts') === -1
            );
        })

// Iterate through each file
    files.forEach((file: string) => {
        const filePath = path.join(modelsDirectory, file);

        try {
            // Import the module dynamically
            const modelModule = require(filePath);

            // Check if the module has exported classes
            if (modelModule && Object.keys(modelModule).length > 0) {
                // Iterate through exported items in the module
                Object.values(modelModule).forEach((exportedItem: unknown) => {
                    // Check if the item is a Sequelize Model class
                    if (typeof exportedItem === 'function' && exportedItem.prototype instanceof Model) {
                        modelClasses.push(exportedItem as ModelStatic);
                    }
                });
            }

        } catch (error) {
            console.error(`Error loading model from ${file}:`, error);
        }
    });
    return modelClasses
}