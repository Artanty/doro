import {
    Sequelize,
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
    NonAttribute
} from '@sequelize/core';
import {
    Attribute,
    PrimaryKey,
    AutoIncrement,
    NotNull,
    Default
} from '@sequelize/core/decorators-legacy';

export interface IExtendedAttributes {
    isForceSync?: boolean;
}
interface ScheduleAttributes {
    id?: number;
    name: string;
    scheduleType?: string | null;
}

export class Schedule extends Model<InferAttributes<Schedule>, InferCreationAttributes<Schedule>> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>;

    @Attribute(DataTypes.STRING)
    @NotNull
    declare name: string;

    @Attribute(DataTypes.STRING)
    @NotNull
    @Default('default')
    declare scheduleType: string;

    isForceSync?: boolean = true
}