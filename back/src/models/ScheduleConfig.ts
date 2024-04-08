import {
    CreationOptional,
    DataType,
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
    Column,
    Default,
    HasMany,
    HasOne,
    NotNull,
    PrimaryKey
} from "@sequelize/core/decorators-legacy";
import {ScheduleEvent} from "./ScheduleEvent";
import {Schedule} from "./Schedule";
import { User } from "./User";

/**
 * Чтобы понять, в каком состоянии сейчас таймер
 * дата
 * при входе - сначала проверка по дате,
 * если нет, то проверка по дню недели,
 * если есть день недели, проверяем параметр модификатор дня недели
 * если нет даты и нет дня недели
 * возвращается последняя дата
 * */
export class ScheduleConfig extends Model<InferAttributes<ScheduleConfig>, InferCreationAttributes<ScheduleConfig>> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>;

    @Attribute(DataTypes.STRING)
    @NotNull
    declare hash: string;

    @Attribute(DataTypes.STRING)
    declare date: CreationOptional<string>;

    @Attribute(DataTypes.INTEGER)
    declare weekDay: CreationOptional<number>;

    @Attribute(DataTypes.STRING)
    declare dateModificator: CreationOptional<string>;

    @BelongsTo(() => Schedule, {
        foreignKey: {
            name: 'schedule_id',
            onDelete: 'CASCADE',
        },
        targetKey: 'id',

    })
    declare schedule?: NonAttribute<Schedule>

    @Attribute(DataTypes.INTEGER)
    declare schedule_id: number;

    // @HasMany(() => ScheduleEvent, 'id')
    // declare scheduleEvents: NonAttribute<ScheduleEvent>[]

    @BelongsTo(() => User, {
        foreignKey: {
            name: 'user_id',
            onDelete: 'CASCADE',
        },
        targetKey: 'id',
    })
    declare user?: NonAttribute<User>

    @Attribute(DataTypes.INTEGER)
    declare scheduleEvent_id: CreationOptional<number>;

    @Attribute(DataTypes.BOOLEAN)
    @Default(true)
    declare counterIsPaused: CreationOptional<boolean>;

    @Attribute(DataTypes.STRING)
    declare counterStartTime: CreationOptional<string>;

    @Attribute(DataTypes.INTEGER)
    declare counterTimePassed: CreationOptional<number>;

    @Attribute(DataTypes.BOOLEAN)
    @Default(false)
    declare configIsActive: CreationOptional<boolean>;

    @Attribute(DataTypes.STRING)
    @NotNull
    declare scheduleHash: string;

    @Attribute(DataTypes.STRING)
    @NotNull
    declare scheduleEventsHash: string;

    isForceSync?: boolean = false
}
