import {Database} from "./dbConnect";
import {ModelStatic} from "@sequelize/core";

export function addDbModels (modelClasses: ModelStatic[]) {
    if (Database.getInstance()) {
        Database.getInstance().addModels(modelClasses)
    }
}
