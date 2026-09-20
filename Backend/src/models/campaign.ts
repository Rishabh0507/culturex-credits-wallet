import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

export class Campaign extends Model<InferAttributes<Campaign>, InferCreationAttributes<Campaign>> {
  declare id: CreationOptional<number>;
  declare user_id: number;
  declare name: string;
  declare required_credits: number;
  declare funded: CreationOptional<boolean>;
  declare funded_at: CreationOptional<Date | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

Campaign.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(150), allowNull: false },
    required_credits: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    funded: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    funded_at: { type: DataTypes.DATE, allowNull: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'campaigns', modelName: 'Campaign' }
);
