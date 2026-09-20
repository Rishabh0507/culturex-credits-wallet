import bcrypt from 'bcryptjs';
import { sequelize, User, Currency, WalletBalance } from '../models';
import { AppError } from '../utils/appError';
import { signToken } from '../utils/jwt';
import { Credentials } from '../validators/authValidator';

const SALT_ROUNDS = 10;

function authResponse(user: User) {
  return {
    token: signToken({ userId: user.id, email: user.email }),
    user: user.toSafeJSON(),
  };
}

export async function signup({ email, password }: Credentials) {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new AppError(409, 'Email is already registered');
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // User + one wallet row per currency must be created atomically.
  const user = await sequelize.transaction(async (t) => {
    const created = await User.create({ email, password_hash }, { transaction: t });

    const currencies = await Currency.findAll({ transaction: t });
    await WalletBalance.bulkCreate(
      currencies.map((currency) => ({ user_id: created.id, currency_id: currency.id, balance: 0 })),
      { transaction: t }
    );

    return created;
  });

  return authResponse(user);
}

export async function login({ email, password }: Credentials) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) {
    throw new AppError(401, 'Invalid email or password');
  }

  return authResponse(user);
}
