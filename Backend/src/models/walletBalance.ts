import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

export class WalletBalance extends Model<InferAttributes<WalletBalance>, InferCreationAttributes<WalletBalance>> {
  declare id: CreationOptional<number>;
  declare user_id: number;
  declare currency_id: number;
  declare balance: CreationOptional<number>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

WalletBalance.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    currency_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    balance: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'wallet_balances', modelName: 'WalletBalance' }
);
