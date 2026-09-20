import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

export class Currency extends Model<InferAttributes<Currency>, InferCreationAttributes<Currency>> {
  declare id: CreationOptional<number>;
  declare code: string;
  declare name: string;
  declare module_key: string;
  declare price_per_credit_paise: number;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

Currency.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    module_key: { type: DataTypes.STRING(50), allowNull: false },
    price_per_credit_paise: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'currencies', modelName: 'Currency' }
);
