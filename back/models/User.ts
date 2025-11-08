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
  HasMany,
  HasOne,
  Default,
  BelongsTo
} from '@sequelize/core/decorators-legacy';
import {ScheduleEvent} from "./ScheduleEvent";
import {ScheduleConfig} from "./ScheduleConfig";

export interface IExtendedAttributes {
  isForceSync?: boolean;
}
interface ScheduleAttributes {
  id?: number;
  name: string;
  scheduleType?: string | null;
}

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare username: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare password: string;

  @Attribute(DataTypes.STRING)
  declare token: CreationOptional<string>;

  @BelongsTo(() => ScheduleConfig, {
    foreignKey: {
        name: 'active_config_id',
        onDelete: 'CASCADE',
    },
    targetKey: 'id',
  })
  declare active_config?: NonAttribute<ScheduleConfig>

  @Attribute(DataTypes.INTEGER)
    declare active_config_id: CreationOptional<number>;

  isForceSync?: boolean = true
}