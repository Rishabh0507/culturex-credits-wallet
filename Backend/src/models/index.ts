import { sequelize } from '../config/database';
import { User } from './user';
import { Currency } from './currency';
import { CurrencyPlan } from './currencyPlan';
import { WalletBalance } from './walletBalance';
import { WalletLedger } from './walletLedger';
import { Payment } from './payment';
import { ProcessedStripeEvent } from './processedStripeEvent';
import { Campaign } from './campaign';

// Associations
Currency.hasMany(CurrencyPlan, { foreignKey: 'currency_id', as: 'plans' });
CurrencyPlan.belongsTo(Currency, { foreignKey: 'currency_id', as: 'currency' });

User.hasMany(WalletBalance, { foreignKey: 'user_id', as: 'walletBalances' });
WalletBalance.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
WalletBalance.belongsTo(Currency, { foreignKey: 'currency_id', as: 'currency' });

User.hasMany(WalletLedger, { foreignKey: 'user_id', as: 'ledgerEntries' });
WalletLedger.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
WalletLedger.belongsTo(Currency, { foreignKey: 'currency_id', as: 'currency' });

User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Payment.belongsTo(Currency, { foreignKey: 'currency_id', as: 'currency' });

User.hasMany(Campaign, { foreignKey: 'user_id', as: 'campaigns' });
Campaign.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export { sequelize, User, Currency, CurrencyPlan, WalletBalance, WalletLedger, Payment, ProcessedStripeEvent, Campaign };
