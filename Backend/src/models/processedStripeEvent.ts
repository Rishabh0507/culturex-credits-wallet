import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

/** One row per handled Stripe event; the UNIQUE index enforces exactly-once processing. */
export class ProcessedStripeEvent extends Model<
  InferAttributes<ProcessedStripeEvent>,
  InferCreationAttributes<ProcessedStripeEvent>
> {
  declare id: CreationOptional<number>;
  declare stripe_event_id: string;
  declare type: string;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

ProcessedStripeEvent.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    stripe_event_id: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    type: { type: DataTypes.STRING(100), allowNull: false },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  { sequelize, tableName: 'processed_stripe_events', modelName: 'ProcessedStripeEvent' }
);
