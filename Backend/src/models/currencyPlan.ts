import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

export class CurrencyPlan extends Model<InferAttributes<CurrencyPlan>, InferCreationAttributes<CurrencyPlan>> {
  declare id: CreationOptional<number>;
  declare currency_id: number;
  declare name: string;
  declare credits: number;
  declare price_paise: number;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

CurrencyPlan.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    currency_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    credits: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    price_paise: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'currency_plans', modelName: 'CurrencyPlan' }
);
