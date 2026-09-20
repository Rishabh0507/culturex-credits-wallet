import { Sequelize, Options } from 'sequelize';
import { env } from './env';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const configs = require('./sequelize-config.js') as Record<string, Options>;

const config = configs[env.nodeEnv] || configs.development;

export const sequelize = new Sequelize(config as Options);
