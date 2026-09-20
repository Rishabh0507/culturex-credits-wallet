import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
} as const;

export class Payment extends Model<InferAttributes<Payment>, InferCreationAttributes<Payment>> {
  declare id: CreationOptional<number>;
  declare user_id: number;
  declare currency_id: number;
  declare credits: number;
  declare amount_paise: number;
  declare stripe_session_id: CreationOptional<string | null>;
  declare status: CreationOptional<string>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

Payment.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    currency_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    credits: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    amount_paise: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    stripe_session_id: { type: DataTypes.STRING(255), allowNull: true, unique: true },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: PAYMENT_STATUS.PENDING },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'payments', modelName: 'Payment' }
);
