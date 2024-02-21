import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute
} from "@sequelize/core";
import {
    Attribute,
    AutoIncrement,
    BelongsTo,
    Default,
    HasMany,
    HasOne,
    NotNull,
    PrimaryKey
} from "@sequelize/core/decorators-legacy";
import {Schedule} from "./Schedule";

export class ScheduleEvent extends Model<InferAttributes<ScheduleEvent>, InferCreationAttributes<ScheduleEvent>> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>;

    @Attribute(DataTypes.STRING)
    @Default('Событие по умолчанию')
    declare name: CreationOptional<string>;

    @Attribute(DataTypes.STRING)
    @NotNull
    declare timeFrom: string;

    @Attribute(DataTypes.STRING)
    @NotNull
    declare timeTo: string;

    @Attribute(DataTypes.STRING)
    declare eventType: string;

    @BelongsTo(() => Schedule, {
        foreignKey: {
            name: 'schedule_id',
            onDelete: 'CASCADE',
        },
        targetKey: 'id',

    })
    declare schedule?: NonAttribute<Schedule>

    // This is the foreign key
    @Attribute(DataTypes.INTEGER)
    declare schedule_id: number;

    isForceSync?: boolean = false
}
