import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

/** Signed amount: positive = credits added, negative = credits spent. */
export class WalletLedger extends Model<InferAttributes<WalletLedger>, InferCreationAttributes<WalletLedger>> {
  declare id: CreationOptional<number>;
  declare user_id: number;
  declare currency_id: number;
  declare type: string;
  declare amount: number;
  declare reference_type: CreationOptional<string | null>;
  declare reference_id: CreationOptional<string | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

WalletLedger.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    currency_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    type: { type: DataTypes.STRING(30), allowNull: false },
    amount: { type: DataTypes.INTEGER, allowNull: false },
    reference_type: { type: DataTypes.STRING(50), allowNull: true },
    reference_id: { type: DataTypes.STRING(100), allowNull: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'wallet_ledger', modelName: 'WalletLedger' }
);
